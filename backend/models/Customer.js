const PgModel = require('./pgModel');

module.exports = new PgModel({
  table: 'customers',
  fields: [
    '_id',
    'id',
    'customerCode',
    'companyName',
    'contactPerson',
    'gstNumber',
    'panNumber',
    'phone',
    'email',
    'address',
    'city',
    'state',
    'pincode',
    'country',
    'remarks',
    'createdAt',
    'updatedAt',
  ],
});
