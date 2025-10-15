require('dotenv').config();
const mongoose = require('mongoose');
const HealthCenter = require('../models/HealthCenter');
const DiagnosticTest = require('../models/DiagnosticTest');
const CenterService = require('../models/CenterService');

(async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected:', mongoose.connection.host);

    const hcCount = await HealthCenter.countDocuments();
    const dtCount = await DiagnosticTest.countDocuments();
    const csCount = await CenterService.countDocuments();

    console.log('📊 HealthCenters:', hcCount);
    console.log('📊 DiagnosticTests:', dtCount);
    console.log('📊 CenterServices:', csCount);

    const centers = await HealthCenter.find().lean();
    console.log('\n🏥 Centers List:\n', centers);

    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from MongoDB.');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
