const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String,  default: '' },
  batchNumber: { type: String,  default: '' },
  expiryDate:  { type: Date },
  quantity:    { type: Number,  default: 1 },
  unitPrice:   { type: Number,  default: 0 },
  gstPercent:  { type: Number,  default: 12 },
  discount:    { type: Number,  default: 0 },
  total:       { type: Number,  default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber:  { type: String, unique: true },
    buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:        [orderItemSchema],
    status:       { type: String, enum: Object.values(ORDER_STATUS),   default: ORDER_STATUS.PENDING   },
    paymentStatus:{ type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    paymentTerms: { type: String, default: 'Net 30' },
    shippingAddress: {
      name:    { type: String, default: '' },
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      pincode: { type: String, default: '' },
      phone:   { type: String, default: '' },
    },
    subtotal:         { type: Number, default: 0 },
    totalGst:         { type: Number, default: 0 },
    totalDiscount:    { type: Number, default: 0 },
    shippingCharge:   { type: Number, default: 0 },
    grandTotal:       { type: Number, default: 0 },
    notes:            { type: String, default: '' },
    trackingNumber:   { type: String, default: '' },
    estimatedDelivery:{ type: Date },
    deliveredAt:      { type: Date },
    cancelledAt:      { type: Date },
    cancelReason:     { type: String, default: '' },
    invoice:          { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    history: [
      {
        status:    { type: String, default: '' },
        note:      { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Unique order number — timestamp + random — no duplicate key errors
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const ts     = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.orderNumber = `MC-ORD-${ts}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
