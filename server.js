require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const authenticateToken = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());



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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});