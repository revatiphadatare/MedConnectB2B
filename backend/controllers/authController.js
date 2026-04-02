const asyncHandler    = require('express-async-handler');
const User            = require('../models/User');
const generateToken   = require('../utils/generateToken');
const { ROLES }       = require('../config/constants');

// ── Register (public users only — admin cannot self-register) ──
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, company, contactPerson } = req.body;

  // Block admin role from public registration
  if (role === ROLES.ADMIN) {
    res.status(403);
    throw new Error('Admin accounts cannot be self-registered');
  }

  if (!name || !email || !password || !role || !company?.name) {
    res.status(400);
    throw new Error('Name, email, password, role and company name are required');
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    res.status(400);
    throw new Error('This email is already registered');
  }

  const user = await User.create({
    name:          name.trim(),
    email:         email.toLowerCase().trim(),
    password,
    role,
    company,
    contactPerson: contactPerson || {},
    isApproved:    false,
    isVerified:    false,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Awaiting admin approval.',
    data: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      company:    user.company,
      isApproved: user.isApproved,
      token:      generateToken(user._id, user.role),
    },
  });
});

// ── General login (for all non-admin roles) ────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Block admin from using the general login
  if (user.role === ROLES.ADMIN) {
    res.status(403);
    throw new Error('Admin must use the Admin Login portal');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact support.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      company:    user.company,
      isApproved: user.isApproved,
      isVerified: user.isVerified,
      token:      generateToken(user._id, user.role),
    },
  });
});

// ── Admin-only login (separate portal) ─────────────────────
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password, adminKey } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role:  ROLES.ADMIN,
  }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Admin account is deactivated');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      company:    user.company,
      isApproved: true,
      isVerified: true,
      token:      generateToken(user._id, user.role),
    },
  });
});

// ── Get current user ───────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('approvedBy', 'name email');
  res.json({ success: true, data: user });
});

// ── Update profile ─────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, company, contactPerson } = req.body;

  if (name)          user.name          = name.trim();
  if (company)       user.company       = { ...user.company?.toObject?.() || user.company, ...company };
  if (contactPerson) user.contactPerson = { ...user.contactPerson, ...contactPerson };

  const updated = await user.save();
  res.json({ success: true, data: updated });
});

// ── Change password ────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both current and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = { register, login, adminLogin, getMe, updateProfile, changePassword };
