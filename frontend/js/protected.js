document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/frontend/login.html"; // Chuyển về trang login
    }
});
