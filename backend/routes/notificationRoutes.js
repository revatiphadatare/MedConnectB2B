const express = require('express');
const router  = express.Router();
const c       = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',            c.getNotifications);
router.post('/generate',   c.generateAlerts);
router.put('/read-all',    c.markAllRead);
router.put('/:id/read',    c.markRead);
module.exports = router;
