const Trip = require('../models/Trip');
const Consignment = require('../models/Consignment');
const { generateTripNumber } = require('../services/generatorService');
const { buildPager, buildSearch } = require('../utils/queryHelpers');

const createTrip = async (req, res) => {
  const { vehicleNumber, from, to, departureDate, expectedArrival, status, remarks } = req.body;
  if (!vehicleNumber || !from || !to || !departureDate || !expectedArrival) {
    res.status(400);
    throw new Error('Vehicle, route, departure date, and expected arrival are required');
  }
  const tripNumber = await generateTripNumber();

  const trip = await Trip.create({
    tripNumber,
    vehicleNumber,
    from,
    to,
    departureDate,
    expectedArrival,
    status,
    remarks,
  });

  res.status(201).json(trip);
};

const getTrips = async (req, res) => {
  const { search = '', status, sort = '-departureDate' } = req.query;
  const { page, limit, skip } = buildPager(req.query);
  const query = {};
  const searchQuery = buildSearch(search, ['tripNumber', 'vehicleNumber', 'from', 'to']);

  if (searchQuery) Object.assign(query, searchQuery);
  if (status) query.status = status;

  const total = await Trip.countDocuments(query);
  const trips = await Trip.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  res.json({ trips, total, page, limit, pages: Math.ceil(total / limit) || 1 });
};

const getTripById = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  const consignments = await Consignment.find({ tripId: trip._id })
    .populate('consignerId', 'companyName contactPerson city')
    .populate('consigneeId', 'companyName contactPerson city')
    .sort({ bookingDate: -1 });

  const stats = consignments.reduce(
    (totals, item) => ({
      totalConsignments: totals.totalConsignments + 1,
      totalPackages: totals.totalPackages + Number(item.packageCount || 0),
      totalWeight: totals.totalWeight + Number(item.chargeableWeight || item.actualWeight || 0),
    }),
    { totalConsignments: 0, totalPackages: 0, totalWeight: 0 }
  );

  res.json({ trip, consignments, stats });
};

const updateTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  Object.assign(trip, req.body);
  await trip.save();
  res.json(trip);
};

const deleteTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  const hasConsignments = await Consignment.exists({ tripId: trip._id });
  if (hasConsignments) {
    res.status(400);
    throw new Error('Trip has assigned consignments and cannot be deleted');
  }

  await trip.deleteOne();
  res.json({ message: 'Trip deleted' });
};

module.exports = { createTrip, getTrips, getTripById, updateTrip, deleteTrip };
