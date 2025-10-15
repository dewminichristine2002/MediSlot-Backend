const router = require("express").Router();
const s = require("../controllers/centerService.controller");

// query
router.get("/by-test", s.centersByTestName);

// admin
router.post("/", s.attachTestToCenter);
router.put("/:id", s.updateCenterService);

module.exports = router;
