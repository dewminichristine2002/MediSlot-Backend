const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.user_category,
      centerId: user.center ? user.center.toString() : null, // ✅ expose centerId in JWT
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

function toPublicUser(u) {
  const obj = u.toObject ? u.toObject() : u;
  delete obj.password;
  return obj;
}

/**
 * POST /api/users/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, contact_no, name, password, address, user_category, center } = req.body;

    const user = await User.create({
      email,
      contact_no,
      name,
      password,
      address,
      user_category,
      center: center || undefined,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(400).json({ message: 'Registration failed', error: err.message });
  }
};

/**
 * POST /api/users/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    user.password = undefined;

    const safe = toPublicUser(user);
    safe.centerId = user.center ? user.center.toString() : null; // ✅ mirror centerId in response

    return res.json({ token, user: safe });
  } catch (err) {
    return res.status(400).json({ message: 'Login failed', error: err.message });
  }
};

/**
 * GET /api/users/me
 */
exports.me = async (req, res) => {
  return res.json(toPublicUser(req.user));
};

/**
 * PATCH /api/users/me
 */
exports.updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'contact_no', 'address'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });

    return res.json(toPublicUser(user));
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

/**
 * PATCH /api/users/me/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // will be hashed by pre('save')
    await user.save();

    return res.json({ message: 'Password updated' });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to change password', error: err.message });
  }
};

/**
 * GET /api/users (admin)
 */
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const f = {};
    if (req.query.category) f.user_category = req.query.category;

    if (req.query.q) {
      const rx = new RegExp(req.query.q.trim(), 'i');
      f.$or = [{ name: rx }, { email: rx }, { contact_no: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(f).sort({ created_at: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(f),
    ]);

    return res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
};

/**
 * GET /api/users/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    if (req.user.user_category !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

/**
 * PATCH /api/users/:id (admin)
 */
exports.updateByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const allowed = ['name', 'contact_no', 'address', 'user_category', 'center'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(400).json({ message: 'Failed to update user', error: err.message });
  }
};

/**
 * DELETE /api/users/:id (admin)
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const del = await User.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'User not found' });

    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};