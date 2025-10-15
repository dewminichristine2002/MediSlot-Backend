// models/EventRegistration.js
const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema(
  {
    // --- Event reference ---
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

    // --- Patient reference + details captured at registration time ---
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    nic: { type: String, required: true, trim: true },            // not unique here (same NIC can register for multiple events)
    gender: { type: String, enum: ['Male', 'Female'] },
    age: { type: Number, min: 0, max: 120, required: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, default: '' },

    // --- Registration state ---
    status: {
      type: String,
      enum: ['confirmed', 'waitlist', 'cancelled', 'attended'],
      default: 'confirmed',
      index: true,
    },

    // --- Optional QR code data/URL ---
    qr_code: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'registered_at', updatedAt: 'updated_at' } }
);

// Prevent duplicate registrations of the same patient for the same event
EventRegistrationSchema.index(
  { event_id: 1, patient_id: 1 },
  { unique: true, name: 'uniq_event_patient' }
);

// Helpful search indexes
EventRegistrationSchema.index({ nic: 1 });
EventRegistrationSchema.index({ name: 'text', email: 'text', address: 'text' });

// Normalize email
EventRegistrationSchema.pre('save', function (next) {
  if (this.email) this.email = this.email.toLowerCase();
  next();
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
