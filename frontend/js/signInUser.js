async function signUp() {
    // Lấy giá trị từ các input
    const fullName = document.getElementById('fullName').value;
    const dob = document.getElementById('datepicker').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agree = document.getElementById('agree').checked;

    // Kiểm tra input không được để trống
    if (!fullName || !dob || !username || !email || !password || !confirmPassword) {
        showNotification("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    // Kiểm tra định dạng email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification("Email không hợp lệ!");
        return;
    }

    // Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
        showNotification("Mật khẩu xác nhận không khớp!");
        return;
    }

    // Kiểm tra checkbox điều khoản
    if (!agree) {
        showNotification("Bạn phải đồng ý với các điều khoản!");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, dob, username, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            showNotification("Đăng ký thành công! Hãy đăng nhập.");
            window.location.href = "../html/logInUser.html";
        } else {
            showNotification(data.error);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        showNotification("Có lỗi xảy ra, vui lòng thử lại!");
    }
}

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

