// routes/payments.js
const router = require("express").Router();
const { protect } = require("../middleware/auth");
const pay = require("../controllers/paymentsController");

router.get('/ping', (_req, res) => res.json({ ok: true }));

router.get('/ping', (_req, res) =>
  res.json({
    ok: true,
    hasKey: !!process.env.STRIPE_SECRET_KEY,
    currency: process.env.PAY_CURRENCY,
    baseUrl: process.env.PUBLIC_BASE_URL
  })
);

// PaymentIntent (future PaymentSheet use)
router.post("/intent", protect, pay.createIntent);

// Hosted Checkout (used now)
router.post("/checkout", protect, pay.createCheckoutSession);

// Return pages for Checkout
router.get("/checkout-return", pay.checkoutReturn);
router.get("/checkout-cancel", pay.checkoutCancel);

router.post('/mark-paid-at-center', protect, pay.markPaidAtCenter);

// (no webhook here; it is mounted directly in server.js with express.raw)

module.exports = router; //
