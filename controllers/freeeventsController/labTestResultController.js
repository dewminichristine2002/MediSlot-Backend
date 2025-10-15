const mongoose = require("mongoose");
const LabTestResult = require("../../models/LabTestResult");
const { notifyLabResultReady } = require("./eventLabNotificationController");

/* --------------------------------------------------------
   🧩 Helper: Build dynamic filters
-------------------------------------------------------- */
function buildFilters(q) {
  const f = {};
  if (q.user_id && mongoose.isValidObjectId(q.user_id)) f.user_id = q.user_id;
  if (q.q) f.testOrEvent_name = { $regex: q.q.trim(), $options: "i" };
  if (q.from || q.to) {
    f.uploaded_at = {};
    if (q.from) f.uploaded_at.$gte = new Date(q.from);
    if (q.to) f.uploaded_at.$lte = new Date(q.to);
  }
  return f;
}

/* --------------------------------------------------------
   🧾 CREATE (POST /api/lab-tests)
-------------------------------------------------------- */
exports.create = async (req, res) => {
  try {
    const body = { ...req.body };

    // ✅ Cloudinary automatically gives the correct file path
    if (req.file && req.file.path) {
      body.file_path = req.file.path;
    }

    if (!body.user_id || !mongoose.isValidObjectId(body.user_id)) {
      return res.status(400).json({ message: "Invalid or missing user_id" });
    }
    if (!body.testOrEvent_name) {
      return res.status(400).json({ message: "testOrEvent_name is required" });
    }
    if (!body.file_path) {
      return res.status(400).json({ message: "File is required" });
    }

    // 🧩 Prevent duplicate uploads for same test + user
    const existing = await LabTestResult.findOne({
      user_id: body.user_id,
      testOrEvent_name: body.testOrEvent_name,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A report for this user and test already exists." });
    }

    // ✅ Proceed to create
    const doc = await LabTestResult.create(body);

    // 🔔 Fire async notification (non-blocking)
    notifyLabResultReady({ lab_test_result_id: doc._id }).catch((err) =>
      console.error("[notifyLabResultReady] failed:", err.message)
    );

    return res.status(201).json(doc);
  } catch (err) {
    console.error("❌ Create lab test result error:", err);
    return res.status(400).json({
      message: "Failed to create lab test result",
      error: err.message,
    });
  }
};

/* --------------------------------------------------------
   🧾 LIST (GET /api/lab-tests)
-------------------------------------------------------- */
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      100
    );
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);
    const allowed = new Set(["uploaded_at", "testOrEvent_name"]);
    const sortField = allowed.has(req.query.sort)
      ? req.query.sort
      : "uploaded_at";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      LabTestResult.find(filters)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      LabTestResult.countDocuments(filters),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    console.error("❌ List lab tests error:", err);
    return res.status(500).json({
      message: "Failed to fetch lab test results",
      error: err.message,
    });
  }
};

/* --------------------------------------------------------
   🧾 GET BY ID (GET /api/lab-tests/:id)
-------------------------------------------------------- */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ID" });

    const doc = await LabTestResult.findById(id);
    if (!doc)
      return res.status(404).json({ message: "Lab test result not found" });
    return res.json(doc);
  } catch (err) {
    console.error("❌ Get by ID error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch lab test result", error: err.message });
  }
};

/* --------------------------------------------------------
   🧾 UPDATE (PATCH /api/lab-tests/:id)
-------------------------------------------------------- */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ID" });

    const update = { ...req.body };
    if (req.file && req.file.path) {
      update.file_path = req.file.path;
    }

    const doc = await LabTestResult.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return res.status(404).json({ message: "Lab test result not found" });
    return res.json(doc);
  } catch (err) {
    console.error("❌ Update lab test result error:", err);
    return res.status(400).json({
      message: "Failed to update lab test result",
      error: err.message,
    });
  }
};

/* --------------------------------------------------------
   🧾 DELETE (DELETE /api/lab-tests/:id)
-------------------------------------------------------- */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ID" });

    const del = await LabTestResult.findByIdAndDelete(id);
    if (!del)
      return res.status(404).json({ message: "Lab test result not found" });

    return res.json({ message: "Lab test result deleted successfully" });
  } catch (err) {
    console.error("❌ Delete lab test result error:", err);
    return res.status(500).json({
      message: "Failed to delete lab test result",
      error: err.message,
    });
  }
};

/* --------------------------------------------------------
   🧾 LIST BY USER (GET /api/lab-tests/user/:userId)
-------------------------------------------------------- */
exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId))
      return res.status(400).json({ message: "Invalid userId" });

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      100
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      LabTestResult.find({ user_id: userId })
        .sort({ uploaded_at: -1 })
        .skip(skip)
        .limit(limit),
      LabTestResult.countDocuments({ user_id: userId }),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    console.error("❌ List by user error:", err);
    return res
      .status(500)
      .json({
        message: "Failed to fetch lab tests by user",
        error: err.message,
      });
  }
};

/* --------------------------------------------------------
   🧾 DOWNLOAD (GET /api/lab-tests/:id/download)
-------------------------------------------------------- */
exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ID" });

    const doc = await LabTestResult.findById(id);
    if (!doc)
      return res.status(404).json({ message: "Lab test result not found" });

    // Redirect to Cloudinary-hosted file (works for PDFs & images)
    if (doc.file_path && /^https?:\/\//i.test(doc.file_path)) {
      return res.redirect(doc.file_path);
    }

    return res.status(404).json({ message: "File not found on Cloudinary" });
  } catch (err) {
    console.error("❌ Download lab test error:", err);
    return res
      .status(500)
      .json({
        message: "Failed to download lab test result",
        error: err.message,
      });
  }
};

/* --------------------------------------------------------
   🧾 BULK CREATE (POST /api/lab-tests/bulk)
-------------------------------------------------------- */
exports.bulkCreate = async (req, res) => {
  try {
    const docs = Array.isArray(req.body) ? req.body : [];
    if (!docs.length)
      return res
        .status(400)
        .json({ message: "Provide an array of lab test results" });

    const inserted = await LabTestResult.insertMany(docs, { ordered: false });

    Promise.allSettled(
      inserted.map((d) => notifyLabResultReady({ lab_test_result_id: d._id }))
    ).then((results) => {
      const failures = results.filter((r) => r.status === "rejected").length;
      if (failures)
        console.error(
          `[bulk notifyLabResultReady] ${failures} notifications failed`
        );
    });

    return res.status(201).json({
      insertedCount: inserted.length,
      inserted,
    });
  } catch (err) {
    console.error("❌ Bulk create lab test error:", err);
    return res.status(207).json({
      message: "Bulk insert completed with some errors",
      error: err.message,
      writeErrors: err?.writeErrors?.map((w) => w.errmsg) || [],
    });
  }
};
