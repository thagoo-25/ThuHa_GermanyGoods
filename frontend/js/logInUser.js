document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("submit");

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const loginButton = document.getElementById("loginButton");

        // Validate rỗng
        if (!username || !password) {
            showNotification("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!", false);
            return;
        }

        // Validate độ dài
        if (username.length < 3 || password.length < 2) {
            showNotification("Tên đăng nhập hoặc mật khẩu quá ngắn!", false);
            return;
        }

        // Loading state
        loginButton.disabled = true;
        loginButton.innerText = "Đang đăng nhập...";

        try {
            const response = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Đăng nhập thất bại!");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("user_id", data.user.user_id);

            showNotification("Đăng nhập thành công!", true);
            window.location.href = "/frontend/html/homepage.html";

        } catch (error) {
            if (error.name === "TypeError" && error.message === "Failed to fetch") {
                showNotification("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.", false);
            } else {
                showNotification(error.message, false);
            }
        } finally {
            // Luôn khôi phục nút
            loginButton.disabled = false;
            loginButton.innerText = "Đăng nhập";
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