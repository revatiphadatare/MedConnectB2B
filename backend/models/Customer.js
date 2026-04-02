const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:           { type: String, required: true },
  mobile:         { type: String, required: true },
  email:          String,
  dateOfBirth:    Date,
  gender:         { type: String, enum: ['male','female','other'] },
  address: {
    street: String, city: String, state: String, pincode: String,
  },
  doctorName:     String,
  medicalHistory: String,
  allergies:      [String],
  isCredit:       { type: Boolean, default: false },
  creditLimit:    { type: Number, default: 0 },
  creditBalance:  { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  totalVisits:    { type: Number, default: 0 },
  lastVisit:      Date,
  loyaltyPoints:  { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  notes:          String,
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
