const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user from database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout Endpoint
router.post('/logout', (req, res) => {
  
  res.json({ message: 'Logout successful' });
});

//Sign-in Endpoint
router.post('/register', async (req, res)=> {
  try{
    const {username, password, email} = req.body;

    //Validate Sign-in Credentials
    if (!username || !password || !email){
      return res.status(400).json({ error: 'Invalid Credentials'});
   } 
   //check if username exists
   const [existingUser] = await pool.query(
    'SELECT user_id FROM users WHERE username = ?',
    [username]
   );
   if (existingUser.length>0){
    return res.status(400).json({ error: 'Username already exists'});
   }
   
   //Hash password with bycrypt
   const satlRounds = 10;
   const hashedPassword = await bcrypt.hash(password, satlRounds);
   
   //add user to db
   await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username,email,hashedPassword]
   );
  
   res.json({ message: 'User registered succesfully'});
  } catch(error){
    console.error(error);
    res.status(500).json({ error: 'Server error'})
  }
});

//update user info
router.patch('/edit', authenticateToken, async (req, res)=>{
  try{
    const userId = req.user.user_id;
    const {
      email,
      full_name,
      address,
      phone_number,
      password
    } = req.body;
  
    const fields = [];
    const values = [];

    if(email){
      fields.push('email=?');
      values.push(email);
    }

    if(full_name){
      fields.push('full_name=?');
      values.push(full_name)
    }

    if(address){
      fields.push('address=?');
      values.push(address)
    }

    if(phone_number){
      fields.push('phone_number=?');
      values.push(phone_number)
    }
    //hash the password if the user wants to change it
    if(password){
      const satlRounds = 10;
      const hashedPassword = await bcrypt.hash(password,satlRounds);
      fields.push('password_hash=?');
      values.push(hashedPassword)
    }

    if(fields.length === 0){
      return res.status(400).json({ error: 'No information to be update'});
    }

    //update the db
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(userId);
    await pool.query(sql, values);

    res.json({ message: 'Information updated successfully'});
  } catch(error){
    console.error(error);
    res.status(500).json({ error:'Server error'});
  }
});

module.exports = router;
