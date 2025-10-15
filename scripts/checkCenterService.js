// scripts/checkCenterService.js
require("dotenv").config();
const mongoose = require("mongoose");
const CenterService = require("../models/CenterService");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to:", mongoose.connection.name);

    const count = await CenterService.countDocuments();
    console.log("📊 CenterService count:", count);

    const sample = await CenterService.find().limit(3).lean();
    console.log("🧩 Sample documents:", sample);

    await mongoose.disconnect();
    console.log("🔒 Disconnected.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
