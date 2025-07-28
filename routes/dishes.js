const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Dish = require('../models/Dish');
const Category = require('../models/Category');
const { protect, canAccessRestaurant } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all dishes for a restaurant
// @route   GET /api/dishes
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { restaurantId, categoryId, isAvailable, isOnSale, search } = req.query;
  
  // Build query
  const query = {};
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  if (categoryId) {
    query.categoryId = categoryId;
  }
  
  if (isAvailable !== undefined) {
    query.isAvailable = isAvailable === 'true';
  }
  
  if (isOnSale !== undefined) {
    query.isOnSale = isOnSale === 'true';
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const dishes = await Dish.find(query)
    .populate('categoryId', 'name')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await Dish.countDocuments(query);

  res.json({
    success: true,
    count: dishes.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: dishes
  });
}));

// @desc    Get single dish
// @route   GET /api/dishes/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id).populate('categoryId', 'name');

  if (!dish) {
    return res.status(404).json({
      success: false,
      message: 'Dish not found'
    });
  }

  res.json({
    success: true,
    data: dish
  });
}));

// @desc    Create dish
// @route   POST /api/dishes
// @access  Private (Restaurant Owner/Staff)
router.post('/', protect, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Dish name must be between 2 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('restaurantId').isMongoId().withMessage('Please provide a valid restaurant ID'),
  body('categoryId').isMongoId().withMessage('Please provide a valid category ID'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Original price must be positive'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Preparation time must be positive'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be positive'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be positive')
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
    restaurantId,
    categoryId,
    price,
    originalPrice,
    images,
    ingredients,
    allergens,
    nutritionalInfo,
    preparationTime,
    isVegetarian,
    isVegan,
    isGlutenFree,
    isSpicy,
    spiceLevel,
    stockQuantity,
    lowStockThreshold,
    customizations,
    tags
  } = req.body;

  // Check if category exists and belongs to the restaurant
  const category = await Category.findOne({ _id: categoryId, restaurantId });
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Category not found or does not belong to this restaurant'
    });
  }

  const dish = await Dish.create({
    name,
    description,
    restaurantId,
    categoryId,
    price,
    originalPrice,
    images,
    ingredients,
    allergens,
    nutritionalInfo,
    preparationTime,
    isVegetarian,
    isVegan,
    isGlutenFree,
    isSpicy,
    spiceLevel,
    stockQuantity,
    lowStockThreshold,
    customizations,
    tags
  });

  await dish.checkStockStatus();
  await dish.save();

  res.status(201).json({
    success: true,
    data: dish
  });
}));

// @desc    Update dish
// @route   PUT /api/dishes/:id
// @access  Private (Restaurant Owner/Staff)
router.put('/:id', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Dish name must be between 2 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Original price must be positive'),
  body('salePercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Sale percentage must be between 0 and 100'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Preparation time must be positive'),
  body('spiceLevel').optional().isInt({ min: 0, max: 5 }).withMessage('Spice level must be between 0 and 5'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be positive'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be positive')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  let dish = await Dish.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({
      success: false,
      message: 'Dish not found'
    });
  }

  dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  await dish.checkStockStatus();
  await dish.save();

  res.json({
    success: true,
    data: dish
  });
}));

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
// @access  Private (Restaurant Owner/Staff)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({
      success: false,
      message: 'Dish not found'
    });
  }

  await dish.remove();

  res.json({
    success: true,
    message: 'Dish deleted successfully'
  });
}));

// @desc    Update dish stock
// @route   PUT /api/dishes/:id/stock
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/stock', protect, [
  body('quantity').isInt().withMessage('Quantity must be an integer'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { quantity, operation } = req.body;

  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({
      success: false,
      message: 'Dish not found'
    });
  }

  switch (operation) {
    case 'add':
      dish.updateStock(quantity);
      break;
    case 'subtract':
      dish.updateStock(-quantity);
      break;
    case 'set':
      dish.stockQuantity = quantity;
      dish.checkStockStatus();
      break;
  }

  await dish.save();

  res.json({
    success: true,
    data: dish
  });
}));

// @desc    Toggle dish availability
// @route   PUT /api/dishes/:id/availability
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/availability', protect, [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { isAvailable } = req.body;

  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({
      success: false,
      message: 'Dish not found'
    });
  }

  dish.isAvailable = isAvailable;
  await dish.save();

  res.json({
    success: true,
    data: dish
  });
}));

// @desc    Toggle dish sale status
// @route   PUT /api/dishes/:id/sale
// @access  Private (Restaurant Owner/Staff)
router.put('/:id/sale', protect, [
  body('isOnSale').isBoolean().withMessage('isOnSale must be a boolean'),
  body('salePercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Sale percentage must be between 0 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { isOnSale, salePercentage } = req.body;

  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({
      success: false,
      message: 'Dish not found'
    });
  }

  dish.isOnSale = isOnSale;
  if (salePercentage !== undefined) {
    dish.salePercentage = salePercentage;
  }

  await dish.save();

  res.json({
    success: true,
    data: dish
  });
}));

// @desc    Get low stock dishes
// @route   GET /api/dishes/low-stock/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/low-stock/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const dishes = await Dish.find({
    restaurantId: req.params.restaurantId,
    isLowStock: true
  }).populate('categoryId', 'name');

  res.json({
    success: true,
    count: dishes.length,
    data: dishes
  });
}));

// @desc    Get out of stock dishes
// @route   GET /api/dishes/out-of-stock/:restaurantId
// @access  Private (Restaurant Owner/Staff)
router.get('/out-of-stock/:restaurantId', protect, canAccessRestaurant, asyncHandler(async (req, res) => {
  const dishes = await Dish.find({
    restaurantId: req.params.restaurantId,
    isOutOfStock: true
  }).populate('categoryId', 'name');

  res.json({
    success: true,
    count: dishes.length,
    data: dishes
  });
}));

module.exports = router; 