const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const HealthAwarenessSchema = new Schema(
  {
    title: String,                       // Title of alert/article
    summary: String,                     // Short description
    description: String,                 // Full content / long info
    type: { type: String, enum: ["article", "video"] },
    mediaUrl: String,                    // Link to video/article
    category: String,                    // e.g. "Dengue", "Flu"
    region: String,                      // e.g. "Islandwide", "Gampaha"
    severity: { type: String, enum: ["high", "medium", "info"] },
    activeFrom: Date,
    activeTo: Date,
    imageUrl: String,                    // One image only (URL or local path)
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = model("HealthAwareness", HealthAwarenessSchema);
