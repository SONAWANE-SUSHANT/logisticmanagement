const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const Consignment = require('../models/Consignment');

const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);

const normalizeMonthly = (items, key) => {
  const labels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + index, 1);
    return {
      month: date.toLocaleString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      monthNumber: date.getMonth() + 1,
      consignments: 0,
      trips: 0,
    };
  });

  items.forEach((item) => {
    const found = labels.find((label) => label.year === item._id.year && label.monthNumber === item._id.month);
    if (found) found[key] = item.count;
  });

  return labels;
};

const getDashboard = async (req, res) => {
  const [
    totalCustomers,
    totalTrips,
    toBeGoneTrips,
    ongoingTrips,
    completedTrips,
    totalConsignments,
    monthlyConsignments,
    monthlyTrips,
    tripStatusDistribution,
    recentTrips,
    recentConsignments,
    recentCustomers,
  ] = await Promise.all([
    Customer.countDocuments(),
    Trip.countDocuments(),
    Trip.countDocuments({ status: 'To Be Gone' }),
    Trip.countDocuments({ status: 'Ongoing' }),
    Trip.countDocuments({ status: 'Completed' }),
    Consignment.countDocuments(),
    Consignment.aggregate([
      { $match: { bookingDate: { $gte: monthStart } } },
      { $group: { _id: { year: { $year: '$bookingDate' }, month: { $month: '$bookingDate' } }, count: { $sum: 1 } } },
    ]),
    Trip.aggregate([
      { $match: { departureDate: { $gte: monthStart } } },
      { $group: { _id: { year: { $year: '$departureDate' }, month: { $month: '$departureDate' } }, count: { $sum: 1 } } },
    ]),
    Trip.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]),
    Trip.find().sort({ createdAt: -1 }).limit(5),
    Consignment.find()
      .populate('consignerId', 'companyName')
      .populate('consigneeId', 'companyName')
      .populate('tripId', 'tripNumber vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(5),
    Customer.find().sort({ createdAt: -1 }).limit(5),
  ]);

  const monthly = normalizeMonthly(monthlyConsignments, 'consignments').map((item) => {
    const tripItem = normalizeMonthly(monthlyTrips, 'trips').find(
      (trip) => trip.year === item.year && trip.monthNumber === item.monthNumber
    );
    return { month: item.month, consignments: item.consignments, trips: tripItem?.trips || 0 };
  });

  res.json({
    stats: { totalCustomers, totalTrips, toBeGoneTrips, ongoingTrips, completedTrips, totalConsignments },
    monthly,
    tripStatusDistribution: tripStatusDistribution.map((item) => ({ name: item._id, value: item.value })),
    recentTrips,
    recentConsignments,
    recentCustomers,
  });
};

module.exports = { getDashboard };
