const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isApproved, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isApproved !== undefined) query.isApproved = isApproved === 'true';
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { 'company.name': { $regex: search, $options: 'i' } },
  ];

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: users,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('approvedBy', 'name email');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

// @desc    Approve/reject user
// @route   PUT /api/users/:id/approve
// @access  Admin
const approveUser = asyncHandler(async (req, res) => {
  const { approved, reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.isApproved = approved;
  user.approvedBy = req.user._id;
  user.approvedAt = new Date();
  await user.save();

  res.json({ success: true, message: `User ${approved ? 'approved' : 'rejected'}`, data: user });
});

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
});

// @desc    Get pending approvals
// @route   GET /api/users/pending
// @access  Admin
const getPendingApprovals = asyncHandler(async (req, res) => {
  const users = await User.find({ isApproved: false, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

module.exports = { getAllUsers, getUserById, approveUser, toggleUserStatus, getPendingApprovals };
