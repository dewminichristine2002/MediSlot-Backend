require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const HealthCenter = require("./models/HealthCenter");
const DiagnosticTest = require("./models/DiagnosticTest");
const CenterService = require("./models/CenterService");

(async () => {
  try {
    await connectDB();

    await HealthCenter.deleteMany({});
    await DiagnosticTest.deleteMany({});
    await CenterService.deleteMany({});

    const centers = await HealthCenter.insertMany([
      {
        name: "Galle Rural Health Center",
        address: { line1: "Matara Rd", city: "Galle", district: "Galle", province: "Southern", postalCode: "80000" },
        contact: { phone: "091-1234567", email: "galle@health.lk" },
        email: "galle@health.lk",
        location: { type: "Point", coordinates: [80.217, 6.053] },
        opening_time: "08:00",
        closing_time: "16:00",
        isActive: true
      },
      {
        name: "Kandy Rural Health Center",
        address: { line1: "Peradeniya Rd", city: "Kandy", district: "Kandy", province: "Central", postalCode: "20000" },
        contact: { phone: "081-2345678", email: "kandy@health.lk" },
        email: "kandy@health.lk",
        location: { type: "Point", coordinates: [80.638, 7.293] },
        opening_time: "09:00",
        closing_time: "17:00",
        isActive: true
      }
    ]);

    const tests = await DiagnosticTest.insertMany([
      {
        name: "Full Blood Count",
        category: "Blood",
        description: "Basic blood test for overall health",
        price: 1500,
        is_available: true,
        daily_count: 20,
        health_center_id: centers[0]._id // as per your spec
      },
      {
        name: "Vision Screening",
        category: "Eye",
        description: "Check eyesight and basic vision problems",
        price: 800,
        is_available: true,
        daily_count: 15,
        health_center_id: centers[1]._id
      }
    ]);

    await CenterService.insertMany([
      {
        health_center_id: centers[0]._id, // Galle
        test_id: tests[0]._id,            // FBC
        price_override: 1400,
        capacity: 10,
        isActive: true
      },
      {
        health_center_id: centers[1]._id, // Kandy
        test_id: tests[1]._id,            // Vision
        capacity: 8,
        isActive: true
      }
    ]);

    console.log("✅ Seeded healthcenters, diagnostictests, centerservices");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
})();
