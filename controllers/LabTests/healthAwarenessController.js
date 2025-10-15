const path = require("path");
const HealthAwareness = require("../../models/HealthAwareness.js");
const cloudinary = require("cloudinary").v2; // ✅ added

// ✅ Configure Cloudinary here itself (no separate file needed)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Helper: upload to Cloudinary
async function uploadToCloudinary(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "health-awareness",
    });
    return result.secure_url; // public Cloudinary image URL
  } catch (err) {
    console.error("❌ Cloudinary upload failed:", err.message);
    return null;
  }
}

// ✅ Helper: build image URL path (fallback)
function pickImageUrl(req) {
  if (req.file) {
    return "/uploads/" + req.file.filename; // static served path
  }
  if (req.body.imageUrl) {
    return req.body.imageUrl; // accept direct URL when no file uploaded
  }
  return undefined;
}

// ========================= CRUD =========================

// GET all
exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.region) q.region = req.query.region;
    if (req.query.category) q.category = req.query.category;
    const docs = await HealthAwareness.find(q).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET one
exports.getOne = async (req, res) => {
  try {
    const doc = await HealthAwareness.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE
exports.create = async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      summary: req.body.summary,
      description: req.body.description,
      type: req.body.type,
      mediaUrl: req.body.mediaUrl,
      category: req.body.category,
      region: req.body.region,
      severity: req.body.severity,
      activeFrom: req.body.activeFrom,
      activeTo: req.body.activeTo,
      createdBy: req.body.createdBy,
    };

    // ✅ If file uploaded, try Cloudinary first
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path);
      // fallback to local if Cloudinary fails
      payload.imageUrl = cloudUrl || "/uploads/" + req.file.filename;
    } else if (req.body.imageUrl) {
      payload.imageUrl = req.body.imageUrl;
    }

    const doc = await HealthAwareness.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("❌ Create error:", err);
    res.status(400).json({ error: err.message });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };

    // ✅ If a new file uploaded, upload to Cloudinary
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path);
      payload.imageUrl = cloudUrl || "/uploads/" + req.file.filename;
    }

    const doc = await HealthAwareness.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const doc = await HealthAwareness.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
