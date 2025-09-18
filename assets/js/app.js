// Central JS for products, cart, auth, theme, and pages

const PRODUCTS = [
  { id: 1, name: 'T-Shirt', price: 499, category: 'fashion', img: 'assets/images/fashion1.jpg' },
  { id: 2, name: 'Jeans', price: 1299, category: 'fashion', img: 'assets/images/fashion2.jpg' },
  { id: 3, name: 'Jacket', price: 2499, category: 'fashion', img: 'assets/images/fashion3.jpg' },
  { id: 4, name: 'Smartphone', price: 15999, category: 'electronics', img: 'assets/images/electronics1.jpg' },
  { id: 5, name: 'Laptop', price: 45999, category: 'electronics', img: 'assets/images/electronics2.jpg' },
  { id: 6, name: 'Bluetooth Speaker', price: 1799, category: 'electronics', img: 'assets/images/product8.jpg' },
  { id: 7, name: 'Cookware Set', price: 1999, category: 'home', img: 'assets/images/home1.jpg' },
  { id: 8, name: 'Vacuum Cleaner', price: 4499, category: 'home', img: 'assets/images/home2.jpg' },
  { id: 9, name: 'Table Lamp', price: 799, category: 'home', img: 'assets/images/home3.jpg' }
];

// Utilities
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));


// ---------------- Search form ----------------
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `products.html?search=${encodeURIComponent(q)}`;
      }
    });
  }
});

// ---------------- Cart functions ----------------
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const el = qs('#cartCount');
  if (el) el.innerText = getCart().reduce((s, i) => s + i.qty, 0);
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  const found = cart.find(i => i.id === id);
  if (found) {
    found.qty += qty;
  } else {
    cart.push({ id, qty });
  }

  saveCart(cart);
  showToast(p.name + ' added to cart');
}

function changeQty(id, qty) {
  const cart = getCart();
  const it = cart.find(i => i.id === id);
  if (!it) return;

  it.qty = Math.max(1, parseInt(qty) || 1);
  saveCart(cart);
  renderCartPage();
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCartPage();
}

// ---------------- Toast ----------------
function showToast(msg) {
  alert(msg);
}

// ---------------- Render products ----------------
function renderProductGrid(containerId = 'productList', filter = 'all', sort = 'name') {
  const container = qs('#' + containerId);
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const searchQuery = params.get("search")?.toLowerCase() || "";

  // Helper: highlight matching text
  function highlight(text) {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  let items = PRODUCTS.filter(p => 
    (filter === 'all' ? true : p.category === filter) &&
    (searchQuery ? p.name.toLowerCase().includes(searchQuery) || p.category.toLowerCase().includes(searchQuery) : true)
  );

  if (sort === 'low-high') items.sort((a, b) => a.price - b.price);
  if (sort === 'high-low') items.sort((a, b) => b.price - a.price);
  if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));

  if (items.length === 0) {
    container.innerHTML = `<p>No products found for "<b>${searchQuery}</b>"</p>`;
    return;
  }

  container.innerHTML = items.map(p => `
    <div class="col-md-4 mb-4">
      <div class="card h-100 p-3">
        <img src="${p.img}" class="product-img" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${highlight(p.name)}</h5>
          <p class="mb-1">₹${p.price}</p>
          <p class="text-muted small mb-2">Category: ${highlight(p.category)}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <a href="product.html?id=${p.id}" class="btn btn-outline-primary">View</a>
            <button class="btn btn-primary" onclick="addToCart(${p.id})">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}



// ---------------- Cart page render ----------------
function renderCartPage() {
  const el = qs('#cartItems');
  if (!el) return;

  const cart = getCart();
  if (cart.length === 0) {
    el.innerHTML = '<p>Your cart is empty.</p>';
    qs('#cartTotal').innerText = '0';
    return;
  }

  const rows = cart.map(ci => {
    const p = PRODUCTS.find(x => x.id === ci.id);
    return `
      <div class="card p-3 mb-2">
        <div class="row align-items-center">
          <div class="col-3"><img src="${p.img}" style="width:100%"></div>
          <div class="col-5">
            <h5>${p.name}</h5>
            <p>₹${p.price}</p>
          </div>
          <div class="col-4 d-flex flex-column align-items-end">
            <input type="number" value="${ci.qty}" min="1" style="width:90px"
              onchange="changeQty(${ci.id}, this.value)">
            <button class="btn btn-link text-danger mt-2"
              onclick="removeFromCart(${ci.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = rows;
  qs('#cartTotal').innerText = cart.reduce((s, i) =>
    s + (PRODUCTS.find(p => p.id === i.id).price * i.qty), 0
  );
}

// ---------------- Checkout summary ----------------
function renderCheckoutSummary() {
  const el = qs('#orderSummary');
  if (!el) return;

  const cart = getCart();
  if (cart.length === 0) {
    el.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  const rows = cart.map(ci => {
    const p = PRODUCTS.find(x => x.id === ci.id);
    return `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${p.name} x ${ci.qty} <span>₹${p.price * ci.qty}</span>
    </li>`;
  }).join('');

  el.innerHTML = `
    <ul class="list-group mb-3">${rows}</ul>
    <h5>Total: ₹${cart.reduce((s, i) => s + (PRODUCTS.find(p => p.id === i.id).price * i.qty), 0)}</h5>
  `;
}

// ---------------- Auth ----------------
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUser(u) {
  const users = getUsers();
  users.push(u);
  localStorage.setItem('users', JSON.stringify(users));
}

function loginUser(email, name) {
  localStorage.setItem('session', JSON.stringify({ email, name }));
}

function getSession() {
  return JSON.parse(localStorage.getItem('session') || 'null');
}

function logout() {
  localStorage.removeItem('session');
  location.href = 'index.html';
}

function initAuthForms() {
  const signup = qs('#signupForm');
  if (signup) {
    signup.addEventListener('submit', e => {
      e.preventDefault();
      const name = qs('#signupName').value.trim();
      const email = qs('#signupEmail').value.trim();
      const pw = qs('#signupPassword').value;
      const conf = qs('#signupConfirm').value;

      if (!name || !email || !pw) {
        alert('Fill all fields');
        return;
      }
      if (pw !== conf) {
        alert('Passwords do not match');
        return;
      }

      const users = getUsers();
      if (users.find(u => u.email === email)) {
        alert('Email already registered');
        return;
      }

      saveUser({ name, email, pw });
      alert('Account created. Please login.');
      location.href = 'login.html';
    });
  }

  const login = qs('#loginForm');
  if (login) {
    login.addEventListener('submit', e => {
      e.preventDefault();
      const email = qs('#loginEmail').value.trim();
      const pw = qs('#loginPassword').value;

      const users = getUsers();
      const u = users.find(x => x.email === email && x.pw === pw);

      if (!u) {
        alert('Invalid credentials');
        return;
      }

      loginUser(u.email, u.name);
      alert('Logged in');
      location.href = 'index.html';
    });
  }
}

// ---------------- Checkout protection ----------------
function requireLoginForCheckout() {
  const session = getSession();
  if (!session) {
    alert('Please login to continue to checkout');
    location.href = 'login.html';
    return false;
  }
  return true;
}

// ---------------- Checkout form & Invoice ----------------
function initCheckoutForm() {
  const form = qs('#checkoutForm');
  const invoiceSection = qs('#invoiceSection');
  const invoiceContent = qs('#invoiceContent');
  const downloadInvoice = qs('#downloadInvoice');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!requireLoginForCheckout()) return;

    const name = qs('#checkoutName').value.trim();
    const addr = qs('#checkoutAddress').value.trim();
    const pay = qs('#checkoutPayment').value.trim();

    if (!name || !addr || !pay) {
      alert('Please fill all fields');
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const orderId = "ORD-" + Date.now();
    const orderDate = new Date().toLocaleString();

    // Generate invoice HTML
    let invoiceHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin:auto; padding: 20px; color: #333; background:#fff; border:1px solid #ccc;">
        <!-- Header with logo -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <img src="assets/images/shop.png" alt="ShopEase Logo" style="height:60px;">
          <div style="text-align:right;">
            <h2 style="margin:0;">Invoice</h2>
            <p style="margin:2px 0;">Order ID: ${orderId}</p>
            <p style="margin:2px 0;">Date: ${orderDate}</p>
          </div>
        </div>

        <!-- Customer info -->
        <div style="margin-bottom:20px;">
          <h4>Billing To:</h4>
          <p style="margin:2px 0;">${name}</p>
          <p style="margin:2px 0;">${addr}</p>
          <p style="margin:2px 0;"><strong>Payment Method:</strong> ${pay}</p>
        </div>

        <!-- Items Table with Images -->
        <table style="width:100%; border-collapse: collapse; margin-bottom:20px;">
          <thead style="background:#f5f5f5;">
            <tr>
              <th style="border:1px solid #ccc; padding:8px; text-align:left;">Item</th>
              <th style="border:1px solid #ccc; padding:8px; text-align:center;">Image</th>
              <th style="border:1px solid #ccc; padding:8px; text-align:center;">Qty</th>
              <th style="border:1px solid #ccc; padding:8px; text-align:right;">Price</th>
              <th style="border:1px solid #ccc; padding:8px; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    let grandTotal = 0;
    cart.forEach((item, idx) => {
      const p = PRODUCTS.find(x => x.id === item.id);
      const itemTotal = p.price * item.qty;
      grandTotal += itemTotal;

      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';

      invoiceHTML += `
        <tr style="background:${rowBg};">
          <td style="border:1px solid #ccc; padding:8px;">${p.name}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">
            <img src="${p.img}" alt="${p.name}" style="height:50px;">
          </td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">${item.qty}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₹${p.price}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₹${itemTotal}</td>
        </tr>
      `;
    });

    invoiceHTML += `
          </tbody>
        </table>

        <!-- Total section -->
        <div style="text-align:right; font-size:16px; font-weight:bold; margin-bottom:20px;">
          Grand Total: ₹${grandTotal}
        </div>

        <!-- Footer -->
        <div style="text-align:center; font-size:12px; color:#666;">
          Thank you for shopping with ShopEase!<br>
          Visit us again at www.shopease.com
        </div>
      </div>
    `;

    invoiceContent.innerHTML = invoiceHTML;
    invoiceSection.classList.remove('d-none');
    invoiceSection.scrollIntoView({ behavior: 'smooth' });

    // Clear cart after showing invoice
    localStorage.removeItem('cart');
    updateCartCount();

    alert('Order placed successfully!');
  });

  // Download PDF
  if (downloadInvoice) {
    downloadInvoice.addEventListener('click', () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      html2canvas(invoiceContent, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = doc.internal.pageSize.getWidth();
        const imgHeight = canvas.height * imgWidth / canvas.width;
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        doc.save('ShopEase-Invoice.pdf');
      });
    });
  }
}



// ---------------- Theme (dark mode) ----------------
function initTheme() {
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');

  const toggles = qsa('#darkModeToggle');
  toggles.forEach(btn => btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }));
}

// ---------------- Product detail ----------------
function renderProductDetail() {
  const el = qs('#productDetail');
  if (!el) return;

  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id'));
  const p = PRODUCTS.find(x => x.id === id);

  if (!p) {
    el.innerHTML = '<p>Product not found</p>';
    return;
  }

  el.innerHTML = `
    <div class="row">
      <div class="col-md-6"><img src="${p.img}" class="img-fluid"></div>
      <div class="col-md-6">
        <h2>${p.name}</h2>
        <p>₹${p.price}</p>
        <p>Category: ${p.category}</p>
        <div class="d-flex gap-2">
          <input id="qtyInput" type="number" value="1" min="1" class="form-control w-25">
          <button class="btn btn-primary" id="addCartBtn">Add to cart</button>
        </div>
      </div>
    </div>
  `;

  const btn = qs('#addCartBtn');
  if (btn) btn.addEventListener('click', () => {
    const q = parseInt(qs('#qtyInput').value) || 1;
    addToCart(p.id, q);
  });
}

// ---------------- Init ----------------
window.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initTheme();
  renderProductGrid();
  renderProductGrid('productList', 'all', 'name');
  renderCartPage();
  renderCheckoutSummary();
  initAuthForms();
  initCheckoutForm();
  renderProductDetail();

  // Category & sort controls
  const cat = qs('#categoryFilter');
  const sort = qs('#sortFilter');
  if (cat && sort) {
    cat.addEventListener('change', () => renderProductGrid('productList', cat.value, sort.value));
    sort.addEventListener('change', () => renderProductGrid('productList', cat.value, sort.value));
  }
});

// Newsletter form success message with auto-hide
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".newsletter-form");
  const message = document.getElementById("newsletterMessage");

  if (form && message) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show message
      message.style.display = "block";

      // Clear input
      form.reset();

      // Hide after 3 seconds
      setTimeout(() => {
        message.style.display = "none";
      }, 3000);
    });
  }
});

// Load footer dynamically
document.addEventListener("DOMContentLoaded", function () {
  fetch("footer.html")
    .then(response => response.text())
    .then(data => {
      document.body.insertAdjacentHTML("beforeend", data);
    });
});
