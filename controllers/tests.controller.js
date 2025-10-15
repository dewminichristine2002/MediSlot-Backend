const DiagnosticTest = require("../models/DiagnosticTest");

// GET /api/tests?q=&category=
exports.listTests = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.$text = { $search: q };
    const tests = await DiagnosticTest.find(filter).limit(200);
    res.json(tests);
  } catch (e) {
    res.status(500).json({ error: "Failed to list tests" });
  }
};

// POST /api/tests
exports.createTest = async (req, res) => {
  try {
    const doc = await DiagnosticTest.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// PUT /api/tests/:id
exports.updateTest = async (req, res) => {
  try {
    const doc = await DiagnosticTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Test not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
