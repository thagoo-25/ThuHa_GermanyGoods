document.addEventListener("DOMContentLoaded", function () {
    const admin = JSON.parse(localStorage.getItem("admin"));
    initAdminInfo(admin);
    setupFileInput(); // 
    setupLogout();
    setupAddProductForm();
    loadProducts(); 
    setupDeleteProduct();
    loadCategories();
});

// Gán sự kiện mở modal khi click nút "Xóa"
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove")) {
        const productId = e.target.getAttribute("data-id");
        document.getElementById("product-id").textContent = productId;
        $('#deleteConfirmModal').modal('show');
    }
});

function loadCategories() {
  fetch('http://localhost:3000/categories')
    .then(res => res.json())
    .then(data => {
      console.log("Dữ liệu trả về từ server:", data);
      const select = document.getElementById("product-category");
      
      if (!Array.isArray(data)) {
        throw new Error("Kết quả trả về không phải là mảng.");
      }

      data.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Lỗi khi tải category:", err));
}



function setupDeleteProduct() {
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    confirmDeleteBtn.addEventListener("click", function () {
        const productId = document.getElementById("product-id").textContent;
        const token = JSON.parse(localStorage.getItem("admin"))?.token;

        fetch(`http://localhost:3000/products/${productId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.message === "Product deleted successfully") {
                showNotification("Xóa sản phẩm thành công!", true);

                // Ẩn modal
                $('#deleteConfirmModal').modal('hide');

                // Xóa dòng sản phẩm khỏi bảng
                const rowToDelete = document.querySelector(`a.remove[data-id="${productId}"]`)?.closest("tr");
                if (rowToDelete) rowToDelete.remove();
            } else {
                showNotification(data.error || "Xóa sản phẩm thất bại!", false);
            }
        })
        .catch(err => {
            console.error("Lỗi khi xóa:", err);
            showNotification("Lỗi kết nối đến server!", false);
        });
    });
}


// Cập nhật giao diện sản phẩm từ database
function loadProducts() {
    const tbody = document.querySelector(".product-table tbody");
    if (!tbody) return;
  
    // Xóa nội dung cũ (nếu cần làm mới)
    /*tbody.innerHTML = "";*/
  
    fetch("http://localhost:3000/products/all")
      .then((res) => res.json())
      .then((data) => {
        console.log("Dữ liệu trả về từ server:", data);
  
        // Kiểm tra và lặp qua mảng sản phẩm
        if (data.success && Array.isArray(data.products)) {
          data.products.forEach((product) => {
            const row = document.createElement("tr");
  
            row.innerHTML = `
              <td><input type="checkbox"></td>
              <td>${product.product_id}</td>
              <td class="product-info">
                <img src="http://localhost:3000/uploads/${product.image_url}" alt="Sản phẩm">
                <div><strong>${product.product_name}</strong></div>
              </td>
              <td>${formatSales(product.sales)}</td>
              <td>${Number(product.price).toLocaleString()} đ 
                  <span class="discount">${product.discount || ""}</span>
              </td>
              <td>${Number(product.quantity).toLocaleString()}</td>
              <td>
                <a href="/frontend/html/updateProduct.html?id=${product.product_id}">Cập nhật</a> | 
                <a href="#" class="remove" data-id="${product.product_id}">Xóa</a>
              </td>
            `;
  
            tbody.appendChild(row);
          });
        } else {
          console.error("Không có sản phẩm nào để hiển thị.");
        }
      })
      .catch((err) => {
        console.error("Lỗi khi load sản phẩm:", err);
      });
  }
  
  // Định dạng doanh số
  function formatSales(sales) {
    if (!sales) return "0";
    const k = sales / 1000;
    return k >= 1 ? `${k.toFixed(1)}k` : sales;
  }
  
  
// Hàm hiển thị thông báo
function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.style.display = "block";
    notification.style.backgroundColor = isSuccess ? "#d4edda" : "#f8d7da";
    notification.style.color = isSuccess ? "#155724" : "#721c24";
    notification.style.border = isSuccess ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
  
    // Ẩn thông báo sau 3 giây
    setTimeout(() => {
      notification.style.display = "none";
    }, 5000);
  }  


// ✅ Hàm gọi khi click "Thêm sản phẩm mới"
function setupAddProductForm() {
    const openButton = document.getElementById("add-product-button"); // ✅ Sửa ID ở đây
    const modal = document.getElementById("productModal");
    const closeButton = document.getElementById("close-form");
  
    if (!openButton || !modal || !closeButton) return;
  
    // Mở modal khi bấm nút "Thêm sản phẩm"
    openButton.addEventListener("click", () => {
      modal.style.display = "block";
    });
  
    // Đóng modal khi bấm nút đóng (dấu x)
    closeButton.addEventListener("click", () => {
      modal.style.display = "none";
    });
  
    // Đóng modal khi click ra ngoài modal
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  
    // Xử lý khi ấn nút "Đăng"
    const publishButton = document.getElementById("publish-product");
    if (publishButton) {
        publishButton.addEventListener("click", () => { 
            const form = document.getElementById("addProductForm");
            form.addEventListener("submit", function (e) {
              
              e.preventDefault(); // chặn reload
              const formData = new FormData(form);
              const token = JSON.parse(localStorage.getItem("admin"))?.token;
              const modal = document.getElementById("productModal"); // 🔥 thêm dòng này
          
              fetch("http://localhost:3000/products/addProduct", {
                method: "POST",
                body: formData,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((res) => res.json())
                .then((data) => {
                    console.log("Server response:", data); // để debug
                  
                    if (data.success || data.message === "Product added") {
                      modal.style.display = "none";
                      showNotification("Thêm sản phẩm thành công!", true);
                      loadProducts();
                    } else if (data.error) {
                      // Hiển thị lỗi cụ thể từ server trả về
                      showNotification(`Lỗi: ${data.error}`, false);
                    } else {
                      // Trường hợp không xác định
                      showNotification("Thêm sản phẩm thất bại! Lỗi không rõ nguyên nhân.", false);
                      modal.style.display = "none";
                    }
                  })                  
                .catch((error) => {
                  console.error("Lỗi:", error);
                  showNotification("Lỗi kết nối đến server!", false);
                  modal.style.display = "none";
                });
            });
          });          
    }
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
