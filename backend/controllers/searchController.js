const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const Consignment = require('../models/Consignment');
const { buildSearch } = require('../utils/queryHelpers');

const globalSearch = async (req, res) => {
  const { q = '' } = req.query;
  if (!q.trim()) {
    return res.json({ customers: [], trips: [], consignments: [] });
  }

  const [customers, trips, consignments] = await Promise.all([
    Customer.find(buildSearch(q, ['customerCode', 'companyName', 'gstNumber', 'phone'])).limit(6),
    Trip.find(buildSearch(q, ['tripNumber', 'vehicleNumber', 'from', 'to'])).limit(6),
    Consignment.find(buildSearch(q, ['lrNumber', 'invoiceNumber', 'ewayBillNumber']))
      .populate('consignerId', 'companyName')
      .populate('consigneeId', 'companyName')
      .populate('tripId', 'tripNumber vehicleNumber')
      .limit(6),
  ]);

  res.json({ customers, trips, consignments });
};

module.exports = { globalSearch };
