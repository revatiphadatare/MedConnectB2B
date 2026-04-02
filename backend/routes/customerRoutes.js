const express = require('express');
const router  = express.Router();
const c       = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats', c.getCustomerStats);
router.get('/',      c.getCustomers);
router.post('/',     c.createCustomer);
router.get('/:id',   c.getCustomerById);
router.put('/:id',   c.updateCustomer);
module.exports = router;
