const mongoose = require("mongoose");
const CenterService = require("../models/CenterService");

// GET /api/center-services/by-test?name=&category=
exports.centersByTestName = async (req, res) => {
  try {
    const { name, category } = req.query;

    const rows = await CenterService.aggregate([
      { $match: { isActive: true, is_available: true } },
      { $lookup: { from: "tests", localField: "test_id", foreignField: "_id", as: "test" } },
      { $unwind: "$test" },
      ...(name || category ? [{ $match: {
        ...(name     ? { "test.name":     { $regex: name, $options: "i" } } : {}),
        ...(category ? { "test.category": category } : {}),
      }}] : []),
      { $lookup: { from: "healthcenters", localField: "health_center_id", foreignField: "_id", as: "center" } },
      { $unwind: "$center" },
      {
        $project: {
          center: {
            _id: "$center._id",
            name: "$center.name",
            district: "$center.address.district",
            province: "$center.address.province",
            location: "$center.location",
            services: "$center.services"
          },
          test: {
            _id: "$test._id",
            code: "$test.testId",
            name: "$test.name",
            category: "$test.category"
          },
          price: "$price_override",
          capacity: 1,
          is_available: 1,
          daily_count: 1
        }
      }
    ]);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch centers by test" });
  }
};

// POST /api/center-services
exports.attachTestToCenter = async (req, res) => {
  try {
    const { health_center_id, test_id } = req.body;
    if (!mongoose.isValidObjectId(health_center_id) || !mongoose.isValidObjectId(test_id)) {
      return res.status(400).json({ error: "health_center_id and test_id must be valid ObjectId strings" });
    }
    const doc = await CenterService.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// PUT /api/center-services/:id
exports.updateCenterService = async (req, res) => {
  try {
    const doc = await CenterService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Mapping not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
