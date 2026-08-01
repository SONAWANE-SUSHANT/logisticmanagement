const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const Consignment = require('../models/Consignment');
const FreightBill = require('../models/FreightBill');

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

const generateFreightBillNumber = async () => {
  const now = new Date();
  const fiscalStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fiscalLabel = `${String(fiscalStart).slice(-2)}-${String(fiscalStart + 1).slice(-2)}`;
  const count = await FreightBill.countDocuments({
    createdAt: {
      $gte: new Date(fiscalStart, 3, 1),
      $lt: new Date(fiscalStart + 1, 3, 1),
    },
  });
  return `${fiscalLabel}/${String(count + 1).padStart(3, '0')}`;
};

module.exports = { generateCustomerCode, generateTripNumber, generateLRNumber, generateFreightBillNumber };
