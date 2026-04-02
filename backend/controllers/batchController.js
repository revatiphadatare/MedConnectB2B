const asyncHandler   = require('express-async-handler');
const Batch          = require('../models/Batch');
const Medicine       = require('../models/Medicine');
const Notification   = require('../models/Notification');

// GET /api/batches
exports.getBatches = asyncHandler(async (req, res) => {
  const { medicineId, expiring, expired, lowStock } = req.query;
  const query = { owner: req.user._id };

  if (medicineId)          query.medicine     = medicineId;
  if (expiring === 'true') query.isNearExpiry = true;
  if (expired  === 'true') query.isExpired    = true;
  if (lowStock === 'true') query.availableQty = { $lte: 10 };

  const batches = await Batch.find(query)
    .populate('medicine',  'name brand genericName unit')
    .populate('supplier',  'companyName')
    .sort({ expiryDate: 1 });

  res.json({ success: true, count: batches.length, data: batches });
});

// POST /api/batches  — add stock
exports.createBatch = asyncHandler(async (req, res) => {
  const {
    medicine, batchNumber, expiryDate, manufacturingDate,
    quantity, purchasePrice, sellingPrice, mrp, location,
  } = req.body;

  if (!medicine || !batchNumber || !expiryDate || !quantity) {
    res.status(400);
    throw new Error('Medicine, Batch Number, Expiry Date and Quantity are required');
  }

  // Check medicine belongs to this user
  const med = await Medicine.findOne({ _id: medicine, owner: req.user._id });
  if (!med) { res.status(404); throw new Error('Medicine not found'); }

  const batch = await Batch.create({
    owner: req.user._id,
    medicine,
    batchNumber,
    expiryDate,
    manufacturingDate: manufacturingDate || null,
    quantity:     Number(quantity),
    availableQty: Number(quantity),
    soldQty:      0,
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice:  Number(sellingPrice)  || Number(mrp) || 0,
    mrp:           Number(mrp)           || 0,
    location:      location || 'Main Store',
    movements: [{
      type:        'in',
      quantity:    Number(quantity),
      reference:   'Opening Stock',
      note:        'Initial stock entry',
      performedBy: req.user._id,
      timestamp:   new Date(),
    }],
  });

  // Update medicine total stock
  await Medicine.findByIdAndUpdate(medicine, {
    $inc: { currentStock: Number(quantity) },
  });

  res.status(201).json({ success: true, data: batch });
});

// POST /api/batches/:id/movement
exports.stockMovement = asyncHandler(async (req, res) => {
  const { type, quantity, reference, note } = req.body;

  const batch = await Batch.findOne({ _id: req.params.id, owner: req.user._id });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }

  const qty = Number(quantity);
  if (type === 'out' && batch.availableQty < qty) {
    res.status(400);
    throw new Error(`Insufficient stock. Available: ${batch.availableQty}`);
  }

  if (type === 'in')  batch.quantity += qty;
  if (type === 'out') batch.soldQty  += qty;
  if (type === 'damage' || type === 'adjustment') {
    batch.quantity = Math.max(0, batch.quantity - qty);
  }

  batch.movements.push({
    type, quantity: qty, reference, note, performedBy: req.user._id,
  });
  await batch.save();

  // Re-sync total medicine stock from all batches
  const allBatches = await Batch.find({ medicine: batch.medicine, owner: req.user._id });
  const totalStock = allBatches.reduce((s, b) => s + (b.availableQty || 0), 0);
  const med = await Medicine.findByIdAndUpdate(
    batch.medicine, { currentStock: totalStock }, { new: true }
  );

  // Low stock notification
  if (med && med.currentStock <= med.reorderLevel) {
    const exists = await Notification.findOne({
      owner:    req.user._id,
      type:     'low_stock',
      isRead:   false,
      'data.medicineId': String(med._id),
    });
    if (!exists) {
      await Notification.create({
        owner:    req.user._id,
        type:     'low_stock',
        priority: 'high',
        title:    `Low Stock: ${med.name}`,
        message:  `${med.name} has only ${med.currentStock} ${med.unit} left. Reorder level: ${med.reorderLevel}.`,
        link:     '/inventory/batches',
        data:     { medicineId: String(med._id) },
      });
    }
  }

  res.json({ success: true, data: batch });
});

// GET /api/batches/expiry-report
exports.expiryReport = asyncHandler(async (req, res) => {
  const days   = Number(req.query.days) || 90;
  const cutoff = new Date(Date.now() + days * 86400000);

  const batches = await Batch.find({
    owner:       req.user._id,
    expiryDate:  { $lte: cutoff },
    isExpired:   false,
    availableQty:{ $gt: 0 },
  })
    .populate('medicine', 'name brand genericName')
    .sort({ expiryDate: 1 });

  res.json({ success: true, count: batches.length, data: batches });
});
