const mongoose = require('mongoose');
const { PRODUCT_STATUS } = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other'],
      required: true,
    },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: String,
    composition: String,
    strength: String,  // e.g., "500mg"
    packSize: { type: String, required: true }, // e.g., "10 tablets/strip"
    hsn: String,       // HSN code for GST
    sku: { type: String, unique: true },
    batchNumber: String,
    expiryDate: Date,
    manufacturingDate: Date,
    pricing: {
      mrp: { type: Number, required: true },
      ptr: { type: Number, required: true },  // Price to Retailer
      pts: { type: Number, required: true },  // Price to Stockist
      gstPercent: { type: Number, default: 12 },
    },
    minOrderQty: { type: Number, default: 10 },
    stock: { type: Number, default: 0 },
    images: [String],
    status: { type: String, enum: Object.values(PRODUCT_STATUS), default: PRODUCT_STATUS.ACTIVE },
    requiresPrescription: { type: Boolean, default: false },
    storageConditions: String,
    sideEffects: String,
    contraindications: String,
    drugsLicenseRequired: { type: Boolean, default: true },
    schedule: { type: String, enum: ['H', 'H1', 'X', 'G', 'J', 'OTC'], default: 'OTC' },
    tags: [String],
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', genericName: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
