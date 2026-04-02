const express = require('express');
const router  = express.Router();
const {
  getOrders, getOrderById, createOrder,
  updateOrderStatus, cancelOrder, getOrderStats,
} = require('../controllers/orderController');
const { protect }            = require('../middleware/authMiddleware');
const { isBuyer, isSeller }  = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', getOrderStats);
router.get('/',      getOrders);
router.get('/:id',   getOrderById);
router.post('/',     isBuyer,  createOrder);
router.put('/:id/status', isSeller, updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
