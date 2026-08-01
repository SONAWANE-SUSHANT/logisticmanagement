const Customer = require("../models/Customer");
const {
  COMPANY_NAMES,
  CITIES,
} = require("./constant");

const {
  generateCustomerCode,
  generateGST,
  generatePAN,
  generatePhone,
  randomItem,
} = require("./helper");

const createCustomers = async () => {
  try {
    // Clear existing customers
    await Customer.deleteMany({});

    const customers = [];

    for (let i = 0; i < COMPANY_NAMES.length; i++) {
      const city = randomItem(CITIES);

      customers.push({
        customerCode: generateCustomerCode(i),
        companyName: COMPANY_NAMES[i],
        contactPerson: `Manager ${i + 1}`,
        gstNumber: generateGST(),
        panNumber: generatePAN(),
        phone: generatePhone(),
        email: `contact${i + 1}@${COMPANY_NAMES[i]
          .replace(/[^a-zA-Z]/g, "")
          .toLowerCase()}.com`,
        address: `Plot No. ${10 + i}, MIDC Industrial Area`,
        city,
        state: "Maharashtra",
        pincode: `${431000 + i}`,
        country: "India",
        remarks: "Regular Customer",
      });
    }

    const insertedCustomers = await Customer.insertMany(customers);

    console.log(`✅ ${insertedCustomers.length} Customers Inserted`);

    return insertedCustomers;
  } catch (error) {
    console.error("Customer Seeder Error:", error);
    throw error;
  }
};

module.exports = createCustomers;