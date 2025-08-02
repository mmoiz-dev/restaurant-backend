# Restaurant Management System Backend

A scalable, multi-tenant restaurant management system built with Node.js, Express, and MongoDB. This system supports multiple user roles, comprehensive restaurant management, and advanced analytics.

## Features

### 🔐 User Roles & Authentication
- **Super Admin**: Can create restaurants and assign restaurant owners
- **Restaurant Owner**: Manages their restaurant, staff, and operations
- **Staff**: Role-based access control for different staff types (cashier, kitchen, delivery, waiter)
- **Customer**: End users who can place orders via QR codes or delivery

### 🏪 Restaurant Management
- Complete restaurant profile management
- Operating hours and location settings
- Menu and category management
- Table management with QR code generation
- Inventory and stock tracking

### 📊 Analytics & Reporting
- Sales reports with filtering by date ranges
- Popular dishes analysis
- Customer analytics and segmentation
- Inventory reports with low stock alerts
- PDF export functionality

### 🛍️ Order Management
- Multi-channel ordering (dine-in, takeout, delivery)
- Real-time order status tracking
- Payment processing integration
- Order history and customer reviews

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **QR Code**: qrcode
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
restaurant-backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js             # Authentication & authorization
│   └── errorHandler.js     # Global error handling
├── models/
│   ├── User.js             # User model with roles
│   ├── Restaurant.js       # Restaurant model
│   ├── Dish.js             # Menu items model
│   ├── Category.js         # Menu categories
│   ├── Order.js            # Order management
│   └── Table.js            # Table management
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── restaurants.js      # Restaurant management
│   ├── dishes.js           # Menu management
│   ├── orders.js           # Order processing
│   ├── tables.js           # Table management
│   ├── staff.js            # Staff management
│   ├── reports.js          # Analytics & reports
│   └── customers.js        # Customer management
├── utils/
│   ├── sendEmail.js        # Email functionality
│   └── generatePDF.js      # PDF report generation
├── server.js               # Main application entry
└── package.json            # Dependencies & scripts
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd restaurant-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/restaurant-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration (for OTP verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# QR Code Configuration
QR_CODE_BASE_URL=http://localhost:3000

# Report Configuration
REPORT_EXPORT_PATH=./reports
```

### 4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/create-restaurant-owner` - Create restaurant owner (Super Admin)
- `POST /api/auth/create-staff` - Create staff member (Restaurant Owner)
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Restaurants
- `GET /api/restaurants` - Get all restaurants (Super Admin)
- `GET /api/restaurants/:id` - Get single restaurant
- `POST /api/restaurants` - Create restaurant (Super Admin)
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant (Super Admin)
- `GET /api/restaurants/:id/analytics` - Restaurant analytics
- `GET /api/restaurants/:id/settings` - Get restaurant settings
- `PUT /api/restaurants/:id/settings` - Update restaurant settings

### Dishes
- `GET /api/dishes` - Get all dishes
- `GET /api/dishes/:id` - Get single dish
- `POST /api/dishes` - Create dish
- `PUT /api/dishes/:id` - Update dish
- `DELETE /api/dishes/:id` - Delete dish
- `PUT /api/dishes/:id/stock` - Update dish stock
- `PUT /api/dishes/:id/availability` - Toggle dish availability
- `PUT /api/dishes/:id/sale` - Toggle dish sale status
- `GET /api/dishes/low-stock/:restaurantId` - Get low stock dishes
- `GET /api/dishes/out-of-stock/:restaurantId` - Get out of stock dishes

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/review` - Add order review

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get single table
- `POST /api/tables` - Create table
- `PUT /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table
- `PUT /api/tables/:id/status` - Update table status
- `GET /api/tables/:id/qr` - Get table QR code
- `PUT /api/tables/:id/clean` - Mark table as cleaned

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/:id` - Get single staff member
- `PUT /api/staff/:id` - Update staff member
- `PUT /api/staff/:id/deactivate` - Deactivate staff member
- `PUT /api/staff/:id/reactivate` - Reactivate staff member
- `PUT /api/staff/:id/permissions` - Update staff permissions
- `GET /api/staff/role/:role` - Get staff by role
- `GET /api/staff/stats/:restaurantId` - Get staff statistics

### Reports
- `GET /api/reports/sales/:restaurantId` - Sales report
- `GET /api/reports/popular-dishes/:restaurantId` - Popular dishes report
- `GET /api/reports/inventory/:restaurantId` - Inventory report
- `GET /api/reports/customers/:restaurantId` - Customer analytics
- `POST /api/reports/export/:restaurantId` - Export report as PDF

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `GET /api/customers/:id/orders` - Get customer order history
- `GET /api/customers/:id/analytics` - Get customer analytics
- `PUT /api/customers/:id` - Update customer profile
- `PUT /api/customers/:id/deactivate` - Deactivate customer
- `PUT /api/customers/:id/reactivate` - Reactivate customer
- `GET /api/customers/stats/:restaurantId` - Get customer statistics

## Database Schema

### User Model
- Supports multiple roles (super_admin, restaurant_owner, staff, customer)
- Role-based permissions and access control
- Email verification and password reset functionality
- Address and contact information

### Restaurant Model
- Complete restaurant profile with contact information
- Operating hours and location settings
- Menu categories and features
- Tax and delivery settings

### Dish Model
- Comprehensive menu item management
- Stock tracking with low stock alerts
- Nutritional information and allergens
- Customization options and pricing

### Order Model
- Multi-channel order processing
- Real-time status tracking
- Payment processing integration
- Customer reviews and ratings

### Table Model
- QR code generation for each table
- Status tracking (available, occupied, reserved)
- Location and capacity management

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Helmet for security headers
- Password hashing with bcrypt

## Multi-tenancy Architecture

The system uses a shared database approach with restaurant-specific data filtering:
- All restaurants share the same database
- Data is filtered by `restaurantId` field
- Users can only access data from their assigned restaurant
- Super admin can access all restaurant data

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Production Considerations
1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure proper MongoDB connection string
4. Set up email service credentials
5. Configure file upload paths
6. Set up proper logging
7. Use HTTPS in production
8. Configure rate limiting appropriately

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-very-secure-jwt-secret
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.

--- 
*Built with ❤️ by Muhammad Moiz as part of The Backend journey*
