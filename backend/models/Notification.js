const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['low_stock','expiry','payment','sale','purchase','system','order'], required: true },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  isRead:   { type: Boolean, default: false },
  link:     String,
  data:     mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
