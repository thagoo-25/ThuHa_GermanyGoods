document.addEventListener("DOMContentLoaded", function () {
    const admin = JSON.parse(localStorage.getItem("admin"));
    initAdminInfo(admin);
    setupFileInput();
    setupUpdateProfileForm(admin);
    setupLogout();
});

// Khởi tạo thông tin admin
function initAdminInfo(admin) {
    const adminInfo = document.getElementById("admin-Info");
    const adminnameElement = document.getElementById("adminname");
    const defaultName = document.getElementById("default-name");
    const fullNameElement = document.getElementById("profile-name");

    if (admin) {
        if (admin.full_name) {
            fullNameElement.textContent = admin.full_name;
        }
        if (adminInfo && adminnameElement) {
            adminnameElement.textContent = admin.adminname;
            adminInfo.style.display = "inline-flex";
        }
        if (defaultName) defaultName.style.display = "none";

        setAdminFormValues(admin);

        if (admin.avatar) {
            document.getElementById("avatar-preview").src = `http://localhost:3000/${admin.avatar}`;
        }
    } else {
        if (adminInfo) adminInfo.style.display = "none";
        if (defaultName) defaultName.style.display = "inline-block";
    }
    console.log("LocalStorage admin:", admin);
}

// Gán dữ liệu admin vào các input
function setAdminFormValues(admin) {
    document.getElementById("full_name").value = admin.full_name || "";
    document.getElementById("email").value = admin.email || "";
    document.getElementById("phone_number").value = admin.phone_number || "";
    document.getElementById("dob").value = admin.dob || "";
    document.getElementById("address").value = admin.address || "";
}

// Xử lý chọn file ảnh
function setupFileInput() {
    document.getElementById("fileInput").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("avatar-preview").src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Xử lý cập nhật thông tin admin
function setupUpdateProfileForm(admin) {
    document.getElementById("updateProfileForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const formData = getFormData();

        try {
            const response = await fetch("http://localhost:3000/auth/editAdmin", {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: formData
            });
            
            const result = await response.json();
            if (response.ok) {
                showNotification("Cập nhật thông tin thành công!", true);
                updateLocalStorage(admin, formData, result.avatar);
            } else {
                showNotification("Lỗi: " + result.error, false);
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            showNotification("Có lỗi xảy ra, vui lòng thử lại sau!", false);
        }
    });
}

// Lấy dữ liệu từ form
function getFormData() {
    const formData = new FormData();
    formData.append("full_name", document.getElementById("full_name").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("phone_number", document.getElementById("phone_number").value);
    formData.append("dob", document.getElementById("dob").value);
    formData.append("address", document.getElementById("address").value);
    formData.append("role", document.getElementById("role").value);

    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length > 0) {
        formData.append("avatar", fileInput.files[0]);
    }
    return formData;
}

// Cập nhật thông tin admin vào localStorage
function updateLocalStorage(admin, formData, newAvatar) {
    const updatedAdmin = { ...admin, ...Object.fromEntries(formData) };
    if (newAvatar) updatedAdmin.avatar = newAvatar;
    localStorage.setItem("admin", JSON.stringify(updatedAdmin));

    if (newAvatar) {
        document.getElementById("avatar-preview").src = `http://localhost:3000/${newAvatar}`;
    }
}

// Hiển thị menu dropdown
function myFunction() {
    document.getElementById("admin-dropdown").classList.toggle("show");
}

// Đóng dropdown khi click ra ngoài
window.onclick = function (event) {
    if (!event.target.closest("#admin-Info")) { 
        const dropdown = document.getElementById("admin-dropdown");
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
        }
    }
};

// Xử lý đăng xuất
function setupLogout() {
    document.getElementById("logout-btn").addEventListener("click", function (event) {
        event.preventDefault();
        
        fetch("http://localhost:3000/auth/logout", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" } 
        })
        .then(response => response.json())
        .then(() => {
            localStorage.removeItem("admin");
            window.location.href = "/frontend/html/homepage.html";
        })
        .catch(error => console.error("Lỗi khi logout:", error));
    });
}

function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.style.display = "block";
    
    // Màu xanh lá cây cho thành công, màu hồng đỏ cho lỗi
    if (isSuccess) {
        notification.style.backgroundColor = "#d4edda";  // Màu nền xanh lá
        notification.style.color = "#155724";  // Màu chữ xanh lá
        notification.style.border = "1px solid #c3e6cb";  // Viền xanh lá
    } else {
        notification.style.backgroundColor = "#f8d7da";  // Màu nền đỏ nhạt
        notification.style.color = "#721c24";  // Màu chữ đỏ
        notification.style.border = "1px solid #f5c6cb";  // Viền đỏ nhạt
    }

    // Thêm đổ bóng và đường viền tròn
    notification.style.borderRadius = "5px";  // Đường viền tròn
    notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";  // Hiệu ứng đổ bóng

    // Ẩn thông báo sau 5 giây
    setTimeout(() => {
        notification.style.display = "none";
    }, 5000);
}
