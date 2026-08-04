const PgModel = require('./pgModel');

module.exports = new PgModel({
  table: 'trips',
  columns: {
    from: 'source',
    to: 'destination',
  },
  fields: [
    '_id',
    'id',
    'tripNumber',
    'vehicleNumber',
    'from',
    'to',
    'departureDate',
    'expectedArrival',
    'status',
    'remarks',
    'createdAt',
    'updatedAt',
  ],
});
