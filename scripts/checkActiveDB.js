// scripts/checkActiveDB.js
require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to:", mongoose.connection.name);
    console.log("📦 Host:", mongoose.connection.host);

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📂 Collections found:");
    collections.forEach((c) => console.log(" -", c.name));

    // Quick checks on key models
    const counts = {};
    for (const name of ["users", "healthcenters", "centerservices", "bookings"]) {
      const exists = collections.some((c) => c.name === name);
      if (exists) {
        counts[name] = await mongoose.connection.db.collection(name).countDocuments();
      }
    }

    console.log("\n📊 Document counts:");
    Object.entries(counts).forEach(([k, v]) => console.log(`${k}: ${v}`));

    console.log("\n🎯 Active database is:", mongoose.connection.name);
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error checking DB:", err);
  }
})();
