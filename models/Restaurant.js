const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String
  },
  banner: {
    type: String
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Please add a phone number']
    },
    email: {
      type: String,
      required: [true, 'Please add an email']
    },
    website: String
  },
  address: {
    street: {
      type: String,
      required: [true, 'Please add a street address']
    },
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    state: {
      type: String,
      required: [true, 'Please add a state']
    },
    zipCode: {
      type: String,
      required: [true, 'Please add a zip code']
    },
    country: {
      type: String,
      required: [true, 'Please add a country']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  operatingHours: {
    monday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    tuesday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    wednesday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    thursday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    friday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    saturday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    sunday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    }
  },
  cuisine: [{
    type: String,
    enum: [
      'italian',
      'chinese',
      'indian',
      'mexican',
      'japanese',
      'thai',
      'american',
      'mediterranean',
      'french',
      'greek',
      'lebanese',
      'turkish',
      'vietnamese',
      'korean',
      'other'
    ]
  }],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  features: [{
    type: String,
    enum: [
      'delivery',
      'takeout',
      'dine_in',
      'outdoor_seating',
      'parking',
      'wifi',
      'wheelchair_accessible',
      'reservations',
      'private_dining',
      'live_music',
      'bar',
      'buffet'
    ]
  }],
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    autoAcceptOrders: {
      type: Boolean,
      default: false
    },
    requireCustomerVerification: {
      type: Boolean,
      default: true
    },
    allowTableReservations: {
      type: Boolean,
      default: true
    },
    allowDelivery: {
      type: Boolean,
      default: true
    },
    allowTakeout: {
      type: Boolean,
      default: true
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    minimumOrderAmount: {
      type: Number,
      default: 0
    },
    deliveryRadius: {
      type: Number,
      default: 10, // in kilometers
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    }
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  staff: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  tables: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Table'
  }],
  categories: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Category'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
RestaurantSchema.index({ 'address.coordinates': '2dsphere' });
RestaurantSchema.index({ cuisine: 1 });
RestaurantSchema.index({ 'settings.isActive': 1 });

module.exports = mongoose.model('Restaurant', RestaurantSchema); 