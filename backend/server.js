require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/order');
const authenticateToken = require('./middleware/auth');
const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
  app.get('/', (req, res) => {
    res.send('xin chao');
  });

  app.get('/protectedroute', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
  });

//static
app.use(express.static('public'));
app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/products',productsRoutes);
app.use('/cart', cartRoutes);
app.use('/categories', categoryRoutes);
app.use('/order', orderRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});






