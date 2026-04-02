const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { ROLES } = require('../config/constants');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, manufacturer, status, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  const query = {};

  // Manufacturers see only their own products
  if (req.user.role === ROLES.MANUFACTURER) query.manufacturer = req.user._id;
  else if (manufacturer) query.manufacturer = manufacturer;

  if (category) query.category = category;
  if (status) query.status = status;
  else if (req.user.role !== ROLES.ADMIN) query.status = 'active';
  if (search) query.$text = { $search: search };
  if (minPrice || maxPrice) {
    query['pricing.mrp'] = {};
    if (minPrice) query['pricing.mrp'].$gte = Number(minPrice);
    if (maxPrice) query['pricing.mrp'].$lte = Number(maxPrice);
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('manufacturer', 'name company.name company.logo')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('manufacturer', 'name email company');
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, data: product });
});

// @desc    Create product
// @route   POST /api/products
// @access  Manufacturer
const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body, manufacturer: req.user._id };

  // Auto SKU
  if (!productData.sku) {
    const count = await Product.countDocuments();
    productData.sku = `MC-PRD-${String(count + 1).padStart(6, '0')}`;
  }

  const product = await Product.create(productData);
  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Manufacturer (own) / Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  // Only manufacturer who owns or admin can update
  if (req.user.role === ROLES.MANUFACTURER && product.manufacturer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Manufacturer (own) / Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  if (req.user.role === ROLES.MANUFACTURER && product.manufacturer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc    Get categories summary
// @route   GET /api/products/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: categories });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories };
