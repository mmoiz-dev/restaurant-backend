# 🌱 Database Seeding Guide

This guide will help you populate your restaurant management database with sample data for testing and development.

## 🚀 Quick Start

### Option 1: Basic Seeding (Recommended for Testing)

```bash
# Seed basic data with minimal sample data
npm run seed:basic
```

### Option 2: Full Seeding (Comprehensive Data)

```bash
# Seed comprehensive data with multiple restaurants
npm run seed
```

## 📊 What Gets Seeded

### Basic Seeding (`seed:basic`)
- **3 Users**: Super Admin, Restaurant Owner, Staff Member
- **1 Restaurant**: Sample Restaurant with full configuration
- **4 Categories**: Appetizers, Main Course, Desserts, Beverages
- **2 Dishes**: Sample Burger, Sample Salad
- **3 Tables**: T1, T2, T3 with QR codes

### Full Seeding (`seed`)
- **5 Users**: Super Admin, Restaurant Owner, 2 Staff Members, Customer
- **2 Restaurants**: Pizza Palace, Sushi Express
- **9 Categories**: Multiple categories per restaurant
- **6 Dishes**: Pizza, Pasta, Sushi dishes with customizations
- **7 Tables**: Multiple tables per restaurant

## 🔑 Default Login Credentials

### Basic Seeding
```
Super Admin:     admin@restaurant.com / admin123
Restaurant Owner: owner@restaurant.com / owner123
Staff Member:    staff@restaurant.com / staff123
```

### Full Seeding
```
Super Admin:     admin@restaurant.com / admin123
Restaurant Owner: john@restaurant.com / owner123
Cashier:         sarah@restaurant.com / staff123
Kitchen Staff:   mike@restaurant.com / staff123
Customer:        customer1@example.com / customer123
```

## 🏪 Sample Restaurants

### Basic Seeding - Sample Restaurant
- **Cuisine**: American
- **Price Range**: $$
- **Features**: Delivery, Takeout, Dine-in
- **Location**: Sample City, SC
- **Operating Hours**: 9 AM - 11 PM daily

### Full Seeding - Pizza Palace
- **Cuisine**: Italian, Pizza
- **Price Range**: $$
- **Features**: Delivery, Takeout, Dine-in, Outdoor Seating
- **Location**: New York, NY
- **Specialties**: Margherita Pizza, Pepperoni Pizza, Spaghetti Carbonara

### Full Seeding - Sushi Express
- **Cuisine**: Japanese, Sushi
- **Price Range**: $$$
- **Features**: Delivery, Takeout, Dine-in, Reservations
- **Location**: Los Angeles, CA
- **Specialties**: California Roll, Salmon Nigiri, Spicy Tuna Roll

## 🍽️ Sample Dishes

### Basic Seeding
1. **Sample Burger** ($12.99)
   - Main Course category
   - Customizable size options
   - Beef patty with fresh ingredients

2. **Sample Salad** ($8.99)
   - Appetizers category
   - Vegetarian and gluten-free
   - Fresh garden ingredients

### Full Seeding - Pizza Palace
1. **Margherita Pizza** ($18.99)
   - On sale with 15% discount
   - Vegetarian
   - Customizable size and toppings

2. **Pepperoni Pizza** ($21.99)
   - Spicy (level 3)
   - Meat-based
   - Popular choice

3. **Spaghetti Carbonara** ($16.99)
   - Creamy pasta dish
   - Contains eggs and dairy

### Full Seeding - Sushi Express
1. **California Roll** ($12.99)
   - Beginner-friendly sushi
   - Contains crab, avocado, cucumber

2. **Salmon Nigiri** ($8.99)
   - Simple and fresh
   - Perfect for sushi beginners

3. **Spicy Tuna Roll** ($14.99)
   - Spicy (level 4)
   - Popular choice

## 🪑 Sample Tables

### Basic Seeding
- **T1**: 4-person table, Main Dining area
- **T2**: 4-person table, Main Dining area
- **T3**: 6-person table, Main Dining area

### Full Seeding
- **T1-T3**: 4-6 person tables, Main Dining
- **T4**: 2-person table, Bar Area
- **T5-T6**: 4-person tables, Outdoor Patio
- **T7**: 8-person table, Private Room

## 🔧 Customizing Seed Data

### Adding Custom Users

Edit `scripts/seed-basic.js` or `scripts/seed.js`:

```javascript
const customUsers = [
  {
    name: 'Your Name',
    email: 'your@email.com',
    phone: '+1234567890',
    password: 'yourpassword',
    role: 'restaurant_owner',
    isEmailVerified: true,
    isActive: true
  }
];
```

### Adding Custom Dishes

```javascript
const customDishes = [
  {
    name: 'Your Special Dish',
    description: 'A delicious custom dish',
    price: 15.99,
    preparationTime: 12,
    isVegetarian: false,
    isGlutenFree: false,
    isSpicy: false,
    spiceLevel: 0,
    stockQuantity: 25,
    lowStockThreshold: 5,
    ingredients: [
      { name: 'Ingredient 1', quantity: '100', unit: 'g' },
      { name: 'Ingredient 2', quantity: '50', unit: 'ml' }
    ],
    allergens: [],
    tags: ['custom', 'special']
  }
];
```

### Adding Custom Restaurants

```javascript
const customRestaurants = [
  {
    name: 'Your Restaurant',
    description: 'Your restaurant description',
    contactInfo: {
      phone: '+1234567890',
      email: 'info@yourrestaurant.com',
      website: 'https://yourrestaurant.com'
    },
    address: {
      street: 'Your Street',
      city: 'Your City',
      state: 'YC',
      zipCode: '12345',
      country: 'USA'
    },
    // ... other restaurant properties
  }
];
```

## 🗑️ Clearing Data

### Clear All Data
```bash
# The seed scripts automatically clear existing data
npm run seed:basic
# or
npm run seed
```

### Manual Clear (if needed)
```javascript
// In MongoDB shell or script
db.users.deleteMany({});
db.restaurants.deleteMany({});
db.categories.deleteMany({});
db.dishes.deleteMany({});
db.tables.deleteMany({});
```

## 🧪 Testing Seeded Data

### 1. Test Login
```bash
# Test super admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "admin123"
  }'
```

### 2. Test Restaurant Data
```bash
# Get all restaurants (requires admin token)
curl -X GET http://localhost:5000/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Dishes
```bash
# Get dishes for a restaurant
curl -X GET "http://localhost:5000/api/dishes?restaurantId=RESTAURANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Tables
```bash
# Get tables for a restaurant
curl -X GET "http://localhost:5000/api/tables?restaurantId=RESTAURANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Reseeding

### When to Reseed
- After database schema changes
- When testing new features
- To reset to a clean state
- After clearing data manually

### Reseeding Process
```bash
# 1. Stop the server
# 2. Run seed script
npm run seed:basic
# 3. Restart the server
npm run dev
```

## 🚨 Important Notes

### Data Relationships
- Users are automatically assigned to restaurants
- Dishes are assigned to categories and restaurants
- Tables are assigned to restaurants
- QR codes are automatically generated for tables

### Password Security
- All passwords are hashed using bcrypt
- Default passwords are for development only
- Change passwords in production

### Email Verification
- All seeded users have email verification set to true
- This allows immediate login without email verification

### Stock Management
- All dishes have stock quantities set
- Low stock thresholds are configured
- Stock status is automatically calculated

## 🎯 Next Steps After Seeding

1. **Start the server**: `npm run dev`
2. **Test login**: Use the provided credentials
3. **Explore the API**: Test different endpoints
4. **Create orders**: Test the ordering system
5. **Generate reports**: Test analytics features
6. **Test QR codes**: Scan table QR codes

## 📞 Troubleshooting

### Common Issues

**Seeding fails with MongoDB connection error**
- Check your `.env` file
- Ensure MongoDB is running
- Verify connection string

**Users not created**
- Check if email addresses are unique
- Verify password hashing is working
- Check for validation errors

**Dishes not assigned to categories**
- Ensure categories are created first
- Check category IDs are correct
- Verify restaurant assignments

**Tables not generating QR codes**
- Check QR code generation dependencies
- Verify table data is valid
- Check for QR code generation errors

### Getting Help

1. Check the console output for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running and accessible
4. Check the database directly for data integrity

Happy seeding! 🌱 