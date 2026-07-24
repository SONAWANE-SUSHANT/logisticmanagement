const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ email: 'admin@shreemaruti.com' });
    if (existing) {
      console.log('Admin user already exists');
      process.exit();
    }

    const password = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@shreemaruti.com',
      password,
      role: 'Admin',
    });
    console.log('Admin user created: admin@shreemaruti.com / admin123');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
