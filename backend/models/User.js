const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.PHARMACY,
    },
    company: {
      name: { type: String, required: true },
      licenseNumber: { type: String },
      gstNumber: { type: String },
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' },
      },
      phone: String,
      website: String,
      logo: String,
    },
    contactPerson: {
      name: String,
      phone: String,
      designation: String,
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
