const mongoose = require('mongoose');

const freightBillLineSchema = new mongoose.Schema({
  consignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignment', required: true },
  srNo: { type: Number, required: true },
  lrNumber: { type: String, required: true },
  lrDate: { type: Date },
  from: { type: String },
  to: { type: String },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  weight: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  collectionCharges: { type: Number, default: 0 },
  doorDeliveryCharges: { type: Number, default: 0 },
  lrCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
}, { _id: false });

const freightBillSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  billDate: { type: Date, required: true, default: Date.now },
  mode: { type: String, default: 'Road' },
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Customer' },
  customerSnapshot: {
    companyName: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    gstNumber: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  ratePerKg: { type: Number, default: 0 },
  lineItems: [freightBillLineSchema],
  taxableAmount: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 9 },
  sgstRate: { type: Number, default: 9 },
  igstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  amountInWords: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['Generated', 'Paid', 'Cancelled'], default: 'Generated' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FreightBill', freightBillSchema);
