const express = require("express");
const router = express.Router();
const checklist = require("../../controllers/LabTests/userChecklistController");

// ✅ Create checklist for a test
router.post("/create", checklist.createFromTest);

// ✅ Get all checklists for a user
router.get("/", checklist.listForUser);

// ✅ Toggle single checklist item
router.patch("/:id/items/:key", checklist.toggleItem);

// ✅ Reset a checklist
router.put("/:id/reset", checklist.resetAll);

// ✅ Delete checklist
router.delete("/:id", checklist.remove);

module.exports = router;
