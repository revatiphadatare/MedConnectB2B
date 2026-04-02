const asyncHandler  = require('express-async-handler');
const Sale          = require('../models/Sale');
const Batch         = require('../models/Batch');
const Medicine      = require('../models/Medicine');
const PurchaseOrder = require('../models/PurchaseOrder');
const AccountEntry  = require('../models/AccountEntry');

const getDateRange = (req) => {
  const start = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(new Date().setDate(1)); // start of current month
  const end = req.query.endDate
    ? new Date(new Date(req.query.endDate).setHours(23, 59, 59))
    : new Date();
  return { start, end };
};

// GET /api/reports/sales
exports.salesReport = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);
  const uid = req.user._id;

  const [daily, byPayment, topMedicines, totals] = await Promise.all([
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          sales:    { $sum: '$grandTotal' },
          count:    { $sum: 1 },
          discount: { $sum: '$totalDiscount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$paymentMode', total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      {
        $group: {
          _id:     '$items.medicine',
          name:    { $first: '$items.medicineName' },
          qty:     { $sum: '$items.quantity' },
          revenue: { $sum: '$items.amount' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id:           null,
          totalSales:    { $sum: '$grandTotal' },
          totalDiscount: { $sum: '$totalDiscount' },
          totalGst:      { $sum: '$totalGst' },
          count:         { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      daily,
      byPayment,
      topMedicines,
      totals: totals[0] || { totalSales: 0, totalDiscount: 0, totalGst: 0, count: 0 },
    },
  });
});

// GET /api/reports/profit-loss
exports.profitLoss = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);
  const uid = req.user._id;

  const [salesData, purchaseData, expenses] = await Promise.all([
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' }, gst: { $sum: '$totalGst' } } },
    ]),
    PurchaseOrder.aggregate([
      { $match: { owner: uid, status: 'received', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, cost: { $sum: '$grandTotal' } } },
    ]),
    AccountEntry.aggregate([
      { $match: { owner: uid, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const revenue      = salesData[0]?.revenue    || 0;
  const gst          = salesData[0]?.gst        || 0;
  const cogs         = purchaseData[0]?.cost    || 0;
  const totalExpenses= expenses.reduce((s, e) => s + e.total, 0);
  const grossProfit  = revenue - cogs;
  const netProfit    = grossProfit - totalExpenses;

  res.json({
    success: true,
    data: { revenue, gst, cogs, grossProfit, totalExpenses, netProfit, expenses },
  });
});

// GET /api/reports/stock
exports.stockReport = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [medicines, lowStock, outOfStock, inventoryValue] = await Promise.all([
    Medicine.find({ owner: uid, isActive: true }).sort({ name: 1 }),
    Medicine.find({
      owner:    uid,
      isActive: true,
      currentStock: { $gt: 0 },
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
    }),
    Medicine.find({ owner: uid, isActive: true, currentStock: 0 }),
    Batch.aggregate([
      { $match: { owner: uid, availableQty: { $gt: 0 } } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$availableQty', '$purchasePrice'] } } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      medicines,
      lowStockCount:       lowStock.length,
      outOfStockCount:     outOfStock.length,
      lowStock,
      outOfStock,
      totalInventoryValue: inventoryValue[0]?.value || 0,
    },
  });
});

// GET /api/reports/expiry
exports.expiryReport = asyncHandler(async (req, res) => {
  const uid  = req.user._id;
  const now  = new Date();
  const d30  = new Date(now.getTime() +  30 * 86400000);
  const d60  = new Date(now.getTime() +  60 * 86400000);
  const d90  = new Date(now.getTime() +  90 * 86400000);

  const [expired, within30, within60, within90] = await Promise.all([
    Batch.find({ owner: uid, isExpired: true, availableQty: { $gt: 0 } })
      .populate('medicine', 'name brand genericName'),
    Batch.find({ owner: uid, expiryDate: { $lte: d30 }, isExpired: false, availableQty: { $gt: 0 } })
      .populate('medicine', 'name brand'),
    Batch.find({ owner: uid, expiryDate: { $gt: d30, $lte: d60 }, isExpired: false, availableQty: { $gt: 0 } })
      .populate('medicine', 'name brand'),
    Batch.find({ owner: uid, expiryDate: { $gt: d60, $lte: d90 }, isExpired: false, availableQty: { $gt: 0 } })
      .populate('medicine', 'name brand'),
  ]);

  res.json({ success: true, data: { expired, within30, within60, within90 } });
});

// GET /api/reports/accounting
exports.getAccounting = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);
  const uid = req.user._id;

  const [entries, salesRevenue] = await Promise.all([
    AccountEntry.find({ owner: uid, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
  ]);

  const manualIncome  = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalIncome   = manualIncome + (salesRevenue[0]?.total || 0);
  const totalExpense  = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance       = totalIncome - totalExpense;

  res.json({ success: true, data: { entries, income: totalIncome, expense: totalExpense, balance } });
});

// POST /api/reports/accounting
exports.createAccountEntry = asyncHandler(async (req, res) => {
  if (!req.body.category || !req.body.amount || !req.body.description) {
    res.status(400); throw new Error('Category, amount and description are required');
  }
  const entry = await AccountEntry.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: entry });
});
