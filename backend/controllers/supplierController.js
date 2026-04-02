const asyncHandler  = require('express-async-handler');
const Supplier      = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Batch         = require('../models/Batch');
const Medicine      = require('../models/Medicine');

// GET /api/suppliers
exports.getSuppliers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const query = { owner: req.user._id, isActive: true };

  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [
      { name:        regex },
      { companyName: regex },
      { phone:       regex },
    ];
  }

  const suppliers = await Supplier.find(query).sort({ companyName: 1 });
  res.json({ success: true, data: suppliers });
});

// POST /api/suppliers
exports.createSupplier = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.companyName || !req.body.phone) {
    res.status(400);
    throw new Error('Contact name, company name and phone are required');
  }
  const supplier = await Supplier.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: supplier });
});

// PUT /api/suppliers/:id
exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    req.body,
    { new: true }
  );
  if (!supplier) { res.status(404); throw new Error('Supplier not found'); }
  res.json({ success: true, data: supplier });
});

// GET /api/suppliers/purchase-orders
exports.getPurchaseOrders = asyncHandler(async (req, res) => {
  const { supplier, status, page = 1, limit = 20 } = req.query;
  const query = { owner: req.user._id };

  if (supplier) query.supplier = supplier;
  if (status)   query.status   = status;

  const total  = await PurchaseOrder.countDocuments(query);
  const orders = await PurchaseOrder.find(query)
    .populate('supplier', 'companyName phone')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data:    orders,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// POST /api/suppliers/purchase-orders
exports.createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplier, items, notes } = req.body;

  if (!supplier) { res.status(400); throw new Error('Supplier is required'); }
  if (!items || !items.length) { res.status(400); throw new Error('At least one item is required'); }

  let subtotal = 0, totalGst = 0, totalDiscount = 0;

  const enrichedItems = items.map((item) => {
    const amt  = Number(item.purchaseRate) * Number(item.quantity);
    const disc = (amt * (Number(item.discount) || 0)) / 100;
    const gst  = ((amt - disc) * (Number(item.gstPercent) || 12)) / 100;
    subtotal      += amt;
    totalDiscount += disc;
    totalGst      += gst;
    return { ...item, amount: amt - disc + gst };
  });

  const grandTotal = subtotal - totalDiscount + totalGst;

  const po = await PurchaseOrder.create({
    owner:   req.user._id,
    supplier,
    items:   enrichedItems,
    notes,
    subtotal,
    totalDiscount,
    totalGst,
    grandTotal,
    amountPaid: 0,
    amountDue:  grandTotal,
    status: 'ordered',
  });

  await Supplier.findByIdAndUpdate(supplier, {
    $inc: { totalPurchases: grandTotal, outstandingAmt: grandTotal },
  });

  res.status(201).json({ success: true, data: po });
});

// PUT /api/suppliers/purchase-orders/:id/receive
exports.receivePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!po) { res.status(404); throw new Error('Purchase order not found'); }

  const receivedItems = req.body.items || [];

  for (const item of receivedItems) {
    if (!item.medicineId || !item.batchNumber || !item.expiryDate) continue;

    const qty = Number(item.receivedQty) || Number(item.quantity) || 0;
    if (qty <= 0) continue;

    await Batch.create({
      owner:            req.user._id,
      medicine:         item.medicineId,
      batchNumber:      item.batchNumber,
      expiryDate:       item.expiryDate,
      manufacturingDate:item.manufacturingDate || null,
      quantity:         qty,
      availableQty:     qty,
      soldQty:          0,
      purchasePrice:    Number(item.purchaseRate) || 0,
      sellingPrice:     Number(item.sellingPrice) || Number(item.mrp) || 0,
      mrp:              Number(item.mrp) || 0,
      supplier:         po.supplier,
      purchaseOrder:    po._id,
      movements: [{
        type:        'in',
        quantity:    qty,
        reference:   `PO-${po.poNumber}`,
        note:        'Received from purchase order',
        performedBy: req.user._id,
      }],
    });

    await Medicine.findByIdAndUpdate(item.medicineId, {
      $inc: { currentStock: qty },
    });
  }

  po.status       = 'received';
  po.receivedDate = new Date();
  await po.save();

  res.json({ success: true, data: po });
});

// PUT /api/suppliers/purchase-orders/:id/payment
exports.recordPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    res.status(400); throw new Error('Valid payment amount required');
  }

  const po = await PurchaseOrder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!po) { res.status(404); throw new Error('Purchase order not found'); }

  po.amountPaid  += Number(amount);
  po.amountDue    = Math.max(0, po.grandTotal - po.amountPaid);
  po.paymentStatus =
    po.amountDue <= 0 ? 'paid' :
    po.amountPaid > 0 ? 'partial' : 'pending';
  await po.save();

  await Supplier.findByIdAndUpdate(po.supplier, {
    $inc: { outstandingAmt: -Number(amount) },
  });

  res.json({ success: true, data: po });
});
