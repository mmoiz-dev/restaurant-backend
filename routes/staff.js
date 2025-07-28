const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, isRestaurantOwner, canAccessRestaurant } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all staff for a restaurant
// @route   GET /api/staff
// @access  Private (Restaurant Owner)
router.get('/', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const { restaurantId, staffRole, isActive } = req.query;
  
  const query = { role: 'staff' };
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  if (staffRole) {
    query.staffRole = staffRole;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const staff = await User.find(query)
    .select('-password')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    count: staff.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: staff
  });
}));

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private (Restaurant Owner)
router.get('/:id', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const staff = await User.findById(req.params.id)
    .select('-password')
    .populate('restaurantId', 'name');

  if (!staff || staff.role !== 'staff') {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  res.json({
    success: true,
    data: staff
  });
}));

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Restaurant Owner)
router.put('/:id', protect, isRestaurantOwner, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('staffRole').optional().isIn(['cashier', 'kitchen_staff', 'delivery_rider', 'waiter']).withMessage('Invalid staff role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const staff = await User.findById(req.params.id);
  if (!staff || staff.role !== 'staff') {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  // Check if staff belongs to the same restaurant as the owner
  if (staff.restaurantId.toString() !== req.user.restaurantId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this staff member'
    });
  }

  const updatedStaff = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.json({
    success: true,
    data: updatedStaff
  });
}));

// @desc    Deactivate staff member
// @route   PUT /api/staff/:id/deactivate
// @access  Private (Restaurant Owner)
router.put('/:id/deactivate', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const staff = await User.findById(req.params.id);
  if (!staff || staff.role !== 'staff') {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  // Check if staff belongs to the same restaurant as the owner
  if (staff.restaurantId.toString() !== req.user.restaurantId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to deactivate this staff member'
    });
  }

  staff.isActive = false;
  await staff.save();

  res.json({
    success: true,
    message: 'Staff member deactivated successfully'
  });
}));

// @desc    Reactivate staff member
// @route   PUT /api/staff/:id/reactivate
// @access  Private (Restaurant Owner)
router.put('/:id/reactivate', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const staff = await User.findById(req.params.id);
  if (!staff || staff.role !== 'staff') {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  // Check if staff belongs to the same restaurant as the owner
  if (staff.restaurantId.toString() !== req.user.restaurantId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reactivate this staff member'
    });
  }

  staff.isActive = true;
  await staff.save();

  res.json({
    success: true,
    message: 'Staff member reactivated successfully'
  });
}));

// @desc    Update staff permissions
// @route   PUT /api/staff/:id/permissions
// @access  Private (Restaurant Owner)
router.put('/:id/permissions', protect, isRestaurantOwner, [
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*').isIn([
    'manage_dishes',
    'manage_orders',
    'manage_staff',
    'view_reports',
    'manage_tables',
    'manage_customers',
    'manage_inventory'
  ]).withMessage('Invalid permission')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { permissions } = req.body;

  const staff = await User.findById(req.params.id);
  if (!staff || staff.role !== 'staff') {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  // Check if staff belongs to the same restaurant as the owner
  if (staff.restaurantId.toString() !== req.user.restaurantId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this staff member'
    });
  }

  staff.permissions = permissions;
  await staff.save();

  res.json({
    success: true,
    data: staff
  });
}));

// @desc    Get staff by role
// @route   GET /api/staff/role/:role
// @access  Private (Restaurant Owner)
router.get('/role/:role', protect, isRestaurantOwner, asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { restaurantId } = req.query;

  const query = { 
    role: 'staff',
    staffRole: role,
    isActive: true
  };

  if (restaurantId) {
    query.restaurantId = restaurantId;
  }

  const staff = await User.find(query)
    .select('-password')
    .populate('restaurantId', 'name');

  res.json({
    success: true,
    count: staff.length,
    data: staff
  });
}));

// @desc    Get staff statistics
// @route   GET /api/staff/stats/:restaurantId
// @access  Private (Restaurant Owner)
router.get('/stats/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $match: {
        role: 'staff',
        restaurantId: req.params.restaurantId
      }
    },
    {
      $group: {
        _id: '$staffRole',
        count: { $sum: 1 },
        activeCount: {
          $sum: {
            $cond: ['$isActive', 1, 0]
          }
        }
      }
    }
  ]);

  const totalStaff = await User.countDocuments({
    role: 'staff',
    restaurantId: req.params.restaurantId
  });

  const activeStaff = await User.countDocuments({
    role: 'staff',
    restaurantId: req.params.restaurantId,
    isActive: true
  });

  res.json({
    success: true,
    data: {
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
      byRole: stats
    }
  });
}));

module.exports = router; 