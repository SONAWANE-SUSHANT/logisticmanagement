const express = require('express');
const router = express.Router();
const {
  createConsignment,
  getConsignments,
  getConsignmentById,
  updateConsignment,
  deleteConsignment,
} = require('../controllers/consignmentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.route('/').get(getConsignments).post(createConsignment);
router.route('/:id').get(getConsignmentById).put(updateConsignment).delete(deleteConsignment);

module.exports = router;
