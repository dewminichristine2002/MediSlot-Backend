const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const Booking = require("../models/Booking");
const HealthCenter = require("../models/HealthCenter");
const { protect, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/bookingsController");

// existing routes
router.get("/availability", protect, ctrl.getAvailability);
router.post("/", protect, ctrl.createBooking);
router.get("/my", protect, ctrl.getMyBookings);

// ✅ NEW: Get all bookings for this health center (lab dashboard)
router.get(
  "/lab",
  protect,
  requireRole("healthCenterAdmin", "admin", "healthCenter", "centerAdmin", "labAdmin"),
  ctrl.getBookingsForLab
);

// ✅ Update booking status (for lab dashboard)
console.log("🧭 Bookings router loaded successfully");

router.patch(
  "/lab/:id/status",
  protect,
  requireRole("healthCenterAdmin", "admin", "healthCenter", "centerAdmin", "labAdmin"),
  (req, res, next) => {
    console.log("🟢 PATCH /lab/:id/status route hit!");
    next();
  },
  ctrl.updateBookingStatusForLab
);

/* ------------------------------------------------------------------
   🧾  BEAUTIFIED PDF RECEIPT (public)
------------------------------------------------------------------ */
router.get("/:id/receipt", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("healthCenter")
      .lean();

    if (!booking) return res.status(404).send("Booking not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Booking_${booking._id}.pdf`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // === HEADER ===
    const logoPath = "public/logo.png"; // optional local logo file
    try {
      doc.image(logoPath, 40, 30, { width: 50 });
    } catch {
      // ignore if logo not found
    }

    doc
      .fillColor("#0ea5e9")
      .fontSize(22)
      .text("MediSlot", 100, 35)
      .fontSize(16)
      .text("Booking Receipt", 100, 60);
    doc.moveDown(1.5);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown(1);

    // === BOOKING SUMMARY BOX ===
    const yStart = doc.y;
    doc.roundedRect(30, yStart, 540, 85, 8).stroke("#0ea5e9");
    doc.font("Helvetica-Bold").fillColor("#0ea5e9").fontSize(13);
    doc.text("Booking Summary", 45, yStart + 8);
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black").fontSize(11);
    doc.text(`Booking ID: ${booking._id}`, 45, yStart + 25);
    doc.text(`Patient Name: ${booking.patientName}`);
    doc.text(`Contact: ${booking.contactNumber}`);
    doc.text(`Health Center: ${booking.healthCenter?.name || "-"}`);
    doc.text(
      `Date: ${booking.scheduledDate}  |  Time: ${booking.scheduledTime}`
    );
    doc.moveDown(2);

    // === PAYMENT INFO ===
    const payMethod = booking?.payment?.method || "unknown";
    const payStatus = booking?.payment?.status || "unpaid";
    const payLabel =
      payMethod === "online"
        ? `Paid via Stripe (${payStatus})`
        : `Pay at Center (${payStatus})`;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#16a34a")
      .text(payLabel, { align: "right" });
    doc.moveDown(1);

    // === TEST DETAILS TABLE ===
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#0ea5e9")
      .text("Test Details");
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("black");
    doc.text("No.", 45);
    doc.text("Test Name", 80);
    doc.text("Price (LKR)", 350, undefined, { align: "right" });
    doc.moveDown(0.3);
    doc.moveTo(45, doc.y).lineTo(560, doc.y).stroke("#0ea5e9");
    doc.moveDown(0.4);

    doc.font("Helvetica").fontSize(11);
    let total = 0;
    booking.items.forEach((item, i) => {
      total += Number(item.price);
      doc.text(`${i + 1}`, 45);
      doc.text(`${item.name}`, 80);
      doc.text(`${item.price.toLocaleString("en-LK")}`, 350, undefined, {
        align: "right",
      });
      doc.moveDown(0.3);
    });

    doc.moveTo(45, doc.y).lineTo(560, doc.y).stroke("#0ea5e9");
    doc.moveDown(0.5);

    // === TOTAL HIGHLIGHT BAR ===
    doc.roundedRect(350, doc.y, 170, 22, 4).fill("#0ea5e9").stroke("#0ea5e9");
    doc
      .fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`TOTAL: LKR ${total.toLocaleString("en-LK")}`, 360, doc.y + 5);
    doc.moveDown(2);

    // === QR CODE (Booking ID) ===
    const qrData = `Booking ID: ${booking._id}`;
    const qrImage = await QRCode.toDataURL(qrData);
    const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
    doc.image(qrBuffer, 45, doc.y, { width: 70 });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("gray")
      .text("Scan for verification", 45, doc.y + 75);
    doc.moveDown(5);

    // === FOOTER ===
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(
        "Thank you for booking with MediSlot.\nThis receipt is automatically generated and does not require a signature.",
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("Receipt generation failed:", err);
    res.status(500).send("Failed to generate receipt");
  }
});

module.exports = router;
