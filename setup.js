#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Restaurant Management System - Setup Script');
console.log('==============================================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!');
  console.log('Please create a .env file with the required configuration.');
  console.log('You can copy from .env.example or use the provided .env file.');
  process.exit(1);
}

console.log('✅ .env file found');

// Create required directories
const directories = ['uploads', 'reports'];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✅ Directory exists: ${dir}`);
  }
});

// Check if dependencies are installed
try {
  require('express');
  console.log('✅ Dependencies are installed');
} catch (error) {
  console.log('❌ Dependencies not installed');
  console.log('Running npm install...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (installError) {
    console.log('❌ Failed to install dependencies');
    console.log('Please run: npm install');
    process.exit(1);
  }
}

// Check MongoDB connection
console.log('\n🔍 Checking MongoDB connection...');
try {
  const mongoose = require('mongoose');
  require('dotenv').config();
  
  const testConnection = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-management', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ MongoDB connection successful');
      await mongoose.connection.close();
    } catch (error) {
      console.log('❌ MongoDB connection failed');
      console.log('Error:', error.message);
      console.log('\nPlease ensure:');
      console.log('1. MongoDB is running');
      console.log('2. MONGODB_URI is correctly set in .env');
      console.log('3. Network access is allowed (for Atlas)');
    }
  };
  
  testConnection();
} catch (error) {
  console.log('❌ Could not test MongoDB connection');
  console.log('Make sure mongoose is installed');
}

// Check environment variables
console.log('\n🔍 Checking environment variables...');
const requiredVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
} else {
  console.log('✅ All required environment variables are set');
}

// Check if server can start
console.log('\n🔍 Testing server startup...');
try {
  const app = require('./server');
  console.log('✅ Server can be imported successfully');
} catch (error) {
  console.log('❌ Server import failed');
  console.log('Error:', error.message);
}

console.log('\n🎉 Setup check completed!');
console.log('\n📋 Next steps:');
console.log('1. Configure your email settings in .env');
console.log('2. Start the server: npm run dev');
console.log('3. Test the health endpoint: curl http://localhost:5000/health');
console.log('4. Check the SETUP.md file for detailed configuration instructions');

console.log('\n📚 Documentation:');
console.log('- README.md: Complete system documentation');
console.log('- SETUP.md: Detailed setup instructions');
console.log('- API endpoints: Check the routes/ directory');

console.log('\n�� Happy coding!'); 