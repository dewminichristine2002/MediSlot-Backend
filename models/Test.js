// models/Test.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ChecklistItem = new Schema(
  {
    key: String,
    label: String,
    isMandatory: Boolean,
  },
  { _id: false }
);

const Localized = new Schema(
  {
    name: String,
    what: String,
    why: String,
    category: String,
    preparation: [String],
    during: [String],
    after: [String],
    checklist: [ChecklistItem],
    mediaUrl: String
  },
  { _id: false }
);

const TestSchema = new Schema(
  {
    testId: { type: String, unique: true, required: true },
    name: String,
    category: { type: String, required: true },
    what: String,
    why: String,
    preparation: [String],
    during: [String],
    after: [String],
    checklist: [ChecklistItem],
    mediaUrl: String,

    // NEW: optional translations
    translations: {
      si: Localized, // Sinhala
      // en: Localized, // (optional) you can keep English as base fields
      // ta: Localized, // (future: Tamil)
    }
  },
  { timestamps: true }
);

module.exports = model("Test", TestSchema);
