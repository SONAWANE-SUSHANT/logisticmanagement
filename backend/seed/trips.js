const Trip = require("../models/Trip");
const { CITIES, TRIP_STATUS } = require("./constant");

const {
  generateTripNumber,
  generateVehicleNumber,
  randomDate,
  randomItem,
  randomNumber,
} = require("./helper");

const createTrips = async () => {
  try {
    // Clear existing trips
    await Trip.deleteMany({});

    const trips = [];

    for (let i = 0; i < 40; i++) {

      let from = randomItem(CITIES);
      let to = randomItem(CITIES);

      // Ensure source and destination are different
      while (from === to) {
        to = randomItem(CITIES);
      }

      const departureDate = randomDate();

      const expectedArrival = new Date(departureDate);
      expectedArrival.setDate(
        expectedArrival.getDate() + randomNumber(1, 3)
      );

      trips.push({
        tripNumber: generateTripNumber(i),
        vehicleNumber: generateVehicleNumber(),
        from,
        to,
        departureDate,
        expectedArrival,
        status: randomItem(TRIP_STATUS),
        remarks: "Scheduled Transport",
      });
    }

    const insertedTrips = await Trip.insertMany(trips);

    console.log(`✅ ${insertedTrips.length} Trips Inserted`);

    return insertedTrips;

  } catch (error) {
    console.error("Trip Seeder Error:", error);
    throw error;
  }
};

module.exports = createTrips;