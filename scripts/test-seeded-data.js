const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const Table = require('../models/Table');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for testing');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Test seeded data
const testSeededData = async () => {
  try {
    console.log('🧪 Testing seeded data...\n');
    
    // Test users
    console.log('👥 Testing users...');
    const users = await User.find({}).select('-password');
    console.log(`✅ Found ${users.length} users`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.email}`);
    });
    
    // Test restaurants
    console.log('\n🏪 Testing restaurants...');
    const restaurants = await Restaurant.find({}).populate('owner', 'name email');
    console.log(`✅ Found ${restaurants.length} restaurants`);
    restaurants.forEach(restaurant => {
      console.log(`   - ${restaurant.name} (Owner: ${restaurant.owner.name})`);
      console.log(`     Location: ${restaurant.address.city}, ${restaurant.address.state}`);
      console.log(`     Cuisine: ${restaurant.cuisine.join(', ')}`);
    });
    
    // Test categories
    console.log('\n📂 Testing categories...');
    const categories = await Category.find({}).populate('restaurantId', 'name');
    console.log(`✅ Found ${categories.length} categories`);
    const categoriesByRestaurant = {};
    categories.forEach(category => {
      const restaurantName = category.restaurantId.name;
      if (!categoriesByRestaurant[restaurantName]) {
        categoriesByRestaurant[restaurantName] = [];
      }
      categoriesByRestaurant[restaurantName].push(category.name);
    });
    Object.keys(categoriesByRestaurant).forEach(restaurant => {
      console.log(`   - ${restaurant}: ${categoriesByRestaurant[restaurant].join(', ')}`);
    });
    
    // Test dishes
    console.log('\n🍽️  Testing dishes...');
    const dishes = await Dish.find({})
      .populate('restaurantId', 'name')
      .populate('categoryId', 'name');
    console.log(`✅ Found ${dishes.length} dishes`);
    dishes.forEach(dish => {
      console.log(`   - ${dish.name} ($${dish.price})`);
      console.log(`     Restaurant: ${dish.restaurantId.name}`);
      console.log(`     Category: ${dish.categoryId.name}`);
      console.log(`     Stock: ${dish.stockQuantity} (Low: ${dish.isLowStock})`);
    });
    
    // Test tables
    console.log('\n🪑 Testing tables...');
    const tables = await Table.find({}).populate('restaurantId', 'name');
    console.log(`✅ Found ${tables.length} tables`);
    const tablesByRestaurant = {};
    tables.forEach(table => {
      const restaurantName = table.restaurantId.name;
      if (!tablesByRestaurant[restaurantName]) {
        tablesByRestaurant[restaurantName] = [];
      }
      tablesByRestaurant[restaurantName].push({
        number: table.tableNumber,
        capacity: table.capacity,
        status: table.status
      });
    });
    Object.keys(tablesByRestaurant).forEach(restaurant => {
      console.log(`   - ${restaurant}:`);
      tablesByRestaurant[restaurant].forEach(table => {
        console.log(`     Table ${table.number} (${table.capacity} seats) - ${table.status}`);
      });
    });
    
    // Test relationships
    console.log('\n🔗 Testing relationships...');
    
    // Test restaurant owner assignment
    const restaurantOwners = await User.find({ role: 'restaurant_owner' }).populate('restaurantId', 'name');
    console.log('✅ Restaurant owners:');
    restaurantOwners.forEach(owner => {
      if (owner.restaurantId) {
        console.log(`   - ${owner.name} owns ${owner.restaurantId.name}`);
      } else {
        console.log(`   - ${owner.name} (no restaurant assigned)`);
      }
    });
    
    // Test staff assignments
    const staff = await User.find({ role: 'staff' }).populate('restaurantId', 'name');
    console.log('✅ Staff members:');
    staff.forEach(member => {
      if (member.restaurantId) {
        console.log(`   - ${member.name} (${member.staffRole}) works at ${member.restaurantId.name}`);
      } else {
        console.log(`   - ${member.name} (${member.staffRole}) - no restaurant assigned`);
      }
    });
    
    // Test dish stock status
    console.log('\n📦 Testing stock status...');
    const lowStockDishes = dishes.filter(dish => dish.isLowStock);
    const outOfStockDishes = dishes.filter(dish => dish.isOutOfStock);
    
    if (lowStockDishes.length > 0) {
      console.log('⚠️  Low stock dishes:');
      lowStockDishes.forEach(dish => {
        console.log(`   - ${dish.name}: ${dish.stockQuantity}/${dish.lowStockThreshold}`);
      });
    } else {
      console.log('✅ No low stock dishes');
    }
    
    if (outOfStockDishes.length > 0) {
      console.log('❌ Out of stock dishes:');
      outOfStockDishes.forEach(dish => {
        console.log(`   - ${dish.name}`);
      });
    } else {
      console.log('✅ No out of stock dishes');
    }
    
    // Test QR codes
    console.log('\n📱 Testing QR codes...');
    const tablesWithQR = tables.filter(table => table.qrCode);
    console.log(`✅ ${tablesWithQR.length}/${tables.length} tables have QR codes`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏪 Restaurants: ${restaurants.length}`);
    console.log(`   📂 Categories: ${categories.length}`);
    console.log(`   🍽️  Dishes: ${dishes.length}`);
    console.log(`   🪑 Tables: ${tables.length}`);
    console.log(`   📱 QR Codes: ${tablesWithQR.length}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n🔑 You can now test the API with these credentials:');
    console.log('   Super Admin: admin@restaurant.com / admin123');
    console.log('   Restaurant Owner: owner@restaurant.com / owner123 (or john@restaurant.com)');
    console.log('   Staff: staff@restaurant.com / staff123 (or sarah@restaurant.com)');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run testing
if (require.main === module) {
  connectDB().then(testSeededData);
}

module.exports = { testSeededData, connectDB }; 