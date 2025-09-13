const express = require('express');
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// ⚙️ Cấu hình nơi lưu và tên file ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// ======================================
// 🔍 API: Tìm kiếm sản phẩm
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Please type sth to search gng' });

    const [rows] = await pool.query(
      'SELECT * FROM product WHERE product_name LIKE ?',
      [`%${q}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 📄 API: Trả về danh sách từ file JSON
router.get("/list", (req, res) => {
    console.log('req.body', req.body);
  const filePath = path.join(__dirname, "../database/products.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Lỗi đọc file JSON" });
    res.json(JSON.parse(data));
  });
});

// 📦 API: Lấy danh sách sản phẩm từ DB
router.get("/all", async (req, res) => {
  try {
      const [rows] = await pool.query(`
          SELECT p.*, c.category_name
          FROM product p
          LEFT JOIN category c ON p.category_id = c.category_id
      `);

      res.json({ success: true, products: rows });
  } catch (err) {
      console.error("❌ Lỗi khi lấy sản phẩm:", err);
      res.status(500).json({ success: false, error: "Lỗi server" });
  }
});



// 📦 API: Lấy danh sách sản phẩm theo danh mục từ DB
router.get("/:id", async (req, res) => {
  try {
      const { id } = req.params;

      const [rows] = await pool.query(
          `SELECT p.*, c.category_name
           FROM product p
           LEFT JOIN category c ON p.category_id = c.category_id
           WHERE p.product_id = ?`, 
          [id]
      );

      if (rows.length === 0) {
          return res.status(404).json({ success: false, error: "Sản phẩm không tồn tại" });
      }

      res.json({ success: true, product: rows[0] }); 
  } catch (err) {
      console.error("❌ Lỗi khi lấy sản phẩm:", err);
      res.status(500).json({ success: false, error: "Lỗi server" });
  }
});


// API để upload ảnh
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Không có file được tải lên." });
    }

    // Đổi tên file ảnh sau khi tải lên
    const imageUrl = req.file.filename + path.extname(req.file.originalname);
    const oldPath = path.join(__dirname, 'uploads', req.file.filename);
    const newPath = path.join(__dirname, 'uploads', imageUrl);

    // Đổi tên file
    fs.renameSync(oldPath, newPath);

    res.json({ success: true, image_url: imageUrl });
});
  
  

// ➕ API: Tạo sản phẩm mới
router.post('/addProduct', upload.single('image'), async (req, res) => {
  try {
    console.log('req.body', req.body);
    //console.log('req.file', req.file);
    const { product_name, product_description, price, quantity, category_id } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!product_name || price == null || quantity == null) {
      return res.status(400).json({ error: 'Vui lòng điền đủ thông tin bắt buộc.' });
    }
    

    // Nếu có ảnh, lưu đường dẫn ảnh vào DB
    /*if (req.file) {
        const imagePath = `../uploads/${req.file.filename}`;
        fields.push("image=?");
        values.push(image_urlPath);
    }*/

    const sql = `
      INSERT INTO product
        (product_name, product_description, price, quantity, category_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      product_name,
      product_description || null,
      price,
      quantity,
      category_id || null,
      image_url
    ]);

    res.status(201).json({ message: 'Product added', product_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✏️ API: Cập nhật sản phẩm
router.put('/:id', async (req, res) => {
  console.log('req.body', req.body);
      console.log('req.file', req.file); 
  const productId = req.params.id;
  const { product_name, price, product_description, category_name } = req.body;

  if (!product_name || !price || !product_description || !category_name) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Tìm hoặc thêm category
    let [categoryRows] = await conn.query(
      'SELECT category_id FROM category WHERE category_name = ? LIMIT 1',
      [category_name]
    );

    let categoryId;
    if (categoryRows.length > 0) {
      categoryId = categoryRows[0].category_id;
    } else {
      const [insertResult] = await conn.query(
        'INSERT INTO category (category_name) VALUES (?)',
        [category_name]
      );
      categoryId = insertResult.insertId;
    }

    // 2. Cập nhật sản phẩm
    const sql = `
      UPDATE product 
      SET product_name = ?, price = ?, product_description = ?, category_id = ?
      WHERE product_id = ?
    `;
    const values = [product_name, price, product_description, categoryId, productId];

    const [updateResult] = await conn.query(sql, values);

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    await conn.commit();
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });

  } catch (err) {
    await conn.rollback();
    console.error('Lỗi cập nhật sản phẩm:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
  } finally {
    conn.release();
  }
});



// ❌ API: Xóa sản phẩm
router.delete('/:id', async (req, res) => {
  try {
    console.log('req.body', req.body);
    const [result] = await pool.query(
      'DELETE FROM product WHERE product_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
