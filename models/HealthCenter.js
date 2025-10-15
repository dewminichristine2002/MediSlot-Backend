const { Schema, model } = require("mongoose");

const hoursSchema = new Schema(
  {
    day: { type: String, enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], required: true },
    open: String,
    close: String,
    closed: { type: Boolean, default: false }
  },
  { _id: false }
);

const healthCenterSchema = new Schema(
  {
    health_center_id: { type: String, unique: true, sparse: true }, // optional custom id
    name: { type: String, required: true, trim: true },
    address: {
      line1: String,
      city: String,
      district: String,
      province: String,
      postalCode: String
    },
    contact: { phone: String, email: String },
    email: String, // also at root if you need it
    services: [String], // e.g. ["OPD","Lab","X-ray"] for badges/filters

    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },

    opening_time: String, // "08:00"
    closing_time: String, // "16:00"
    isActive: { type: Boolean, default: true },

    // optional richer weekly schedule (UI "Open now" can use either)
    hours: [hoursSchema]
  },
  { timestamps: true }
);

healthCenterSchema.index({ location: "2dsphere" });
healthCenterSchema.index({
  name: "text",
  "address.city": "text",
  "address.district": "text",
  "address.province": "text"
});

module.exports = model("HealthCenter", healthCenterSchema);
