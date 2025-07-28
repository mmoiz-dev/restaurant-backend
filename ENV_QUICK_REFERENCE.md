# 🔧 Environment Configuration - Quick Reference

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run setup check:**
   ```bash
   npm run setup
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

## 📋 Essential Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/restaurant-management` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |
| `JWT_EXPIRE` | Token expiration | `30d` |
| `EMAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email username | `your-email@gmail.com` |
| `EMAIL_PASS` | Email password | `your-app-password` |

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use HTTPS in production
- [ ] Set up proper MongoDB authentication
- [ ] Configure email service credentials
- [ ] Set up rate limiting appropriately

## 📧 Email Configuration Options

### Gmail (Recommended)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outmail.com
EMAIL_PASS=your-password
```

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

## 🗄️ Database Options

### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/restaurant-management
```

### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-management?retryWrites=true&w=majority
```

## 🧪 Testing Your Setup

1. **Health check:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Expected response:**
   ```json
   {
     "status": "OK",
     "message": "Restaurant Management API is running",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## 🚨 Common Issues

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify connection string
- Check network access (for Atlas)

### Email Authentication Failed
- Use App Password for Gmail
- Enable 2-Factor Authentication
- Check SMTP settings

### JWT Errors
- Ensure JWT_SECRET is set
- Restart server after changes
- Clear browser cookies

## 📁 Required Directories

```bash
mkdir uploads    # For file uploads
mkdir reports    # For PDF exports
```

## 🔄 Development vs Production

### Development
```env
NODE_ENV=development
DEBUG=true
```

### Production
```env
NODE_ENV=production
DEBUG=false
# Use strong JWT_SECRET
# Use production database
# Use production email service
```

## 📞 Need Help?

1. Check `SETUP.md` for detailed instructions
2. Review server logs for error messages
3. Verify all environment variables are set
4. Test database and email connectivity 