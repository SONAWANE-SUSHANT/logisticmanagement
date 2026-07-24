const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const Consignment = require('../models/Consignment');

const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();
  return `CUST-${String(count + 1).padStart(4, '0')}`;
};

const generateTripNumber = async () => {
  const count = await Trip.countDocuments();
  return `TRIP-${String(count + 1).padStart(4, '0')}`;
};

const generateLRNumber = async () => {
  const count = await Consignment.countDocuments();
  return `LR-${String(count + 1).padStart(5, '0')}`;
};

module.exports = { generateCustomerCode, generateTripNumber, generateLRNumber };
