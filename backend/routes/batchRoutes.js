const express = require('express');
const router  = express.Router();
const c       = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/expiry-report',     c.expiryReport);
router.get('/',                  c.getBatches);
router.post('/',                 c.createBatch);
router.post('/:id/movement',     c.stockMovement);
module.exports = router;
