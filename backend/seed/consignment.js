const Consignment = require("../models/Consignment");

const {
  PACKAGE_TYPES,
  PART_NAMES,
  BOOKING_MODES,
  DELIVERY_MODES,
  PAYMENT_MODES,
  STATUS,
} = require("./constant");

const {
  randomItem,
  randomNumber,
  randomDate,
  generateLRNumber,
  generateInvoiceNumber,
  generateEWayBill,
} = require("./helper");

const createConsignments = async (customers, trips) => {
  try {

    await Consignment.deleteMany({});

    const consignments = [];

    for (let i = 0; i < 500; i++) {

      const consigner =
        customers[randomNumber(0, customers.length - 1)];

      let consignee =
        customers[randomNumber(0, customers.length - 1)];

      while (
        consignee._id.toString() ===
        consigner._id.toString()
      ) {
        consignee =
          customers[randomNumber(0, customers.length - 1)];
      }

      const trip =
        trips[randomNumber(0, trips.length - 1)];

      const bookingDate = randomDate();

      const invoiceDate = new Date(bookingDate);
      invoiceDate.setDate(invoiceDate.getDate() - 1);

      const deliveryDate = new Date(bookingDate);
      deliveryDate.setDate(
        deliveryDate.getDate() + randomNumber(1, 4)
      );

      const ewayDate = new Date(bookingDate);

      const validDate = new Date(bookingDate);
      validDate.setDate(validDate.getDate() + 5);
            // Package Details
      const packageCount = randomNumber(1, 50);
      const quantity = randomNumber(10, 500);

      const actualWeight = randomNumber(80, 5000);

      const chargeableWeight =
        actualWeight + randomNumber(0, 200);

      const goodsValue = randomNumber(10000, 500000);

      // Charges

      const freight = randomNumber(800, 15000);

      const collectionCharges = randomNumber(0, 800);

      const doorDeliveryCharges = randomNumber(0, 1200);

      const hamali = randomNumber(0, 500);

      const stCharges = randomNumber(0, 300);

      const otherCharges = randomNumber(0, 500);

      const insurance = randomNumber(0, 700);

      const subTotal =
        freight +
        collectionCharges +
        doorDeliveryCharges +
        hamali +
        stCharges +
        otherCharges +
        insurance;

      const gst = Number((subTotal * 0.18).toFixed(2));

      const sgst = Number((gst / 2).toFixed(2));

      const cgst = Number((gst / 2).toFixed(2));

      const igst = 0;

      const totalAmount = Number(
        (subTotal + gst).toFixed(2)
      );

      consignments.push({

        lrNumber: generateLRNumber(i),

        bookingDate,

        bookingTime: `${randomNumber(8,18)}:${randomNumber(10,59)}`,

        consignerId: consigner._id,

        consigneeId: consignee._id,

        tripId: trip._id,

        invoiceNumber: generateInvoiceNumber(i),

        invoiceDate,

        ewayBillNumber: generateEWayBill(),

        ewayBillDate: ewayDate,

        ewayBillValidUpto: validDate,

        description: randomItem(PART_NAMES),

        packageType: randomItem(PACKAGE_TYPES),

        packageCount,

        dimensions: `${randomNumber(10,60)}x${randomNumber(10,60)}x${randomNumber(10,60)}`,

        rate: randomNumber(10,50),

        bookingMode: randomItem(BOOKING_MODES),

        modeOfDelivery: randomItem(DELIVERY_MODES),

        paymentMode: randomItem(PAYMENT_MODES),

        deliveryDate,

        partNumber: `PRT-${randomNumber(1000,9999)}`,

        partName: randomItem(PART_NAMES),

        quantity,

        privateMark: `PM-${randomNumber(100,999)}`,

        actualWeight,

        chargeableWeight,

        goodsValue,

        freight,

        collectionCharges,

        doorDeliveryCharges,

        hamali,

        stCharges,

        otherCharges,

        insurance,

        subTotal,

        gst,

        sgst,

        cgst,

        igst,

        totalAmount,

        remarks: randomItem([
          "Handle With Care",
          "Urgent Delivery",
          "Fragile",
          "Keep Dry",
          "Industrial Goods",
          "Stack Carefully",
          "No Remarks",
        ]),

        status: randomItem(STATUS),

      });

    }

    const insertedConsignments =
      await Consignment.insertMany(consignments);

    console.log(
      `✅ ${insertedConsignments.length} Consignments Inserted`
    );

    return insertedConsignments;

  } catch (error) {

    console.error("Consignment Seeder Error:", error);

    throw error;

  }

};

module.exports = createConsignments;