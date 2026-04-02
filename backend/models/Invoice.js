const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber:  { type: String, unique: true },
    order:          { type: mongoose.Schema.Types.ObjectId, ref: 'Order',  required: true },
    seller:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    buyer:          { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    issueDate:      { type: Date,   default: Date.now },
    dueDate:        { type: Date },
    items: [
      {
        description: { type: String,  default: 'Medicine' },
        hsn:         { type: String,  default: '' },
        quantity:    { type: Number,  default: 1 },
        unit:        { type: String,  default: 'Nos' },
        rate:        { type: Number,  default: 0 },
        amount:      { type: Number,  default: 0 },
        discount:    { type: Number,  default: 0 },
        gstPercent:  { type: Number,  default: 12 },
        cgst:        { type: Number,  default: 0 },
        sgst:        { type: Number,  default: 0 },
        igst:        { type: Number,  default: 0 },
      },
    ],
    subtotal:       { type: Number, default: 0 },
    totalCgst:      { type: Number, default: 0 },
    totalSgst:      { type: Number, default: 0 },
    totalIgst:      { type: Number, default: 0 },
    totalGst:       { type: Number, default: 0 },
    discount:       { type: Number, default: 0 },
    grandTotal:     { type: Number, default: 0 },
    amountPaid:     { type: Number, default: 0 },
    amountDue:      { type: Number, default: 0 },
    paymentStatus:  {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partially_paid'],
      default: 'pending',
    },
    notes:          { type: String, default: '' },
    terms:          { type: String, default: 'Payment due within 30 days.' },
    pdfUrl:         { type: String, default: '' },
  },
  { timestamps: true }
);

// Unique invoice number — timestamp + random to avoid duplicates
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const ts     = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.invoiceNumber = `MC-INV-${ts}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
