const { Schema, model, Types } = require("mongoose");

const centerServiceSchema = new Schema(
  {
    health_center_id: { type: Types.ObjectId, ref: "HealthCenter", required: true, index: true },
    test_id:         { type: Types.ObjectId, ref: "Test",        required: true, index: true },

    price_override: Number,
    capacity: Number,
    is_available: { type: Boolean, default: true },
    daily_count: Number,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

centerServiceSchema.index(
  { health_center_id: 1, test_id: 1 },
  { unique: true, name: "uniq_center_test" }
);

module.exports = model("CenterService", centerServiceSchema);
