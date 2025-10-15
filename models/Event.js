const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },              // event calendar date
    time: { type: String, required: true },            // "HH:mm"
    location: { type: String, required: true, trim: true },
    slots_total: { type: Number, required: true, min: 0 },
    slots_filled: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

EventSchema.index({ date: 1 });
EventSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Event', EventSchema);
