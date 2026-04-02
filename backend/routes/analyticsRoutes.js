const express = require('express');
const router  = express.Router();
const { getAdminAnalytics, getSellerAnalytics, getBuyerAnalytics } = require('../controllers/analyticsController');
const { protect }   = require('../middleware/authMiddleware');
const { isAdmin, isSeller } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/admin',  isAdmin,  getAdminAnalytics);
router.get('/seller', isSeller, getSellerAnalytics);
router.get('/buyer',            getBuyerAnalytics);

module.exports = router;
