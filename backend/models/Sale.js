const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  medicine:     { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  batch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  medicineName: String,
  batchNumber:  String,
  expiryDate:   Date,
  quantity:     { type: Number, required: true },
  mrp:          { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  gstPercent:   { type: Number, default: 12 },
  cgst:         { type: Number, default: 0 },
  sgst:         { type: Number, default: 0 },
  amount:       { type: Number, required: true },
});

const saleSchema = new mongoose.Schema({
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billNumber:    { type: String, unique: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:  { type: String, default: 'Walk-in Customer' },
  customerMobile:String,
  doctorName:    String,
  prescriptionNo:String,
  items:         [saleItemSchema],
  saleDate:      { type: Date, default: Date.now },
  subtotal:      { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalGst:      { type: Number, default: 0 },
  grandTotal:    { type: Number, required: true },
  amountPaid:    { type: Number, default: 0 },
  amountDue:     { type: Number, default: 0 },
  changeReturned:{ type: Number, default: 0 },
  paymentMode:   { type: String, enum: ['cash','card','upi','credit','cheque'], default: 'cash' },
  paymentStatus: { type: String, enum: ['paid','partial','credit','pending'], default: 'paid' },
  notes:         String,
  isReturn:      { type: Boolean, default: false },
  returnOf:      { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
}, { timestamps: true });

saleSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Sale').countDocuments({ owner: this.owner });
    this.billNumber = `BILL-${String(count + 1).padStart(6, '0')}`;
  }
  this.amountDue = Math.max(0, this.grandTotal - this.amountPaid);
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
