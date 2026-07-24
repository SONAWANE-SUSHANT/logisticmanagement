const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerCode: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  contactPerson: { type: String },
  gstNumber: { type: String },
  panNumber: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String },
  remarks: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Customer', customerSchema);
