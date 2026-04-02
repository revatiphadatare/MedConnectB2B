const express = require('express');
const router  = express.Router();
const c       = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/purchase-orders',             c.getPurchaseOrders);
router.post('/purchase-orders',            c.createPurchaseOrder);
router.put('/purchase-orders/:id/receive', c.receivePurchaseOrder);
router.put('/purchase-orders/:id/payment', c.recordPayment);
router.get('/',                            c.getSuppliers);
router.post('/',                           c.createSupplier);
router.put('/:id',                         c.updateSupplier);
module.exports = router;
