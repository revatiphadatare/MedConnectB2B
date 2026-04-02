const asyncHandler   = require('express-async-handler');
const Notification   = require('../models/Notification');
const Batch          = require('../models/Batch');
const Medicine       = require('../models/Medicine');

// GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const { unread, type } = req.query;
  const limit = Number(req.query.limit) || 50;
  const query = { owner: req.user._id };
  if (unread === 'true') query.isRead = false;
  if (type)              query.type   = type;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ owner: req.user._id, isRead: false }),
  ]);

  res.json({ success: true, data: notifications, unreadCount });
});

// PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { isRead: true }
  );
  res.json({ success: true });
});

// PUT /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ owner: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// POST /api/notifications/generate  — auto scan and create alerts
exports.generateAlerts = asyncHandler(async (req, res) => {
  const uid     = req.user._id;
  let   created = 0;

  // 1. Low stock alerts
  const lowMeds = await Medicine.find({
    owner:    uid,
    isActive: true,
    $expr:    { $lte: ['$currentStock', '$reorderLevel'] },
  });

  for (const med of lowMeds) {
    const exists = await Notification.findOne({
      owner:   uid,
      type:    'low_stock',
      isRead:  false,
      'data.medicineId': String(med._id),
    });
    if (!exists) {
      await Notification.create({
        owner:    uid,
        type:     'low_stock',
        priority: med.currentStock === 0 ? 'critical' : 'high',
        title:    `Low Stock: ${med.name}`,
        message:  `${med.name} has ${med.currentStock} ${med.unit} left. Reorder level is ${med.reorderLevel}.`,
        link:     '/inventory/batches',
        data:     { medicineId: String(med._id) },
      });
      created++;
    }
  }

  // 2. Expiry alerts (within 90 days)
  const cutoff = new Date(Date.now() + 90 * 86400000);
  const expiringBatches = await Batch.find({
    owner:        uid,
    expiryDate:   { $lte: cutoff },
    isExpired:    false,
    availableQty: { $gt: 0 },
  }).populate('medicine', 'name brand');

  for (const b of expiringBatches) {
    const daysLeft = Math.ceil((new Date(b.expiryDate) - Date.now()) / 86400000);
    const priority = daysLeft <= 15 ? 'critical' : daysLeft <= 30 ? 'high' : 'medium';

    const exists = await Notification.findOne({
      owner:  uid,
      type:   'expiry',
      isRead: false,
      'data.batchId': String(b._id),
    });
    if (!exists) {
      await Notification.create({
        owner:    uid,
        type:     'expiry',
        priority,
        title:    `Expiry Alert: ${b.medicine?.name || 'Medicine'}`,
        message:  `Batch ${b.batchNumber} of ${b.medicine?.name} expires in ${daysLeft} day(s) on ${new Date(b.expiryDate).toDateString()}. Available qty: ${b.availableQty}.`,
        link:     '/inventory/expiry',
        data:     { batchId: String(b._id), daysLeft },
      });
      created++;
    }
  }

  res.json({ success: true, message: `Generated ${created} new alert(s)` });
});
