const Customer = require('../models/Customer');
const Consignment = require('../models/Consignment');
const { generateCustomerCode } = require('../services/generatorService');
const { buildPager, buildSearch } = require('../utils/queryHelpers');

const createCustomer = async (req, res) => {
  if (!req.body.companyName || !req.body.phone) {
    res.status(400);
    throw new Error('Company name and mobile number are required');
  }

  const customerCode = await generateCustomerCode();
  const customer = await Customer.create({
    customerCode,
    ...req.body,
  });
  res.status(201).json(customer);
};

const getCustomers = async (req, res) => {
  const { search = '', state, city, sort = '-createdAt' } = req.query;
  const { page, limit, skip } = buildPager(req.query);
  const query = {};
  const searchQuery = buildSearch(search, [
    'customerCode',
    'companyName',
    'contactPerson',
    'gstNumber',
    'panNumber',
    'phone',
    'email',
    'city',
  ]);

  if (searchQuery) Object.assign(query, searchQuery);
  if (state) query.state = state;
  if (city) query.city = city;

  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  res.json({ customers, total, page, limit, pages: Math.ceil(total / limit) || 1 });
};

const getCustomerById = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  res.json(customer);
};

const updateCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  Object.assign(customer, req.body);
  await customer.save();
  res.json(customer);
};

const deleteCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const hasConsignments = await Consignment.exists({
    $or: [{ consignerId: customer._id }, { consigneeId: customer._id }],
  });
  if (hasConsignments) {
    res.status(400);
    throw new Error('Customer has consignment history and cannot be deleted');
  }

  await customer.deleteOne();
  res.json({ message: 'Customer deleted' });
};

const getCustomerHistory = async (req, res) => {
  const consignments = await Consignment.find({
    $or: [{ consignerId: req.params.id }, { consigneeId: req.params.id }],
  })
    .populate('tripId', 'tripNumber vehicleNumber status')
    .sort({ bookingDate: -1 });
  res.json(consignments);
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
};
