const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicine:       { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  batchNumber:    { type: String, required: true },
  manufacturingDate: Date,
  expiryDate:     { type: Date, required: true },
  quantity:       { type: Number, required: true, default: 0 },
  availableQty:   { type: Number, default: 0 },
  soldQty:        { type: Number, default: 0 },
  purchasePrice:  { type: Number, default: 0 },
  sellingPrice:   { type: Number, default: 0 },
  mrp:            { type: Number, default: 0 },
  supplier:       { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  purchaseOrder:  { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  location:       { type: String, default: 'Main Store' },
  isExpired:      { type: Boolean, default: false },
  isNearExpiry:   { type: Boolean, default: false },
  movements: [{
    type:       { type: String, enum: ['in','out','adjustment','return','damage'] },
    quantity:   Number,
    reference:  String,
    note:       String,
    performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp:  { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Auto-set expiry flags before save
batchSchema.pre('save', function(next) {
  this.availableQty = this.quantity - this.soldQty;
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);
  this.isExpired   = this.expiryDate < today;
  this.isNearExpiry= !this.isExpired && this.expiryDate < thirtyDays;
  next();
});

module.exports = mongoose.model('Batch', batchSchema);
