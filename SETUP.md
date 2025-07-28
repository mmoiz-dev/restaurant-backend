# 🚀 Restaurant Management System - Setup Guide

This guide will help you set up the restaurant management system environment step by step.

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- A code editor (VS Code recommended)

## 🔧 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB locally:**
   - **Windows**: Download from [MongoDB website](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: `sudo apt install mongodb`

2. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running:**
   ```bash
   mongosh
   # or
   mongo
   ```

#### Option B: MongoDB Atlas (Cloud Database)

1. **Create MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a cluster:**
   - Choose the free tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

3. **Set up database access:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create a username and password
   - Select "Read and write to any database"
   - Click "Add User"

4. **Set up network access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get connection string:**
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

6. **Update .env file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-management?retryWrites=true&w=majority
   ```

### 3. Email Configuration

#### Option A: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication:**
   - Go to your Google Account settings
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to "Security" → "2-Step Verification"
   - Click "App passwords"
   - Generate a new app password for "Mail"
   - Copy the generated password

3. **Update .env file:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

#### Option B: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Option C: SendGrid

1. **Create SendGrid account:**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for a free account

2. **Create API Key:**
   - Go to "Settings" → "API Keys"
   - Create a new API key
   - Copy the API key

3. **Update .env file:**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   ```

### 4. JWT Secret Configuration

**For Development:**
The default JWT secret in the .env file is fine for development.

**For Production:**
Generate a strong, random JWT secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use an online generator
# https://generate-secret.vercel.app/64
```

Update the .env file:
```env
JWT_SECRET=your-generated-64-character-secret
```

### 5. Create Required Directories

```bash
# Create uploads directory for file uploads
mkdir uploads

# Create reports directory for PDF exports
mkdir reports
```

### 6. Test the Setup

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check the health endpoint:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Expected response:**
   ```json
   {
     "status": "OK",
     "message": "Restaurant Management API is running",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## 🔍 Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerSelectionError: connect ECONNREFUSED"**

**Solution:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

2. Verify MongoDB port:
   ```bash
   # Check if port 27017 is open
   netstat -an | grep 27017
   ```

### Email Configuration Issues

**Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**

**Solution:**
1. Ensure you're using an App Password (not your regular password)
2. Verify 2-Factor Authentication is enabled
3. Check if your email provider allows SMTP access

### JWT Issues

**Error: "JsonWebTokenError: invalid signature"**

**Solution:**
1. Ensure JWT_SECRET is set in .env
2. Restart the server after changing JWT_SECRET
3. Clear browser cookies/localStorage

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-very-secure-production-jwt-secret
MONGODB_URI=mongodb+srv://production-user:production-password@cluster.mongodb.net/restaurant-management-prod
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password
QR_CODE_BASE_URL=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com
```

### Security Checklist

- [ ] Change JWT_SECRET to a strong, random string
- [ ] Use HTTPS in production
- [ ] Set up proper MongoDB authentication
- [ ] Configure email service with production credentials
- [ ] Set up proper logging
- [ ] Configure rate limiting appropriately
- [ ] Set up monitoring and error tracking

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check MongoDB and email service connectivity
4. Review server logs for detailed error messages

## 🎉 Next Steps

Once setup is complete:

1. **Test the API endpoints** using Postman or similar tool
2. **Create a super admin user** for initial setup
3. **Set up your first restaurant** and restaurant owner
4. **Configure menu items** and categories
5. **Test the QR code functionality** for table ordering

Happy coding! 🚀 