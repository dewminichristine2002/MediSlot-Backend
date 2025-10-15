const express = require("express");
const ctrl = require("../../controllers/LabTests/healthAwarenessController.js");
const upload = require("../../middleware/uploads.js"); // 🔹 multer config

const r = express.Router();

// List all
r.get("/", ctrl.list);

// Get one
r.get("/:id", ctrl.getOne);

// Create (single image, field name = "image")
r.post("/", upload.single("image"), ctrl.create);

// Update (single image optional)
r.put("/:id", upload.single("image"), ctrl.update);

// Delete
r.delete("/:id", ctrl.remove);

module.exports = r;
