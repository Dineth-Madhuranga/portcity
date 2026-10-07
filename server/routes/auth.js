const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Please enter Login ID and Password.' });
    }

    const user = await User.findOne({ loginId: loginId.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Login ID not found. Contact Admin.' });
    }
    if (!user.enabled) {
      return res.status(401).json({ message: 'Account is disabled. Contact Admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Log login activity
    await ActivityLog.create({
      type: 'login',
      msg: `${user.displayName} logged in`,
      user: user.displayName,
      userId: user.loginId
    });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        loginId: user.loginId,
        displayName: user.displayName,
        role: user.role,
        color: user.color,
        enabled: user.enabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    await ActivityLog.create({
      type: 'login',
      msg: `${req.user.displayName} logged out`,
      user: req.user.displayName,
      userId: req.user.loginId
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ message: 'Display name cannot be empty' });
    }

    const user = await User.findById(req.user._id);
    const oldName = user.displayName;
    user.displayName = displayName.trim();
    await user.save();

    await ActivityLog.create({
      type: 'edit',
      msg: `${oldName} changed display name to ${displayName.trim()}`,
      user: displayName.trim(),
      userId: user.loginId
    });

    res.json({ user: user.toJSON(), message: 'Profile updated!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Fill all password fields' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await ActivityLog.create({
      type: 'edit',
      msg: `${user.displayName} changed their password`,
      user: user.displayName,
      userId: user.loginId
    });

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
