const router = require("express").Router();
const c = require("../controllers/centers.controller");
const { protect, requireRole } = require("../middleware/auth");

router.get('/names', c.getHealthCenterNames);

// public
router.get("/", c.listCenters);
router.get("/nearby", c.nearbyCenters);

// ✅ secure “my center” endpoint
router.get("/me", protect, requireRole("healthCenterAdmin", "admin"), c.getMyCenter);

// id-based reads
router.get("/:id", c.getCenterById);
router.get("/:id/tests", c.getCenterTests);

// admin-only mutations
router.post("/", protect, requireRole("admin"), c.createCenter);
router.put("/:id", protect, requireRole("admin"), c.updateCenter);
router.delete("/:id", protect, requireRole("admin"), c.deleteCenter);
router.post("/:centerId/admins", protect, requireRole("admin"), c.createCenterAdmin);

module.exports = router;
