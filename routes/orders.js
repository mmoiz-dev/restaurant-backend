const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Table = require('../models/Table');
const { protect, canAccessRestaurant } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { restaurantId, status, orderType, startDate, endDate } = req.query;
  
  const query = {};
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (orderType) {
    query.orderType = orderType;
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
    .populate('customerId', 'name email phone')
    .populate('tableId', 'tableNumber')
    .populate('deliveryRider', 'name phone')
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name email phone address')
    .populate('tableId', 'tableNumber capacity')
    .populate('deliveryRider', 'name phone')
    .populate('items.dishId', 'name price images');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
}));

// @desc    Create order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, [
  body('restaurantId').isMongoId().withMessage('Please provide a valid restaurant ID'),
  body('orderType').isIn(['dine_in', 'takeout', 'delivery']).withMessage('Invalid order type'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.dishId').isMongoId().withMessage('Please provide valid dish IDs'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').isIn(['cash', 'card', 'online', 'wallet']).withMessage('Invalid payment method'),
  body('tableId').optional().isMongoId().withMessage('Please provide a valid table ID'),
  body('deliveryAddress').optional().isObject().withMessage('Delivery address must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    restaurantId,
    orderType,
    items,
    paymentMethod,
    tableId,
    deliveryAddress,
    deliveryInstructions,
    specialInstructions
  } = req.body;

  // Validate items and calculate totals
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const dish = await Dish.findById(item.dishId);
    if (!dish || dish.restaurantId.toString() !== restaurantId) {
      return res.status(400).json({
        success: false,
        message: `Dish ${item.dishId} not found or does not belong to this restaurant`
      });
    }

    if (!dish.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Dish ${dish.name} is not available`
      });
    }

    if (dish.isOutOfStock) {
      return res.status(400).json({
        success: false,
        message: `Dish ${dish.name} is out of stock`
      });
    }

    // Calculate item total
    let itemTotal = dish.price * item.quantity;
    
    // Add customization costs
    if (item.customizations) {
      for (const customization of item.customizations) {
        itemTotal += customization.price || 0;
      }
    }

    subtotal += itemTotal;

    validatedItems.push({
      dishId: dish._id,
      name: dish.name,
      price: dish.price,
      quantity: item.quantity,
      customizations: item.customizations || [],
      specialInstructions: item.specialInstructions,
      totalPrice: itemTotal
    });
  }

  // Get restaurant settings for additional charges
  const Restaurant = require('../models/Restaurant');
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const taxAmount = (subtotal * restaurant.settings.taxRate) / 100;
  const serviceCharge = (subtotal * restaurant.settings.serviceCharge) / 100;
  const deliveryFee = orderType === 'delivery' ? restaurant.settings.deliveryFee : 0;
  const totalAmount = subtotal + taxAmount + serviceCharge + deliveryFee;

  // Create order
  const order = await Order.create({
    restaurantId,
    customerId: req.user.id,
    orderType,
    items: validatedItems,
    subtotal,
    taxAmount,
    serviceCharge,
    deliveryFee,
    totalAmount,
    paymentMethod,
    tableId,
    deliveryAddress,
    deliveryInstructions,
    specialInstructions
  });

  // Update table status if dine-in
  if (orderType === 'dine_in' && tableId) {
    const table = await Table.findById(tableId);
    if (table) {
      table.occupy(order._id);
      await table.save();
    }
  }

  // Update dish stock
  for (const item of validatedItems) {
    const dish = await Dish.findById(item.dishId);
    dish.updateStock(-item.quantity);
    await dish.save();
  }

  res.status(201).json({
    success: true,
    data: order
  });
}));

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/status', protect, [
  body('status').isIn([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled',
    'rejected'
  ]).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, notes } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Update status
  order.updateStatus(status, req.user.id, notes);

  // Handle special status changes
  if (status === 'delivered' || status === 'completed') {
    order.actualDeliveryTime = new Date();
  }

  if (status === 'cancelled' || status === 'rejected') {
    order.cancelledBy = req.user.id;
    order.cancelledAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    data: order
  });
}));

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason').optional().isString().withMessage('Reason must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { reason } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order can be cancelled
  if (['delivered', 'completed', 'cancelled', 'rejected'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled in current status'
    });
  }

  // Update order
  order.updateStatus('cancelled', req.user.id, reason);
  order.cancellationReason = reason;
  order.cancelledBy = req.user.id;
  order.cancelledAt = new Date();

  await order.save();

  // Restore dish stock
  for (const item of order.items) {
    const dish = await Dish.findById(item.dishId);
    if (dish) {
      dish.updateStock(item.quantity);
      await dish.save();
    }
  }

  // Free table if dine-in
  if (order.orderType === 'dine_in' && order.tableId) {
    const table = await Table.findById(order.tableId);
    if (table) {
      table.free();
      await table.save();
    }
  }

  res.json({
    success: true,
    data: order
  });
}));

// @desc    Add order review
// @route   POST /api/orders/:id/review
// @access  Private
router.post('/:id/review', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().withMessage('Review must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { rating, review } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order belongs to user
  if (order.customerId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to review this order'
    });
  }

  // Check if order is completed
  if (order.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Can only review completed orders'
    });
  }

  // Update order
  order.rating = rating;
  order.review = review;
  order.reviewDate = new Date();

  await order.save();

  res.json({
    success: true,
    data: order
  });
}));

module.exports = router; 