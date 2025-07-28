# 🌱 Database Seeding - Quick Reference

## 🚀 Quick Commands

```bash
# Basic seeding (recommended for testing)
npm run seed:basic

# Full seeding (comprehensive data)
npm run seed

# Test seeded data
npm run test:seed
```

## 📊 What You Get

### Basic Seeding (`seed:basic`)
- ✅ 3 Users (Admin, Owner, Staff)
- ✅ 1 Restaurant (Sample Restaurant)
- ✅ 4 Categories (Appetizers, Main Course, Desserts, Beverages)
- ✅ 2 Dishes (Sample Burger, Sample Salad)
- ✅ 3 Tables (T1, T2, T3 with QR codes)

### Full Seeding (`seed`)
- ✅ 5 Users (Admin, Owner, 2 Staff, Customer)
- ✅ 2 Restaurants (Pizza Palace, Sushi Express)
- ✅ 9 Categories (Multiple per restaurant)
- ✅ 6 Dishes (Pizza, Pasta, Sushi with customizations)
- ✅ 7 Tables (Multiple per restaurant)

## 🔑 Login Credentials

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

### Basic - Sample Restaurant
- **Cuisine**: American
- **Location**: Sample City, SC
- **Features**: Delivery, Takeout, Dine-in
- **Hours**: 9 AM - 11 PM daily

### Full - Pizza Palace
- **Cuisine**: Italian, Pizza
- **Location**: New York, NY
- **Specialties**: Margherita Pizza, Pepperoni Pizza, Spaghetti Carbonara

### Full - Sushi Express
- **Cuisine**: Japanese, Sushi
- **Location**: Los Angeles, CA
- **Specialties**: California Roll, Salmon Nigiri, Spicy Tuna Roll

## 🍽️ Sample Dishes

### Basic Seeding
1. **Sample Burger** ($12.99) - Main Course
2. **Sample Salad** ($8.99) - Appetizers

### Full Seeding - Pizza Palace
1. **Margherita Pizza** ($18.99) - On sale 15% off
2. **Pepperoni Pizza** ($21.99) - Spicy level 3
3. **Spaghetti Carbonara** ($16.99) - Creamy pasta

### Full Seeding - Sushi Express
1. **California Roll** ($12.99) - Beginner-friendly
2. **Salmon Nigiri** ($8.99) - Simple and fresh
3. **Spicy Tuna Roll** ($14.99) - Spicy level 4

## 🪑 Sample Tables

### Basic Seeding
- **T1**: 4 seats, Main Dining
- **T2**: 4 seats, Main Dining
- **T3**: 6 seats, Main Dining

### Full Seeding
- **T1-T3**: 4-6 seats, Main Dining
- **T4**: 2 seats, Bar Area
- **T5-T6**: 4 seats, Outdoor Patio
- **T7**: 8 seats, Private Room

## 🧪 Testing Your Data

### 1. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "admin123"
  }'
```

### 2. Test Restaurants
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

### Clear and Reseed
```bash
# The seed scripts automatically clear existing data
npm run seed:basic
# or
npm run seed
```

### Test After Seeding
```bash
# Verify seeded data
npm run test:seed
```

## 🚨 Important Notes

### Data Relationships
- ✅ Users automatically assigned to restaurants
- ✅ Dishes assigned to categories and restaurants
- ✅ Tables assigned to restaurants
- ✅ QR codes automatically generated

### Security
- ✅ All passwords hashed with bcrypt
- ✅ Email verification set to true for immediate login
- ✅ Stock quantities and thresholds configured

### Stock Management
- ✅ All dishes have stock quantities
- ✅ Low stock thresholds set
- ✅ Stock status automatically calculated

## 🎯 Next Steps

1. **Start server**: `npm run dev`
2. **Test login**: Use provided credentials
3. **Explore API**: Test different endpoints
4. **Create orders**: Test ordering system
5. **Generate reports**: Test analytics
6. **Test QR codes**: Scan table QR codes

## 📞 Troubleshooting

### Common Issues
- **Connection failed**: Check `.env` and MongoDB
- **Users not created**: Check for duplicate emails
- **Dishes not assigned**: Verify categories exist
- **QR codes missing**: Check QR code dependencies

### Getting Help
1. Check console output for errors
2. Run `npm run test:seed` to verify data
3. Check database directly
4. Review `SEEDING_GUIDE.md` for details

## 📚 Documentation

- **`SEEDING_GUIDE.md`**: Detailed seeding guide
- **`scripts/seed.js`**: Full seeding script
- **`scripts/seed-basic.js`**: Basic seeding script
- **`scripts/test-seeded-data.js`**: Data verification script

Happy seeding! 🌱 