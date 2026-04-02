const asyncHandler = require('express-async-handler');
const Customer     = require('../models/Customer');
const Sale         = require('../models/Sale');

// GET /api/customers
exports.getCustomers = asyncHandler(async (req, res) => {
  const { search, isCredit } = req.query;
  const query = { owner: req.user._id, isActive: true };

  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [
      { name:   regex },
      { mobile: regex },
      { email:  regex },
    ];
  }

  if (isCredit === 'true') query.isCredit = true;

  const customers = await Customer.find(query).sort({ name: 1 });
  res.json({ success: true, data: customers });
});

// GET /api/customers/stats
exports.getCustomerStats = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [total, creditData, topCustomers] = await Promise.all([
    Customer.countDocuments({ owner: uid, isActive: true }),
    Customer.aggregate([
      { $match: { owner: uid, isCredit: true } },
      { $group: { _id: null, total: { $sum: '$creditBalance' }, count: { $sum: 1 } } },
    ]),
    Customer.find({ owner: uid, isActive: true })
      .sort({ totalPurchases: -1 })
      .limit(5),
  ]);

  res.json({
    success: true,
    data: {
      total,
      totalCreditBalance: creditData[0]?.total || 0,
      creditCustomers:    creditData[0]?.count  || 0,
      topCustomers,
    },
  });
});

// GET /api/customers/:id
exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id:   req.params.id,
    owner: req.user._id,
  });
  if (!customer) { res.status(404); throw new Error('Customer not found'); }

  const purchases = await Sale.find({
    owner:    req.user._id,
    customer: customer._id,
  }).sort({ saleDate: -1 }).limit(10);

  res.json({ success: true, data: { ...customer.toObject(), recentPurchases: purchases } });
});

// POST /api/customers
exports.createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: customer });
});

// PUT /api/customers/:id
exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  res.json({ success: true, data: customer });
});
