const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const { protect, canAccessRestaurant } = require('../middleware/auth');
const generatePDF = require('../utils/generatePDF');

const router = express.Router();

// @desc    Get sales report
// @route   GET /api/reports/sales/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/sales/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
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
  const orders = await Order.find({
    restaurantId: req.params.restaurantId,
    createdAt: { $gte: start, $lte: end },
    status: { $nin: ['cancelled', 'rejected'] }
  });

  // Calculate sales metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Sales by status
  const salesByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + order.totalAmount;
    return acc;
  }, {});

  // Sales by order type
  const salesByOrderType = orders.reduce((acc, order) => {
    acc[order.orderType] = (acc[order.orderType] || 0) + order.totalAmount;
    return acc;
  }, {});

  // Sales by payment method
  const salesByPaymentMethod = orders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.totalAmount;
    return acc;
  }, {});

  // Daily sales breakdown
  const dailySales = orders.reduce((acc, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + order.totalAmount;
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
      salesByStatus,
      salesByOrderType,
      salesByPaymentMethod,
      dailySales
    }
  });
}));

// @desc    Get popular dishes report
// @route   GET /api/reports/popular-dishes/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/popular-dishes/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  
  let start, end;
  const now = new Date();
  
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    end = now;
  }

  // Aggregate orders to get dish statistics
  const dishStats = await Order.aggregate([
    {
      $match: {
        restaurantId: req.params.restaurantId,
        createdAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $unwind: '$items'
    },
    {
      $group: {
        _id: '$items.dishId',
        dishName: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    {
      $limit: parseInt(limit)
    }
  ]);

  // Get dish details
  const dishIds = dishStats.map(stat => stat._id);
  const dishes = await Dish.find({ _id: { $in: dishIds } }).select('name price categoryId');

  // Combine stats with dish details
  const popularDishes = dishStats.map(stat => {
    const dish = dishes.find(d => d._id.toString() === stat._id.toString());
    return {
      ...stat,
      currentPrice: dish ? dish.price : 0,
      categoryId: dish ? dish.categoryId : null
    };
  });

  res.json({
    success: true,
    data: {
      period: {
        start,
        end
      },
      popularDishes
    }
  });
}));

// @desc    Get inventory report
// @route   GET /api/reports/inventory/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/inventory/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const dishes = await Dish.find({ restaurantId: req.params.restaurantId })
    .populate('categoryId', 'name')
    .select('name categoryId stockQuantity lowStockThreshold isLowStock isOutOfStock price');

  const lowStockDishes = dishes.filter(dish => dish.isLowStock);
  const outOfStockDishes = dishes.filter(dish => dish.isOutOfStock);
  const availableDishes = dishes.filter(dish => !dish.isOutOfStock);

  const totalValue = dishes.reduce((sum, dish) => sum + (dish.stockQuantity * dish.price), 0);
  const lowStockValue = lowStockDishes.reduce((sum, dish) => sum + (dish.stockQuantity * dish.price), 0);

  res.json({
    success: true,
    data: {
      summary: {
        totalDishes: dishes.length,
        lowStockDishes: lowStockDishes.length,
        outOfStockDishes: outOfStockDishes.length,
        availableDishes: availableDishes.length,
        totalValue,
        lowStockValue
      },
      lowStockDishes,
      outOfStockDishes,
      allDishes: dishes
    }
  });
}));

// @desc    Get customer analytics
// @route   GET /api/reports/customers/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/customers/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
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

  // Customer order statistics
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
        averageOrderValue: { $avg: '$totalAmount' },
        firstOrder: { $min: '$createdAt' },
        lastOrder: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalSpent: -1 }
    }
  ]);

  // Get customer details
  const User = require('../models/User');
  const customerIds = customerStats.map(stat => stat._id);
  const customers = await User.find({ _id: { $in: customerIds } }).select('name email phone');

  // Combine stats with customer details
  const customerAnalytics = customerStats.map(stat => {
    const customer = customers.find(c => c._id.toString() === stat._id.toString());
    return {
      ...stat,
      customerName: customer ? customer.name : 'Unknown',
      customerEmail: customer ? customer.email : '',
      customerPhone: customer ? customer.phone : ''
    };
  });

  res.json({
    success: true,
    data: {
      period: {
        start,
        end
      },
      totalCustomers: customerAnalytics.length,
      customerAnalytics
    }
  });
}));

// @desc    Export report as PDF
// @route   POST /api/reports/export/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.post('/export/:restaurantId', protect, canAccessRestaurant, [
  body('reportType').isIn(['sales', 'inventory', 'customers', 'popular-dishes']).withMessage('Invalid report type'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('format').optional().isIn(['pdf', 'csv']).withMessage('Format must be pdf or csv')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { reportType, startDate, endDate, format = 'pdf' } = req.body;

  // Get restaurant details
  const Restaurant = require('../models/Restaurant');
  const restaurant = await Restaurant.findById(req.params.restaurantId).select('name');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  let reportData;
  
  // Generate report data based on type
  switch (reportType) {
    case 'sales':
      const salesReport = await generateSalesReport(req.params.restaurantId, startDate, endDate);
      reportData = salesReport;
      break;
    case 'inventory':
      const inventoryReport = await generateInventoryReport(req.params.restaurantId);
      reportData = inventoryReport;
      break;
    case 'customers':
      const customersReport = await generateCustomersReport(req.params.restaurantId, startDate, endDate);
      reportData = customersReport;
      break;
    case 'popular-dishes':
      const dishesReport = await generatePopularDishesReport(req.params.restaurantId, startDate, endDate);
      reportData = dishesReport;
      break;
  }

  if (format === 'pdf') {
    const pdfBuffer = await generatePDF(reportData, restaurant.name, reportType);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } else {
    // CSV format
    const csvData = convertToCSV(reportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${Date.now()}.csv`);
    res.send(csvData);
  }
}));

// Helper functions for report generation
async function generateSalesReport(restaurantId, startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const orders = await Order.find({
    restaurantId,
    createdAt: { $gte: start, $lte: end },
    status: { $nin: ['cancelled', 'rejected'] }
  });

  return {
    type: 'sales',
    period: { start, end },
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    orders
  };
}

async function generateInventoryReport(restaurantId) {
  const dishes = await Dish.find({ restaurantId })
    .populate('categoryId', 'name')
    .select('name categoryId stockQuantity lowStockThreshold isLowStock isOutOfStock price');

  return {
    type: 'inventory',
    totalDishes: dishes.length,
    lowStockDishes: dishes.filter(dish => dish.isLowStock).length,
    outOfStockDishes: dishes.filter(dish => dish.isOutOfStock).length,
    dishes
  };
}

async function generateCustomersReport(restaurantId, startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const customerStats = await Order.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $group: {
        _id: '$customerId',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' }
      }
    }
  ]);

  return {
    type: 'customers',
    period: { start, end },
    totalCustomers: customerStats.length,
    customerStats
  };
}

async function generatePopularDishesReport(restaurantId, startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const dishStats = await Order.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled', 'rejected'] }
      }
    },
    {
      $unwind: '$items'
    },
    {
      $group: {
        _id: '$items.dishId',
        dishName: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    }
  ]);

  return {
    type: 'popular-dishes',
    period: { start, end },
    dishStats
  };
}

function convertToCSV(data) {
  // Simple CSV conversion - in a real app, you'd use a proper CSV library
  const headers = Object.keys(data);
  const rows = [headers.join(',')];
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      rows.push(Object.values(item).join(','));
    });
  }
  
  return rows.join('\n');
}

module.exports = router; 