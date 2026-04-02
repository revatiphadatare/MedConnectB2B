const express = require('express');
const router  = express.Router();
const {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getCategories,
} = require('../controllers/productController');
const { protect }          = require('../middleware/authMiddleware');
const { isManufacturer }   = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/categories', getCategories);
router.get('/',           getProducts);
router.get('/:id',        getProductById);
router.post('/',          isManufacturer, createProduct);
router.put('/:id',        isManufacturer, updateProduct);
router.delete('/:id',     isManufacturer, deleteProduct);

module.exports = router;
