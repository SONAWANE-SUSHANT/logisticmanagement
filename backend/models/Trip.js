const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: { type: String, required: true, unique: true },
  vehicleNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: Date, required: true },
  expectedArrival: { type: Date, required: true },
  status: { type: String, enum: ['To Be Gone', 'Ongoing', 'Completed'], default: 'To Be Gone' },
  remarks: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trip', tripSchema);
