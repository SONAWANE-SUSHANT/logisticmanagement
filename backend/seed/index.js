require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");

const createCustomers = require("./customer");
const createTrips = require("./trips");
const createConsignments = require("./consignment");

const seedDatabase = async () => {
  try {

    await connectDB();

    console.log("==================================");
    console.log("Starting Logistics Database Seeder");
    console.log("==================================");

    const customers = await createCustomers();

    const trips = await createTrips();

    await createConsignments(customers, trips);

    console.log("");
    console.log("==================================");
    console.log("Database Seeded Successfully");
    console.log("==================================");

    mongoose.connection.close();

    process.exit(0);

  } catch (error) {

    console.error(error);

    process.exit(1);

  }
};

seedDatabase();