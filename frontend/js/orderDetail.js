// [Note 0] Lấy orderId từ query URL
function getOrderIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// [Note 1] Sự kiện khi trang đã tải xong: lấy admin từ localStorage, hiển thị và setup logout
document.addEventListener("DOMContentLoaded", function () {
    const admin = JSON.parse(localStorage.getItem("admin"));

    const orderId = getOrderIdFromURL();
    if (orderId) {
        fetchOrderDetail(orderId);
    } else {
        showNotification("Không tìm thấy mã đơn hàng trong URL", false);
    }

    initAdminInfo(admin);
    setupLogout();
});

// [Note 2] Khởi tạo thông tin admin: cập nhật avatar, tên hiển thị, form dữ liệu, ẩn/hiện block
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

        //setAdminFormValues(admin); // hàm chưa thấy định nghĩa

        if (admin.avatar) {
            document.getElementById("avatar-preview").src = `http://localhost:3000/${admin.avatar}`;
        }
    } else {
        if (adminInfo) adminInfo.style.display = "none";
        if (defaultName) defaultName.style.display = "inline-block";
    }
    console.log("LocalStorage admin:", admin);
}

// [Note 3] Toggle hiển thị dropdown menu admin khi click vào ảnh/username
function myFunction() {
    document.getElementById("admin-dropdown").classList.toggle("show");
}

// [Note 4] Đóng dropdown nếu người dùng click ra ngoài khu vực admin info
window.onclick = function (event) {
    if (!event.target.closest("#admin-Info")) { 
        const dropdown = document.getElementById("admin-dropdown");
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
        }
    }
};

// [Note 5] Gửi request logout tới server, xóa localStorage và chuyển về homepage
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

// [Note 6] Hiển thị thông báo (notification) thành công hoặc lỗi, tự động ẩn sau 5 giây
function showNotification(message, isSuccess) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
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

// [Note 7] Hàm fetch chi tiết đơn hàng theo orderId
function fetchOrderDetail(orderId) {
    fetch(`http://localhost:3000/order/order-info/${orderId}`)
        .then(response => {
            if (!response.ok) throw new Error("Không tìm thấy đơn hàng");
            return response.json();
        })
        .then(result => {
            console.log("Kết quả fetch:", result);
            if (result.success && result.data) {
              renderOrderDetail(result.data);
            } else {
              showNotification("Không thể lấy dữ liệu đơn hàng", false);
            }
          })
          .catch(err => {
            console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
            showNotification("Không thể tải dữ liệu đơn hàng", false);
          });
}

// [Note 8] Hàm render chi tiết đơn hàng ra giao diện
function renderOrderDetail(orderData) {
    const { items, order } = orderData;

    if (!Array.isArray(items)) {
    showNotification("Chi tiết đơn hàng thiếu danh sách sản phẩm", false);
    console.error("Chi tiết đơn hàng thiếu 'items':", orderData);
    return;
  }

  // Thay vì innerHTML chứa cả <strong>, chỉ render phần timeline thôi
document.querySelector(".status span").textContent = order.order_status;
document.getElementById('timeline-anchor').innerHTML = renderTimeline(order.order_status);


    // 1) Chọn wrapper và build toàn bộ layout
  const wrapper = document.getElementById('order-detail-wrapper');
  if (!wrapper) {
    console.error('Không tìm thấy #order-detail-wrapper trong DOM');
    return;
  }

  const totalProducts = items.length;
  wrapper.innerHTML = `
    <div class="order-detail-page">
      <div class="order-info">
        <p><strong>Mã đơn hàng:</strong> ${order.order_code}</p>
        <p><strong>Địa chỉ nhận hàng:</strong><br>
          ${order.customer_name}, ${order.customer_phone}<br>
          ${order.shipping_address}
        </p>
        <p><strong>Thông tin vận chuyển:</strong><br>
          Giao hàng quốc tế<br>
        Tổng: ${totalProducts} sản phẩm${totalProducts>1?'':''}
        </p>
      </div>

      <div class="order-status">
        <div class="user">
          <img src="${order.user_avatar ? `http://localhost:3000/${order.user_avatar}` : ''}" alt="avatar" />
          <span>${order.username}</span>
        </div>
        <div class="status-buttons">
          <button class="btn">Theo dõi</button>
          <button class="btn btn-chat">Chat ngay</button>
        </div>
      </div>

      <div class="payment-container">
        <div class="section">
          <div class="section-header">
            <span>🧾 Thông tin thanh toán</span>
            <a href="#">Xem lịch sử giao dịch</a>
          </div>

          <table class="product-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody id="product-tbody">
              <!-- JS sẽ đổ các <tr> vào đây -->
            </tbody>
          </table>

          <div class="totals" id="order-totals"></div>
        </div>

        <div class="section final">
          <div class="section-header">
            <span>💵 Số tiền cuối cùng</span>
          </div>
          <div class="summary" id="order-summary"></div>
        </div>
      </div>
    </div>
  `;

  // 2) Render các dòng sản phẩm vào tbody
  const tbody = document.getElementById('product-tbody');
  let totalProductPrice = 0;
  let index = 1;

  items.forEach(item => {
    const price     = item.product_price;               // giá gốc
    const qty       = item.order_quantity;              // số lượng đặt
    const lineTotal = price * qty;
    const isGift    = price === 0;
    const imgSrc    = item.product_image
      ? `http://localhost:3000/uploads/${item.product_image}`
      : '';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index++}</td>
      <td>
        <div class="product">
          <img src="${imgSrc}" alt="${item.product_name}" />
          <div class="details">
            ${isGift ? '<span class="gift">🎁 Quà tặng</span><br>' : ''}
            <div class="title">${item.product_name}</div>
          </div>
        </div>
      </td>
      <td>${price.toLocaleString()}₫</td>
      <td>${qty}</td>
      <td>${lineTotal.toLocaleString()}₫</td>
    `;
    tbody.appendChild(row);
    totalProductPrice += lineTotal;
  });

  // 3) Tính phí, voucher và in totals + summary
  const shippingFee = totalProductPrice >= 500000 ? 0 : 40000;
  const voucher     = order.voucher || 0;
  const totalPay    = totalProductPrice + shippingFee - voucher;

  document.getElementById('order-totals').innerHTML = `
    <div>Tổng tiền sản phẩm: <strong>₫${totalProductPrice.toLocaleString()}</strong></div>
    <div>Tổng phí vận chuyển ước tính: <strong>₫${shippingFee.toLocaleString()}</strong></div>
    <div class="highlight">Doanh thu đơn hàng ước tính: <strong class="price">₫${totalProductPrice.toLocaleString()}</strong></div>
  `;

  document.getElementById('order-summary').innerHTML = `
    <p><strong>Thanh toán của Người Mua</strong></p>
    <div class="line">Tổng tiền sản phẩm: <span>₫${totalProductPrice.toLocaleString()}</span></div>
    <div class="line">Phí vận chuyển: <span>₫${shippingFee.toLocaleString()}</span></div>
    <div class="line">Voucher: <span>-₫${voucher.toLocaleString()}</span></div>
    <div class="line total">Tổng tiền Thanh toán: <span class="price">₫${totalPay.toLocaleString()}</span></div>
  `;
}


// [Note 9] Hàm renderTimeline
function renderTimeline(currentStatus) {
  const STATUSES = [
    "Chờ xác nhận",
    "Chờ lấy hàng",
    "Đang giao hàng",
    "Giao hàng thành công",
    "Đánh Giá"
  ];

  const currentIndex = STATUSES.indexOf(currentStatus);

  return `
    ${STATUSES.map((label, i) => {
      const isCompleted = i <= currentIndex;
      return `
        <div class="step ${isCompleted ? 'completed' : ''}">
          <div class="icon">${
            i === 0 ? '📄' :
            i === 1 ? '💵' :
            i === 2 ? '🚚' :
            i === 3 ? '📦' : '⭐'
          }</div>
          <div class="label">${label}</div>
        </div>
        ${i < STATUSES.length - 1 ? '<div class="line"></div>' : ''}
      `;
    }).join('')}
  `;
}
