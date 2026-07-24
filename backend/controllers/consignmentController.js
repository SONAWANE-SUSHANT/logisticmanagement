const Consignment = require('../models/Consignment');
const Trip = require('../models/Trip');
const Customer = require('../models/Customer');
const { generateLRNumber } = require('../services/generatorService');
const { buildPager, buildSearch } = require('../utils/queryHelpers');

const createConsignment = async (req, res) => {
  const { tripId, consignerId, consigneeId, bookingDate, bookingTime } = req.body;
  if (!tripId || !consignerId || !consigneeId || !bookingDate || !bookingTime) {
    res.status(400);
    throw new Error('Consigner, consignee, trip, booking date, and booking time are required');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    res.status(404);
    throw new Error('Assigned trip not found');
  }
  if (trip.status === 'Completed') {
    res.status(400);
    throw new Error('Cannot add consignment to a completed trip');
  }
  const customerCount = await Customer.countDocuments({ _id: { $in: [consignerId, consigneeId] } });
  if (customerCount !== 2 && consignerId !== consigneeId) {
    res.status(404);
    throw new Error('Consigner or consignee not found');
  }

  const lrNumber = await generateLRNumber();
  const consignment = await Consignment.create({
    lrNumber,
    bookingDate,
    bookingTime,
    ...req.body,
  });
  res.status(201).json(consignment);
};

const getConsignments = async (req, res) => {
  const { search = '', status, tripNumber, vehicleNumber, sort = '-bookingDate' } = req.query;
  const { page, limit, skip } = buildPager(req.query);
  const query = {};
  const searchQuery = buildSearch(search, ['lrNumber', 'invoiceNumber', 'ewayBillNumber', 'description']);

  if (searchQuery) Object.assign(query, searchQuery);
  if (status) query.status = status;

  if (tripNumber || vehicleNumber) {
    const tripQuery = {};
    if (tripNumber) tripQuery.tripNumber = new RegExp(tripNumber, 'i');
    if (vehicleNumber) tripQuery.vehicleNumber = new RegExp(vehicleNumber, 'i');
    const trips = await Trip.find(tripQuery).select('_id');
    query.tripId = { $in: trips.map((trip) => trip._id) };
  }

  const total = await Consignment.countDocuments(query);
  const consignments = await Consignment.find(query)
    .populate('consignerId', 'companyName contactPerson')
    .populate('consigneeId', 'companyName contactPerson')
    .populate('tripId', 'tripNumber vehicleNumber status to from')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  res.json({ consignments, total, page, limit, pages: Math.ceil(total / limit) || 1 });
};

const getConsignmentById = async (req, res) => {
  const consignment = await Consignment.findById(req.params.id)
    .populate('consignerId', 'companyName contactPerson phone email address city state pincode gstNumber')
    .populate('consigneeId', 'companyName contactPerson phone email address city state pincode gstNumber')
    .populate('tripId', 'tripNumber vehicleNumber status from to departureDate expectedArrival');
  if (!consignment) {
    res.status(404);
    throw new Error('Consignment not found');
  }
  res.json(consignment);
};

const updateConsignment = async (req, res) => {
  const consignment = await Consignment.findById(req.params.id);
  if (!consignment) {
    res.status(404);
    throw new Error('Consignment not found');
  }

  if (req.body.tripId) {
    const trip = await Trip.findById(req.body.tripId);
    if (!trip) {
      res.status(404);
      throw new Error('Assigned trip not found');
    }
    if (trip.status === 'Completed') {
      res.status(400);
      throw new Error('Cannot assign a consignment to a completed trip');
    }
  }

  Object.assign(consignment, req.body);
  await consignment.save();
  res.json(consignment);
};

const deleteConsignment = async (req, res) => {
  const consignment = await Consignment.findById(req.params.id);
  if (!consignment) {
    res.status(404);
    throw new Error('Consignment not found');
  }
  await consignment.deleteOne();
  res.json({ message: 'Consignment deleted' });
};

module.exports = {
  createConsignment,
  getConsignments,
  getConsignmentById,
  updateConsignment,
  deleteConsignment,
};
