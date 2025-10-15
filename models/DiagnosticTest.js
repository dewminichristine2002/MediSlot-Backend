const { Schema, model, Types } = require("mongoose");

const diagnosticTestSchema = new Schema(
  {
    // Unique test identifier (not MongoDB _id)
    testId: { type: String, required: true, unique: true, trim: true },

    center_test_id: { type: String, unique: true, sparse: true }, // optional legacy/custom id

    name: { type: String, required: true, trim: true },
    category: { type: String, index: true }, // Blood, Eye, Dental, etc.
    description: String,
    price: Number,

    // Availability flags
    is_available: { type: Boolean, default: true },
    daily_count: Number, // coarse capacity (not real-time slots)

    // Link to center
    health_center_id: { type: Types.ObjectId, ref: "HealthCenter", required: true },

    // Available dates & times
    availableSlots: [
      {
        date: { type: Date, required: true }, // eg. "2025-09-09"
        times: [
          {
            start: { type: String, required: true }, // eg. "09:00"
            end: { type: String, required: true },   // eg. "10:00"
            capacity: { type: Number, default: 1 },  // optional: how many patients can book
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Full-text search
diagnosticTestSchema.index({
  name: "text",
  category: "text",
  description: "text",
});

// Transform JSON output (hide Mongo _id, __v)
diagnosticTestSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id; // expose id if needed
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Static helper to fetch only testId, name, category, description
diagnosticTestSchema.statics.getBasicDetails = function () {
  return this.find({}, "testId name category description").lean();
};

module.exports = model("DiagnosticTest", diagnosticTestSchema);
