const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.route('/').get(getTrips).post(createTrip);
router.route('/:id').get(getTripById).put(updateTrip).delete(deleteTrip);

module.exports = router;
