const asyncHandler = require('express-async-handler');
const Medicine = require('../models/Medicine');
const Batch    = require('../models/Batch');

// GET /api/medicines
exports.getMedicines = asyncHandler(async (req, res) => {
  const { search, category, lowStock, page = 1, limit = 20 } = req.query;

  const query = { owner: req.user._id, isActive: true };

  if (category) query.category = category;

  // Use regex search instead of $text to avoid index issues
  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [
      { name:        regex },
      { genericName: regex },
      { brand:       regex },
      { barcode:     regex },
    ];
  }

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
  }

  const total     = await Medicine.countDocuments(query);
  const medicines = await Medicine.find(query)
    .sort({ name: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data: medicines,
    pagination: {
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// GET /api/medicines/barcode/:code
exports.getByBarcode = asyncHandler(async (req, res) => {
  const med = await Medicine.findOne({
    barcode: req.params.code,
    owner:   req.user._id,
    isActive: true,
  });
  if (!med) {
    res.status(404);
    throw new Error('No medicine found for barcode: ' + req.params.code);
  }
  const batches = await Batch.find({
    medicine:     med._id,
    owner:        req.user._id,
    availableQty: { $gt: 0 },
    isExpired:    false,
  }).sort({ expiryDate: 1 });

  res.json({ success: true, data: { ...med.toObject(), batches } });
});

// GET /api/medicines/:id
exports.getMedicineById = asyncHandler(async (req, res) => {
  const med = await Medicine.findOne({
    _id:   req.params.id,
    owner: req.user._id,
  });
  if (!med) { res.status(404); throw new Error('Medicine not found'); }

  const batches = await Batch.find({
    medicine:     med._id,
    owner:        req.user._id,
    availableQty: { $gt: 0 },
    isExpired:    false,
  }).sort({ expiryDate: 1 });

  res.json({ success: true, data: { ...med.toObject(), batches } });
});

// POST /api/medicines
exports.createMedicine = asyncHandler(async (req, res) => {
  // Remove empty barcode so sparse index works correctly
  const data = { ...req.body, owner: req.user._id };
  if (!data.barcode || data.barcode.trim() === '') {
    delete data.barcode;
  }

  const med = await Medicine.create(data);
  res.status(201).json({ success: true, data: med });
});

// PUT /api/medicines/:id
exports.updateMedicine = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.barcode || data.barcode.trim() === '') {
    delete data.barcode;
  }

  const med = await Medicine.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    data,
    { new: true, runValidators: true }
  );
  if (!med) { res.status(404); throw new Error('Medicine not found'); }
  res.json({ success: true, data: med });
});

// DELETE /api/medicines/:id
exports.deleteMedicine = asyncHandler(async (req, res) => {
  await Medicine.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { isActive: false }
  );
  res.json({ success: true, message: 'Medicine deactivated' });
});
