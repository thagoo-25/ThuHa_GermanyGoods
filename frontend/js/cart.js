document.addEventListener("DOMContentLoaded", () => {
  initApp();

  let selectedUserId = null;
  let selectedCartId = null;

  // Khởi tạo ứng dụng
  function initApp() {
      fetchProducts();
      handleUserDisplay();
      setupLogout();
      renderProducts();
      fetchCartData();
  }

  // Lấy dữ liệu giỏ hàng của người dùng
  function fetchCartData() {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      if (userId) {
          fetch(`http://localhost:3000/cart/${userId}`)
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      console.log("Giỏ hàng của user:", data);
                      renderCart(data.cart);
                  } else {
                      alert('Giỏ hàng trống');
                  }
              })
              .catch(error => {
                  console.error("Lỗi khi tải giỏ hàng:", error);
              });
      } else {
          alert("Bạn cần đăng nhập để xem giỏ hàng.");
      }
  }

  // Xử lý sự kiện mở modal khi click nút "Xóa"
  document.addEventListener("click", function (e) {
      if (e.target.classList.contains("remove")) {
        const row = e.target.closest("tr");
        const productId = row.dataset.productId;
          const cartId = e.target.getAttribute("data-cart-id");
          const user = JSON.parse(localStorage.getItem("user"));
          const userId = user?.id;

          if (!userId) {
              alert("Bạn cần đăng nhập để xóa sản phẩm!");
              return;
          }

          selectedUserId = userId;
          selectedCartId = cartId;

          $('#deleteConfirmModal').data('cartIds', [cartId]);
          document.getElementById("product-id").textContent = productId;
          $('#deleteConfirmModal').modal('show');
      }
  });

  // Xử lý xác nhận xóa sản phẩm
  document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      if (!userId) {
          alert("Bạn cần đăng nhập để thực hiện thao tác này.");
          return;
      }

      const cartIds = $('#deleteConfirmModal').data('cartIds');
      cartIds.forEach(cartId => handleRemoveItem(userId, cartId));

      $('#deleteConfirmModal').modal('hide');
  });

  // Xử lý xóa sản phẩm từ giỏ hàng
  function handleRemoveItem(userId, cartId) {
      fetch(`http://localhost:3000/cart/removeItem/${userId}/${cartId}`, {
          method: 'DELETE'
      })
      .then(res => res.json())
      .then(data => {
          if (data.success) {
              const rowToDelete = document.querySelector(`tr[data-cart-id="${cartId}"]`);
              if (rowToDelete) rowToDelete.remove();
              updateTotalAmount();
          } else {
              showToast(data.error || 'Xóa sản phẩm thất bại.');
          }
      })
      .catch(err => {
          console.error("Lỗi khi gọi API xóa:", err);
          showToast("Không thể kết nối đến server.");
      });
  }

  // Xử lý tăng/giảm số lượng sản phẩm trong giỏ
  document.addEventListener("click", function (e) {
      if (e.target.classList.contains("increase") || e.target.classList.contains("decrease")) {
          handleQuantityChange(e);
      }
  });

  // Xử lý thay đổi số lượng sản phẩm
  function handleQuantityChange(e) {
      const isIncrease = e.target.classList.contains("increase");
      const ctrl = e.target.closest(".quantity-control");
      const input = ctrl.querySelector("input");
      let qty = parseInt(input.value, 10) || 0;
      const oldQty = qty;
      const cartId = e.target.dataset.id;
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      qty = isIncrease ? qty + 1 : Math.max(1, qty - 1);
      input.value = qty;

      const row = e.target.closest("tr");
      const priceText = row.querySelector('td:nth-child(3) strong').textContent;
      const unitPrice = parseCurrency(priceText);
      const newLineTotal = unitPrice * qty;
      row.querySelector('td:nth-child(5) strong').textContent = formatCurrency(newLineTotal);

      updateTotalAmount();

      if (userId && cartId) {
          updateQuantityInDB(userId, cartId, qty, oldQty, row);
      }

      e.preventDefault();
  }

  // Cập nhật số lượng lên server
  function updateQuantityInDB(userId, cartId, qty, oldQty, row) {
      fetch(`http://localhost:3000/cart/updateQuantity/${userId}/${cartId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: qty })
      })
      .then(r => r.json())
      .then(resp => {
          const existingError = row.querySelector('.qty-error');
          if (existingError) existingError.remove();

          if (!resp.success) {
              showToast(resp.error || 'Cập nhật thất bại');
              revertQuantity(oldQty, row);
          }
      })
      .catch(err => {
          console.error(err);
          showToast('Không thể kết nối đến server.');
          revertQuantity(oldQty, row);
      });
  }

  // Quay lại số lượng cũ và tính lại tổng tiền
  function revertQuantity(oldQty, row) {
      const input = row.querySelector('input');
      input.value = oldQty;
      const unitPrice = parseCurrency(row.querySelector('td:nth-child(3) strong').textContent);
      row.querySelector('td:nth-child(5) strong').textContent = formatCurrency(unitPrice * oldQty);
      updateTotalAmount();
  }

  // Xử lý thay đổi thủ công số lượng
  const cartContainer = document.querySelector('.cart-container');
  cartContainer.addEventListener('change', e => {
      if (!e.target.classList.contains('qty-input')) return;

      handleManualQuantityChange(e);
  });

  function handleManualQuantityChange(e) {
      const input = e.target;
      const tr = input.closest('tr');
      const oldQty = parseInt(input.dataset.old, 10);
      const maxStock = parseInt(tr.dataset.stock, 10);

      let newValStr = input.value.trim();

      if (!/^[1-9]\d*$/.test(newValStr)) {
          showToast('Số lượng phải là số nguyên dương.');
          input.value = oldQty;
          return;
      }

      const newQty = parseInt(newValStr, 10);

      if (newQty > maxStock) {
          showToast(`Chỉ còn ${maxStock} sản phẩm trong kho.`);
          input.value = oldQty;
          return;
      }

      input.dataset.old = newQty;
      const unitPrice = parseCurrency(tr.querySelector('td:nth-child(3) strong').textContent);
      tr.querySelector('td:nth-child(5) strong').textContent = formatCurrency(unitPrice * newQty);
      updateTotalAmount();

      const cartId = tr.dataset.cartId;
      if (!cartId) return;

      const userId = JSON.parse(localStorage.getItem('user')).id;
      input.disabled = true;

      updateQuantityInDB(userId, cartId, newQty, oldQty, tr);
  }

  // Xử lý xóa hàng loạt sản phẩm
  document.querySelector('.cart-footer .remove').addEventListener('click', function () {
      const checkedRows = document.querySelectorAll('tbody input[type="checkbox"]:checked');

      if (checkedRows.length === 0) {
          showToast('Bạn chưa chọn sản phẩm nào để xóa!');
          return;
      }

      document.getElementById('deleteConfirmModal').classList.add('show');
      document.getElementById('product-id').textContent = `${checkedRows.length} sản phẩm`;

      const selectedCartIds = [];
      checkedRows.forEach(cb => {
          const row = cb.closest("tr");
          selectedCartIds.push(row.dataset.cartId);
      });

      $('#deleteConfirmModal').data('cartIds', selectedCartIds);
  });
});


//--------------------------------- Hàm xử lý checkout-----------------------------------
function handleCheckout() {
  const selectedProducts = [];

  // Duyệt tất cả checkbox trong tbody được chọn
  document.querySelectorAll("tbody input[type='checkbox']:checked").forEach(cb => {
      const row = cb.closest("tr");

      const product = {
          name: row.querySelector(".product span")?.textContent.trim() || "",
          image: row.querySelector(".product img")?.src || "",
          price: row.querySelector("td:nth-child(3) strong")?.textContent.trim() || "",
          quantity: row.querySelector(".qty-input")?.value || "1",
          total: row.querySelector("td:nth-child(5) strong")?.textContent.trim() || "",
          productId: row.querySelector(".remove")?.dataset.productId || "",
          cartId: row.dataset.cartId || ""
      };

      selectedProducts.push(product);
  });

  // Lưu danh sách sản phẩm đã chọn vào localStorage
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

  // Đặt cờ để mở modal khi sang trang order.html
  localStorage.setItem("openModal", "true");

  // Chuyển hướng đến trang order.html
  window.location.href = "/frontend/html/order.html";
}

// Gắn sự kiện click cho nút "Mua hàng"
document.getElementById("checkoutBtn").addEventListener("click", handleCheckout);


//----------------------------Tạo container cho toast (chạy một lần)---------------------------
function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      Object.assign(c.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
      });
      document.body.appendChild(c);
    }
    return c;
  }
  
  //-------------------- Hàm show toast------------------------------------------
  function showToast(msg, type = 'error') {
    const container = ensureToastContainer();
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    container.appendChild(t);
    // tự ẩn sau 3 giây
    setTimeout(() => {
      t.classList.add('fade-out');
      setTimeout(() => t.remove(), 500);
    }, 3000);
  }
  

//---------------------------- Hàm xóa sản phẩm trong giỏ hàng--------------------------------
function deleteCartItem(userId, cartId) {
    fetch(`http://localhost:3000/cart/removeItem/${userId}/${cartId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Xóa dòng sản phẩm khỏi bảng
            const rowToDelete = document.querySelector(`.remove[data-cart-id="${cartId}"]`)?.closest('tr');
            if (rowToDelete) rowToDelete.remove();

            updateTotalAmount();

            $('#deleteConfirmModal').modal('hide');
        } else {
            alert(data.error || 'Xóa sản phẩm thất bại.');
        }
    })
    .catch(err => {
        console.error("Lỗi khi gọi API xóa:", err);
        alert("Lỗi khi xóa sản phẩm.");
    });
}

function parseCurrency(str) {
    return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
  }

//function updateTotalAmount() {
    const rows = document.querySelectorAll('.cart-container tbody tr');
    let total = 0;
  
    rows.forEach(row => {
      const amountEl = row.querySelector('td:nth-child(5) strong');
      if (amountEl) {
        total += parseCurrency(amountEl.textContent);
      }
    });
  
    document.getElementById('total-amount').textContent = formatCurrency(total);
  //}

  function updateTotalAmount() {
    const checkedRows = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    let total = 0;
  
    checkedRows.forEach(cb => {
      const row = cb.closest("tr");
      const amountText = row.querySelector("td:nth-child(5) strong").textContent;
      total += parseCurrency(amountText);
    });
  
    const count = checkedRows.length;
    document.getElementById("total-amount").innerHTML =
      `Tổng cộng (${count} Sản phẩm): <strong>${formatCurrency(total)}</strong>`;
  
    // Cập nhật số lượng sau "Chọn tất cả (X)"
    document.querySelector('.cart-footer input[type="checkbox"] + span')
      .textContent = `Chọn tất cả (${count})`;
  }
  
  // Hàm parse giá kiểu 687.000₫ → 687000
  function parseCurrency(str) {
    return parseInt(str.replace(/[^\d]/g, ""), 10) || 0;
  }
  
  // Hàm format kiểu 687000 → 687.000₫
  function formatCurrency(num) {
    return num.toLocaleString("vi-VN") + "₫";
  }
  
  // Gán sự kiện cho checkbox từng sản phẩm
  document.addEventListener("change", function (e) {
    if (e.target.matches('tbody input[type="checkbox"]')) {
      updateTotalAmount();
  
      // Nếu tất cả checkbox con đều được chọn, thì tự chọn checkbox "chọn tất cả"
      const allBoxes = document.querySelectorAll('tbody input[type="checkbox"]');
      const checkedBoxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
      document.querySelector('.cart-footer input[type="checkbox"]').checked = (allBoxes.length === checkedBoxes.length);
    }
  });
  
  // Sự kiện "Chọn tất cả"
  document.querySelector('.cart-footer input[type="checkbox"]').addEventListener('change', function () {
    const isChecked = this.checked;
    const allBoxes = document.querySelectorAll('tbody input[type="checkbox"]');
    allBoxes.forEach(cb => cb.checked = isChecked);
    updateTotalAmount();
  });
  

//---------------- Hàm hiển thị giỏ hàng--------------------
function renderCart(cartItems) {
    const tbody = document.querySelector('.cart-container tbody');
    //tbody.innerHTML = ''; // Xoá nội dung giỏ hàng cũ

    let totalAmount = 0;

    cartItems.forEach(item => {
        const productTotal = item.price * item.quantity;
        totalAmount += productTotal;

        const row = `
<tr data-cart-id="${item.cart_id}" data-stock="${item.product_stock}" data-product-id="${item.product_id}">
    <td><input type="checkbox"></td>
    <td>
        <div class="product">
            <img src="http://localhost:3000/uploads/${item.image_url}" alt="${item.product_name}">
            <span>${item.product_name}</span>
        </div>
    </td>
    <td><strong>${formatCurrency(item.price)}</strong></td>
    <td>
        <div class="quantity-control">
            <button class="decrease" data-id="${item.cart_id}">-</button>
            <input type="text" class="qty-input" data-old="${item.quantity}" value="${item.quantity}">
            <button class="increase" data-id="${item.cart_id}">+</button>
        </div>
    </td>
    <td><strong>${formatCurrency(productTotal)}</strong></td>
    <td><span class="remove" data-cart-id="${item.cart_id}" data-product-id="${item.product_id}">Xóa</span></td>
</tr>
`;

        tbody.innerHTML += row;
    });

    // Cập nhật tổng số tiền
    document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
}

//----------------------------------- Hàm định dạng tiền tệ------------------------------------------------
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}


//------------------------------------Hàm lấy danh sách sản phẩm từ API và hiển thị trên trang--------------------------------------------
function fetchProducts() {
    fetch("http://localhost:3000/products/list")
        .then(response => response.json())
        .then(data => {
            renderProducts("best-seller", data, 5);
        })
        .catch(error => console.error("Lỗi tải dữ liệu:", error));
}

//-----------------------------------Hàm hiển thị danh sách sản phẩm theo danh mục----------------------------------------
function renderProducts(sectionId, products, limit) {
    const container = document.getElementById(sectionId);
    if (!container) return;
    
    //container.innerHTML = "";
    products.slice(0, limit).forEach(product => {
        const productBox = document.createElement("div");
        productBox.classList.add("product-box");

        productBox.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-category">${product.category}</h3>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price}</p>
        `;

        // Thêm sự kiện click để chuyển hướng đến trang chi tiết sản phẩm
        productBox.addEventListener("click", function() {
            const productId = this.getAttribute("data-id");
            window.location.href = `/frontend/html/product.html?id=${productId}`;
        });

        container.appendChild(productBox);
    });
}

//----------------------------------- Hàm xử lý hiển thị thông tin người dùng dựa trên localStorage--------------------------------------
function handleUserDisplay() {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const userInfo = document.getElementById("user-info");
    const usernameElement = document.getElementById("username");
    const loginButton = document.querySelector(".login-btn");

    if (user) {
        const link = document.getElementById("view-orders-link");
        if (link) {
            link.href = `/frontend/html/viewOrder.html?id=${user.id}`;
        }
    }

    if (user) {
        if (usernameElement) usernameElement.textContent = user.username; // Hiển thị tên người dùng
        if (userInfo) userInfo.style.display = "inline-flex"; // Hiển thị khu vực thông tin người dùng
        if (loginButton) loginButton.style.display = "none"; // Ẩn nút đăng nhập
    } else {
        if (userInfo) userInfo.style.display = "none"; // Ẩn khu vực người dùng nếu chưa đăng nhập
        if (loginButton) loginButton.style.display = "inline-block"; // Hiển thị nút đăng nhập
    }

    console.log('localStorage user:', user);
}


//---------------------------- Hàm xử lý hiển thị hoặc ẩn dropdown menu của người dùng-----------------------------
function myFunction() {
    document.getElementById("user-dropdown")?.classList.toggle("show");
}

// Sự kiện đóng dropdown khi click ra ngoài
window.addEventListener("click", event => {
    if (!event.target.closest("#user-info")) {
        document.getElementById("user-dropdown")?.classList.remove("show");
    }
});

//-------------------------------- Hàm xử lý logout người dùng-------------------------------------------------------
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", event => {
        event.preventDefault();

        fetch("http://localhost:3000/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        })
        .then(response => response.json())
        .then(data => {
            console.log("Logout response:", data);
            localStorage.removeItem("user"); // Xóa thông tin người dùng khỏi localStorage
            window.location.href = "/frontend/html/homepage.html"; // Chuyển hướng về trang chủ
        })
        .catch(error => console.error("Lỗi khi logout:", error));
    });
}
