const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const authenticateToken = require('../middleware/auth');

// 🛒 GET: Get user's cart contents
/*router.get('/:user_id', async (req, res) => {
    try {
        console.log('req.body', req.body);
        const [rows] = await pool.query(
            `SELECT c.*, p.product_name, p.price, p.image_url 
             FROM cart c
             JOIN product p ON c.product_id = p.product_id
             WHERE c.user_id = ?`,
            [req.params.user_id]
        );

        res.json({ 
            success: true, 
            cart: rows 
        });
    } catch (err) {
        console.error("Lỗi khi lấy giỏ hàng:", err);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi server" 
        });
    }
});*/

router.get('/:id', async (req, res) => {
    try {
        console.log('req.params.id:', req.params.id);

        const { id } = req.params;

        // Truy vấn cơ sở dữ liệu
        const [rows] = await pool.query(
            `SELECT
                c.cart_id, c.quantity,
                p.product_id,
                p.product_name, p.price, p.image_url,
                p.product_description, p.brand, p.origin,
                p.quantity       AS product_stock,   -- <— thêm dòng này
                u.full_name, u.email, u.phone_number,
                cat.category_name
             FROM cart c
             LEFT JOIN product p  ON c.product_id  = p.product_id
             LEFT JOIN user u     ON c.user_id     = u.user_id
             LEFT JOIN category cat ON p.category_id = cat.category_id
             WHERE c.user_id = ?`,
            [id]
        );        

          console.log('Rows trả về:', rows.length, rows);


        if (rows.length === 0) {
            return res.status(404).json({ message: "Giỏ hàng trống." });
        }

        res.json({ 
            success: true, 
            cart: rows 
        });
    } catch (err) {
        console.error("Lỗi khi lấy giỏ hàng:", err);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi server" 
        });
    }
});

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


// 🛒 POST: Add item to cart
router.post('/addItem', async (req, res) => {
    try {
        console.log('req.body', req.body);
        const { user_id, product_id, quantity } = req.body;

        if (!user_id || !product_id) {
            return res.status(400).json({ 
                success: false, 
                error: "Thiếu user_id hoặc product_id" 
            });
        }

        // Check product exists
        const [product] = await pool.query(
            'SELECT * FROM product WHERE product_id = ?',
            [product_id]
        );
        
        if (product.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Sản phẩm không tồn tại" 
            });
        }

        // Check existing cart item
        const [existing] = await pool.query(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existing.length > 0) {
            // Nếu đã có trong giỏ -> cập nhật số lượng mới
            const newQuantity = existing[0].quantity + (quantity || 1);
        
            await pool.query(
                'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
                [newQuantity, user_id, product_id]
            );
        
            return res.status(200).json({ 
                success: true, 
                message: "Đã cập nhật số lượng sản phẩm trong giỏ hàng" 
            });
        }

        // Add new item
        await pool.query(
            'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
            [user_id, product_id, quantity || 1]
        );

        res.status(201).json({ 
            success: true, 
            message: "Đã thêm vào giỏ hàng" 
        });
    } catch (err) {
        console.error("Lỗi khi thêm vào giỏ hàng:", err);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi server" 
        });
    }
});

// 🛒 PUT: Update cart item quantity
router.put('/updateItem/:user_id/:product_id', async (req, res) => {
    try {
        console.log('req.body', req.body);
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ 
                success: false, 
                error: "Số lượng không hợp lệ" 
            });
        }

        const [result] = await pool.query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, req.params.user_id, req.params.product_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Mục không tồn tại trong giỏ hàng" 
            });
        }

        res.json({ 
            success: true, 
            message: "Đã cập nhật số lượng" 
        });
    } catch (err) {
        console.error("Lỗi khi cập nhật giỏ hàng:", err);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi server" 
        });
    }
});

// 🛒 DELETE: Remove item from cart
router.delete('/removeItem/:user_id/:cart_id', async (req, res) => {
    try {
        const userId = req.params.user_id;  
        const cartId = req.params.cart_id;  

        console.log("Xóa sản phẩm với:", { userId, cartId });
        
        const [result] = await pool.query(  
            'DELETE FROM cart WHERE user_id = ? AND cart_id = ?',
            [userId, cartId]  // 
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Mục không tồn tại trong giỏ hàng" 
            });
        }

        res.json({ 
            success: true, 
            message: "Đã xóa khỏi giỏ hàng" 
        });
    } catch (err) {
        console.error("Lỗi khi xóa khỏi giỏ hàng:", err);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi server" 
        });
    }
});

// Cập nhật số lượng trong giỏ hàng
// ⚙️ PUT: Cập nhật số lượng (kiểm tra tồn kho)
router.put('/updateQuantity/:user_id/:cart_id', async (req, res) => {
    try {
      const { user_id: userId, cart_id: cartId } = req.params;
      const { quantity } = req.body;
      
      // 1) Validate phải là số nguyên dương
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, error: 'Quantity không hợp lệ' });
      }
  
      // 2) Lấy product_id từ cart
      const [cartRows] = await pool.query(
        'SELECT product_id FROM cart WHERE user_id = ? AND cart_id = ?', 
        [userId, cartId]
      );
      if (cartRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mục cần cập nhật' });
      }
      const productId = cartRows[0].product_id;
  
      // 3) Lấy tồn kho hiện tại (cột quantity trong product)
const [prodRows] = await pool.query(
    'SELECT quantity AS availableStock FROM product WHERE product_id = ?',
    [productId]
  );
  const availableStock = prodRows[0]?.availableStock ?? 0;
      if (quantity > availableStock) {
        return res.status(400).json({
          success: false,
          error: `Chỉ còn ${availableStock} sản phẩm trong kho`,
        });
      }
  
      // 4) Thực hiện update
      const [result] = await pool.query(
        `UPDATE cart
           SET quantity = ?
         WHERE user_id = ? AND cart_id = ?`,
        [quantity, userId, cartId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mục cần cập nhật' });
      }
  
      res.json({ success: true, message: 'Cập nhật số lượng thành công' });
    } catch (err) {
      console.error('Lỗi cập nhật số lượng:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });
  
  
module.exports = router;
