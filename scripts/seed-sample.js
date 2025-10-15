// // Backend/scripts/seed-sample.js
// const dotenv = require('dotenv');
// dotenv.config();

// const mongoose = require('mongoose');
// const HealthCenter = require('../models/HealthCenter');
// const DiagnosticTest = require('../models/DiagnosticTest');

// const MONGO_URI = process.env.MONGO_URI;

// function dayISO(d) {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, '0');
//   const dd = String(d.getDate()).padStart(2, '0');
//   return `${yyyy}-${mm}-${dd}`;
// }

// function buildAvailableSlots(days = 14) {
//   const out = [];
//   const today = new Date();
//   for (let i = 0; i < days; i++) {
//     const d = new Date(today);
//     d.setDate(today.getDate() + i);
//     out.push({
//       date: new Date(dayISO(d)), // date-only
//       times: [
//         { start: '09:00', end: '09:30', capacity: 5 },
//         { start: '10:00', end: '10:30', capacity: 5 },
//       ],
//     });
//   }
//   return out;
// }

// (async () => {
//   await mongoose.connect(MONGO_URI);
//   console.log('Mongo connected:', mongoose.connection.host);

//   // 1) Upsert one demo center (or reuse the one you already have)
//   const center = await HealthCenter.findOneAndUpdate(
//     { name: 'City Lab - Colombo' },
//     {
//       name: 'City Lab - Colombo',
//       email: 'demo@citylab.example',
//       location: { type: 'Point', coordinates: [79.8612, 6.9271] },
//       opening_time: '08:00',
//       closing_time: '16:00',
//       isActive: true,
//     },
//     { upsert: true, new: true, setDefaultsOnInsert: true }
//   );
//   console.log('Center:', center._id.toString());

//   // 2) Upsert two tests tied to that center, with overlapping availableSlots
//   const baseSlots = buildAvailableSlots(14); // SAME for both tests

//   const t1 = await DiagnosticTest.findOneAndUpdate(
//     { testId: 'FBS' },
//     {
//       testId: 'FBS',
//       center_test_id: 'legacy-fbs',
//       name: 'Fasting Blood Sugar',
//       category: 'Blood',
//       price: 1200,
//       is_available: true,
//       health_center_id: center._id,
//       availableSlots: baseSlots,
//     },
//     { upsert: true, new: true, setDefaultsOnInsert: true }
//   );

//   const t2 = await DiagnosticTest.findOneAndUpdate(
//     { testId: 'FBC' },
//     {
//       testId: 'FBC',
//       center_test_id: 'legacy-fbc',
//       name: 'Full Blood Count',
//       category: 'Blood',
//       price: 1500,
//       is_available: true,
//       health_center_id: center._id,
//       availableSlots: baseSlots, // identical => they overlap
//     },
//     { upsert: true, new: true, setDefaultsOnInsert: true }
//   );

//   console.log('Tests:', t1._id.toString(), t2._id.toString());
//   await mongoose.disconnect();
//   console.log('Done.');
// })();
