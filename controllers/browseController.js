// controllers/browseController.js
const { Types, isValidObjectId } = require("mongoose");
const HealthCenter = require("../models/HealthCenter");
const Test = require("../models/Test");
const CenterService = require("../models/CenterService");
const Booking = require("../models/Booking");

/** Utility: format date to YYYY-MM-DD */
const ymd = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
};

/* -------------------------------------------------------------------------- */
/* 🏥 1️⃣ List All Health Centers                                              */
/* -------------------------------------------------------------------------- */
exports.listCenters = async (_req, res) => {
  try {
    const centers = await HealthCenter.find({ isActive: true })
      .select("_id name address.city address.district")
      .sort({ "address.district": 1, name: 1 })
      .lean();
    res.json(centers);
  } catch (err) {
    console.error("listCenters error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* 🧪 2️⃣ List Tests Available for a Health Center                              */
/* -------------------------------------------------------------------------- */
exports.listTestsForCenter = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid center id" });

    // Find all CenterService docs for this center
    const services = await CenterService.find({
      health_center_id: id,
      isActive: true,
    })
      .populate({
        path: "test_id",
        model: "Test", // use correct model name
        select: "name category what why preparation",
      })
      .lean();

    if (!services.length) return res.json([]);

    const tests = services
      .filter((s) => s.test_id)
      .map((s) => ({
        _id: s.test_id._id,
        name: s.test_id.name,
        category: s.test_id.category,
        description: s.test_id.what || "",
        price: s.price_override ?? 0,
      }));

    // sort alphabetically
    tests.sort((a, b) => a.name.localeCompare(b.name));
    res.json(tests);
  } catch (err) {
    console.error("listTestsForCenter error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* ⏰ 3️⃣ List Available Time Slots for a Given Test                            */
/* -------------------------------------------------------------------------- */
exports.listSlotsForTest = async (req, res) => {
  try {
    const { id } = req.params; // test_id
    const { center, date } = req.query;

    if (!isValidObjectId(id) || !isValidObjectId(center))
      return res.status(400).json({ error: "Invalid id" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: "Invalid date format" });

    const service = await CenterService.findOne({
      health_center_id: center,
      test_id: id,
      isActive: true,
    })
      .populate("test_id", "name")
      .lean();

    if (!service) return res.status(404).json({ error: "Test not available at this center" });

    // Default: assume 8am–5pm hourly slots
    const defaultSlots = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ];

    const capacity = service.daily_count || 10;
    const list = [];

    for (const time of defaultSlots) {
      const agg = await Booking.aggregate([
        {
          $match: {
            healthCenter: new Types.ObjectId(center),
            scheduledDate: date,
            scheduledTime: time,
          },
        },
        { $unwind: "$items" },
        { $match: { "items.centerTest": new Types.ObjectId(service._id) } },
        { $count: "used" },
      ]);
      const used = agg[0]?.used || 0;
      list.push({ time, remaining: Math.max(0, capacity - used) });
    }

    res.json(list);
  } catch (err) {
    console.error("listSlotsForTest error:", err);
    res.status(500).json({ error: err.message });
  }
};
