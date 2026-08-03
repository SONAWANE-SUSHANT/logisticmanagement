const Customer = require('../models/Customer');
const Consignment = require('../models/Consignment');
const FreightBill = require('../models/FreightBill');
const { generateFreightBillNumber } = require('../services/generatorService');
const { buildPager, buildSearch } = require('../utils/queryHelpers');

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const belowHundred = (num) => {
  if (num < 20) return units[num];
  return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${units[num % 10]}` : ''}`;
};

const belowThousand = (num) => {
  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  return `${hundred ? `${units[hundred]} Hundred` : ''}${hundred && rest ? ' ' : ''}${rest ? belowHundred(rest) : ''}`.trim();
};

const numberToWords = (value) => {
  const amount = Math.round(Number(value || 0));
  if (!amount) return 'Zero Rupees only.';
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const rest = amount % 1000;
  const parts = [];
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return `${parts.join(' ')} Rupees only.`;
};

const parseDateRange = (fromDate, toDate) => {
  if (!fromDate || !toDate) {
    const error = new Error('Customer, from date, and to date are required');
    error.statusCode = 400;
    throw error;
  }
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const error = new Error('Invalid billing date range');
    error.statusCode = 400;
    throw error;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (start > end) {
    const error = new Error('From date cannot be after to date');
    error.statusCode = 400;
    throw error;
  }
  return { start, end };
};

const buildCustomerSnapshot = (customer) => ({
  companyName: customer.companyName,
  address: customer.address,
  city: customer.city,
  state: customer.state,
  pincode: customer.pincode,
  gstNumber: customer.gstNumber,
  phone: customer.phone,
  email: customer.email,
});

const buildConsignmentQuery = (customerId, start, end) => ({
  bookingDate: { $gte: start, $lte: end },
  $or: [{ consignerId: customerId }, { consigneeId: customerId }],
});

const fetchBillConsignments = async ({ customerId, fromDate, toDate, consignmentIds, onlyUnbilled = false }) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const { start, end } = parseDateRange(fromDate, toDate);
  const query = buildConsignmentQuery(customer._id, start, end);
  if (onlyUnbilled) {
    query.billStatus = { $ne: 'Bill Generated' };
  }

  if (consignmentIds !== undefined) {
    const ids = Array.isArray(consignmentIds) ? consignmentIds.filter(Boolean) : [consignmentIds].filter(Boolean);
    query._id = { $in: ids };
  }

  const consignments = await Consignment.find(query)
    .populate('tripId', 'from to')
    .populate('consignerId', 'companyName')
    .populate('consigneeId', 'companyName')
    .sort({ bookingDate: 1, lrNumber: 1 });

  return { customer, start, end, consignments };
};

const buildBillPayload = async ({
  customerId,
  fromDate,
  toDate,
  consignmentIds = [],
  ratePerKg = 0,
  cgstRate = 9,
  sgstRate = 9,
  igstRate = 0,
  mode = 'Road',
}) => {
  const rate = Number(ratePerKg || 0);
  if (Number.isNaN(rate) || rate < 0) {
    const error = new Error('Rate Per Kg must be a valid amount');
    error.statusCode = 400;
    throw error;
  }

  const { customer, start, end, consignments } = await fetchBillConsignments({ customerId, fromDate, toDate, consignmentIds, onlyUnbilled: true });
  const requestedIds = Array.isArray(consignmentIds) ? consignmentIds.filter(Boolean) : [consignmentIds].filter(Boolean);
  if (requestedIds.length && consignments.length !== requestedIds.length) {
    const error = new Error('One or more selected consignments do not match this customer and date range');
    error.statusCode = 400;
    throw error;
  }

  const lineItems = consignments.map((item, index) => {
    const weight = Number(item.chargeableWeight || item.actualWeight || 0);
    const calculatedFreight = roundMoney(weight * rate);
    const lrCharges = Number(item.stCharges || 0);
    const otherCharges = Number(item.hamali || 0) + Number(item.otherCharges || 0) + Number(item.insurance || 0);
    const amount = roundMoney(
      calculatedFreight +
      Number(item.collectionCharges || 0) +
      Number(item.doorDeliveryCharges || 0) +
      lrCharges +
      otherCharges
    );
    return {
      consignmentId: item._id,
      srNo: index + 1,
      lrNumber: item.lrNumber,
      lrDate: item.bookingDate,
      from: item.tripId?.from,
      to: item.tripId?.to,
      invoiceNumber: item.invoiceNumber,
      invoiceDate: item.invoiceDate,
      weight,
      freight: calculatedFreight,
      collectionCharges: Number(item.collectionCharges || 0),
      doorDeliveryCharges: Number(item.doorDeliveryCharges || 0),
      lrCharges,
      otherCharges,
      amount,
    };
  });

  const taxableAmount = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const cgstAmount = roundMoney((taxableAmount * Number(cgstRate || 0)) / 100);
  const sgstAmount = roundMoney((taxableAmount * Number(sgstRate || 0)) / 100);
  const igstAmount = roundMoney((taxableAmount * Number(igstRate || 0)) / 100);
  const grandTotal = Math.round(taxableAmount + cgstAmount + sgstAmount + igstAmount);

  return {
    customerId: customer._id,
    customerSnapshot: buildCustomerSnapshot(customer),
    fromDate: start,
    toDate: end,
    mode,
    ratePerKg: rate,
    lineItems,
    taxableAmount,
    cgstRate: Number(cgstRate || 0),
    sgstRate: Number(sgstRate || 0),
    igstRate: Number(igstRate || 0),
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
    amountInWords: numberToWords(grandTotal),
  };
};

const getBillConsignments = async (req, res) => {
  const { consignments } = await fetchBillConsignments(req.query);
  res.json({
    consignments: consignments.map((item) => ({
      _id: item._id,
      lrNumber: item.lrNumber,
      bookingDate: item.bookingDate,
      consigner: item.consignerId?.companyName,
      consignee: item.consigneeId?.companyName,
      from: item.tripId?.from,
      to: item.tripId?.to,
      invoiceNumber: item.invoiceNumber,
      invoiceDate: item.invoiceDate,
      chargeableWeight: Number(item.chargeableWeight || item.actualWeight || 0),
      storedFreight: Number(item.freight || 0),
      collectionCharges: Number(item.collectionCharges || 0),
      doorDeliveryCharges: Number(item.doorDeliveryCharges || 0),
      lrCharges: Number(item.stCharges || 0),
      otherCharges: Number(item.hamali || 0) + Number(item.otherCharges || 0) + Number(item.insurance || 0),
      billStatus: item.billStatus === 'Bill Generated' ? 'Bill Generated' : 'Not Billed',
      paymentStatus: item.billStatus === 'Bill Generated' ? item.paymentStatus || 'Pending' : '-',
      canSelectForBill: item.billStatus !== 'Bill Generated',
    })),
  });
};

const previewFreightBill = async (req, res) => {
  const payload = await buildBillPayload(req.method === 'POST' ? req.body : req.query);
  res.json(payload);
};

const createFreightBill = async (req, res) => {
  const payload = await buildBillPayload(req.body);
  if (!payload.lineItems.length) {
    res.status(400);
    throw new Error('No consignments found for this customer and date range');
  }

  const bill = await FreightBill.create({
    ...payload,
    billNumber: await generateFreightBillNumber(),
    billDate: req.body.billDate || new Date(),
    notes: req.body.notes,
    createdBy: req.user?._id,
  });

  await Consignment.updateMany(
    { _id: { $in: payload.lineItems.map((item) => item.consignmentId) } },
    { billStatus: 'Bill Generated', paymentStatus: 'Pending', freightBillId: bill._id }
  );

  res.status(201).json(bill);
};

const getFreightBills = async (req, res) => {
  const { search = '', customerId, status, sort = '-billDate' } = req.query;
  const { page, limit, skip } = buildPager(req.query);
  const query = {};
  const searchQuery = buildSearch(search, ['billNumber', 'customerSnapshot.companyName', 'customerSnapshot.gstNumber']);

  if (searchQuery) Object.assign(query, searchQuery);
  if (customerId) query.customerId = customerId;
  if (status) query.status = status;

  const total = await FreightBill.countDocuments(query);
  const freightBills = await FreightBill.find(query)
    .populate('customerId', 'companyName')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  res.json({ freightBills, total, page, limit, pages: Math.ceil(total / limit) || 1 });
};

const getFreightBillById = async (req, res) => {
  const bill = await FreightBill.findById(req.params.id).populate('customerId', 'companyName gstNumber address city state pincode');
  if (!bill) {
    res.status(404);
    throw new Error('Freight bill not found');
  }
  res.json(bill);
};

const markFreightBillPaid = async (req, res) => {
  const bill = await FreightBill.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Freight bill not found');
  }

  bill.status = 'Paid';
  await bill.save();

  await Consignment.updateMany(
    { _id: { $in: bill.lineItems.map((item) => item.consignmentId) } },
    { paymentStatus: 'Paid' }
  );

  res.json(bill);
};

const deleteFreightBill = async (req, res) => {
  const bill = await FreightBill.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Freight bill not found');
  }
  await bill.deleteOne();
  res.json({ message: 'Freight bill deleted' });
};

module.exports = {
  getBillConsignments,
  previewFreightBill,
  createFreightBill,
  getFreightBills,
  getFreightBillById,
  markFreightBillPaid,
  deleteFreightBill,
};
