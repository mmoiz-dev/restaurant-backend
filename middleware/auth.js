const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
});

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is super admin
const isSuperAdmin = authorize('super_admin');

// Check if user is restaurant owner
const isRestaurantOwner = authorize('restaurant_owner');

// Check if user is staff
const isStaff = authorize('staff');

// Check if user is customer
const isCustomer = authorize('customer');

// Check if user can access restaurant data (owner or staff of that restaurant)
const canAccessRestaurant = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const restaurantId = req.params.restaurantId || req.body.restaurantId;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant ID is required'
    });
  }

  // Super admin can access all restaurants
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Restaurant owner can only access their own restaurant
  if (req.user.role === 'restaurant_owner' && req.user.restaurantId?.toString() === restaurantId) {
    return next();
  }

  // Staff can only access their assigned restaurant
  if (req.user.role === 'staff' && req.user.restaurantId?.toString() === restaurantId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Not authorized to access this restaurant'
  });
});

module.exports = {
  protect,
  authorize,
  isSuperAdmin,
  isRestaurantOwner,
  isStaff,
  isCustomer,
  canAccessRestaurant
}; 