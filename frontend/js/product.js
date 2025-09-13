document.addEventListener("DOMContentLoaded", function () {
    const buyButtons = document.querySelectorAll(".buy-button");

    buyButtons.forEach(button => {
        button.addEventListener("click", function () {
            const productId = this.getAttribute("data-id");
            addToCart(productId);
        });
    });


    const productId = getProductIdFromURL();
    if (productId) {
        fetchProduct(productId);
    } else {
        console.error("Không có ID sản phẩm trong URL");
    }


    // ----------- Xử lý tab giao diện -----------
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    const underline = document.querySelector(".tab-underline");

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            // Xóa class 'active' khỏi tab đang được chọn
            const activeTab = document.querySelector(".tab.active");
            if (activeTab) activeTab.classList.remove("active");

            // Thêm class 'active' cho tab được click
            tab.classList.add("active");

            // Ẩn tất cả nội dung tab
            contents.forEach(content => content.classList.remove("active"));

            // Hiển thị nội dung của tab được chọn
            if (contents[index]) contents[index].classList.add("active");

            // Cập nhật vị trí và chiều rộng của thanh underline
            if (underline) {
                underline.style.width = `${tab.offsetWidth}px`;
                underline.style.left = `${tab.offsetLeft}px`;
            }
        });
    });

    // Đặt mặc định cho tab đầu tiên nếu có
    const defaultActiveTab = document.querySelector(".tab.active");
    if (defaultActiveTab && underline) {
        underline.style.width = `${defaultActiveTab.offsetWidth}px`;
        underline.style.left = `${defaultActiveTab.offsetLeft}px`;
    }

    // ----------- Tăng/giảm số lượng sản phẩm -----------
    document.querySelectorAll(".quantity").forEach(quantityDiv => {
        const input = quantityDiv.querySelector("input");
        const increaseBtn = quantityDiv.querySelector(".increase");
        const decreaseBtn = quantityDiv.querySelector(".decrease");
    
        // Lấy thông tin sản phẩm từ API hoặc DOM
        const stockQuantity = 300; // Giả sử là số lượng sản phẩm trong kho (sẽ lấy từ API thực tế)
    
        // Sự kiện cho nút +
        increaseBtn.addEventListener("click", () => {
            let value = parseInt(input.value);
            if (!isNaN(value)) {
                if (value < stockQuantity) {
                    input.value = value + 1;
                } else {
                    showNotification("Số lượng không thể vượt quá số lượng trong kho.", "error");
                }
            }
        });
    
        // Sự kiện cho nút -
        decreaseBtn.addEventListener("click", () => {
            let value = parseInt(input.value);
            if (!isNaN(value) && value > 1) {
                input.value = value - 1;
            }
        });
    
        // Kiểm tra khi người dùng nhập số lượng thủ công
        input.addEventListener("input", () => {
            let value = parseInt(input.value);
            if (isNaN(value) || value <= 0) {
                showNotification("Vui lòng nhập số nguyên dương.", "error");
                input.value = 1;  // Đặt lại giá trị về 1 khi nhập sai
            } else if (value > stockQuantity) {
                showNotification("Số lượng không thể vượt quá số lượng trong kho.", "error");
                input.value = stockQuantity;  // Đặt lại giá trị về số lượng tối đa trong kho
            }
        });
    });
    

    // ----------- Gọi các hàm khác sau khi DOM sẵn sàng -----------
    fetchProduct(productId);
    fetchProducts();
    handleUserDisplay();
    setupLogout();
});

function addToCart(productId) {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId) {
        showNotification("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.", "error");
        return;
    }

    // Lấy giá trị số lượng từ input
    const qtyInput = document.querySelector(".quantity input");
    const quantity = parseInt(qtyInput.value, 10) || 1;

    // Lấy số lượng trong kho từ API hoặc DOM
    const stockQuantity = 10;  // Giả sử là số lượng sản phẩm trong kho

    if (quantity > stockQuantity) {
        showNotification("Số lượng không thể vượt quá số lượng trong kho.", "error");
        return;
    }

    fetch(`http://localhost:3000/cart/addItem`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            product_id: productId,
            quantity: quantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification("🛒 " + data.message, "success");
            updateCartDisplay();
        } else {
            showNotification("⚠️ " + data.error, "error");
        }
    })    
    .catch(error => {
        console.error("Lỗi:", error);
        showNotification("❌ Lỗi khi thêm vào giỏ hàng.", "error");
    });
}


// Nếu đang ở trang giỏ hàng, gọi API để hiển thị dữ liệu mới
function updateCartDisplay() {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    fetch(`http://localhost:3000/cart/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.querySelector("tbody");
                //tbody.innerHTML = ""; // Clear existing cart items

                data.cart.forEach(item => {
                    const row = `
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <div class="product">
                                    <img src="${item.image_url}" alt="Sản phẩm">
                                    <span>${item.product_name}</span>
                                </div>
                            </td>
                            <td><strong>${formatCurrency(item.price)}</strong></td>
                            <td>
                                <div class="quantity-control">
                                    <button>-</button>
                                    <input type="text" value="${item.quantity}">
                                    <button>+</button>
                                </div>
                            </td>
                            <td><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
                            <td><span class="remove" data-id="${item.product_id}">Xóa</span></td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML("beforeend", row);
                });
            }
        });
}

function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// ------- Hàm lấy danh sách sp từ file json
// Hàm lấy danh sách sản phẩm từ API và hiển thị trên trang
function fetchProducts() {
    fetch("http://localhost:3000/products/list")
        .then(response => response.json())
        .then(data => {
            renderProducts("best-seller", data, 5);
        })
        .catch(error => console.error("Lỗi tải dữ liệu:", error));
}

// Hàm hiển thị danh sách sản phẩm theo danh mục
function renderProducts(sectionId, products, limit) {
    const container = document.getElementById(sectionId);
    if (!container) return;
    
    container.innerHTML = "";
    products.slice(0, limit).forEach(product => {
        const productBox = document.createElement("div");
        productBox.classList.add("product-box");

        productBox.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-category">${product.category}</h3>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price}</p>
        `;

        // Thêm sự kiện click để chuyển hướng đến trang chi tiết sản phẩm
        productBox.addEventListener("click", function() {
            const productId = this.getAttribute("data-id");
            window.location.href = `/frontend/html/product.html?id=${productId}`;
        });

        container.appendChild(productBox);
    });
}



function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id"); // ví dụ trả về "3" từ ?id=3
}


// ----- Hàm lấy danh sách sản phẩm từ API và hiển thị thông tin chi tiết sp -----
function fetchProduct(productId) {
    fetch(`http://localhost:3000/products/${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.success && data.product) {
                renderProductDetail(data.product);
                
        
            } else {
                console.error("Không tìm thấy sản phẩm");
            }
        })
        .catch(error => {
            console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        });
}


function renderProductDetail(product) {
    document.getElementById("product-image").src = product.image_url ? `http://localhost:3000/uploads/${product.image_url}` : 'default-image-path.jpg'; // Đặt ảnh mặc định nếu không có ảnh trong database
    document.getElementById("product-name-main").textContent = product.product_name;
    document.getElementById("product-name-desciption").textContent = product.product_name;
    document.getElementById("product-id").textContent = product.product_id;
    document.getElementById("product-desciption").textContent = product.product_description;
    document.getElementById("product-price").textContent = Number(product.price).toLocaleString("vi-VN") + " đ";
    // Cập nhật thêm nếu bạn có các trường khác (brand, origin, packaging, etc.)

    // Gán productId vào nút thêm giỏ hàng
    const addToCartBtn = document.querySelector(".buy-button");
    if (addToCartBtn) {
        addToCartBtn.setAttribute("data-id", product.product_id);
    }
}


// ----- Hàm xử lý hiển thị thông tin người dùng từ localStorage -----
function handleUserDisplay() {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const userInfo = document.getElementById("user-info");
    const usernameElement = document.getElementById("username");
    const loginButton = document.querySelector(".login-btn");

    if (user) {
        const link = document.getElementById("view-orders-link");
        if (link) {
            link.href = `/frontend/html/viewOrder.html?id=${user.id}`;
        }
    }

    if (user) {
        if (usernameElement) usernameElement.textContent = user.username;
        if (userInfo) userInfo.style.display = "inline-flex";
        if (loginButton) loginButton.style.display = "none";
    } else {
        if (userInfo) userInfo.style.display = "none";
        if (loginButton) loginButton.style.display = "inline-block";
    }
    console.log("localStorage user:", user);
}

// ----- Hàm xử lý dropdown menu cho thông tin người dùng -----
function myFunction() {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown) dropdown.classList.toggle("show");
}

window.addEventListener("click", function(event) {
    if (!event.target.closest("#user-info")) {
        const dropdown = document.getElementById("user-dropdown");
        if (dropdown) dropdown.classList.remove("show");
    }
});

// ----- Hàm xử lý logout -----
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", function(event) {
        event.preventDefault();
        fetch("http://localhost:3000/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        })
        .then(response => response.json())
        .then(data => {
            console.log("Logout response:", data);
            localStorage.removeItem("user");
            window.location.href = "/frontend/html/homepage.html";
        })
        .catch(error => {
            console.error("Lỗi khi logout:", error);
        });
    });
}

// ----- Hàm hiển thị thông báo (chẳng hạn khi thêm vào giỏ hàng) -----
function showNotification(message, type = "success") {
    const notification = document.getElementById("cartNotification");
    const icon = document.getElementById("notificationIcon");
    const text = document.getElementById("notificationText");

    // Đặt nội dung thông báo
    text.textContent = message;

    // Thay đổi icon theo loại
    switch (type) {
        case "success":
            icon.src = "https://cdn-icons-png.flaticon.com/512/845/845646.png"; // tick xanh
            break;
        case "error":
            icon.src = "https://cdn-icons-png.flaticon.com/512/463/463612.png"; // dấu X đỏ
            break;
        case "warning":
            icon.src = "https://cdn-icons-png.flaticon.com/512/595/595067.png"; // chấm than vàng
            break;
        default:
            icon.src = "https://cdn-icons-png.flaticon.com/512/845/845646.png";
    }

    // Hiển thị
    notification.style.display = "block";

    // Tự ẩn sau 3 giây
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

