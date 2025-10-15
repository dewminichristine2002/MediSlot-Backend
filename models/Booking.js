// Backend/models/Booking.js
const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

/** Counter per (healthCenter, scheduledDate) → sequential appointment_no */
const counterSchema = new Schema(
  { key: { type: String, unique: true }, seq: { type: Number, default: 0 } },
  { collection: "counters" }
);
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/** One selected test inside a booking (ref + snapshot) */
const itemSchema = new Schema(
  {
    // Change ref string if your team named the model "CenterTest"
    centerTest: { type: Types.ObjectId, ref: "DiagnosticTest", required: true }, // Center_test_id
    name:       { type: String, required: true, trim: true },   // snapshot label at booking time
    price:      { type: Number, required: true, min: 0 }        // snapshot price at booking time
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    // Foreign keys
    user:         { type: Types.ObjectId, ref: "User", required: true },          // User_id
    healthCenter: { type: Types.ObjectId, ref: "HealthCenter", required: true },  // health_center_id

    // Patient details
    patientName:   { type: String, required: true },  // Patient_name
    contactNumber: { type: String, required: true },  // Contact_number

    // Slot
    scheduledDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },       // YYYY-MM-DD
    scheduledTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // HH:mm
    appointment_no:{ type: Number, index: true },                                        // per center/day

    // Multiple tests in one booking
    items: {
      type: [itemSchema],
      validate: [
        arr => Array.isArray(arr) && arr.length > 0,
        "At least one test is required"
      ]
    },

    // Payment summary (embed)
    payment: {
      method: { type: String, enum: ["pay_at_center","online"], default: "pay_at_center" },
      status: { type: String, enum: ["unpaid","paid"], default: "unpaid" },
      amount: { type: Number, required: true, min: 0 } // LKR charged (sum/discount)
    },

    // Total list price snapshot at booking time (sum of item prices)
    price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true } // createdAt, updatedAt
);

/** Disallow duplicate tests within the same booking */
bookingSchema.path("items").validate(function (arr) {
  const ids = arr.map(i => String(i.centerTest));
  return new Set(ids).size === ids.length;
}, "Duplicate test in items");

/** INDEXES */

// Fast per-test availability at a specific slot
bookingSchema.index(
  { healthCenter: 1, scheduledDate: 1, scheduledTime: 1, "items.centerTest": 1 },
  { name: "idx_slot_items_centerTest" }
);

// Queue number uniqueness per center/day
bookingSchema.index(
  { healthCenter: 1, scheduledDate: 1, appointment_no: 1 },
  { unique: true, sparse: true, name: "uniq_appt_no_per_center_day" }
);

// (Optional) reduce spam: same user booking same slot repeatedly
bookingSchema.index(
  { user: 1, healthCenter: 1, scheduledDate: 1, scheduledTime: 1 },
  { name: "idx_user_slot" }
);

/** Auto-assign appointment_no (1,2,3,…) per (center, day) */
bookingSchema.pre("validate", async function assignAppt(next) {
  try {
    if (this.isNew && this.appointment_no == null) {
      const key = `${this.healthCenter}:${this.scheduledDate}`;
      const c = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.appointment_no = c.seq;
    }
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);