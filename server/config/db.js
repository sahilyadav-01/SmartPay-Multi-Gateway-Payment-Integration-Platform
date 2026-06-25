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

const seedRoutingRules = async () => {
  try {
    const RoutingRule = require('../models/RoutingRule');
    const ruleCount = await RoutingRule.countDocuments();
    if (ruleCount === 0) {
      console.log('No routing rules found. Seeding default routing rules...');
      await RoutingRule.create([
        {
          name: 'Stripe for USD Transactions',
          conditions: {
            currency: 'USD',
            minAmount: 0,
            maxAmount: 1000000
          },
          targetGateway: 'stripe',
          priority: 10,
          isActive: true
        },
        {
          name: 'Razorpay for INR Transactions',
          conditions: {
            currency: 'INR',
            minAmount: 0,
            maxAmount: 10000000
          },
          targetGateway: 'razorpay',
          priority: 20,
          isActive: true
        },
        {
          name: 'Stripe High-Value Transactions Fallback',
          conditions: {
            currency: 'ANY',
            minAmount: 5000,
            maxAmount: 100000000
          },
          targetGateway: 'stripe',
          priority: 5,
          isActive: true
        }
      ]);
      console.log('Default routing rules seeded successfully.');
    }
  } catch (err) {
    console.error(`Failed to seed routing rules: ${err.message}`);
  }
};

const seedGatewayStatuses = async () => {
  try {
    const GatewayStatus = require('../models/GatewayStatus');
    const count = await GatewayStatus.countDocuments();
    if (count === 0) {
      console.log('No gateway statuses found. Seeding default healthy gateway statuses...');
      await GatewayStatus.create([
        { name: 'stripe', status: 'online', latencyMs: 120, errorRate: 0 },
        { name: 'razorpay', status: 'online', latencyMs: 95, errorRate: 0 },
        { name: 'paypal', status: 'online', latencyMs: 210, errorRate: 0 }
      ]);
      console.log('Default gateway statuses seeded successfully.');
    }
  } catch (err) {
    console.error(`Failed to seed gateway statuses: ${err.message}`);
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
    await seedRoutingRules();
    await seedGatewayStatuses();
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
        await seedRoutingRules();
        await seedGatewayStatuses();
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
