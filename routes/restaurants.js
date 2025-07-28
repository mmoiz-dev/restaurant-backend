const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect, isSuperAdmin, isRestaurantOwner, canAccessRestaurant } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all restaurants (Super Admin)
// @route   GET /api/restaurants
// @access  Private (Super Admin)
router.get('/', protect, isSuperAdmin, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const restaurants = await Restaurant.find()
    .populate('owner', 'name email phone')
    .populate('staff', 'name email staffRole')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await Restaurant.countDocuments();

  res.json({
    success: true,
    count: restaurants.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: restaurants
  });
}));

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Private
router.get('/:id', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('staff', 'name email staffRole')
    .populate('categories', 'name description')
    .populate('tables', 'tableNumber capacity status');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant
  });
}));

// @desc    Create restaurant (Super Admin)
// @route   POST /api/restaurants
// @access  Private (Super Admin)
router.post('/', protect, isSuperAdmin, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name must be between 2 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('contactInfo.phone').notEmpty().withMessage('Phone number is required'),
  body('contactInfo.email').isEmail().withMessage('Please provide a valid email'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('address.country').notEmpty().withMessage('Country is required'),
  body('ownerId').isMongoId().withMessage('Please provide a valid owner ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    name,
    description,
    contactInfo,
    address,
    operatingHours,
    cuisine,
    priceRange,
    features,
    settings,
    ownerId
  } = req.body;

  // Check if owner exists and is a restaurant owner
  const owner = await User.findById(ownerId);
  if (!owner || owner.role !== 'restaurant_owner') {
    return res.status(400).json({
      success: false,
      message: 'Invalid owner ID or user is not a restaurant owner'
    });
  }

  // Check if owner already has a restaurant
  const existingRestaurant = await Restaurant.findOne({ owner: ownerId });
  if (existingRestaurant) {
    return res.status(400).json({
      success: false,
      message: 'Owner already has a restaurant'
    });
  }

  const restaurant = await Restaurant.create({
    name,
    description,
    contactInfo,
    address,
    operatingHours,
    cuisine,
    priceRange,
    features,
    settings,
    owner: ownerId
  });

  res.status(201).json({
    success: true,
    data: restaurant
  });
}));

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Restaurant Owner)
router.put('/:id', protect, canAccessRestaurant, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name must be between 2 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('contactInfo.phone').optional().notEmpty().withMessage('Phone number is required'),
  body('contactInfo.email').optional().isEmail().withMessage('Please provide a valid email'),
  body('address.street').optional().notEmpty().withMessage('Street address is required'),
  body('address.city').optional().notEmpty().withMessage('City is required'),
  body('address.state').optional().notEmpty().withMessage('State is required'),
  body('address.zipCode').optional().notEmpty().withMessage('Zip code is required'),
  body('address.country').optional().notEmpty().withMessage('Country is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  let restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: restaurant
  });
}));

// @desc    Delete restaurant (Super Admin)
// @route   DELETE /api/restaurants/:id
// @access  Private (Super Admin)
router.delete('/:id', protect, isSuperAdmin, asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  await restaurant.remove();

  res.json({
    success: true,
    message: 'Restaurant deleted successfully'
  });
}));

// @desc    Get restaurant analytics
// @route   GET /api/restaurants/:id/analytics
// @access  Private (Restaurant Owner)
router.get('/:id/analytics', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = req.query;
  
  // Calculate date range based on period
  let start, end;
  const now = new Date();
  
  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = now;
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      end = now;
      break;
    default:
      start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = endDate ? new Date(endDate) : now;
  }

  // Get orders for the period
  const Order = require('../models/Order');
  const orders = await Order.find({
    restaurantId: req.params.id,
    createdAt: { $gte: start, $lte: end }
  });

  // Calculate analytics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Status distribution
  const statusDistribution = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Order type distribution
  const orderTypeDistribution = orders.reduce((acc, order) => {
    acc[order.orderType] = (acc[order.orderType] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      period: {
        start,
        end
      },
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      },
      statusDistribution,
      orderTypeDistribution
    }
  });
}));

// @desc    Get restaurant settings
// @route   GET /api/restaurants/:id/settings
// @access  Private (Restaurant Owner)
router.get('/:id/settings', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).select('settings');
  
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant.settings
  });
}));

// @desc    Update restaurant settings
// @route   PUT /api/restaurants/:id/settings
// @access  Private (Restaurant Owner)
router.put('/:id/settings', protect, canAccessRestaurant, [
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('autoAcceptOrders').optional().isBoolean().withMessage('autoAcceptOrders must be a boolean'),
  body('requireCustomerVerification').optional().isBoolean().withMessage('requireCustomerVerification must be a boolean'),
  body('allowTableReservations').optional().isBoolean().withMessage('allowTableReservations must be a boolean'),
  body('allowDelivery').optional().isBoolean().withMessage('allowDelivery must be a boolean'),
  body('allowTakeout').optional().isBoolean().withMessage('allowTakeout must be a boolean'),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('serviceCharge').optional().isFloat({ min: 0, max: 100 }).withMessage('Service charge must be between 0 and 100'),
  body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('deliveryRadius').optional().isFloat({ min: 0 }).withMessage('Delivery radius must be positive'),
  body('deliveryFee').optional().isFloat({ min: 0 }).withMessage('Delivery fee must be positive')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Update settings
  restaurant.settings = { ...restaurant.settings, ...req.body };
  await restaurant.save();

  res.json({
    success: true,
    data: restaurant.settings
  });
}));

module.exports = router; 