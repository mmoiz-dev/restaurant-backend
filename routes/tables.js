const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Table = require('../models/Table');
const { protect, canAccessRestaurant } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all tables for a restaurant
// @route   GET /api/tables
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { restaurantId, status, area } = req.query;
  
  const query = {};
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (area) {
    query['location.area'] = area;
  }

  const tables = await Table.find(query)
    .populate('currentOrder', 'orderNumber status totalAmount')
    .sort('tableNumber');

  res.json({
    success: true,
    count: tables.length,
    data: tables
  });
}));

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id)
    .populate('currentOrder', 'orderNumber status totalAmount items');

  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Table not found'
    });
  }

  res.json({
    success: true,
    data: table
  });
}));

// @desc    Create table
// @route   POST /api/tables
// @access  Private (Restaurant Owner/Staff)
router.post('/', protect, [
  body('tableNumber').notEmpty().withMessage('Table number is required'),
  body('restaurantId').isMongoId().withMessage('Please provide a valid restaurant ID'),
  body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
  body('location.area').optional().isIn(['indoor', 'outdoor', 'private', 'bar', 'patio']).withMessage('Invalid area'),
  body('location.section').optional().isString().withMessage('Section must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { tableNumber, restaurantId, capacity, location, notes } = req.body;

  // Check if table number already exists for this restaurant
  const existingTable = await Table.findOne({ tableNumber, restaurantId });
  if (existingTable) {
    return res.status(400).json({
      success: false,
      message: 'Table number already exists for this restaurant'
    });
  }

  const table = await Table.create({
    tableNumber,
    restaurantId,
    capacity,
    location,
    notes
  });

  res.status(201).json({
    success: true,
    data: table
  });
}));

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (Restaurant Owner/Staff)
router.put('/:id', protect, [
  body('tableNumber').optional().notEmpty().withMessage('Table number is required'),
  body('capacity').optional().isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
  body('location.area').optional().isIn(['indoor', 'outdoor', 'private', 'bar', 'patio']).withMessage('Invalid area'),
  body('location.section').optional().isString().withMessage('Section must be a string'),
  body('status').optional().isIn(['available', 'occupied', 'reserved', 'maintenance', 'out_of_service']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  let table = await Table.findById(req.params.id);
  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Table not found'
    });
  }

  table = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: table
  });
}));

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Restaurant Owner/Staff)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Table not found'
    });
  }

  // Check if table is occupied
  if (table.status === 'occupied') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete occupied table'
    });
  }

  await table.remove();

  res.json({
    success: true,
    message: 'Table deleted successfully'
  });
}));

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/status', protect, [
  body('status').isIn(['available', 'occupied', 'reserved', 'maintenance', 'out_of_service']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status } = req.body;

  const table = await Table.findById(req.params.id);
  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Table not found'
    });
  }

  table.status = status;
  await table.save();

  res.json({
    success: true,
    data: table
  });
}));

// @desc    Get table QR code
// @route   GET /api/tables/:id/qr
// @access  Private
router.get('/:id/qr', protect, asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Table not found'
    });
  }

  res.json({
    success: true,
    data: {
      qrCode: table.qrCode,
      qrCodeUrl: table.qrCodeUrl,
      tableNumber: table.tableNumber
    }
  });
}));

// @desc    Mark table as cleaned
// @route   PUT /api/tables/:id/clean
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/clean', protect, asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Table not found'
    });
  }

  table.lastCleaned = new Date();
  await table.save();

  res.json({
    success: true,
    data: table
  });
}));

module.exports = router; 