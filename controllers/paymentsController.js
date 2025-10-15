// controllers/paymentsController.js
// Stripe Hosted Checkout for Expo Go (no native SDK). Also keeps a simple
// PaymentIntent endpoint for future PaymentSheet work, plus a webhook.

const Stripe = require("stripe");

console.log("[payments] Stripe key present?", !!process.env.STRIPE_SECRET_KEY);

let stripe; // lazily initialized
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const Booking = require("../models/Booking");
const { sendSMS, sendEmail } = require("../utils/notify");

const PAY_CCY = process.env.PAY_CURRENCY || "usd"; // e.g. 'usd' or 'inr'
const BASE = process.env.PUBLIC_BASE_URL || "http://localhost:5000"; // must be reachable from the phone

const bad = (res, msg) => res.status(400).json({ error: msg });

/* ------------------------------------------------------------------ */
/* A) Hosted Checkout (recommended for Expo Go)                        */
/* ------------------------------------------------------------------ */

exports.createCheckoutSession = async (req, res) => {
  try {
    const s = getStripe();
    if (!s) return bad(res, "Stripe is not configured");
    const { bookingId } = req.body;
    if (!bookingId) return bad(res, "bookingId is required");

    const b = await Booking.findById(bookingId).populate("healthCenter").lean();
    if (!b || String(b.user) !== String(req.user._id)) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const amount = Math.round((b.payment?.amount || b.price || 0) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: PAY_CCY,
            unit_amount: amount,
            product_data: {
              name: `Lab booking at ${b.healthCenter?.name || "Center"}`,
              description: `Appt #${b.appointment_no ?? ""} on ${
                b.scheduledDate
              }`,
            },
          },
        },
      ],
      metadata: {
        bookingId: String(b._id),
        userId: String(req.user._id),
      },
      success_url: `${BASE}/api/payments/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE}/api/payments/checkout-cancel`,
    });

    // store provider info; mark method online
    await Booking.findByIdAndUpdate(bookingId, {
      "payment.method": "online",
      "payment.provider": "stripe",
      "payment.providerRef": session.id,
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error("createCheckoutSession", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/payments/checkout-return?session_id=...
exports.checkoutReturn = async (req, res) => {
  try {
    const s = getStripe();
    if (!s) return res.status(400).send("Stripe not configured");
    const { session_id } = req.query;
    if (!session_id) return res.status(400).send("Missing session_id");

    const session = await s.checkout.sessions.retrieve(session_id);
    const bookingId = session.metadata?.bookingId;

    if (session.payment_status === "paid" && bookingId) {
      const b = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: "paid",
          "payment.status": "paid",
          "payment.providerRef": session.payment_intent || session.id,
        },
        { new: true }
      );

      try {
        if (b?.contactNumber) {
          await sendSMS(
            b.contactNumber,
            `Payment received for booking #${b.appointment_no}.`
          );
        }
        await sendEmail(
          null,
          "Payment received",
          `Thanks! Booking ${b?._id} is paid.`
        );
      } catch {}

      return res.send(`
        <html><body style="font-family:system-ui;padding:24px">
          <h2>Payment complete ✅</h2>
          <p>You can close this tab and return to the app.</p>
        </body></html>
      `);
    }

    return res.send(`
      <html><body style="font-family:system-ui;padding:24px">
        <h2>Payment status: ${session.payment_status}</h2>
        <p>If you already paid, it may take a moment to update.</p>
      </body></html>
    `);
  } catch (e) {
    console.error("checkoutReturn", e.message);
    return res.status(500).send("Error");
  }
};

exports.checkoutCancel = (_req, res) => {
  res.send(`
    <html><body style="font-family:system-ui;padding:24px">
      <h2>Payment canceled</h2>
      <p>You can return to the app and try again.</p>
    </body></html>
  `);
};

/* ------------------------------------------------------------------ */
/* B) PaymentIntent (kept for future native PaymentSheet)              */
/* ------------------------------------------------------------------ */

exports.createIntent = async (req, res) => {
  try {
    const s = getStripe();
    if (!s) return bad(res, "Stripe is not configured");
    const { bookingId } = req.body;
    if (!bookingId) return bad(res, "bookingId is required");

    const b = await Booking.findById(bookingId);
    if (!b || String(b.user) !== String(req.user._id)) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const amountInMinor = Math.round((b.payment?.amount || b.price || 0) * 100);
    const pi = await stripe.paymentIntents.create({
      amount: amountInMinor,
      currency: PAY_CCY,
      metadata: {
        bookingId: b._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    await Booking.findByIdAndUpdate(bookingId, {
      "payment.method": "online",
      "payment.provider": "stripe",
      "payment.providerRef": pi.id,
    });

    return res.json({ clientSecret: pi.client_secret });
  } catch (e) {
    console.error("createIntent", e);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ------------------------------------------------------------------ */
/* Webhook (optional with Checkout; useful if you want server push)    */
/* ------------------------------------------------------------------ */

exports.webhook = async (req, res) => {
  try {
    // If you later set STRIPE_WEBHOOK_SECRET, verify signature here.
    const event = req.body;

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const bookingId = pi.metadata?.bookingId;
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, {
          status: "paid",
          "payment.status": "paid",
          "payment.providerRef": pi.id,
        });
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error("webhook", e.message);
    res.status(400).json({ error: "Webhook error" });
  }
};

/* ------------------------------------------------------------------ */
/* Staff utility                                                       */
/* ------------------------------------------------------------------ */

exports.markPaidAtCenter = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return bad(res, "bookingId is required");

    const b = await Booking.findByIdAndUpdate(
      bookingId,
      {
        "payment.status": "paid",
        "payment.method": "pay_at_center",
        status: "paid",
      },
      { new: true }
    ).lean();

    if (!b) return res.status(404).json({ error: "Booking not found" });

    try {
      if (b.contactNumber) {
        await sendSMS(
          b.contactNumber,
          `Payment recorded for booking #${b.appointment_no}.`
        );
      }
      await sendEmail(
        null,
        "Payment recorded",
        `Booking ${b._id} is marked paid at center.`
      );
    } catch {}

    return res.json({ booking: b });
  } catch (e) {
    console.error("markPaidAtCenter", e);
    return res.status(500).json({ error: "Server error" });
  }
};
