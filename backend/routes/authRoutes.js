const express  = require('express');
const router   = express.Router();
const {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register',        register);
router.post('/login',           login);
router.post('/adminlogin',      adminLogin);   // same as /login, kept for compatibility
router.get('/me',               protect, getMe);
router.put('/profile',          protect, updateProfile);
router.put('/change-password',  protect, changePassword);

module.exports = router;
