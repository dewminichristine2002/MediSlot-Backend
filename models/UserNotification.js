const { Schema, model, Types } = require("mongoose");

const UserNotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: false },
    contactNumber: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["booking", "system"], default: "booking" },
    booking: { type: Types.ObjectId, ref: "Booking", required: false },
    appointment_no: { type: String, index: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("UserNotification", UserNotificationSchema);
