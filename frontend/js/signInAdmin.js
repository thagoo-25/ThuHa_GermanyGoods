async function signUp() {
    event.preventDefault(); 
    // Lấy giá trị từ các input
    const fullName = document.getElementById("fullName").value.trim();
    const dob = document.getElementById("datepicker").value.trim();
    const adminname = document.getElementById("adminname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const address = document.getElementById("address").value.trim();
    const agree = document.getElementById("agree").checked;

    // Kiểm tra input không được để trống
    if (![fullName, dob, adminname, email, password, confirmPassword, phoneNumber, address].every(Boolean)) {
        showNotification("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    // Kiểm tra định dạng email hợp lệ
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
        const response = await fetch("http://localhost:3000/auth/regisAdmin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, dob, adminname, email, password, phoneNumber, address })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("Đăng ký thành công! Hãy đăng nhập.");
            window.location.href = "../html/logInAdmin.html";
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
