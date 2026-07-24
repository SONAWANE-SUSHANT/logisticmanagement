const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const Consignment = require('../models/Consignment');

const buildDateFilter = (query) => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.$gte = query.startDate ? new Date(query.startDate) : undefined;
    filter.$lte = query.endDate ? new Date(query.endDate) : undefined;
  }
  return Object.keys(filter).length ? filter : null;
};

const getReportSummary = async (req, res) => {
  const customerCount = await Customer.countDocuments();
  const tripCount = await Trip.countDocuments();
  const consignmentCount = await Consignment.countDocuments();

  const tripStatusCounts = await Trip.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const pendingConsignments = await Consignment.countDocuments({ status: 'Pending' });
  const completedConsignments = await Consignment.countDocuments({ status: 'Delivered' });

  res.json({
    customerCount,
    tripCount,
    consignmentCount,
    pendingConsignments,
    completedConsignments,
    tripStatusCounts,
  });
};

const getCustomersReport = async (req, res) => {
  const dateFilter = buildDateFilter(req.query);
  const query = {};
  if (dateFilter) query.createdAt = dateFilter;

  const customers = await Customer.find(query).sort({ createdAt: -1 });
  res.json({ total: customers.length, customers });
};

const getTripsReport = async (req, res) => {
  const { status } = req.query;
  const dateFilter = buildDateFilter(req.query);
  const query = {};
  if (status) query.status = status;
  if (dateFilter) query.departureDate = dateFilter;

  const trips = await Trip.find(query).sort({ departureDate: -1 });
  res.json({ total: trips.length, trips });
};

const getVehiclesReport = async (req, res) => {
  const dateFilter = buildDateFilter(req.query);
  const match = {};
  if (dateFilter) match.createdAt = dateFilter;

  const vehicles = await Trip.aggregate([
    { $match: match },
    { $group: { _id: '$vehicleNumber', trips: { $sum: 1 } } },
    { $sort: { trips: -1 } },
  ]);

  res.json({ totalVehicles: vehicles.length, vehicles });
};

const getConsignmentsReport = async (req, res) => {
  const { status } = req.query;
  const dateFilter = buildDateFilter(req.query);
  const query = {};
  if (status) query.status = status;
  if (dateFilter) query.bookingDate = dateFilter;

  const consignments = await Consignment.find(query)
    .populate('consignerId', 'companyName')
    .populate('consigneeId', 'companyName')
    .populate('tripId', 'tripNumber vehicleNumber')
    .sort({ bookingDate: -1 });

  res.json({ total: consignments.length, consignments });
};

module.exports = {
  getReportSummary,
  getCustomersReport,
  getTripsReport,
  getVehiclesReport,
  getConsignmentsReport,
};
