document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("submit");
    
        const adminname = document.getElementById("adminname").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!adminname || !password) {
            showNotification("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/loginAdmin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ adminname, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Đăng nhập thất bại!");
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("admin", JSON.stringify(data.admin));

            showNotification("Đăng nhập thành công!");
            window.location.href = "../html/profileAdmin.html";

        } catch (error) {
            showNotification(error.message);
        }
    });
});

// Hàm hiển thị thông báo
function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.style.display = "block";
    notification.style.backgroundColor = isSuccess ? "#d4edda" : "#f8d7da";
    notification.style.color = isSuccess ? "#155724" : "#721c24";
    notification.style.border = isSuccess ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
    notification.style.borderRadius = "5px";  // Đường viền tròn
    notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";  // Hiệu ứng đổ bóng
  
    // Ẩn thông báo sau 5 giây
    setTimeout(() => {
        notification.style.display = "none";
    }, 5000);
}
