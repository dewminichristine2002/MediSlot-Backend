const mongoose = require('mongoose');
const Notification = require('../../models/Notification');
const LabTestResult = require('../../models/LabTestResult');
const Event = require('../../models/Event');
const User = require('../../models/User');

// ----- LAB TEST NOTIFICATIONS (specific user only) -----

exports.notifyLabResultReady = async ({ lab_test_result_id, user_id, testOrEvent_name }) => {
  if (lab_test_result_id) {
    if (!mongoose.isValidObjectId(lab_test_result_id)) throw new Error('Invalid lab_test_result_id');
    const result = await LabTestResult.findById(lab_test_result_id).lean();
    if (!result) throw new Error('Lab test result not found');
    user_id = result.user_id;
    testOrEvent_name = result.testOrEvent_name;
  }
  if (!user_id) throw new Error('user_id required');

  const base = 'Your lab report is ready.';
  const message = testOrEvent_name ? `${base} (${testOrEvent_name})` : base;

  return Notification.create({ user_id, message });
};

exports.createLabResultReady = async (req, res) => {
  try {
    const doc = await exports.notifyLabResultReady(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to send lab-result notification', error: err.message });
  }
};


// ----- EVENT NOTIFICATIONS (broadcast to all users) -----

// helper: fetch all user ids (optionally filter by role)
async function getAllUserIds(filterByRole /* e.g., 'patient' | undefined */) {
  const q = {};
  if (filterByRole) q.user_category = filterByRole;
  const users = await User.find(q).select('_id').lean();
  return users.map(u => u._id);
}

// New event -> notify everyone (or role)
exports.notifyEventPublished = async ({ event_id, role /* optional: 'patient' */ } = {}) => {
  if (!mongoose.isValidObjectId(event_id)) throw new Error('Invalid event_id');
  const ev = await Event.findById(event_id).lean();
  if (!ev) throw new Error('Event not found');

  const dateStr = ev.date ? new Date(ev.date).toDateString() : '';
  const message = `New event published: ${ev.name} on ${dateStr} at ${ev.time}, ${ev.location}.`;

  const userIds = await getAllUserIds(role);
  if (!userIds.length) return [];

  const payload = userIds.map(uid => ({ user_id: uid, message }));
  return Notification.insertMany(payload, { ordered: false });
};

// Event updated -> notify everyone (or role)
exports.notifyEventUpdated = async ({ event_id, role /* optional */ } = {}) => {
  if (!mongoose.isValidObjectId(event_id)) throw new Error('Invalid event_id');
  const ev = await Event.findById(event_id).lean();
  if (!ev) throw new Error('Event not found');

  const message = `Event updated: ${ev.name} — please check the latest details.`;

  const userIds = await getAllUserIds(role);
  if (!userIds.length) return [];

  const payload = userIds.map(uid => ({ user_id: uid, message }));
  return Notification.insertMany(payload, { ordered: false });
};

// ----- Generic list -----
exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.user_id && mongoose.isValidObjectId(req.query.user_id)) q.user_id = req.query.user_id;
    const items = await Notification.find(q).sort({ sent_at: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

// ----- Route wrappers -----
exports.createEventPublished = async (req, res) => {
  try {
    const docs = await exports.notifyEventPublished(req.body);
    return res.status(201).json(docs);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to send new-event notification', error: err.message });
  }
};

exports.createEventUpdated = async (req, res) => {
  try {
    const docs = await exports.notifyEventUpdated(req.body);
    return res.status(201).json(docs);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to send event-updated notification', error: err.message });
  }
};
