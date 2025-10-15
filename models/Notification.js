const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    sent_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

NotificationSchema.index({ user_id: 1, sent_at: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
