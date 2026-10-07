const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, adminOnly } = require('../middleware/auth');

// @route GET /api/users - Get all users (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/users/list - Get minimal user list for filters (all authenticated)
router.get('/list', protect, async (req, res) => {
  try {
    const users = await User.find({ enabled: true }).select('loginId displayName role color').sort({ displayName: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/users - Create a new user (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { loginId, displayName, password, role, color } = req.body;
    if (!loginId || !displayName || !password) {
      return res.status(400).json({ message: 'Login ID, Display Name, and Password are required' });
    }

    const existing = await User.findOne({ loginId: loginId.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Login ID already exists' });
    }

    const COLORS = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0d9488','#ec4899','#f59e0b'];
    const userColor = color || COLORS[Math.floor(Math.random() * COLORS.length)];

    const user = await User.create({
      loginId: loginId.toLowerCase().trim(),
      displayName: displayName.trim(),
      password,
      role: role || 'User',
      color: userColor,
      enabled: true
    });

    await ActivityLog.create({
      type: 'user-mgmt',
      msg: `Admin created user "${displayName}" (${loginId}) with role ${role || 'User'}`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.status(201).json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route PUT /api/users/:loginId/toggle - Enable/Disable user (Admin only)
router.put('/:loginId/toggle', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findOne({ loginId: req.params.loginId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.loginId === req.user.loginId) {
      return res.status(400).json({ message: 'Cannot disable your own account' });
    }

    user.enabled = !user.enabled;
    await user.save();

    await ActivityLog.create({
      type: 'user-mgmt',
      msg: `${user.enabled ? 'Enabled' : 'Disabled'} account for "${user.displayName}"`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/users/:loginId/reset-password - Reset user password (Admin only)
router.put('/:loginId/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Both password fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    const user = await User.findOne({ loginId: req.params.loginId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    await ActivityLog.create({
      type: 'user-mgmt',
      msg: `Admin reset password for "${user.displayName}"`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route DELETE /api/users/:loginId - Delete user (Admin only)
router.delete('/:loginId', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.loginId === req.user.loginId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findOneAndDelete({ loginId: req.params.loginId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.create({
      type: 'user-mgmt',
      msg: `Admin deleted user "${user.displayName}"`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
