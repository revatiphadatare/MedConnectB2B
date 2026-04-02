const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  medicine:     { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: String,
  batchNumber:  String,
  expiryDate:   Date,
  quantity:     { type: Number, required: true },
  receivedQty:  { type: Number, default: 0 },
  freeQty:      { type: Number, default: 0 },
  purchaseRate: { type: Number, required: true },
  mrp:          Number,
  discount:     { type: Number, default: 0 },
  gstPercent:   { type: Number, default: 12 },
  amount:       Number,
});

const purchaseOrderSchema = new mongoose.Schema({
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  poNumber:      { type: String, unique: true },
  supplier:      { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierInvoiceNo: String,
  orderDate:     { type: Date, default: Date.now },
  receivedDate:  Date,
  dueDate:       Date,
  items:         [poItemSchema],
  status:        { type: String, enum: ['draft','ordered','partial','received','cancelled'], default: 'draft' },
  paymentStatus: { type: String, enum: ['pending','paid','partial','overdue'], default: 'pending' },
  subtotal:      { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalGst:      { type: Number, default: 0 },
  grandTotal:    { type: Number, default: 0 },
  amountPaid:    { type: Number, default: 0 },
  amountDue:     { type: Number, default: 0 },
  notes:         String,
}, { timestamps: true });

purchaseOrderSchema.pre('save', async function(next) {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments({ owner: this.owner });
    this.poNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  }
  this.amountDue = this.grandTotal - this.amountPaid;
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
