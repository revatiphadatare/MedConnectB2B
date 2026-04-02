const express = require('express');
const router  = express.Router();
const c       = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats/summary', c.getSalesSummary);
router.get('/',              c.getSales);
router.post('/',             c.createSale);
router.get('/:id',           c.getSaleById);
module.exports = router;
