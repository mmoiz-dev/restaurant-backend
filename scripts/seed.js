const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const Table = require('../models/Table');

// Sample data
const sampleData = {
  users: [
    {
      name: 'Super Admin',
      email: 'admin@restaurant.com',
      phone: '+1234567890',
      password: 'admin123',
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true
    },
    {
      name: 'John Restaurant Owner',
      email: 'john@restaurant.com',
      phone: '+1234567891',
      password: 'owner123',
      role: 'restaurant_owner',
      isEmailVerified: true,
      isActive: true
    },
    {
      name: 'Sarah Cashier',
      email: 'sarah@restaurant.com',
      phone: '+1234567892',
      password: 'staff123',
      role: 'staff',
      staffRole: 'cashier',
      permissions: ['manage_orders', 'view_reports'],
      isEmailVerified: true,
      isActive: true
    },
    {
      name: 'Mike Kitchen Staff',
      email: 'mike@restaurant.com',
      phone: '+1234567893',
      password: 'staff123',
      role: 'staff',
      staffRole: 'kitchen_staff',
      permissions: ['manage_dishes', 'manage_orders'],
      isEmailVerified: true,
      isActive: true
    },
    {
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '+1234567894',
      password: 'customer123',
      role: 'customer',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      isEmailVerified: true,
      isActive: true
    }
  ],
  restaurants: [
    {
      name: 'Pizza Palace',
      description: 'Authentic Italian pizza and pasta',
      contactInfo: {
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        website: 'https://pizzapalace.com'
      },
      address: {
        street: '456 Pizza Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128]
        }
      },
      operatingHours: {
        monday: { open: '11:00', close: '22:00', isOpen: true },
        tuesday: { open: '11:00', close: '22:00', isOpen: true },
        wednesday: { open: '11:00', close: '22:00', isOpen: true },
        thursday: { open: '11:00', close: '22:00', isOpen: true },
        friday: { open: '11:00', close: '23:00', isOpen: true },
        saturday: { open: '12:00', close: '23:00', isOpen: true },
        sunday: { open: '12:00', close: '21:00', isOpen: true }
      },
      cuisine: ['italian', 'pizza'],
      priceRange: '$$',
      features: ['delivery', 'takeout', 'dine_in', 'outdoor_seating'],
      settings: {
        isActive: true,
        autoAcceptOrders: false,
        requireCustomerVerification: true,
        allowTableReservations: true,
        allowDelivery: true,
        allowTakeout: true,
        taxRate: 8.5,
        serviceCharge: 10,
        minimumOrderAmount: 15,
        deliveryRadius: 5,
        deliveryFee: 3
      }
    },
    {
      name: 'Sushi Express',
      description: 'Fresh sushi and Japanese cuisine',
      contactInfo: {
        phone: '+1234567891',
        email: 'info@sushiexpress.com',
        website: 'https://sushiexpress.com'
      },
      address: {
        street: '789 Sushi Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522]
        }
      },
      operatingHours: {
        monday: { open: '11:30', close: '21:30', isOpen: true },
        tuesday: { open: '11:30', close: '21:30', isOpen: true },
        wednesday: { open: '11:30', close: '21:30', isOpen: true },
        thursday: { open: '11:30', close: '21:30', isOpen: true },
        friday: { open: '11:30', close: '22:30', isOpen: true },
        saturday: { open: '12:00', close: '22:30', isOpen: true },
        sunday: { open: '12:00', close: '21:00', isOpen: true }
      },
      cuisine: ['japanese', 'sushi'],
      priceRange: '$$$',
      features: ['delivery', 'takeout', 'dine_in', 'reservations'],
      settings: {
        isActive: true,
        autoAcceptOrders: false,
        requireCustomerVerification: true,
        allowTableReservations: true,
        allowDelivery: true,
        allowTakeout: true,
        taxRate: 9.0,
        serviceCharge: 15,
        minimumOrderAmount: 25,
        deliveryRadius: 8,
        deliveryFee: 5
      }
    }
  ],
  categories: [
    { name: 'Appetizers', description: 'Start your meal right' },
    { name: 'Main Course', description: 'Delicious main dishes' },
    { name: 'Desserts', description: 'Sweet endings' },
    { name: 'Beverages', description: 'Refreshing drinks' },
    { name: 'Pizza', description: 'Fresh baked pizzas' },
    { name: 'Pasta', description: 'Italian pasta dishes' },
    { name: 'Sushi', description: 'Fresh sushi rolls' },
    { name: 'Sashimi', description: 'Fresh raw fish' },
    { name: 'Sides', description: 'Perfect accompaniments' }
  ],
  dishes: [
    // Pizza Palace Dishes
    {
      name: 'Margherita Pizza',
      description: 'Classic tomato sauce, mozzarella, and basil',
      price: 18.99,
      originalPrice: 22.99,
      isOnSale: true,
      salePercentage: 15,
      preparationTime: 15,
      isVegetarian: true,
      isGlutenFree: false,
      isSpicy: false,
      spiceLevel: 0,
      stockQuantity: 50,
      lowStockThreshold: 10,
      ingredients: [
        { name: 'Pizza dough', quantity: '1', unit: 'pcs' },
        { name: 'Tomato sauce', quantity: '100', unit: 'ml' },
        { name: 'Mozzarella cheese', quantity: '150', unit: 'g' },
        { name: 'Fresh basil', quantity: '5', unit: 'pcs' }
      ],
      allergens: ['dairy', 'wheat'],
      nutritionalInfo: {
        calories: 285,
        protein: 12,
        carbohydrates: 35,
        fat: 8,
        fiber: 2,
        sugar: 3,
        sodium: 450
      },
      customizations: [
        {
          name: 'Size',
          options: [
            { name: 'Small', price: 0 },
            { name: 'Medium', price: 3 },
            { name: 'Large', price: 6 }
          ],
          isRequired: true,
          maxSelections: 1
        },
        {
          name: 'Extra Toppings',
          options: [
            { name: 'Pepperoni', price: 2 },
            { name: 'Mushrooms', price: 1.5 },
            { name: 'Olives', price: 1.5 },
            { name: 'Extra Cheese', price: 2 }
          ],
          isRequired: false,
          maxSelections: 4
        }
      ],
      tags: ['popular', 'vegetarian', 'classic']
    },
    {
      name: 'Pepperoni Pizza',
      description: 'Spicy pepperoni with melted cheese',
      price: 21.99,
      preparationTime: 18,
      isVegetarian: false,
      isGlutenFree: false,
      isSpicy: true,
      spiceLevel: 3,
      stockQuantity: 40,
      lowStockThreshold: 8,
      ingredients: [
        { name: 'Pizza dough', quantity: '1', unit: 'pcs' },
        { name: 'Tomato sauce', quantity: '100', unit: 'ml' },
        { name: 'Mozzarella cheese', quantity: '150', unit: 'g' },
        { name: 'Pepperoni', quantity: '80', unit: 'g' }
      ],
      allergens: ['dairy', 'wheat'],
      customizations: [
        {
          name: 'Size',
          options: [
            { name: 'Small', price: 0 },
            { name: 'Medium', price: 3 },
            { name: 'Large', price: 6 }
          ],
          isRequired: true,
          maxSelections: 1
        }
      ],
      tags: ['popular', 'spicy', 'meat']
    },
    {
      name: 'Spaghetti Carbonara',
      description: 'Creamy pasta with bacon and parmesan',
      price: 16.99,
      preparationTime: 12,
      isVegetarian: false,
      isGlutenFree: false,
      isSpicy: false,
      spiceLevel: 1,
      stockQuantity: 30,
      lowStockThreshold: 5,
      ingredients: [
        { name: 'Spaghetti', quantity: '200', unit: 'g' },
        { name: 'Bacon', quantity: '100', unit: 'g' },
        { name: 'Eggs', quantity: '2', unit: 'pcs' },
        { name: 'Parmesan cheese', quantity: '50', unit: 'g' }
      ],
      allergens: ['dairy', 'eggs', 'wheat'],
      tags: ['pasta', 'creamy', 'classic']
    },
    // Sushi Express Dishes
    {
      name: 'California Roll',
      description: 'Crab, avocado, and cucumber roll',
      price: 12.99,
      preparationTime: 8,
      isVegetarian: false,
      isGlutenFree: true,
      isSpicy: false,
      spiceLevel: 0,
      stockQuantity: 25,
      lowStockThreshold: 5,
      ingredients: [
        { name: 'Sushi rice', quantity: '100', unit: 'g' },
        { name: 'Crab meat', quantity: '50', unit: 'g' },
        { name: 'Avocado', quantity: '30', unit: 'g' },
        { name: 'Cucumber', quantity: '20', unit: 'g' }
      ],
      allergens: ['fish'],
      customizations: [
        {
          name: 'Sauce',
          options: [
            { name: 'Soy sauce', price: 0 },
            { name: 'Spicy mayo', price: 0.5 },
            { name: 'Eel sauce', price: 0.5 }
          ],
          isRequired: false,
          maxSelections: 2
        }
      ],
      tags: ['sushi', 'popular', 'beginner-friendly']
    },
    {
      name: 'Salmon Nigiri',
      description: 'Fresh salmon over seasoned rice',
      price: 8.99,
      preparationTime: 5,
      isVegetarian: false,
      isGlutenFree: true,
      isSpicy: false,
      spiceLevel: 0,
      stockQuantity: 35,
      lowStockThreshold: 7,
      ingredients: [
        { name: 'Sushi rice', quantity: '50', unit: 'g' },
        { name: 'Fresh salmon', quantity: '30', unit: 'g' }
      ],
      allergens: ['fish'],
      tags: ['nigiri', 'fresh', 'simple']
    },
    {
      name: 'Spicy Tuna Roll',
      description: 'Spicy tuna with cucumber and scallions',
      price: 14.99,
      preparationTime: 10,
      isVegetarian: false,
      isGlutenFree: true,
      isSpicy: true,
      spiceLevel: 4,
      stockQuantity: 20,
      lowStockThreshold: 4,
      ingredients: [
        { name: 'Sushi rice', quantity: '100', unit: 'g' },
        { name: 'Tuna', quantity: '60', unit: 'g' },
        { name: 'Spicy mayo', quantity: '15', unit: 'ml' },
        { name: 'Cucumber', quantity: '20', unit: 'g' }
      ],
      allergens: ['fish'],
      tags: ['sushi', 'spicy', 'popular']
    }
  ],
  tables: [
    { tableNumber: 'T1', capacity: 4, location: { area: 'indoor', section: 'Main Dining' } },
    { tableNumber: 'T2', capacity: 4, location: { area: 'indoor', section: 'Main Dining' } },
    { tableNumber: 'T3', capacity: 6, location: { area: 'indoor', section: 'Main Dining' } },
    { tableNumber: 'T4', capacity: 2, location: { area: 'indoor', section: 'Bar Area' } },
    { tableNumber: 'T5', capacity: 4, location: { area: 'outdoor', section: 'Patio' } },
    { tableNumber: 'T6', capacity: 4, location: { area: 'outdoor', section: 'Patio' } },
    { tableNumber: 'T7', capacity: 8, location: { area: 'indoor', section: 'Private Room' } }
  ]
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await Dish.deleteMany({});
    await Table.deleteMany({});
    console.log('✅ Data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
  }
};

// Seed users (excluding staff and restaurant owners for now)
const seedUsers = async () => {
  try {
    console.log('👥 Seeding users...');
    const users = [];
    
    for (const userData of sampleData.users) {
      // Skip staff and restaurant owners for now - they need restaurantId
      if (userData.role === 'staff' || userData.role === 'restaurant_owner') {
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      users.push({
        ...userData,
        password: hashedPassword
      });
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

// Seed restaurants after staff and owners are created
const seedRestaurants = async (staffAndOwners) => {
  try {
    console.log('🏪 Seeding restaurants...');
    
    const restaurantOwner = staffAndOwners.find(u => u.role === 'restaurant_owner');
    const staff = staffAndOwners.filter(u => u.role === 'staff');
    
    // Fix cuisine values to match enum
    const restaurants = sampleData.restaurants.map((restaurant, index) => {
      // Fix cuisine values
      const fixedCuisine = restaurant.cuisine.map(c => {
        if (c === 'pizza') return 'italian';
        if (c === 'sushi') return 'japanese';
        return c;
      });
      
      return {
        ...restaurant,
        cuisine: fixedCuisine,
        owner: restaurantOwner._id,
        staff: staff.map(s => s._id)
      };
    });
    
    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log(`✅ Created ${createdRestaurants.length} restaurants`);
    return createdRestaurants;
  } catch (error) {
    console.error('❌ Error seeding restaurants:', error.message);
    throw error;
  }
};

// Seed categories
const seedCategories = async (restaurants) => {
  try {
    console.log('📂 Seeding categories...');
    const categories = [];
    
    for (const restaurant of restaurants) {
      for (const categoryData of sampleData.categories) {
        categories.push({
          ...categoryData,
          restaurantId: restaurant._id
        });
      }
    }
    
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    return createdCategories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
    throw error;
  }
};

// Seed dishes
const seedDishes = async (restaurants, categories) => {
  try {
    console.log('🍽️  Seeding dishes...');
    const dishes = [];
    
    // Pizza Palace dishes (first restaurant)
    const pizzaCategories = categories.filter(c => 
      c.restaurantId.toString() === restaurants[0]._id.toString()
    );
    
    const pizzaCategory = pizzaCategories.find(c => c.name === 'Pizza');
    const pastaCategory = pizzaCategories.find(c => c.name === 'Pasta');
    
    // Add pizza dishes to first restaurant
    dishes.push({
      ...sampleData.dishes[0], // Margherita Pizza
      restaurantId: restaurants[0]._id,
      categoryId: pizzaCategory._id
    });
    
    dishes.push({
      ...sampleData.dishes[1], // Pepperoni Pizza
      restaurantId: restaurants[0]._id,
      categoryId: pizzaCategory._id
    });
    
    dishes.push({
      ...sampleData.dishes[2], // Spaghetti Carbonara
      restaurantId: restaurants[0]._id,
      categoryId: pastaCategory._id
    });
    
    // Sushi Express dishes (second restaurant)
    const sushiCategories = categories.filter(c => 
      c.restaurantId.toString() === restaurants[1]._id.toString()
    );
    
    const sushiCategory = sushiCategories.find(c => c.name === 'Sushi');
    const sashimiCategory = sushiCategories.find(c => c.name === 'Sashimi');
    
    dishes.push({
      ...sampleData.dishes[3], // California Roll
      restaurantId: restaurants[1]._id,
      categoryId: sushiCategory._id
    });
    
    dishes.push({
      ...sampleData.dishes[4], // Salmon Nigiri
      restaurantId: restaurants[1]._id,
      categoryId: sashimiCategory._id
    });
    
    dishes.push({
      ...sampleData.dishes[5], // Spicy Tuna Roll
      restaurantId: restaurants[1]._id,
      categoryId: sushiCategory._id
    });
    
    const createdDishes = await Dish.insertMany(dishes);
    console.log(`✅ Created ${createdDishes.length} dishes`);
    return createdDishes;
  } catch (error) {
    console.error('❌ Error seeding dishes:', error.message);
    throw error;
  }
};

// Seed tables
const seedTables = async (restaurants) => {
  try {
    console.log('🪑 Seeding tables...');
    const tables = [];
    
    for (const restaurant of restaurants) {
      for (const tableData of sampleData.tables) {
        tables.push({
          ...tableData,
          restaurantId: restaurant._id
        });
      }
    }
    
    const createdTables = await Table.insertMany(tables);
    console.log(`✅ Created ${createdTables.length} tables`);
    return createdTables;
  } catch (error) {
    console.error('❌ Error seeding tables:', error.message);
    throw error;
  }
};

// Seed staff and restaurant owners with temporary restaurant
const seedStaffAndOwners = async () => {
  try {
    console.log('👥 Seeding staff and restaurant owners...');
    
    // Create a temporary user first to be the owner (with customer role to avoid restaurantId requirement)
    const tempOwner = await User.create({
      name: 'Temporary Owner',
      email: 'tempowner@restaurant.com',
      phone: '+1234567890',
      password: await bcrypt.hash('temp123', 10),
      role: 'customer', // Start as customer to avoid restaurantId requirement
      isEmailVerified: true,
      isActive: true
    });
    
    // Create a temporary restaurant for the users
    const tempRestaurant = await Restaurant.create({
      name: 'Temporary Restaurant',
      description: 'Temporary restaurant for seeding',
      contactInfo: {
        phone: '+1234567890',
        email: 'temp@restaurant.com'
      },
      address: {
        street: '123 Temp St',
        city: 'Temp City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128]
        }
      },
      cuisine: ['italian'],
      priceRange: '$$',
      features: ['dine_in'],
      settings: {
        isActive: true,
        autoAcceptOrders: false,
        requireCustomerVerification: true,
        allowTableReservations: true,
        allowDelivery: true,
        allowTakeout: true,
        taxRate: 8.5,
        serviceCharge: 10,
        minimumOrderAmount: 15,
        deliveryRadius: 5,
        deliveryFee: 3
      },
      owner: tempOwner._id,
      staff: []
    });
    
    // Update the temporary owner to be restaurant_owner and assign restaurantId
    await User.findByIdAndUpdate(tempOwner._id, {
      role: 'restaurant_owner',
      restaurantId: tempRestaurant._id
    });
    
    const users = [];
    
    // Find staff and restaurant owner data
    const staffData = sampleData.users.filter(u => u.role === 'staff' || u.role === 'restaurant_owner');
    
    for (const userData of staffData) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      users.push({
        ...userData,
        password: hashedPassword,
        restaurantId: tempRestaurant._id
      });
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} staff and owners`);
    
    return { users: createdUsers, tempRestaurant, tempOwner };
  } catch (error) {
    console.error('❌ Error seeding staff and owners:', error.message);
    throw error;
  }
};

// Update user restaurant assignments and clean up temporary restaurant
const updateUserRestaurants = async (staffAndOwners, restaurants, tempRestaurant, tempOwner) => {
  try {
    console.log('🔗 Updating user restaurant assignments...');
    
    const restaurantOwner = staffAndOwners.find(u => u.role === 'restaurant_owner');
    const staff = staffAndOwners.filter(u => u.role === 'staff');
    
    // Update users to point to the first real restaurant
    await User.findByIdAndUpdate(restaurantOwner._id, {
      restaurantId: restaurants[0]._id
    });
    
    for (const staffMember of staff) {
      await User.findByIdAndUpdate(staffMember._id, {
        restaurantId: restaurants[0]._id
      });
    }
    
    // Delete the temporary restaurant and temporary owner
    await Restaurant.findByIdAndDelete(tempRestaurant._id);
    await User.findByIdAndDelete(tempOwner._id);
    
    console.log('✅ User restaurant assignments updated and temporary data cleaned up');
  } catch (error) {
    console.error('❌ Error updating user assignments:', error.message);
  }
};

// Main seeding function
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Clear existing data
    await clearData();
    
    // Seed data in order
    const users = await seedUsers();
    const { users: staffAndOwners, tempRestaurant, tempOwner } = await seedStaffAndOwners();
    const restaurants = await seedRestaurants(staffAndOwners);
    await updateUserRestaurants(staffAndOwners, restaurants, tempRestaurant, tempOwner);
    const categories = await seedCategories(restaurants);
    const dishes = await seedDishes(restaurants, categories);
    const tables = await seedTables(restaurants);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length + staffAndOwners.length}`);
    console.log(`   🏪 Restaurants: ${restaurants.length}`);
    console.log(`   📂 Categories: ${categories.length}`);
    console.log(`   🍽️  Dishes: ${dishes.length}`);
    console.log(`   🪑 Tables: ${tables.length}`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Super Admin: admin@restaurant.com / admin123');
    console.log('   Restaurant Owner: john@restaurant.com / owner123');
    console.log('   Staff: sarah@restaurant.com / staff123');
    console.log('   Customer: customer1@example.com / customer123');
    
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run seeding
if (require.main === module) {
  connectDB().then(seedData);
}

module.exports = { seedData, connectDB }; 