// config/db.js
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing');

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  await mongoose.connect(uri);
  console.log('Mongo connected:', mongoose.connection.host);
  return mongoose.connection;
};
