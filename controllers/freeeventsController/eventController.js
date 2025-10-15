// controllers/eventController.js
const mongoose = require("mongoose");
//const Event = require('../models/Event');
const Event = require("../../models/Event");

// Helper: build filters from query
function buildFilters(query) {
  const filters = {};
  // date range: ?from=2025-08-01&to=2025-08-31
  if (query.from || query.to) {
    filters.date = {};
    if (query.from) filters.date.$gte = new Date(query.from);
    if (query.to) filters.date.$lte = new Date(query.to);
  }
  // text search: ?q=colombo
  if (query.q) {
    filters.$text = { $search: query.q };
  }
  return filters;
}

// Helper: sort mapping
function buildSort(query) {
  // ?sort=date|name|created_at  & order=asc|desc
  const allowed = new Set(["date", "name", "created_at", "updated_at"]);
  const sortField = allowed.has(query.sort) ? query.sort : "date";
  const direction = query.order === "desc" ? -1 : 1;
  return { [sortField]: direction };
}

// POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const payload = req.body;

    // Optional guard: slots_filled must not exceed slots_total
    if (payload.slots_filled && payload.slots_total != null) {
      if (payload.slots_filled > payload.slots_total) {
        return res
          .status(400)
          .json({ message: "slots_filled cannot exceed slots_total" });
      }
    }

    const event = await Event.create(payload);
    return res.status(201).json(event);
  } catch (err) {
    console.error("createEvent error:", err);
    return res
      .status(400)
      .json({ message: "Failed to create event", error: err.message });
  }
};

// GET /api/events
// Shows ALL events (no pagination)
exports.getEvents = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const sort = buildSort(req.query);

    // Fetch all events (no skip, no limit)
    const events = await Event.find(filters).sort(sort).lean();
    const total = events.length;

    // Add derived fields for UI
    const items = events.map((event) => ({
      ...event,
      slots_remaining: Math.max(
        0,
        (event.slots_total || 0) - (event.slots_filled || 0)
      ),
      attended_count: event.attended_count || 0,
    }));

    return res.json({
      total,
      items,
    });
  } catch (err) {
    console.error("getEvents error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch events", error: err.message });
  }
};


// GET /api/events/:id
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    // lean() so we can spread a plain object
    const event = await Event.findById(id).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    const slots_remaining = Math.max(
      0,
      (event.slots_total || 0) - (event.slots_filled || 0)
    );

    return res.json({ ...event, slots_remaining });
  } catch (err) {
    console.error("getEventById error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch event", error: err.message });
  }
};

// PATCH /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const update = req.body;

    // Guard: do not allow slots_filled > slots_total
    if (update.slots_total != null || update.slots_filled != null) {
      const current = await Event.findById(id).lean();
      if (!current) return res.status(404).json({ message: "Event not found" });

      const nextTotal =
        update.slots_total != null ? update.slots_total : current.slots_total;
      const nextFilled =
        update.slots_filled != null
          ? update.slots_filled
          : current.slots_filled;
      if (nextFilled > nextTotal) {
        return res
          .status(400)
          .json({ message: "slots_filled cannot exceed slots_total" });
      }
    }

    const event = await Event.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    return res.json(event);
  } catch (err) {
    console.error("updateEvent error:", err);
    return res
      .status(400)
      .json({ message: "Failed to update event", error: err.message });
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Event not found" });

    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete event", error: err.message });
  }
};

// POST /api/events/:id/register  (reserve one slot)
/*exports.registerToEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.slots_filled >= event.slots_total) {
      return res.status(409).json({ message: 'Event is full' });
    }

    event.slots_filled += 1;
    await event.save();

    return res.json({ message: 'Registered', event });
  } catch (err) {
    console.error('registerToEvent error:', err);
    return res.status(500).json({ message: 'Failed to register', error: err.message });
  }
};*/

// POST /api/events/:id/cancel  (release one slot)
/*exports.cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.slots_filled <= 0) {
      return res.status(400).json({ message: 'No filled slots to cancel' });
    }

    event.slots_filled -= 1;
    await event.save();

    return res.json({ message: 'Cancelled', event });
  } catch (err) {
    console.error('cancelRegistration error:', err);
    return res.status(500).json({ message: 'Failed to cancel registration', error: err.message });
  }
};*/

// GET /api/events/upcoming  (next N days)
exports.getUpcoming = async (req, res) => {
  try {
    const days = Math.max(parseInt(req.query.days || "30", 10), 1);
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + days);

    const items = await Event.find({ date: { $gte: now, $lte: until } }).sort({
      date: 1,
    });
    return res.json(items);
  } catch (err) {
    console.error("getUpcoming error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch upcoming events", error: err.message });
  }
};
