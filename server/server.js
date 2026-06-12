require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
// Temporarily add test-email route to debug Render SMTP blocks
app.get('/api/test-email', async (req, res) => {
  try {
    const sendEmail = require('./utils/sendEmail');
    const result = await sendEmail(
      'abdullahshabbir486@gmail.com', 
      'Render SMTP Debug Test', 
      '<h1>Testing SMTP from Render</h1><p>If you see this, email works.</p>'
    );
    res.json({ success: true, message: 'Email sent successfully from Render!', result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Email failed to send from Render', 
      error: error.message,
      code: error.code,
      command: error.command
    });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payouts', require('./routes/payoutRoutes'));
app.use('/api/refunds', require('./routes/refundRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatbotRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShopZone API running' });
});

// Error Handler
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
