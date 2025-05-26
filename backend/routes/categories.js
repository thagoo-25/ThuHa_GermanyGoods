const express = require('express');
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');


router.get('/', async (req, res) => {
    try {
      const [results] = await pool.query(
        'SELECT category_id AS id, category_name AS name FROM category'
      );
      res.json(results);
    } catch (err) {
      console.error('Lỗi khi truy vấn categories:', err);
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });
  
  module.exports = router;