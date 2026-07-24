const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
} = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomerById).put(updateCustomer).delete(deleteCustomer);
router.get('/:id/history', getCustomerHistory);

module.exports = router;
