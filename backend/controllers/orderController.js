const asyncHandler = require('express-async-handler');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const { ROLES, ORDER_STATUS } = require('../config/constants');

// Safe number helper
const num = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

// Safe id comparison — never crashes on null/undefined
const idMatch = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

// GET /api/orders
const getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === ROLES.ADMIN) {
    // admin sees all
  } else if ([ROLES.MANUFACTURER, ROLES.DISTRIBUTOR].includes(req.user.role)) {
    query.seller = req.user._id;
  } else {
    query.buyer = req.user._id;
  }

  if (status) query.status = status;

  const total  = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('buyer',  'name company email')
    .populate('seller', 'name company email')
    .populate('items.product', 'name brand sku')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data: orders,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer',  'name email company')
    .populate('seller', 'name email company')
    .populate('items.product', 'name brand sku images')
    .populate('history.updatedBy', 'name role');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isAuthorized =
    req.user.role === ROLES.ADMIN ||
    idMatch(order.buyer?._id,  req.user._id) ||
    idMatch(order.seller?._id, req.user._id);

  if (!isAuthorized) { res.status(403); throw new Error('Not authorized to view this order'); }

  res.json({ success: true, data: order });
});

// POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const { sellerId, items, shippingAddress, notes, paymentTerms } = req.body;

  if (!sellerId) {
    res.status(400); throw new Error('Seller ID is required');
  }
  if (!items || items.length === 0) {
    res.status(400); throw new Error('No order items provided');
  }

  let subtotal = 0;
  let totalGst = 0;
  const enrichedItems = [];

  for (const item of items) {
    if (!item.product) {
      res.status(400); throw new Error('Product ID missing in order item');
    }

    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404); throw new Error(`Product not found: ${item.product}`);
    }

    const qty        = num(item.quantity, 1);
    const minQty     = num(product.minOrderQty, 1);

    if (qty < minQty) {
      res.status(400);
      throw new Error(`Minimum order quantity for "${product.name}" is ${minQty} units. You ordered ${qty}.`);
    }

    const unitPrice  = num(product.pricing?.ptr, 0);
    const gstPercent = num(product.pricing?.gstPercent, 12);
    const itemTotal  = unitPrice * qty;
    const gstAmount  = (itemTotal * gstPercent) / 100;

    enrichedItems.push({
      product:     product._id,
      productName: product.name     || '',
      batchNumber: product.batchNumber || '',
      expiryDate:  product.expiryDate  || null,
      quantity:    qty,
      unitPrice,
      gstPercent,
      discount:    num(item.discount, 0),
      total:       itemTotal,
    });

    subtotal += itemTotal;
    totalGst += gstAmount;
  }

  const grandTotal = subtotal + totalGst;

  const order = await Order.create({
    buyer:  req.user._id,
    seller: sellerId,
    items:  enrichedItems,
    shippingAddress: shippingAddress || {},
    notes:           notes           || '',
    paymentTerms:    paymentTerms    || 'Net 30',
    subtotal,
    totalGst,
    grandTotal,
    history: [{
      status:    ORDER_STATUS.PENDING,
      note:      'Order placed by buyer',
      updatedBy: req.user._id,
    }],
  });

  res.status(201).json({ success: true, data: order });
});

// PUT /api/orders/:id/status  — update status (seller/admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, estimatedDelivery } = req.body;

  if (!status) {
    res.status(400); throw new Error('Status is required');
  }

  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const canUpdate =
    req.user.role === ROLES.ADMIN ||
    idMatch(order.seller, req.user._id);

  if (!canUpdate) {
    res.status(403); throw new Error('Not authorized to update this order');
  }

  // Build update object
  const updateData = {
    status,
    $push: {
      history: {
        status,
        note:      note || `Status updated to ${status}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      },
    },
  };

  if (trackingNumber)    updateData.trackingNumber    = trackingNumber;
  if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);
  if (status === ORDER_STATUS.DELIVERED) updateData.deliveredAt = new Date();
  if (status === ORDER_STATUS.CANCELLED) {
    updateData.cancelledAt  = new Date();
    updateData.cancelReason = note || 'Cancelled by seller';
  }

  // Use findByIdAndUpdate to avoid re-validation of all fields
  const updated = await Order.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: false }   // runValidators:false prevents validation on unchanged fields
  )
    .populate('buyer',  'name email company')
    .populate('seller', 'name email company')
    .populate('items.product', 'name brand')
    .populate('history.updatedBy', 'name role');

  if (!updated) { res.status(404); throw new Error('Order not found after update'); }

  res.json({ success: true, data: updated });
});

// PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel an order with status "${order.status}"`);
  }

  const canCancel =
    req.user.role === ROLES.ADMIN ||
    idMatch(order.buyer, req.user._id);

  if (!canCancel) { res.status(403); throw new Error('Not authorized to cancel this order'); }

  const reason = req.body.reason || 'Cancelled by buyer';

  // Use findByIdAndUpdate to avoid re-validation
  const updated = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status:       ORDER_STATUS.CANCELLED,
      cancelledAt:  new Date(),
      cancelReason: reason,
      $push: {
        history: {
          status:    ORDER_STATUS.CANCELLED,
          note:      reason,
          updatedBy: req.user._id,
          timestamp: new Date(),
        },
      },
    },
    { new: true, runValidators: false }
  );

  res.json({ success: true, message: 'Order cancelled', data: updated });
});

// GET /api/orders/stats
const getOrderStats = asyncHandler(async (req, res) => {
  const match = {};
  if ([ROLES.MANUFACTURER, ROLES.DISTRIBUTOR].includes(req.user.role)) {
    match.seller = req.user._id;
  } else if (req.user.role !== ROLES.ADMIN) {
    match.buyer = req.user._id;
  }

  const [stats, revenueData] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([
      { $match: { ...match, status: ORDER_STATUS.DELIVERED } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      statusBreakdown: stats,
      totalRevenue:    revenueData[0]?.total || 0,
    },
  });
});

module.exports = {
  getOrders, getOrderById, createOrder,
  updateOrderStatus, cancelOrder, getOrderStats,
};
