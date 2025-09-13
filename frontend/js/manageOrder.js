document.addEventListener("DOMContentLoaded", function () {
    const admin = JSON.parse(localStorage.getItem("admin"));
    
    initAdminInfo(admin);        // 1. Hiển thị thông tin admin
    setupLogout();               // 2. Xử lý đăng xuất
    //fetchAndRenderOrder();       // 10. Lấy & hiển thị đơn hàng nếu có
    fetchAndRenderAllOrders();    // 11. Lấy & hiển thị danh sách đơn hàng (admin)
});

// =========================== 1. Hiển thị thông tin Admin ===========================
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

        //setAdminFormValues(admin);

        if (admin.avatar) {
            document.getElementById("avatar-preview").src = `http://localhost:3000/${admin.avatar}`;
        }
    } else {
        if (adminInfo) adminInfo.style.display = "none";
        if (defaultName) defaultName.style.display = "inline-block";
    }

    console.log("LocalStorage admin:", admin);
}

// =========================== 2. Xử lý đăng xuất cho admin ===========================
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
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
}

// =========================== 3. Dropdown menu: mở & tự động đóng ===========================
function myFunction() {
    document.getElementById("admin-dropdown").classList.toggle("show");
}

window.onclick = function (event) {
    if (!event.target.closest("#admin-Info")) {
        const dropdown = document.getElementById("admin-dropdown");
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
        }
    }
};

// =========================== 4. Hiển thị thông báo notification ===========================
function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");

    notification.textContent = message;
    notification.style.display = "block";

    if (isSuccess) {
        notification.style.backgroundColor = "#d4edda";
        notification.style.color = "#155724";
        notification.style.border = "1px solid #c3e6cb";
    } else {
        notification.style.backgroundColor = "#f8d7da";
        notification.style.color = "#721c24";
        notification.style.border = "1px solid #f5c6cb";
    }

    notification.style.borderRadius = "5px";
    notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

    setTimeout(() => {
        notification.style.display = "none";
    }, 5000);
}

// =========================== 10. Lấy và hiển thị đơn hàng dựa trên orderId (nếu có) ===========================
async function fetchAndRenderOrder() {
    const orderId = getOrderIdFromURL();
    if (!orderId) return;

    try {
        const response = await fetch(`http://localhost:3000/order/${orderId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Không thể lấy đơn hàng.");
        }

        const { order, items } = result.data;
        renderOrderInfo(order);
        renderOrderItems(items);
    } catch (err) {
        console.error("Lỗi khi fetch đơn hàng:", err.message);
        const errorBox = document.getElementById("order-error");
        if (errorBox) errorBox.textContent = err.message;
    }
}

// Lấy orderId từ URL (ví dụ: order.html?id=5)
function getOrderIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// Hiển thị thông tin đơn hàng
function renderOrderInfo(order) {
    const infoBox = document.getElementById("order-info");
    if (!infoBox) return;

    infoBox.innerHTML = `
        <p><strong>Mã đơn:</strong> ${order.order_code}</p>
        <p><strong>Ngày đặt:</strong> ${new Date(order.order_date).toLocaleString()}</p>
        <p><strong>Tổng tiền:</strong> ₫${order.total_amount.toLocaleString()}</p>
        <p><strong>Trạng thái:</strong> ${order.order_status}</p>
    `;
}

// Hiển thị các sản phẩm trong đơn hàng
function renderOrderItems(items) {
    const container = document.getElementById("order-items");
    if (!container) return;

    container.innerHTML = "";
    items.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("order-product");
        div.innerHTML = `
            <img src="${item.product_image}" alt="product">
            <div class="info">
                <p class="name">${item.product_name}</p>
                <p class="quantity">x${item.quantity}</p>
                <p class="price">₫${item.price.toLocaleString()}</p>
            </div>
        `;
        container.appendChild(div);
    });
}


// Định nghĩa mảng mapping trạng thái ↔ stage và nhãn nút
const STATUS_FLOW = [
    "Chờ xác nhận",         // stage 0
    "Đang xếp hàng",        // stage 1
    "Chờ lấy hàng",         // stage 2
    "Đang giao hàng",       // stage 3
    "Giao hàng thành công"  // stage 4
  ];
  const LABEL_FLOW = [
    "Xác nhận đơn hàng",       // hành động khi stage = 0
    "Hoàn thành xếp hàng",     // khi stage = 1
    "ĐVVC đã lấy hàng",        // khi stage = 2
    "Giao hàng thành công",    // khi stage = 3
    "Xem chi tiết đơn hàng"    // khi stage = 4
  ];


// =========================== 11. Lấy và hiển thị danh sách đơn hàng (cho admin) ===========================
function fetchAndRenderAllOrders() {
    fetch("http://localhost:3000/order/all-orders")
    .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Không thể lấy danh sách đơn hàng.");
        }

        return result;
    })
    .then(result => {
        const orders = result.data;

        const ordersContainer = document.getElementById("orders-container");
        const ordersCount = document.getElementById("orders-count");

        if (!ordersContainer) {
            console.error("Không tìm thấy phần tử 'orders-container'");
            return;
        }

        ordersContainer.innerHTML = ""; // Xoá trước khi render

        // Cập nhật số lượng đơn
        if (ordersCount) {
            ordersCount.textContent = `${orders.length} Đơn hàng`;
        }


            orders.forEach(order => {
                // 1. Tìm stage hiện tại dựa vào order_status
                const stage = STATUS_FLOW.indexOf(order.order_status);
                // Nếu không khớp, mặc định về 0
                const currentStage = stage >= 0 ? stage : 0;
                // Nút label cho bước tiếp theo
                const nextLabel = LABEL_FLOW[currentStage];

                const orderElement = document.createElement("div");
                orderElement.classList.add("order-item");

                orderElement.innerHTML = `
                    <div class="order-user">
                        <span>${order.username}</span>
                        <span>Mã đơn hàng: ${order.order_code}</span>
                    </div>

                    <div class="order-products">
                        ${order.items.map(item => `
                          <div class="order-product" data-order-id="${order.order_id}">
                              <img src="http://localhost:3000/uploads/${item.product_image}" alt="${item.product_name}">
                              <div class="info">
                                  <p class="name">${item.product_name}</p>
                                  <p class="quantity">x${item.quantity}</p>
                              </div>
                          </div>
                        `).join('')}
                    </div>

                    <div class="order-price">
                        <p>₫${order.total_amount.toLocaleString()}</p>
                    </div>

                    <div class="order-status">
                    <p class="status-text">${order.order_status}</p>
                    </div>

                    <div class="order-shipping">
                       <p>${new Date(order.order_date).toLocaleString()}</p>
                       </div>

                    <div class="order-actions">
  ${
    currentStage < 4
    ? `<button class="action-btn"
                data-order-id="${order.order_id}"
                data-stage="${currentStage}">
         ${nextLabel}
       </button>
       <button class="cancel-btn"
               data-order-id="${order.order_id}">
         Hủy đơn hàng
       </button>`
    : `<a href="/frontend/html/orderDetail.html?id=${order.order_id}"
          class="view-detail-btn">
         Xem chi tiết đơn hàng
       </a>`
  }
</div>
                `;

                ordersContainer.appendChild(orderElement);
            });

            document.querySelectorAll('.order-product').forEach(item => {
                item.addEventListener('click', function () {
                    const orderId = this.getAttribute('data-order-id');
                    if (orderId) {
                        window.location.href = `/frontend/html/orderDetail.html?id=${orderId}`;
                    } else {
                        console.warn("Không tìm thấy orderId trong data-order-id");
                    }
                });
            });  
        })
        .catch(err => {
            console.error("Lỗi khi fetch danh sách đơn hàng:", err.message);
            showNotification(err.message, false);
        });      
}

// Sau khi render xong tất cả orders
document.getElementById('orders-container').addEventListener('click', e => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
  
    const orderId  = btn.dataset.orderId;
    const stage    = Number(btn.dataset.stage);
    let newStatus, nextStage, nextLabel;
  
    // Xác định bước kế tiếp
    switch(stage) {
      case 0:
        newStatus = 'Đang xếp hàng';
        nextStage = 1;
        nextLabel = 'Hoàn thành xếp hàng';
        break;
      case 1:
        newStatus = 'Chờ lấy hàng';
        nextStage = 2;
        nextLabel = 'ĐVVC đã lấy hàng';
        break;
      case 2:
        newStatus = 'Đang giao hàng';
        nextStage = 3;
        nextLabel = 'Giao hàng thành công';
        break;
      case 3:
        newStatus = 'Giao hàng thành công';
        nextStage = 4;
        nextLabel = 'Xem chi tiết đơn hàng';
        break;
      default:
        return;
    }
  
    // Gọi API cập nhật status
    fetch(`http://localhost:3000/order/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStatus })
    })
    .then(res => {
      if (!res.ok) throw new Error('Cập nhật thất bại');
      return res.json();
    })
    .then(() => {
      // 1. Cập nhật UI: status text
      const orderItem = btn.closest('.order-item');
      orderItem.querySelector('.status-text').textContent = newStatus;
  
      // 2. Cập nhật nút hành động
      btn.dataset.stage = nextStage;
      btn.textContent = nextLabel;
  
      // 3. Nếu đã bước cuối (stage 4), chuyển nút sang link chi tiết
      if (nextStage === 4) {
        btn.outerHTML = `<a href="/frontend/html/orderDetail.html?id=${orderId}" class="view-detail-btn">Xem chi tiết đơn hàng</a>`;
      }
  
      showNotification(`Cập nhật: ${newStatus}`, true);
    })
    .catch(err => {
      console.error(err);
      showNotification(err.message, false);
    });
  });


  