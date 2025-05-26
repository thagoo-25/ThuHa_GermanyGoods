const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const pool = require('../config/db');


router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;