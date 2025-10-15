require("dotenv").config();
const mongoose = require("mongoose");
const CenterService = require("../models/CenterService");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected:", mongoose.connection.name);

  const docs = await CenterService.find()
    .select("health_center_id test_id isActive")
    .limit(10)
    .lean();

  console.log("Sample CenterService links:");
  console.table(
    docs.map(d => ({
      id: d._id.toString(),
      center: d.health_center_id?.toString(),
      test: d.test_id?.toString(),
      active: d.isActive,
    }))
  );

  await mongoose.disconnect();
})();
