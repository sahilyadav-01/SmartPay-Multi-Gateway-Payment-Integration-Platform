const mongoose = require('mongoose');

const seedAdminUser = async () => {
  try {
    const User = require('../models/User');
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin user found. Seeding default admin user...');
      await User.create({
        name: 'System Admin',
        email: 'admin@smartpay.io',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default admin user (admin@smartpay.io / admin123) seeded successfully.');
    }
  } catch (err) {
    console.error(`Failed to seed admin user: ${err.message}`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpay';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdminUser();
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Local MongoDB connection failed. Starting in-memory MongoDB for development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        console.log(`In-Memory MongoDB started at: ${memoryUri}`);
        const conn = await mongoose.connect(memoryUri);
        console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
        await seedAdminUser();
        return conn;
      } catch (memError) {
        console.error(`In-Memory Database Connection Error: ${memError.message}`);
        process.exit(1);
      }
    } else {
      console.error(`Database Connection Error: ${error.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
