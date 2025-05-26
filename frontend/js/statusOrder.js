document.addEventListener("DOMContentLoaded", () => {
    handleUserDisplay();
    setupLogout();
}); 

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
