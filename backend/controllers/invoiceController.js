const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Order   = require('../models/Order');
const { ROLES } = require('../config/constants');

// ── Helpers ────────────────────────────────────────────────
// Safe number — never returns NaN or undefined
const num = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

// Safe ID comparison — never crashes on null/undefined
const idMatch = (a, b) => {
  if (!a || !b) return false;
  try { return a.toString() === b.toString(); }
  catch { return false; }
};

// ── GET /api/invoices ──────────────────────────────────────
const getInvoices = asyncHandler(async (req, res) => {
  const { paymentStatus, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role !== ROLES.ADMIN) {
    query.$or = [{ seller: req.user._id }, { buyer: req.user._id }];
  }
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const total    = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('seller', 'name company')
    .populate('buyer',  'name company')
    .populate('order',  'orderNumber')
    .sort({ createdAt: -1 })
    .skip((num(page) - 1) * num(limit))
    .limit(num(limit));

  res.json({
    success: true,
    data: invoices,
    pagination: {
      total,
      page:  num(page),
      pages: Math.ceil(total / num(limit)),
    },
  });
});

// ── GET /api/invoices/:id ──────────────────────────────────
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('seller', 'name email company')
    .populate('buyer',  'name email company')
    .populate('order');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const canView =
    req.user.role === ROLES.ADMIN ||
    idMatch(invoice.seller?._id, req.user._id) ||
    idMatch(invoice.buyer?._id,  req.user._id);

  if (!canView) {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }

  res.json({ success: true, data: invoice });
});

// ── POST /api/invoices — generate invoice from order ───────
const createInvoice = asyncHandler(async (req, res) => {
  const { orderId, dueDate, notes, terms } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('orderId is required');
  }

  // ── Step 1: Fetch order with ALL needed data populated ──
  const order = await Order.findById(orderId)
    .populate('seller', 'name email company')
    .populate('buyer',  'name email company')
    .populate('items.product', 'name hsn pricing');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // ── Step 2: Check not already invoiced ──────────────────
  const existing = await Invoice.findOne({ order: orderId });
  if (existing) {
    res.status(400);
    throw new Error('Invoice already exists for this order');
  }

  // ── Step 3: Resolve seller and buyer IDs safely ─────────
  // After populate, seller is a full user object — get the _id from it
  // If somehow not populated, fall back to raw value
  let sellerId = null;
  let buyerId  = null;

  if (order.seller && typeof order.seller === 'object' && order.seller._id) {
    sellerId = order.seller._id;
  } else if (order.seller) {
    sellerId = order.seller;
  }

  if (order.buyer && typeof order.buyer === 'object' && order.buyer._id) {
    buyerId = order.buyer._id;
  } else if (order.buyer) {
    buyerId = order.buyer;
  }

  // If seller still null, use current user (they clicked Generate Invoice = they are seller)
  if (!sellerId) sellerId = req.user._id;

  if (!buyerId) {
    res.status(400);
    throw new Error('Order buyer is missing. Cannot generate invoice.');
  }

  // ── Step 4: Authorization check ─────────────────────────
  const isAdmin  = req.user.role === ROLES.ADMIN;
  const isSeller = idMatch(sellerId, req.user._id);

  if (!isAdmin && !isSeller) {
    res.status(403);
    throw new Error('Only the seller can generate an invoice');
  }

  // ── Step 5: Build invoice items — every value guarded ───
  const items = (order.items || []).map(item => {
    const quantity    = num(item.quantity,   1);
    const rate        = num(item.unitPrice,  0);
    // Try gstPercent from item first, then from product pricing
    const gstPct      = num(
      item.gstPercent > 0 ? item.gstPercent : item.product?.pricing?.gstPercent,
      12
    );
    const discount    = num(item.discount, 0);
    // Use stored total or calculate from rate × qty
    const amount      = num(item.total > 0 ? item.total : rate * quantity, rate * quantity);
    const taxBase     = Math.max(0, amount - discount);
    const cgst        = parseFloat(((taxBase * gstPct) / 200).toFixed(2));
    const sgst        = cgst;

    return {
      description: (item.productName || item.product?.name || 'Medicine').toString(),
      hsn:         (item.product?.hsn || '').toString(),
      quantity,
      unit:        'Nos',
      rate,
      amount,
      discount,
      gstPercent:  gstPct,
      cgst,
      sgst,
      igst:        0,
    };
  });

  // ── Step 6: Calculate totals safely ─────────────────────
  const itemsSubtotal = items.reduce((s, i) => s + num(i.amount), 0);
  const subtotal      = num(order.subtotal > 0 ? order.subtotal : itemsSubtotal, itemsSubtotal);
  const totalCgst     = parseFloat(items.reduce((s, i) => s + num(i.cgst), 0).toFixed(2));
  const totalSgst     = parseFloat(items.reduce((s, i) => s + num(i.sgst), 0).toFixed(2));
  const totalGst      = parseFloat((totalCgst + totalSgst).toFixed(2));
  const discount      = num(order.totalDiscount, 0);
  const calcTotal     = subtotal + totalGst - discount;
  const grandTotal    = parseFloat(
    num(order.grandTotal > 0 ? order.grandTotal : calcTotal, calcTotal).toFixed(2)
  );

  // ── Step 7: Due date — 30 days default ──────────────────
  let invoiceDueDate;
  try {
    invoiceDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (isNaN(invoiceDueDate.getTime())) {
      invoiceDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  } catch {
    invoiceDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // ── Step 8: Create invoice ───────────────────────────────
  const invoice = await Invoice.create({
    order:         orderId,
    seller:        sellerId,
    buyer:         buyerId,
    issueDate:     new Date(),
    dueDate:       invoiceDueDate,
    items,
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst:     0,
    totalGst,
    discount,
    grandTotal,
    amountPaid:    0,
    amountDue:     grandTotal,
    paymentStatus: 'pending',
    notes:         (notes  || '').toString(),
    terms:         (terms  || 'Payment due within 30 days. Late payment charges apply.').toString(),
  });

  // ── Step 9: Link invoice to order (no re-validation) ────
  await Order.findByIdAndUpdate(
    orderId,
    { invoice: invoice._id },
    { runValidators: false }
  );

  // ── Step 10: Return fully populated invoice ──────────────
  const populated = await Invoice.findById(invoice._id)
    .populate('seller', 'name email company')
    .populate('buyer',  'name email company')
    .populate('order',  'orderNumber');

  res.status(201).json({ success: true, data: populated });
});

// ── PUT /api/invoices/:id/payment ──────────────────────────
const updatePayment = asyncHandler(async (req, res) => {
  const amt = num(req.body.amountPaid, 0);

  if (amt <= 0) {
    res.status(400);
    throw new Error('Enter a valid amount greater than 0');
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  if (num(invoice.amountDue) <= 0) {
    res.status(400);
    throw new Error('This invoice is already fully paid');
  }

  invoice.amountPaid    = parseFloat((num(invoice.amountPaid) + amt).toFixed(2));
  invoice.amountDue     = parseFloat(Math.max(0, num(invoice.grandTotal) - num(invoice.amountPaid)).toFixed(2));
  invoice.paymentStatus =
    invoice.amountDue <= 0 ? 'paid'          :
    invoice.amountPaid > 0 ? 'partially_paid' : 'pending';

  await invoice.save();

  const updated = await Invoice.findById(invoice._id)
    .populate('seller', 'name email company')
    .populate('buyer',  'name email company');

  res.json({ success: true, data: updated });
});

module.exports = { getInvoices, getInvoiceById, createInvoice, updatePayment };
