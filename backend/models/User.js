const PgModel = require('./pgModel');

module.exports = new PgModel({
  table: 'users',
  fields: ['_id', 'id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt'],
});
