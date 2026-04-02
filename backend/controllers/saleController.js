const asyncHandler   = require('express-async-handler');
const Sale           = require('../models/Sale');
const Batch          = require('../models/Batch');
const Medicine       = require('../models/Medicine');
const Customer       = require('../models/Customer');
const Notification   = require('../models/Notification');

// GET /api/sales
exports.getSales = asyncHandler(async (req, res) => {
  const { startDate, endDate, paymentMode, page = 1, limit = 20 } = req.query;
  const query = { owner: req.user._id };

  if (startDate || endDate) {
    query.saleDate = {};
    if (startDate) query.saleDate.$gte = new Date(startDate);
    if (endDate)   query.saleDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  }
  if (paymentMode) query.paymentMode = paymentMode;

  const total = await Sale.countDocuments(query);
  const sales = await Sale.find(query)
    .populate('customer', 'name mobile')
    .sort({ saleDate: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data: sales,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// GET /api/sales/:id
exports.getSaleById = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id })
    .populate('customer', 'name mobile email');
  if (!sale) { res.status(404); throw new Error('Sale not found'); }
  res.json({ success: true, data: sale });
});

// GET /api/sales/stats/summary
exports.getSalesSummary = asyncHandler(async (req, res) => {
  const uid   = req.user._id;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week  = new Date(today); week.setDate(week.getDate() - 7);
  const month = new Date(today); month.setDate(1);

  const [todaySales, weekSales, monthSales, paymentBreakdown] = await Promise.all([
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: week } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: month } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { owner: uid, saleDate: { $gte: month } } },
      { $group: { _id: '$paymentMode', total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      today:            { total: todaySales[0]?.total  || 0, count: todaySales[0]?.count  || 0 },
      week:             { total: weekSales[0]?.total   || 0, count: weekSales[0]?.count   || 0 },
      month:            { total: monthSales[0]?.total  || 0, count: monthSales[0]?.count  || 0 },
      paymentBreakdown,
    },
  });
});

// POST /api/sales  — create bill
exports.createSale = asyncHandler(async (req, res) => {
  const {
    items, customer, customerName, customerMobile,
    paymentMode, amountPaid, doctorName, prescriptionNo, notes,
  } = req.body;

  if (!items || !items.length) {
    res.status(400); throw new Error('Add at least one medicine to the bill');
  }

  let subtotal = 0, totalDiscount = 0, totalGst = 0;
  const enrichedItems = [];

  for (const item of items) {
    const batch = await Batch.findOne({ _id: item.batchId, owner: req.user._id });
    if (!batch) throw new Error(`Batch not found: ${item.batchId}`);

    if (batch.availableQty < Number(item.quantity)) {
      throw new Error(
        `Insufficient stock for batch ${batch.batchNumber}. ` +
        `Available: ${batch.availableQty}, Requested: ${item.quantity}`
      );
    }

    const medicine  = await Medicine.findById(batch.medicine);
    const qty       = Number(item.quantity);
    const price     = Number(item.sellingPrice) || batch.sellingPrice || batch.mrp || 0;
    const disc      = Number(item.discount)     || 0;
    const gstPct    = Number(item.gstPercent)   || medicine?.pricing?.gstPercent || 12;
    const amount    = price * qty - disc;
    const gstAmt    = (amount * gstPct) / 100;
    const cgst      = gstAmt / 2;
    const sgst      = gstAmt / 2;

    enrichedItems.push({
      medicine:     batch.medicine,
      batch:        batch._id,
      medicineName: medicine?.name || item.medicineName || 'Unknown',
      batchNumber:  batch.batchNumber,
      expiryDate:   batch.expiryDate,
      quantity:     qty,
      mrp:          batch.mrp || price,
      sellingPrice: price,
      discount:     disc,
      gstPercent:   gstPct,
      cgst,
      sgst,
      amount,
    });

    subtotal      += price * qty;
    totalDiscount += disc;
    totalGst      += gstAmt;

    // Deduct stock from batch
    batch.soldQty += qty;
    batch.movements.push({
      type:        'out',
      quantity:    qty,
      reference:   'SALE',
      note:        `Sold in bill`,
      performedBy: req.user._id,
    });
    await batch.save();
  }

  const grandTotal    = subtotal - totalDiscount + totalGst;
  const paid          = Number(amountPaid) || grandTotal;
  const changeReturned= Math.max(0, paid - grandTotal);
  const amountDue     = Math.max(0, grandTotal - paid);

  const sale = await Sale.create({
    owner:          req.user._id,
    customer:       customer || null,
    customerName:   customerName  || 'Walk-in Customer',
    customerMobile: customerMobile || '',
    doctorName,
    prescriptionNo,
    items:          enrichedItems,
    subtotal,
    totalDiscount,
    totalGst,
    grandTotal,
    amountPaid:     paid,
    changeReturned,
    amountDue,
    paymentMode:    paymentMode || 'cash',
    paymentStatus:  amountDue > 0 ? 'partial' : 'paid',
    notes,
  });

  // Re-sync medicine stock for each sold item
  for (const item of enrichedItems) {
    const allBatches = await Batch.find({ medicine: item.medicine, owner: req.user._id });
    const totalStock = allBatches.reduce((s, b) => s + (b.availableQty || 0), 0);
    const med = await Medicine.findByIdAndUpdate(
      item.medicine, { currentStock: totalStock }, { new: true }
    );

    // Low stock alert
    if (med && med.currentStock <= med.reorderLevel) {
      const exists = await Notification.findOne({
        owner:   req.user._id,
        type:    'low_stock',
        isRead:  false,
        'data.medicineId': String(med._id),
      });
      if (!exists) {
        await Notification.create({
          owner:    req.user._id,
          type:     'low_stock',
          priority: med.currentStock === 0 ? 'critical' : 'high',
          title:    `Low Stock: ${med.name}`,
          message:  `${med.name} has only ${med.currentStock} ${med.unit} left (reorder level: ${med.reorderLevel}).`,
          link:     '/inventory/batches',
          data:     { medicineId: String(med._id) },
        });
      }
    }
  }

  // Update customer stats
  if (customer) {
    await Customer.findByIdAndUpdate(customer, {
      $inc: { totalPurchases: grandTotal, totalVisits: 1, loyaltyPoints: Math.floor(grandTotal / 10) },
      lastVisit: new Date(),
    });
  }

  const populated = await Sale.findById(sale._id).populate('customer', 'name mobile');
  res.status(201).json({ success: true, data: populated });
});
