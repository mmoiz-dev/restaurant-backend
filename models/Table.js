const mongoose = require('mongoose');
const QRCode = require('qrcode');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Please add a table number'],
    trim: true
  },
  restaurantId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please add table capacity'],
    min: [1, 'Capacity must be at least 1'],
    max: [20, 'Capacity cannot exceed 20']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'out_of_service'],
    default: 'available'
  },
  currentOrder: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order'
  },
  qrCode: {
    type: String
  },
  qrCodeUrl: {
    type: String
  },
  location: {
    area: {
      type: String,
      enum: ['indoor', 'outdoor', 'private', 'bar', 'patio'],
      default: 'indoor'
    },
    section: String,
    coordinates: {
      x: Number,
      y: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastCleaned: {
    type: Date
  },
  notes: String,
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
TableSchema.index({ restaurantId: 1, status: 1 });
TableSchema.index({ restaurantId: 1, tableNumber: 1 });
TableSchema.index({ restaurantId: 1, isActive: 1 });

// Generate QR code for table
TableSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('tableNumber') || this.isModified('restaurantId')) {
    try {
      const tableData = {
        tableId: this._id,
        tableNumber: this.tableNumber,
        restaurantId: this.restaurantId
      };
      
      const qrData = JSON.stringify(tableData);
      this.qrCode = await QRCode.toDataURL(qrData);
      this.qrCodeUrl = `${process.env.QR_CODE_BASE_URL || 'http://localhost:3000'}/table/${this._id}`;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  next();
});

// Method to check if table is available
TableSchema.methods.isAvailable = function() {
  return this.status === 'available' && this.isActive;
};

// Method to reserve table
TableSchema.methods.reserve = function() {
  if (this.isAvailable()) {
    this.status = 'reserved';
    return true;
  }
  return false;
};

// Method to occupy table
TableSchema.methods.occupy = function(orderId) {
  if (this.status === 'available' || this.status === 'reserved') {
    this.status = 'occupied';
    this.currentOrder = orderId;
    return true;
  }
  return false;
};

// Method to free table
TableSchema.methods.free = function() {
  this.status = 'available';
  this.currentOrder = null;
  return this;
};

module.exports = mongoose.model('Table', TableSchema); 