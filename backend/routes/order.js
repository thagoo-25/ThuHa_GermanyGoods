const express = require('express');
const path = require("path");
const multer = require("multer");
const pool = require('../config/db');
const router = express.Router();

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
// 🔍 API: Lấy thông tin người dùng
router.get('/user-info/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT full_name AS name, phone_number AS phone, address FROM user WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// 📥 API: Cập nhật thông tin địa chỉ người dùng
router.post('/update-user-address', async (req, res) => {
  const { user_id, full_name, phone_number, region, specific } = req.body;

  if (!user_id || !region || !specific) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  const address = `${specific}, ${region}`;

  try {
    const [existing] = await pool.execute(
      'SELECT full_name, phone_number FROM user WHERE user_id = ?',
      [user_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const current = existing[0];

    await pool.execute(
      `UPDATE user SET full_name = ?, phone_number = ?, address = ? WHERE user_id = ?`,
      [
        full_name || current.full_name,
        phone_number || current.phone_number,
        address,
        user_id
      ]
    );

    await pool.execute(
      `UPDATE orders SET customer_name = ?, customer_phone = ?, shipping_address = ? 
       WHERE user_id = ? ORDER BY order_id DESC LIMIT 1`,
      [
        full_name || current.full_name,
        phone_number || current.phone_number,
        address,
        user_id
      ]
    );

    res.json({
      name: full_name || current.full_name,
      phone: phone_number || current.phone_number,
      address
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// 📦 API: Tạo đơn hàng
router.post('/create-order', async (req, res) => {
  console.log("Dữ liệu nhận được từ client:", req.body);
  const {
    user_id, total_amount, order_status, order_code,
    customer_name, customer_phone, shipping_address,
    order_note, order_date, products
  } = req.body;

  // 1. Validate đầu vào
  if (
    !user_id ||
    !total_amount ||
    !order_status ||
    !customer_name ||
    !customer_phone ||
    !shipping_address ||
    !order_date ||
    !Array.isArray(products) ||
    products.length === 0
  ) {
    return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
  }

  try {
    // 2. Chèn vào bảng orders
    const formattedOrderDate = new Date(order_date)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const [result] = await pool.execute(
      `INSERT INTO orders 
         (user_id, order_code, total_amount, order_status, customer_name, customer_phone, shipping_address, order_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        order_code,
        total_amount,
        order_status,
        customer_name,
        customer_phone,
        shipping_address,
        formattedOrderDate
      ]
    );

    const orderId = result.insertId;

    // 3. Chèn từng sản phẩm vào order_items
    for (const product of products) {
      // a. Chuyển quantity về số (nếu chuỗi)
      const quantity = typeof product.quantity === 'string'
        ? parseInt(product.quantity, 10)
        : product.quantity;

      // b. Chuyển total về số (nếu chuỗi)
      let priceOrTotal = product.total;
      if (typeof priceOrTotal === 'string') {
        priceOrTotal = parseInt(priceOrTotal.replace(/[^\d]/g, ''), 10);
      }

      // c. Chuyển productId về số
      const productId = Number(product.productId);

      // d. Kiểm tra hợp lệ
      if (isNaN(productId) || isNaN(quantity) || isNaN(priceOrTotal)) {
        console.error('Dữ liệu sản phẩm không hợp lệ, bỏ qua:', product);
        continue;
      }

      // e. Chèn vào DB
      await pool.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, productId, quantity, priceOrTotal]
      );
    }

    // 4. Trả về thành công
    res.status(201).json({ message: "Đặt hàng thành công", order_id: orderId });
  } catch (err) {
    console.error("Lỗi khi tạo đơn hàng:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});


// 📑 API: Lấy thông tin đơn hàng theo ID
router.get('/order-info/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    // 1. Lấy bản ghi orders
    const [orderRows] = await pool.execute(
      `SELECT
         o.*,
         u.username
       FROM orders o
       JOIN user u
         ON o.user_id = u.user_id 
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    const order = orderRows[0];

    // 2. Lấy các item kèm thông tin sản phẩm
    const [orderItems] = await pool.execute(
       `SELECT
      oi.product_id                AS product_id,
      oi.quantity                  AS order_quantity,
      oi.price                     AS item_price,       -- giá khi đặt
      p.product_name,
      p.product_description,
      p.price                      AS product_price,    -- giá gốc
      p.quantity                   AS stock_quantity,
      p.category_id,
      p.image_url                  AS product_image,
      p.brand,
      p.origin
   FROM order_items oi
   JOIN product p
     ON oi.product_id = p.product_id
   WHERE oi.order_id = ?`,
  [orderId]
    );

    // 3. Trả về dữ liệu
    return res.status(200).json({
      success: true,
      message: 'Lấy đơn hàng thành công',
      data: {
        order: order,
        items: orderItems
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy thông tin đơn hàng:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// 📃 API: Lấy tất cả đơn hàng (bên admin)
router.get('/all-orders', async (req, res) => {
  try {
    const [ordersRows] = await pool.execute(`SELECT * FROM orders`);
    if (ordersRows.length === 0) {
      return res.status(404).json({ message: 'Không có đơn hàng nào' });
    }

    const orders = [];

    for (let order of ordersRows) {
      const [orderItems] = await pool.execute(
        `SELECT oi.quantity, oi.price, p.product_name AS product_name, p.image_url AS product_image
         FROM order_items oi
         JOIN product p ON oi.product_id = p.product_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );

      orders.push({
        order_id:     order.order_id,
        username: order.customer_name,
        order_code: order.order_code,
        total_amount: order.total_amount,
        order_status: order.order_status,
        order_date: order.order_date,
        items: orderItems
      });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});


// 📃 API: Lấy tất cả đơn hàng (bên khách hàng)
router.get("/orders/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
      // Lấy tất cả đơn hàng của user
      const [orders] = await pool.execute(
          `SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC`, [userId]
      );

      const orderDetails = [];

      for (const order of orders) {
          // Lấy các sản phẩm trong từng đơn hàng
          const [items] = await pool.execute(`
              SELECT oi.*, p.product_name, p.image_url
              FROM order_items oi
              JOIN product p ON oi.product_id = p.product_id
              WHERE oi.order_id = ?
          `, [order.order_id]);

          orderDetails.push({
              ...order,
              items
          });
      }

      res.json(orderDetails);
  } catch (error) {
      console.error("Lỗi truy vấn đơn hàng:", error);
      res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;

//Cật nhập trạng thái đơn hàng
router.patch('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { newStatus } = req.body;

  if (!newStatus) {
    return res.status(400).json({ message: 'Thiếu trạng thái mới' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE orders SET order_status = ? WHERE order_id = ?`,
      [newStatus, orderId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});