// utils/localize.js
function localizeTest(doc, lang) {
  const t = (doc.translations && doc.translations[lang]) || {};
  return {
    _id: doc._id,
    testId: doc.testId,
    name: t.name || doc.name,
    category: t.category || doc.category, // ✅ fallback
    what: t.what || doc.what,
    why: t.why || doc.why,
    preparation: t.preparation?.length ? t.preparation : doc.preparation,
    during: t.during?.length ? t.during : doc.during,
    after: t.after?.length ? t.after : doc.after,
    checklist: t.checklist?.length ? t.checklist : doc.checklist,
    mediaUrl: t.mediaUrl || doc.mediaUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
module.exports = { localizeTest };
