const mongoose = require('mongoose');

const accountEntrySchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['income','expense'], required: true },
  category:    { type: String, required: true },
  amount:      { type: Number, required: true },
  description: { type: String, required: true },
  date:        { type: Date, default: Date.now },
  paymentMode: { type: String, enum: ['cash','bank','upi','cheque','card'], default: 'cash' },
  reference:   String,
  attachmentUrl: String,
  isRecurring: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('AccountEntry', accountEntrySchema);
