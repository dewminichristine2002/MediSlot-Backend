const r = require('express').Router();
const { protect } = require('../middleware/auth');
const browse = require('../controllers/browseController');

r.get('/centers', protect, browse.listCenters);
r.get('/centers/:id/tests', protect, browse.listTestsForCenter);
r.get('/tests/:id/slots', protect, browse.listSlotsForTest); // ?center=&date=YYYY-MM-DD

module.exports = r;
