document.addEventListener("DOMContentLoaded", () => {
    renderSelectedProducts();
    handleUserDisplay();
    setupLogout();
    checkUserAddress();
    setupOrderSubmission();
});

// ======== Hàm hiển thị thông báo chuyên nghiệp ========
function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.innerText = message;
    notification.style.display = "block";
    notification.style.backgroundColor = isSuccess ? "#d4edda" : "#f8d7da";
    notification.style.color = isSuccess ? "#155724" : "#721c24";
    notification.style.border = isSuccess ? "1px solid #c3e6cb" : "1px solid #f5c6cb";

    setTimeout(() => {
        notification.style.display = "none";
    }, 5000);
}

// ======== 1. Hiển thị thông tin người dùng ========
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

    console.log('localStorage user:', user);
}

// ======== 2. Dropdown menu ========
function myFunction() {
    document.getElementById("user-dropdown")?.classList.toggle("show");
}

window.addEventListener("click", event => {
    if (!event.target.closest("#user-info")) {
        document.getElementById("user-dropdown")?.classList.remove("show");
    }
});

// ======== 3. Logout ========
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", event => {
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
        .catch(error => console.error("Lỗi khi logout:", error));
    });
}

// ======== 4. Kiểm tra địa chỉ người dùng ========
function checkUserAddress() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const userId = user.id;

    fetch(`http://localhost:3000/order/user-info/${userId}`)
    .then(response => response.json())
    .then(data => {
        if (!data || !data.address || !data.phone || !data.name) {
            $('#addressModal').modal('show');
        } else {
            updateAddressDisplay(data);
        }
    })
    .catch(error => {
        console.error("Lỗi khi kiểm tra địa chỉ:", error);
    });
}

// ======== 5. Cập nhật hiển thị địa chỉ ========
function updateAddressDisplay(data) {
    const displayNamePhone = document.getElementById("display-name-phone");
    const displayAddress = document.getElementById("display-address");

    if (displayNamePhone && displayAddress) {
        displayNamePhone.textContent = `${data.name} - ${data.phone}`;
        displayAddress.textContent = data.address;
    }
}

// ======== 6. Lưu địa chỉ người dùng ========
document.getElementById("saveAddressBtn").addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const region = document.getElementById("region").value.trim();
    const specific = document.getElementById("specific").value.trim();

    if (!region || !specific) {
        showNotification("Vui lòng điền đầy đủ thông tin địa chỉ.", false);
        return;
    }

    const addressData = {
        user_id: user.id,
        full_name: fullName,
        phone_number: phone,
        region,
        specific
    };

    fetch(`http://localhost:3000/order/update-user-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Cập nhật địa chỉ thành công:", data);
        updateAddressDisplay(data);
        $('#addressModal').modal('hide');
        showNotification("Cập nhật địa chỉ thành công!", true);
    })
    .catch(error => {
        console.error("Lỗi khi cập nhật địa chỉ:", error);
        showNotification("Lỗi khi cập nhật địa chỉ. Vui lòng thử lại!", false);
    });
});

// ======== 7. Hiển thị sản phẩm đã chọn ========
function renderSelectedProducts() {
    const productTableBody = document.querySelector(".product-table tbody");
    const selectedProducts = JSON.parse(localStorage.getItem("selectedProducts"));

    if (!selectedProducts || selectedProducts.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="4">Không có sản phẩm nào được chọn.</td></tr>';
        return;
    }

    productTableBody.innerHTML = "";

    selectedProducts.forEach(product => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="product">
                    <img src="${product.image}" alt="">
                    <div class="details">
                        <div class="title">${product.name}</div>
                    </div>
                </div>
            </td>
            <td>${product.price}</td>
            <td>${product.quantity}</td>
            <td>${product.total}</td>
        `;
        productTableBody.appendChild(row);
    });

    updateOrderSummary(selectedProducts);
}

// ======== 8. Tính tổng thanh toán ========
function updateOrderSummary(products) {
    const shippingFee = 40000;
    const voucherDiscount = 0;

    let totalProductPrice = 0;
    products.forEach(p => {
        const number = parseInt(p.total.replace(/[^\d]/g, ""));
        totalProductPrice += number;
    });

    const totalAmount = totalProductPrice + shippingFee - voucherDiscount;

    document.querySelector(".summary .flex-row:nth-child(1) span:last-child").textContent = `đ${totalProductPrice.toLocaleString()}`;
    document.querySelector(".summary .flex-row:nth-child(2) span:last-child").textContent = `đ${shippingFee.toLocaleString()}`;
    document.querySelector(".summary .flex-row:nth-child(3) span:last-child").textContent = `-đ${voucherDiscount.toLocaleString()}`;
    document.querySelector(".summary .flex-row:nth-child(4) span:last-child").textContent = `đ${totalAmount.toLocaleString()}`;
}

// ======== 9. Gửi đơn hàng ========
function setupOrderSubmission() {
    
    const orderButton = document.getElementById("orderButton");
    if (orderButton) {
        orderButton.addEventListener("click", () => {
            const note = document.querySelector(".note input").value.trim();
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const products = JSON.parse(localStorage.getItem("selectedProducts") || "[]");

            const shippingFee = 40000;
            const voucherDiscount = 0;

            let totalProductPrice = 0;
            products.forEach(p => {
                const number = parseInt(p.total.replace(/[^\d]/g, ""));
                totalProductPrice += number;
            });

            const totalAmount = totalProductPrice + shippingFee - voucherDiscount;

            const orderId = `ORD-${Date.now()}`;

            // Làm sạch dữ liệu trong products, đảm bảo rằng các giá trị price, total, quantity là số
const cleanedProducts = products.map(product => {
    return {
        ...product,
        price: parseInt(product.price.replace(/[^\d]/g, ""), 10), // Chuyển price thành số
        total: parseInt(product.total.replace(/[^\d]/g, ""), 10), // Chuyển total thành số
        quantity: parseInt(product.quantity, 10) // Chuyển quantity thành số
    };
});

// Kiểm tra lại cleanedProducts trước khi gửi
console.log("Cleaned Products:", cleanedProducts);

            const orderData = {
                order_code: orderId, 
                user_id: user.id,
                total_amount: totalAmount,
                order_status: "Chờ xác nhận",
                customer_name: user.full_name,
                customer_phone: user.phone_number || "",
                shipping_address: user.address || "",
                order_note: note,
                order_date: new Date().toISOString(),
                products: cleanedProducts
            };


            fetch("http://localhost:3000/order/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            })
            .then(res => res.json())
            .then(data => {
                showNotification("Đặt hàng thành công!", true);
                // Lưu thông tin đơn hàng vào localStorage
                localStorage.setItem('orderInfo', JSON.stringify(orderData));

                // Xóa sản phẩm đã chọn trong giỏ hàng
                localStorage.removeItem("selectedProducts");
                setTimeout(() => {
                    window.location.href = "/frontend/html/statusOrder.html";
                }, 1500);
            })
            .catch(err => {
                console.error("Lỗi đặt hàng:", err);
                showNotification("Đặt hàng thất bại. Vui lòng thử lại!", false);
            });
        });
    }
}
