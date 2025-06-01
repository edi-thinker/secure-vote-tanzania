/**
 * Seed script to create admin and auditor accounts
 * Run this script with: node scripts/seed-admin-auditor.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { logActivity } = require('../utils/logger');

// Configuration for admin and auditor accounts
const accounts = [
  {
    name: 'System Administrator',
    email: 'admin@securevote.tz',
    password: 'Admin@123', // This would be hashed by the User model
    role: 'admin',
    mfaEnabled: false // MFA disabled initially so user can set it up after first login
  },
  {
    name: 'System Auditor',
    email: 'auditor@securevote.tz',
    password: 'Audit@123', // This would be hashed by the User model
    role: 'auditor',
    mfaEnabled: false // MFA disabled initially so user can set it up after first login
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/secure-vote');
    console.log('MongoDB connected');
    
    // Seed admin and auditor accounts
    await seedAccounts();
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Seed admin and auditor accounts
const seedAccounts = async () => {
  try {
    console.log('Seeding admin and auditor accounts...');
    
    for (const account of accounts) {
      // Check if account already exists
      const existingUser = await User.findOne({ email: account.email });
      
      if (existingUser) {
        console.log(`Account for ${account.email} already exists`);
        continue;
      }
      
      // Create new account
      const user = await User.create(account);
      
      // Log activity
      await logActivity({
        level: 'INFO',
        message: `Created ${account.role} account`,
        component: 'Seed Script',
        action: 'Create Account',
        userId: user._id,
        userRole: account.role,
        ipAddress: '127.0.0.1'
      });
      
      console.log(`Created ${account.role} account: ${account.email}`);
    }
    
    console.log('Seeding completed');
  } catch (error) {
    console.error('Error seeding accounts:', error);
    throw error;
  }
};

// Run the script
connectDB();
