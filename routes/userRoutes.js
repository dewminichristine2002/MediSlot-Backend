// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/auth');

// Auth
router.post('/auth/register', ctrl.register);
router.post('/auth/login', ctrl.login);

// Me
router.get('/me', protect, ctrl.me);
router.patch('/me', protect, ctrl.updateMe);
router.patch('/me/password', protect, ctrl.changePassword);

// Admin
router.get('/', protect, requireRole('admin'), ctrl.list);
router.get('/:id', protect, ctrl.getById); // owner or admin enforced in controller
router.patch('/:id', protect, requireRole('admin'), ctrl.updateByAdmin);
router.delete('/:id', protect, requireRole('admin'), ctrl.remove);

module.exports = router;
