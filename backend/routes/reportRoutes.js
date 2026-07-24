const express = require('express');
const router = express.Router();
const {
  getReportSummary,
  getCustomersReport,
  getTripsReport,
  getVehiclesReport,
  getConsignmentsReport,
} = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/summary', getReportSummary);
router.get('/customers', getCustomersReport);
router.get('/trips', getTripsReport);
router.get('/vehicles', getVehiclesReport);
router.get('/consignments', getConsignmentsReport);

module.exports = router;
