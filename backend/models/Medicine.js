const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  owner:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true, trim: true },
  genericName:  { type: String, required: true, trim: true },
  brand:        { type: String, required: true, trim: true },
  category:     {
    type: String,
    enum: ['tablet','capsule','syrup','injection','ointment','drops','inhaler','powder','strip','other'],
    default: 'tablet'
  },
  barcode:      { type: String, sparse: true },
  hsn:          { type: String, default: '' },
  sku:          { type: String, default: '' },
  strength:     { type: String, default: '' },
  packSize:     { type: String, default: '' },
  unit:         { type: String, default: 'strip' },
  schedule:     { type: String, enum: ['H','H1','X','G','J','OTC'], default: 'OTC' },
  requiresPrescription: { type: Boolean, default: false },
  storageConditions: { type: String, default: '' },
  description:  { type: String, default: '' },
  manufacturer: { type: String, default: '' },
  pricing: {
    mrp:        { type: Number, default: 0 },
    ptr:        { type: Number, default: 0 },
    pts:        { type: Number, default: 0 },
    costPrice:  { type: Number, default: 0 },
    gstPercent: { type: Number, default: 12 },
  },
  reorderLevel: { type: Number, default: 10 },
  currentStock: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// Separate text index — only on text fields
medicineSchema.index({ name: 'text', genericName: 'text', brand: 'text' });
// Regular index on barcode
medicineSchema.index({ barcode: 1 }, { sparse: true });

module.exports = mongoose.model('Medicine', medicineSchema);
