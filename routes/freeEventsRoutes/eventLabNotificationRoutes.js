const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/freeeventsController/eventLabNotificationController');

// Generic notification list (optionally filter by ?user_id=)
router.get('/', ctrl.list);

// Manual trigger for a single lab-result notification (optional endpoint)
router.post('/lab-result-ready', ctrl.createLabResultReady);

// Event notifications
router.post('/event/published', ctrl.createEventPublished);
router.post('/event/updated', ctrl.createEventUpdated);

module.exports = router;
