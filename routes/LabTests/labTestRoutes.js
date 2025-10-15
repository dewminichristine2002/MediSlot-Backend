// routes/LabTests/labTestRoutes.js
const express = require("express");
const ctrl = require("../../controllers/LabTests/labTestController.js");

const r = express.Router();

r.get("/categories", ctrl.categories);
r.get("/", ctrl.list);
r.get("/:id", ctrl.getOne);
r.post("/", ctrl.create);
r.put("/:id", ctrl.update);



r.delete("/:id", ctrl.remove);

module.exports = r;
