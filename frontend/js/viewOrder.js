document.addEventListener("DOMContentLoaded", () => {
    handleUserDisplay();
    setupLogout();
    renderSidebarUser();
}); 

function renderSidebarUser() {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    if (!user) return;

    const username = user.username || "user";
    const fullName = user.full_name || "";

    // Cập nhật username
    const sidebarUsername = document.getElementById("sidebar-username");
    if (sidebarUsername) sidebarUsername.textContent = username;

    // Cập nhật avatar (lấy 2 ký tự đầu trong tên đầy đủ)
    const avatar = document.getElementById("avatar-initial");
    if (avatar) {
        const initials = fullName
            .split(" ")
            .map(w => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
        avatar.textContent = initials || username.slice(0, 2).toUpperCase();
    }

    // Cập nhật link "Sửa hồ sơ" và "Tài khoản của tôi"
    const editLink = document.getElementById("edit-profile-link");
    const accountLink = document.getElementById("account-link");
    const userId = user.user_id;

    if (editLink) editLink.href = `/frontend/html/profileUser.html?id=${user.id}`;
    if (accountLink) accountLink.href = `/frontend/html/profileUser.html?id=${user.id}`;
}


// Hàm xử lý hiển thị thông tin người dùng dựa trên localStorage
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
        if (usernameElement) usernameElement.textContent = user.username; // Hiển thị tên người dùng
        if (userInfo) userInfo.style.display = "inline-flex"; // Hiển thị khu vực thông tin người dùng
        if (loginButton) loginButton.style.display = "none"; // Ẩn nút đăng nhập
    } else {
        if (userInfo) userInfo.style.display = "none"; // Ẩn khu vực người dùng nếu chưa đăng nhập
        if (loginButton) loginButton.style.display = "inline-block"; // Hiển thị nút đăng nhập
    }

    console.log('localStorage user:', user);
}

// Hàm xử lý hiển thị hoặc ẩn dropdown menu của người dùng
function myFunction() {
    document.getElementById("user-dropdown")?.classList.toggle("show");
}

// Sự kiện đóng dropdown khi click ra ngoài
window.addEventListener("click", event => {
    if (!event.target.closest("#user-info")) {
        document.getElementById("user-dropdown")?.classList.remove("show");
    }
});

// Hàm xử lý logout người dùng
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
            localStorage.removeItem("user"); // Xóa thông tin người dùng khỏi localStorage
            window.location.href = "/frontend/html/homepage.html"; // Chuyển hướng về trang chủ
        })
        .catch(error => console.error("Lỗi khi logout:", error));
    });
}

// Hàm hiển thị thông báo
function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.style.display = "block";
    notification.style.backgroundColor = isSuccess ? "#d4edda" : "#f8d7da";
    notification.style.color = isSuccess ? "#155724" : "#721c24";
    notification.style.border = isSuccess ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
  
    // Ẩn thông báo sau 5 giây
    setTimeout(() => {
        notification.style.display = "none";
    }, 5000);
}

// Hàm hiển thị thông tin đơn hàng
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");
    const orderSection = document.querySelector(".order-section"); // 1 vùng hiển thị chung
    let allOrders = []; // lưu toàn bộ đơn hàng sau khi fetch

    // Hàm render theo list đơn hàng
    const renderOrders = (orders) => {
        orderSection.innerHTML = '';
        if (orders.length === 0) {
            orderSection.innerHTML = "<p>Không có đơn hàng nào.</p>";
            return;
        }

        orders.forEach(order => {
            const itemsHTML = order.items.map(item => `
                <div class="product">
                    <img src="http://localhost:3000/uploads/${item.image_url}" alt="sp">
                    <div>
                        <p class="title">${item.product_name}</p>
                        <small>Số lượng: ${item.quantity}</small>
                    </div>
                    <div class="price">₫${Number(item.price).toLocaleString("vi-VN")}</div>
                </div>
            `).join("");

            const actionButton = order.order_status === "Chờ xác nhận"
                ? `<button class="cancel-btn">Huỷ Đơn Hàng</button>`
                : `<span class="delivered-text">Đã nhận được hàng</span>`;

            const orderHTML = `
                <div class="order-card">
                    <div class="order-header">
                        <span>Germany Goods</span>
                        <button class="chat-btn">💬 Chat</button>
                        <span class="status">${order.order_status}</span>
                        <span class="order-id">Mã đơn hàng: <strong>${order.order_code}</strong></span>
                    </div>
                    ${itemsHTML}
                    <div class="order-footer">
                        <span class="total">Tổng: <strong>₫${Number(order.total_amount).toLocaleString("vi-VN")}</strong></span>
                        <button class="contact-btn">Liên hệ</button>
                        ${actionButton}
                    </div>
                </div>
            `;
            orderSection.insertAdjacentHTML("beforeend", orderHTML);
        });
    };

    // Fetch đơn hàng ban đầu
    if (userId) {
        fetch(`http://localhost:3000/order/orders/${userId}`)
            .then(res => res.json())
            .then(data => {
                allOrders = data;
                renderOrders(allOrders); // Mặc định hiển thị tất cả
            })
            .catch(err => console.error("Lỗi fetch đơn hàng:", err));
    }

    // Xử lý chuyển tab
    const tabs = document.querySelectorAll(".nav-tabs button");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(btn => btn.classList.remove("active"));
            tab.classList.add("active");

            const tabKey = tab.getAttribute("data-tab");

            if (tabKey === "all") {
                renderOrders(allOrders);
            } else {
                const filtered = allOrders.filter(order => {
                    const statusMap = {
                        waiting: "Chờ xác nhận",
                        pending: "Chờ lấy hàng",
                        shipping: "Đang giao hàng",
                        delivered: "Giao hàng thành công",
                        returned: "Trả hàng",
                        cancelled: "Đã huỷ"
                    };
                    return order.order_status === statusMap[tabKey];
                });
                renderOrders(filtered);
            }
        });
    });
});
