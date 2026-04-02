const express = require('express');
const router  = express.Router();
const { getInvoices, getInvoiceById, createInvoice, updatePayment } = require('../controllers/invoiceController');
const { protect }     = require('../middleware/authMiddleware');
const { isSeller }    = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/',    getInvoices);
router.get('/:id', getInvoiceById);
router.post('/',   isSeller, createInvoice);
router.put('/:id/payment', isSeller, updatePayment);

module.exports = router;
