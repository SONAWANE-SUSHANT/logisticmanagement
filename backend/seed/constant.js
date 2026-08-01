const { faker } = require('@faker-js/faker');

const COMPANY_NAMES = [
  "Bajaj Auto Ltd.",
  "Bosch India Pvt. Ltd.",
  "Mahindra & Mahindra Ltd.",
  "Tata Motors Ltd.",
  "Varroc Engineering Ltd.",
  "Endurance Technologies Ltd.",
  "Gabriel India Ltd.",
  "SKF India Ltd.",
  "Bharat Forge Ltd.",
  "Lumax Industries Ltd.",
  "Kirloskar Brothers Ltd.",
  "Force Motors Ltd.",
  "Motherson Automotive Ltd.",
  "CEAT Ltd.",
  "Siddheshwar Industries Pvt. Ltd."
];

const CITIES = [
  "Aurangabad",
  "Chakan",
  "Pune",
  "Waluj",
  "Nashik",
  "Mumbai",
  "Nagpur",
  "Kolhapur",
  "Satara",
  "Ahmednagar"
];

const PACKAGE_TYPES = [
  "Boxes",
  "Cartons",
  "Crates",
  "Bundles",
  "Pallets",
  "Wooden Case",
  "Steel Cage",
  "Plastic Bin"
];

const PART_NAMES = [
  "Brake Disc",
  "Bearing Kit",
  "Engine Block",
  "Gear Box",
  "Axle Shaft",
  "Control Arm",
  "Clutch Plate",
  "Wheel Hub",
  "Shock Absorber",
  "Leaf Spring",
  "Steel Pipe",
  "Casting",
  "Oil Seal",
  "Rubber Bush",
  "Machine Parts"
];

const BOOKING_MODES = [
  "Regular",
  "Express",
  "Part Load",
  "Full Truck Load"
];

const DELIVERY_MODES = [
  "Door Delivery",
  "Godown Delivery",
  "Self Pickup"
];

const PAYMENT_MODES = [
  "Paid",
  "To Pay",
  "To Be Billed"
];

const STATUS = [
  "Pending",
  "In Transit",
  "Delivered"
];

const TRIP_STATUS = [
  "To Be Gone",
  "Ongoing",
  "Completed"
];

module.exports = {
  faker,
  COMPANY_NAMES,
  CITIES,
  PACKAGE_TYPES,
  PART_NAMES,
  BOOKING_MODES,
  DELIVERY_MODES,
  PAYMENT_MODES,
  STATUS,
  TRIP_STATUS,
};