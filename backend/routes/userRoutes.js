const express = require('express');
const router  = express.Router();
const {
  getAllUsers, getUserById, approveUser,
  toggleUserStatus, getPendingApprovals,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin }  = require('../middleware/roleMiddleware');

router.use(protect, isAdmin);

router.get('/',              getAllUsers);
router.get('/pending',       getPendingApprovals);
router.get('/:id',           getUserById);
router.put('/:id/approve',   approveUser);
router.put('/:id/toggle-status', toggleUserStatus);

module.exports = router;
