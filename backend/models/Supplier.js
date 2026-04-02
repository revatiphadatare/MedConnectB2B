const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  companyName: { type: String, required: true },
  email:       String,
  phone:       { type: String, required: true },
  mobile:      String,
  gstNumber:   String,
  drugLicense: String,
  panNumber:   String,
  address: {
    street: String, city: String, state: String,
    pincode: String, country: { type: String, default: 'India' },
  },
  bankDetails: {
    bankName: String, accountNumber: String,
    ifscCode: String, accountType: String,
  },
  creditLimit:    { type: Number, default: 0 },
  creditDays:     { type: Number, default: 30 },
  outstandingAmt: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  notes:          String,
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
