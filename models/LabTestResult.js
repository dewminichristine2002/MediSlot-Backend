// models/LabTestResult.js
const mongoose = require('mongoose');

const LabTestResultSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testOrEvent_name: {
      type: String,
      required: true,
      trim: true,
    },
    // If stored locally, this is like "/uploads/reports/<filename>.pdf"
    // If stored remotely (S3), you can save the absolute URL here.
    file_path: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional metadata
    notes: String,
    uploaded_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabTestResult', LabTestResultSchema);
