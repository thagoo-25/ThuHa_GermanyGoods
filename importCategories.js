const fs = require('fs');
const path = require('path');
const pool = require('../backend/config/db');

async function importCategories() {
    try {
        const filePath = path.join(__dirname, '../backend/database/category.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const categories = JSON.parse(data);

        for (const category of categories) {
            const { category_name } = category;

            // Kiểm tra xem danh mục đã tồn tại chưa
            const [rows] = await pool.query(
                'SELECT category_id FROM category WHERE category_name = ?', 
                [category_name]
            );

            if (rows.length === 0) {
                // Thêm danh mục nếu chưa tồn tại
                await pool.query(
                    'INSERT INTO category (category_name) VALUES (?)', 
                    [category_name]
                );
                console.log(`✅ Thêm danh mục: ${category_name}`);
            } else {
                console.log(`🔄 Danh mục đã tồn tại: ${category_name}`);
            }
        }

        console.log('🎉 Import danh mục hoàn tất!');
    } catch (error) {
        console.error('❌ Lỗi khi import danh mục:', error);
    } finally {
        pool.end();
    }
}

// Gọi hàm import
importCategories();
