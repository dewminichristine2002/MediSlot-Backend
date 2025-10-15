// routes/tests.routes.js
const router = require("express").Router();

// from routes/ → controllers/ is ONE level up, not two
const t = require("../controllers/tests.controller");

router.get("/", t.listTests);
router.post("/", t.createTest);
router.put("/:id", t.updateTest);

module.exports = router;
