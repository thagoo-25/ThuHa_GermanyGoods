// Dữ liệu sản phẩm (có thể thay đổi hoặc lấy từ database)
const bestSellerProducts = [
    {
        img: "product1.jpg",
        name: "Sữa rửa mặt Neutrogena",
        price: "250.000đ"
    },
    {
        img: "product2.jpg",
        name: "Kem chống nắng La Roche-Posay",
        price: "320.000đ"
    },
    {
        img: "product3.jpg",
        name: "Nước hoa Chanel No.5",
        price: "2.500.000đ"
    },
    {
        img: "product4.jpg",
        name: "Son môi Dior Rouge",
        price: "900.000đ"
    }
];

const newProducts = [
    {
        img: "product5.jpg",
        name: "Bộ dầu gội TRESemmé",
        price: "180.000đ"
    },
    {
        img: "product6.jpg",
        name: "Tinh chất dưỡng ẩm Hada Labo",
        price: "260.000đ"
    },
    {
        img: "product7.jpg",
        name: "Serum dưỡng da Estee Lauder",
        price: "1.200.000đ"
    },
    {
        img: "product8.jpg",
        name: "Toner Some By Mi AHA-BHA-PHA",
        price: "220.000đ"
    }
];

// Hàm hiển thị sản phẩm
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Xóa nội dung cũ

    products.forEach(product => {
        const productBox = document.createElement("div");
        productBox.classList.add("product-box");

        productBox.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            <p class="product-name">${product.name}</p>
            <p class="product-price">${product.price}</p>
        `;

        container.appendChild(productBox);
    });
}

// Hiển thị sản phẩm vào trang
displayProducts(bestSellerProducts, "best-seller");
displayProducts(newProducts, "new-products");
