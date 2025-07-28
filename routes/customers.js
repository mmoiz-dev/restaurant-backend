const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, isRestaurantOwner, canAccessRestaurant } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all customers for a restaurant
// @route   GET /api/customers
// @access  Private (Restaurant Owner/Staff)
router.get('/', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const { restaurantId, search, isActive } = req.query;
  
  const query = { role: 'customer' };
  
  if (restaurantId) {
    // Get customers who have placed orders at this restaurant
    const orderCustomerIds = await Order.distinct('customerId', { restaurantId });
    query._id = { $in: orderCustomerIds };
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const customers = await User.find(query)
    .select('-password')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    count: customers.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: customers
  });
}));

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (Restaurant Owner/Staff)
router.get('/:id', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id)
    .select('-password');

  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  res.json({
    success: true,
    data: customer
  });
}));

// @desc    Get customer order history
// @route   GET /api/customers/:id/orders
// @access  Private (Restaurant Owner/Staff)
router.get('/:id/orders', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const { restaurantId, status, startDate, endDate } = req.query;
  
  const query = { customerId: req.params.id };
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const orders = await Order.find(query)
    .populate('restaurantId', 'name')
    .populate('tableId', 'tableNumber')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: orders
  });
}));

// @desc    Get customer analytics
// @route   GET /api/customers/:id/analytics
// @access  Private (Restaurant Owner/Staff)
router.get('/:id/analytics', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const { restaurantId, startDate, endDate } = req.query;
  
  const query = { customerId: req.params.id };
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const orders = await Order.find(query);

  // Calculate analytics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  
  // Order status distribution
  const statusDistribution = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Order type distribution
  const orderTypeDistribution = orders.reduce((acc, order) => {
    acc[order.orderType] = (acc[order.orderType] || 0) + 1;
    return acc;
  }, {});

  // Payment method distribution
  const paymentMethodDistribution = orders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
    return acc;
  }, {});

  // Most ordered dishes
  const dishStats = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (acc[item.dishId]) {
        acc[item.dishId].quantity += item.quantity;
        acc[item.dishId].revenue += item.totalPrice;
      } else {
        acc[item.dishId] = {
          name: item.name,
          quantity: item.quantity,
          revenue: item.totalPrice
        };
      }
    });
    return acc;
  }, {});

  const popularDishes = Object.entries(dishStats)
    .map(([dishId, stats]) => ({
      dishId,
      ...stats
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      summary: {
        totalOrders,
        totalSpent,
        averageOrderValue
      },
      statusDistribution,
      orderTypeDistribution,
      paymentMethodDistribution,
      popularDishes
    }
  });
}));

// @desc    Update customer profile
// @route   PUT /api/customers/:id
// @access  Private (Restaurant Owner/Staff)
router.put('/:id', protect, isRestaurantOwner, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const customer = await User.findById(req.params.id);
  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  const updatedCustomer = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.json({
    success: true,
    data: updatedCustomer
  });
}));

// @desc    Deactivate customer
// @route   PUT /api/customers/:id/deactivate
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/deactivate', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  customer.isActive = false;
  await customer.save();

  res.json({
    success: true,
    message: 'Customer deactivated successfully'
  });
}));

// @desc    Reactivate customer
// @route   PUT /api/customers/:id/reactivate
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/reactivate', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  customer.isActive = true;
  await customer.save();

  res.json({
    success: true,
    message: 'Customer reactivated successfully'
  });
}));

// @desc    Get customer statistics
// @route   GET /api/customers/stats/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/stats/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let start, end;
  const now = new Date();
  
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    end = now;
  }

  // Get unique customers who placed orders
  const uniqueCustomers = await Order.distinct('customerId', {
    restaurantId: req.params.restaurantId,
    createdAt: { $gte: start, $lte: end }
  });

  // Get customer order statistics
  const customerStats = await Order.aggregate([
    {
      $match: {
        restaurantId: req.params.restaurantId,
        createdAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $group: {
        _id: '$customerId',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  const totalCustomers = uniqueCustomers.length;
  const totalRevenue = customerStats.reduce((sum, stat) => sum + stat.totalSpent, 0);
  const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Customer segments based on spending
  const segments = {
    highValue: customerStats.filter(stat => stat.totalSpent >= 100).length,
    mediumValue: customerStats.filter(stat => stat.totalSpent >= 50 && stat.totalSpent < 100).length,
    lowValue: customerStats.filter(stat => stat.totalSpent < 50).length
  };

  res.json({
    success: true,
    data: {
      period: {
        start,
        end
      },
      summary: {
        totalCustomers,
        totalRevenue,
        averageCustomerValue
      },
      segments,
      customerStats: customerStats.slice(0, 10) // Top 10 customers
    }
  });
}));

module.exports = router; 