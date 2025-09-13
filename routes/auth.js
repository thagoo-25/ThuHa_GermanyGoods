const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Login Endpoint (cus)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
  

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user from database
    const [user] = await pool.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const users = user[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, users.password_hash);

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
        id: users.user_id,
        username: users.username,
        full_name: users.full_name,
        email: users.email,
        address: users.address,
        phone_number: users.phone_number,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Endpoint (admin)
router.post('/loginAdmin', async (req, res) => {
  try {
    const { adminname, password } = req.body;
  

    // Validate input
    if (!adminname || !password) {
      return res.status(400).json({ error: 'Adminname and password required' });
    }

    // Get admin from database
    const [admin] = await pool.query(
      'SELECT * FROM admin WHERE adminname = ?',
      [adminname]
    );

    if (admin.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admins = admin[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, admins.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { admin_id: admin.admin_id, adminname: admin.adminname },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      admin: {
        id: admins.admin_id,
        adminname: admins.adminname,
        full_name: admins.full_name,
        email: admins.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout Endpoint
router.post('/logout', (req, res) => {
  console.log('req.body:', req.body); // Log dữ liệu gửi từ frontend
  res.json({ message: 'Logout successful' });
});

//Sign-in Endpoint (for customer)
router.post('/register', async (req, res) => {
  try {
    console.log('req.body',req.body);
    
      const { fullName, username, dob, email, password } = req.body;

      // Kiểm tra input không được để trống
      if (!fullName || !username || !dob || !email || !password) {
          return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
      }

      // Kiểm tra xem username đã tồn tại chưa
      const [existingUser] = await pool.query(
          'SELECT user_id FROM user WHERE username = ?',
          [username]
      );
      if (existingUser.length > 0) {
          return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      }

      // Kiểm tra xem email đã tồn tại chưa
      const [existingEmail] = await pool.query(
          'SELECT user_id FROM user WHERE email = ?',
          [email]
      );
      if (existingEmail.length > 0) {
          return res.status(400).json({ error: 'Email đã được sử dụng' });
      }

      // Mã hóa mật khẩu
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Lưu user vào database
      await pool.query(
          'INSERT INTO user (full_name, username, dob, email, password_hash) VALUES (?, ?, ?, ?, ?)',
          [fullName, username, dob, email, hashedPassword]
      );

      res.json({ message: 'Đăng ký thành công!' , token:'123123123'});
      // Đoạn này yêu cầu BE trả thêm token để FE lưu lại
      // 

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;


//Sign-up Endpoint (for admin)
router.post('/regisAdmin', async (req, res) => {
  try {
    console.log('req.body', req.body);
    
    const { fullName, adminname, dob, email, password, phoneNumber, address } = req.body;

    // Kiểm tra input không được để trống
    if (!fullName || !adminname || !dob || !email || !password || !phoneNumber || !address) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Kiểm tra xem adminname đã tồn tại chưa
    const [existingAdmin] = await pool.query(
        'SELECT admin_id FROM admin WHERE adminname = ?',
        [adminname]
    );
    if (existingAdmin.length > 0) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const [existingEmail] = await pool.query(
        'SELECT admin_id FROM admin WHERE email = ?',
        [email]
    );
    if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Lưu admin vào database
    await pool.query(
      'INSERT INTO admin (full_name, adminname, dob, email, password_hash, phone_number, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, adminname, dob, email, hashedPassword, phoneNumber, address]
  );

    res.json({ message: 'Đăng ký thành công!', token: '123123123' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "..", "uploads")); // Lưu vào thư mục uploads
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file theo timestamp
  },
});

const upload = multer({ storage: storage });

module.exports = upload;

//update user info
router.patch('/editUser', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
      console.log('req.body', req.body);
      console.log('req.file', req.file); // Kiểm tra thông tin file upload

      const userId = req.user.user_id;
      const { email, dob, full_name, address, phone_number, password } = req.body;

      const fields = [];
      const values = [];

      if (email) {
          fields.push('email=?');
          values.push(email);
      }

      if (full_name) {
          fields.push('full_name=?');
          values.push(full_name);
      }

      if (address) {
          fields.push('address=?');
          values.push(address);
      }

      if (phone_number) {
          fields.push('phone_number=?');
          values.push(phone_number);
      }

      if (dob) {
          fields.push('dob=?');
          values.push(dob);
      }

      // Hash password nếu user muốn đổi
      if (password) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          fields.push('password_hash=?');
          values.push(hashedPassword);
      }

      // Nếu có ảnh, lưu đường dẫn ảnh vào DB
      if (req.file) {
        const avatarPath = `../uploads/${req.file.filename}`;
        fields.push("avatar=?");
        values.push(avatarPath);
    }


    if (fields.length === 0) {
        return res.status(400).json({ error: "No information to update" });
    }

      // Cập nhật thông tin user trong database
      const sql = `UPDATE user SET ${fields.join(', ')} WHERE user_id = ?`;
      values.push(userId);
      await pool.query(sql, values);

      res.json({ message: 'Information updated successfully', avatar: req.file ? `../uploads/${req.file.filename}` : null });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

//update admin info
router.patch('/editAdmin', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
      console.log('req.body', req.body);
      console.log('req.file', req.file); // Kiểm tra thông tin file upload

      const adminId = req.user.admin_id; // Vì middleware gán vào req.user chứ không phải req.admin
      const { email, dob, full_name, address, phone_number, password , role} = req.body;

      const fields = [];
      const values = [];

      if (email) {
          fields.push('email=?');
          values.push(email);
      }

      if (full_name) {
          fields.push('full_name=?');
          values.push(full_name);
      }

      if (address) {
          fields.push('address=?');
          values.push(address);
      }

      if (phone_number) {
          fields.push('phone_number=?');
          values.push(phone_number);
      }

      if (dob) {
          fields.push('dob=?');
          values.push(dob);
      }

      if (role) {
        fields.push('role=?');
        values.push(role);
    }

      // Hash password nếu admin muốn đổi
      if (password) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          fields.push('password_hash=?');
          values.push(hashedPassword);
      }

      // Nếu có ảnh, lưu đường dẫn ảnh vào DB
      if (req.file) {
        const avatarPath = `../uploads/${req.file.filename}`;
        fields.push("avatar=?");
        values.push(avatarPath);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: "No information to update" });
    }

      // Cập nhật thông tin admin trong database
      const sql = `UPDATE admin SET ${fields.join(', ')} WHERE admin_id = ?`;
      values.push(adminId);
      await pool.query(sql, values);

      res.json({ message: 'Information updated successfully', avatar: req.file ? `../uploads/${req.file.filename}` : null });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


router.get('/getAdminInfo', authenticateToken, async (req, res) => {
  try {
    console.log('req.body', req.body);
      const adminId = req.user.admin_id;
      const [admin] = await pool.query("SELECT * FROM admin WHERE admin_id = ?", [adminId]);

      if (admin.length === 0) {
          return res.status(404).json({ error: "Admin not found" });
      }

      res.json(admin[0]);  
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});



// Giả sử bạn lưu refreshToken vào database hoặc memory
let refreshTokens = []; 

router.post("/refresh-token", (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ error: "Refresh token không hợp lệ!" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Refresh token hết hạn!" });

        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "15m" } // Token mới có thời hạn 15 phút
        );

        res.json({ token: newAccessToken });
    });
});

module.exports = router;