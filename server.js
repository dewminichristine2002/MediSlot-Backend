// server.js
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");



const app = express();
//--Booking
const Booking = require("./models/Booking");
const paymentsController = require("./controllers/paymentsController");

// --- Core middleware (once) ---
app.use(cors({ origin: true, credentials: true }));

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentsController.webhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Tiny request logger ---
app.use((req, _res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});


// --- Health checks (once) ---
app.get("/", (_req, res) => res.send("OK"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

//--- DB Health check ---
app.get("/db-health", async (_req, res) => {
  try {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    const rs = mongoose.connection.readyState;
    if (rs === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      return res.json({ state: states[rs] || rs, ping: "ok" });
    }
    return res
      .status(500)
      .json({ state: states[rs] || rs, ping: "skip", hint: "not connected" });
  } catch (e) {
    return res.status(500).json({ state: "error", error: e.message });
  }
});

// --- Ensure uploads dir and serve static ---
const uploadsRoot = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

// ✅ Serve uploads folder publicly
app.use("/uploads", express.static(uploadsRoot));


// --- Connect DB (non-fatal on dev) ---
(async () => {
  try {
    await connectDB();
    console.log('Mongo connected');
  } catch (e) {
    console.error("Mongo connect failed:", e.message);
  }
})();

// --- Routes: mount each ONCE ---

app.use("/api/uploads", require("./routes/uploadRoutes"));

app.use("/api/health-awareness", require("./routes/LabTests/healthAwarenessRoutes"));
app.use("/api/user-checklist", require("./routes/LabTests/userChecklistRoutes"));

// Keep ONE tests route. If you want the generic tests CRUD, use this:
app.use("/api/tests", require("./routes/tests.routes"));


app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/centers", require("./routes/centers.routes"));
app.use("/api/center-services", require("./routes/centerService.routes"));

app.use('/api/events', require('./routes/freeEventsRoutes/eventRoutes'));
app.use('/api/event-registrations', require('./routes/freeEventsRoutes/eventRegistrationRoutes'));
app.use('/api/lab-tests', require('./routes/freeEventsRoutes/labTestResultRoutes'));
app.use("/api/labtests", require("./routes/LabTests/labTestRoutes"));
app.use('/api/eventLabNotifications', require('./routes/freeEventsRoutes/eventLabNotificationRoutes'));




// Users, Bookings, Payments, Browse
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/browse", require("./routes/browse"));

// --- 404 for unknown API routes ---
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Not Found' });
  }
  return next();
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  const status = err.status || 400;
  const message = err.message || 'Request error';
  return res.status(status).json({ message });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error(" Global Error:", err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server on http://${HOST}:${PORT}`);
});

module.exports = app;
