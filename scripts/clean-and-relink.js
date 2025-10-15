/**
 * Clean out old seed data and re-create minimal valid demo data
 * linked correctly across HealthCenter → DiagnosticTest → CenterService
 */

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

    console.log('\n🧹 Removing old data...');
    await HealthCenter.deleteMany({});
    await DiagnosticTest.deleteMany({});
    await CenterService.deleteMany({});
    console.log('✅ Old seed data cleared.');

    console.log('\n🏥 Creating new Health Center...');
    const center = await HealthCenter.create({
      name: 'City Lab - Colombo',
      email: 'citylab@demo.com',
      contact: { phone: '0112345678', email: 'citylab@demo.com' },
      location: { type: 'Point', coordinates: [79.8612, 6.9271] },
      opening_time: '08:00',
      closing_time: '16:00',
      isActive: true,
    });
    console.log('✅ Health Center created:', center._id.toString());

    console.log('\n🧪 Creating Diagnostic Tests...');
    const tests = await DiagnosticTest.insertMany([
      {
        testId: 'FBS',
        name: 'Fasting Blood Sugar',
        category: 'Blood',
        description: 'Measures fasting blood sugar level.',
        price: 1200,
        health_center_id: center._id,
        is_available: true,
      },
      {
        testId: 'FBC',
        name: 'Full Blood Count',
        category: 'Blood',
        description: 'Complete blood count analysis.',
        price: 1500,
        health_center_id: center._id,
        is_available: true,
      },
    ]);
    console.log('✅ Tests created:', tests.map(t => t._id.toString()).join(', '));

    console.log('\n🔗 Linking via CenterService...');
    for (const t of tests) {
      await CenterService.create({
        health_center_id: center._id,
        test_id: t._id,
        price_override: t.price,
        capacity: 25,
        isActive: true,
      });
    }
    console.log('✅ CenterService links created.');

    console.log('\n🎉 All data linked successfully.');
  } catch (err) {
    console.error('\n❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from MongoDB.');
  }
})();
