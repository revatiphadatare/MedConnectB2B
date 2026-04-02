const asyncHandler = require('express-async-handler');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');
const { ROLES } = require('../config/constants');

// ── Admin analytics ──────────────────────────────────────────
const getAdminAnalytics = asyncHandler(async (req, res) => {
  // Run all queries in parallel — each has a safe fallback
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    revenueData,
    roleBreakdown,
    monthlyOrders,
  ] = await Promise.all([
    User.countDocuments({ isActive: true, role: { $ne: ROLES.ADMIN } }),
    Order.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, avg: { $avg: '$grandTotal' } } },
    ]).then(r => r).catch(() => []),
    User.aggregate([
      { $match: { role: { $ne: ROLES.ADMIN } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).then(r => r).catch(() => []),
    Order.aggregate([
      {
        $group: {
          _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count:   { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]).then(r => r.reverse()).catch(() => []),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue:  revenueData[0]?.total || 0,
      avgOrderValue: revenueData[0]?.avg   || 0,
      roleBreakdown,
      monthlyOrders,
    },
  });
});

// ── Seller analytics (manufacturer / distributor) ────────────
const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const [orderStats, topProducts, monthlyRevenue] = await Promise.all([
    Order.aggregate([
      { $match: { seller: sellerId } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
    ]).then(r => r).catch(() => []),

    Order.aggregate([
      { $match: { seller: sellerId, status: 'delivered' } },
      { $unwind: '$items' },
      { $group: {
          _id:          '$items.product',
          totalQty:     { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    ]).then(r => r).catch(() => []),

    Order.aggregate([
      { $match: { seller: sellerId } },
      { $group: {
          _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders:  { $sum: 1 },
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]).then(r => r.reverse()).catch(() => []),
  ]);

  const delivered = orderStats.find((s) => s._id === 'delivered');

  res.json({
    success: true,
    data: {
      orderStats,
      topProducts,
      totalRevenue:   delivered?.revenue || 0,
      monthlyRevenue,
    },
  });
});

// ── Buyer analytics (pharmacy / hospital / distributor) ──────
const getBuyerAnalytics = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;

  const [orderStats, spending, topSuppliers, monthlySpend] = await Promise.all([
    Order.aggregate([
      { $match: { buyer: buyerId } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } },
    ]).then(r => r).catch(() => []),

    Order.aggregate([
      { $match: { buyer: buyerId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]).then(r => r).catch(() => []),

    Order.aggregate([
      { $match: { buyer: buyerId } },
      { $group: {
          _id:        '$seller',
          totalSpent: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
    ]).then(r => r).catch(() => []),

    Order.aggregate([
      { $match: { buyer: buyerId } },
      { $group: {
          _id:    { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          spent:  { $sum: '$grandTotal' },
          orders: { $sum: 1 },
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]).then(r => r.reverse()).catch(() => []),
  ]);

  res.json({
    success: true,
    data: {
      orderStats,
      totalSpent:   spending[0]?.total || 0,
      totalOrders:  spending[0]?.count || 0,
      topSuppliers,
      monthlySpend,
    },
  });
});

module.exports = { getAdminAnalytics, getSellerAnalytics, getBuyerAnalytics };
