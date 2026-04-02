const express = require('express');
const router  = express.Router();
const c       = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/barcode/:code', c.getByBarcode);
router.get('/',              c.getMedicines);
router.post('/',             c.createMedicine);
router.get('/:id',           c.getMedicineById);
router.put('/:id',           c.updateMedicine);
router.delete('/:id',        c.deleteMedicine);
module.exports = router;
