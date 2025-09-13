document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            alert("Bạn đã đăng xuất!");
            window.location.href = "/frontend/html/homepage.html"; // Quay về trang đăng nhập
        });
    }
});
