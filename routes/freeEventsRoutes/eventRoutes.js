// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/freeeventsController/eventController');

// CRUD
router.post('/', ctrl.createEvent);
router.get('/', ctrl.getEvents);
router.get('/upcoming', ctrl.getUpcoming);
router.get('/:id', ctrl.getEventById);
router.patch('/:id', ctrl.updateEvent);
router.delete('/:id', ctrl.deleteEvent);

// Capacity helpers
//router.post('/:id/register', ctrl.registerToEvent);
//router.post('/:id/cancel', ctrl.cancelRegistration);

module.exports = router;
