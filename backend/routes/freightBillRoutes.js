const express = require('express');
const router = express.Router();
const {
  previewFreightBill,
  createFreightBill,
  getFreightBills,
  getFreightBillById,
  deleteFreightBill,
} = require('../controllers/freightBillController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/preview', previewFreightBill);
router.route('/').get(getFreightBills).post(createFreightBill);
router.route('/:id').get(getFreightBillById).delete(deleteFreightBill);

module.exports = router;
