// routes/freeEventsRoutes/eventRegistrationRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/freeeventsController/eventRegistrationController');
const { protect, requireRole } = require('../../middleware/auth');

// Create
router.post('/events/:eventId/register', protect, ctrl.createForSelf);
router.post('/events/:eventId/register/:patientId', protect, requireRole('admin'), ctrl.createForPatient);

// Self: my events (place BEFORE "/:id")
router.get('/events-by-user/me', protect, ctrl.listMyEvents);

// Admin: events for a specific user (BEFORE "/:id")
router.get('/events-by-user/:userId', protect, requireRole('admin'), ctrl.listEventsByUserId);

// Scan QR (BEFORE "/:id")
router.post('/scan', protect, ctrl.scanQr);

// Reads (generic last)
router.get('/', protect, ctrl.list);
router.get('/:id', protect, ctrl.getById);

// Update status
router.patch('/:id/status', protect, requireRole('admin'), ctrl.updateStatus);

// Cancel (only patients in this example; adjust as needed)
router.patch('/:id/cancel', protect, requireRole('patient'), ctrl.cancelRegistration);

// Delete
router.delete('/:id', protect, requireRole('admin'), ctrl.deleteRegistration);

module.exports = router;
