// controllers/LabTests/labTestController.js
const Test = require("../../models/Test.js");


// helper: merge localized fields over base with fallback
function localizeTest(doc, lang) {
  if (!lang) return doc;
  const t = (doc.translations && doc.translations[lang]) || {};
  return {
    ...doc,
    name: t.name || doc.name,
    category: t.category || doc.category,
    what: t.what || doc.what,
    why: t.why || doc.why,
    preparation: Array.isArray(t.preparation) && t.preparation.length ? t.preparation : doc.preparation,
    during: Array.isArray(t.during) && t.during.length ? t.during : doc.during,
    after: Array.isArray(t.after) && t.after.length ? t.after : doc.after,
    checklist: Array.isArray(t.checklist) && t.checklist.length ? t.checklist : doc.checklist,
    mediaUrl: t.mediaUrl || doc.mediaUrl,
  };
}

// GET /api/tests?category=...&category_si=...&q=...&lang=si
exports.list = async (req, res) => {
  const { category, category_si, q, lang } = req.query;

  const and = [];
  const catOr = [];
  if (category)   catOr.push({ category });
  if (category_si) catOr.push({ "translations.si.category": category_si });
  if (catOr.length) and.push({ $or: catOr });

  if (q) {
    and.push({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { "translations.si.name": { $regex: q, $options: "i" } },
      ],
    });
  }

  const filter = and.length ? { $and: and } : {};
  const docs = await Test.find(filter).sort({ createdAt: -1 }).lean();
  res.json(lang ? docs.map(d => localizeTest(d, lang)) : docs);
};

// GET /api/tests/:id?lang=si
exports.getOne = async (req, res) => {
  const { lang } = req.query;
  let doc = null;

  // Try finding by MongoDB _id
  try {
    doc = await Test.findById(req.params.id).lean();
  } catch {
    doc = null; // if invalid ObjectId format
  }

  // If not found, try by testId or test_id
  if (!doc) {
    doc = await Test.findOne({
      $or: [{ testId: req.params.id }, { test_id: req.params.id }],
    }).lean();
  }

  if (!doc) return res.status(404).json({ message: "Not found" });

  res.json(lang ? localizeTest(doc, lang) : doc);
};

// POST /api/tests
exports.create = async (req, res) => {
  if (!req.body.testId) req.body.testId = "T" + Date.now();
  const doc = await Test.create(req.body);
  res.status(201).json(doc);
};


// PUT /api/tests/:id
exports.update = async (req, res) => {
  const doc = await Test.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};



// DELETE /api/tests/:id
exports.remove = async (req, res) => {
  const doc = await Test.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};

// GET /api/labtests/categories?lang=si
// GET /api/labtests/categories?lang=en or ?lang=si
exports.categories = async (req, res) => {
  const { lang } = req.query;

  let categories = [];

  if (lang === "si") {
    categories = await Test.find({ "translations.si.category": { $exists: true, $ne: "" } })
      .distinct("translations.si.category");
  } else {
    categories = await Test.distinct("category");
  }

  res.json(categories.sort());
};

