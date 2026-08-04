// seeder.js — dotenv.config() must run BEFORE requiring ./config/db,
// otherwise db.js builds the Pool with process.env.DB_PASSWORD still undefined

const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcryptjs');
const { connectDB, pool } = require('./config/db');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await connectDB();
    const existing = await User.findOne({ email: 'admin@shreemaruti.com' });
    if (existing) {
      console.log('Admin user already exists');
      await pool.end();
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
    await pool.end();
    process.exit();
  } catch (error) {
    console.error(error);
    await pool.end();
    process.exit(1);
  }
};

seedAdmin();