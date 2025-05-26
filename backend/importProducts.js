const fs = require('fs');
const path = require('path');
const pool = require('../backend/config/db'); // Đường dẫn database

async function importProducts() {
    try {
        // Đọc file JSON
        const filePath = path.join(__dirname, '../backend/database/products.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(data);

        for (const product of products) {
            let { name, price, image, category } = product;
            
            // Xử lý giá tiền: Loại bỏ dấu ',' và '₫' để lưu dưới dạng số
            price = parseInt(price.replace(/[₫,]/g, ''), 10) || 0;

            // Map lại `image_url`
            const image_url = image || ''; 
            const description = `Sản phẩm ${name} thuộc danh mục ${category}`;

            // 🔹 Tìm category_id từ bảng category
            const [categoryRows] = await pool.query(
                'SELECT category_id FROM category WHERE category_name = ?', 
                [category]
            );

            let category_id;
            if (categoryRows.length > 0) {
                category_id = categoryRows[0].category_id; // Nếu đã có, lấy category_id
                } else {
                    console.log(`⚠️ Không tìm thấy danh mục: ${category}, thêm mới vào database.`);
                }


            // 🔹 Kiểm tra xem sản phẩm đã tồn tại chưa
            const [productRows] = await pool.query('SELECT * FROM product WHERE product_name = ?', [name]);

            if (productRows.length > 0) {
                // Nếu sản phẩm đã có, cập nhật thông tin mới
                await pool.query(
                    'UPDATE product SET price=?, product_description=?, image_url=?, category_id=? WHERE product_name=?',
                    [price, description, image_url, category_id, name]
                );
                console.log(`🔄 Cập nhật sản phẩm: ${name}`);
            } else {
                console.log(`⚠️ Không tìm thấy danh mục: ${category}, thêm mới vào database.`);
            }
        }

        console.log('🎉 Import sản phẩm từ JSON hoàn tất!');
    } catch (error) {
        console.error('❌ Lỗi khi import sản phẩm:', error);
    } finally {
        pool.end(); // Đóng kết nối database
    }
}

// Gọi hàm import
importProducts();
