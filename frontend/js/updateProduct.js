document.addEventListener("DOMContentLoaded", function () {
    const admin = JSON.parse(localStorage.getItem("admin"));
    initAdminInfo(admin);
    setupFileInput(); 
    setupLogout();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
 
    if (productId) {
      fetchProductData(productId);
      setupUpdateHandler(productId);
    }
 });
 
// Định dạng số với đơn vị k
function formatSales(sales) {
    if (sales === null || sales === undefined) return "0";
    const k = sales / 1000;
    return k >= 1 ? `${k.toFixed(1)}k` : `${sales}`;
}

// Chuyển ngược định dạng về số nguyên
function parseFormattedSales(str) {
    if (!str) return 0;
    str = str.trim();
    if (str.endsWith('k') || str.endsWith('K')) {
        const num = parseFloat(str.slice(0, -1));
        return Math.round(num * 1000);
    }
    return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

 function fetchProductData(productId) {
   fetch(`http://localhost:3000/products/${productId}`)
     .then(res => res.json())
     .then(data => {
       if (data.success && data.product) {
         populateForm(data.product); // Điền dữ liệu vào form
       } else {
         showNotification("Không thể tải thông tin sản phẩm.", false);
       }
     })
     .catch(err => {
       console.error("Lỗi khi lấy dữ liệu sản phẩm:", err);
       showNotification("Lỗi kết nối đến server!", false);
     });
 }
 
 function populateForm(product) {
    document.getElementById("product-name").value = product.product_name;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-description").value = product.product_description;
    document.getElementById("product-category").value = product.category_name || "Chưa phân loại";

    const productImage = document.getElementById("product-image");
    productImage.src = product.image_url 
        ? `http://localhost:3000/uploads/${product.image_url}` 
        : 'default-image-path.jpg';
}

function setupUpdateHandler(productId) {
    const updateBtn = document.getElementById("publish-product");
    updateBtn.addEventListener("click", () => {
      const product_name = document.getElementById("product-name").value;
      const price = parseInt(document.getElementById("product-price").value.replace(/[^0-9]/g, ''), 10);
      const product_description = document.getElementById("product-description").value;
      const category_name = document.getElementById("product-category").value;
  
      fetch(`http://localhost:3000/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_name, price, product_description, category_name }),
      })
        .then(res => res.json())
        .then(data => {
          showNotification(data.message, data.success);
        })
        .catch(err => {
          console.error("Lỗi khi cập nhật:", err);
          showNotification("Lỗi kết nối server!", false);
        });
    });
  }
  

// ✅ Hiển thị thông báo (dùng chung cho tất cả)
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



//Hiển thị thông báo
  function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.style.display = "block";
    notification.style.backgroundColor = isSuccess ? "#d4edda" : "#f8d7da";
    notification.style.color = isSuccess ? "#155724" : "#721c24";
    notification.style.border = isSuccess ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
    notification.style.padding = "12px";
    notification.style.borderRadius = "8px";
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.zIndex = "9999";
    notification.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    notification.style.transition = "opacity 0.3s ease-in-out";
    
    // Ẩn sau 5 giây
    setTimeout(() => {
      notification.style.display = "none";
    }, 5000);
  }  



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

// Định nghĩa hàm setAdminFormValues
function setAdminFormValues(admin) {
    // Điền thông tin admin vào các trường trong form
    const adminnameInput = document.getElementById("adminname-input");
    const fullNameInput = document.getElementById("full-name-input");

    if (adminnameInput) adminnameInput.value = admin.adminname || "";
    if (fullNameInput) fullNameInput.value = admin.full_name || "";
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

// Định nghĩa hàm setupFileInput
function setupFileInput() {
    // Chọn tất cả các input file trên trang
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    // Lặp qua các input file và thêm sự kiện onchange
    fileInputs.forEach(input => {
        input.addEventListener('change', function(event) {
            const fileName = event.target.files[0] ? event.target.files[0].name : 'No file selected';
            console.log('File selected:', fileName);
        });
    });
}
