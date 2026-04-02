const express = require('express');
const router  = express.Router();
const c       = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/sales',        c.salesReport);
router.get('/profit-loss',  c.profitLoss);
router.get('/stock',        c.stockReport);
router.get('/expiry',       c.expiryReport);
router.get('/accounting',   c.getAccounting);
router.post('/accounting',  c.createAccountEntry);
module.exports = router;
