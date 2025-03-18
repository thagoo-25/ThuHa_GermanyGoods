const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/search', async (req, res) =>{
    try{
        const {q} = req.query;
    //if the user doesnt enter something to search
        if(!q){
            return res.status(400).json({ error: 'Please type sth to search gng'});
        }
        //search through products table
    const [rows] = await pool.query(
        'SELECT * FROM products WHERE name LIKE ?', 
        [`%${q}%`]
    );
    res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }    
});

module.exports = router;

