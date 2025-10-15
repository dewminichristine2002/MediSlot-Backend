const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserChecklistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    testId: { type: String, required: true }, // matches Test.testId
    items: [
      {
        key: String,
        label: String,
        isMandatory: Boolean,
        value: { type: Boolean, default: false }, // user ticked or not
      },
    ],
    completedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("UserChecklist", UserChecklistSchema);
