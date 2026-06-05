const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const menuSection = document.getElementById('menuSection');
const orderSection = document.getElementById('orderSection');
const salesSection = document.getElementById('salesSection');
const logoutBtn = document.getElementById('logoutBtn');
const hotelGreeting = document.getElementById('hotelGreeting');
const todaySales = document.getElementById('todaySales');
const todayOrders = document.getElementById('todayOrders');
const menuCount = document.getElementById('menuCount');
const reportSales = document.getElementById('reportSales');
const reportOrders = document.getElementById('reportOrders');
const salesHistory = document.getElementById('salesHistory');
const menuItemsList = document.getElementById('menuItemsList');
const orderMenuItems = document.getElementById('orderMenuItems');
const orderCartList = document.getElementById('orderCartList');
const orderTotal = document.getElementById('orderTotal');
const orderItemCount = document.getElementById('orderItemCount');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const completeOrderBtn = document.getElementById('completeOrderBtn');
const tableStatusGrid = document.getElementById('tableStatusGrid');
const tableOrderBanner = document.getElementById('tableOrderBanner');
const openOrderLabel = document.getElementById('openOrderLabel');
const openOrderStatus = document.getElementById('openOrderStatus');
const messageBox = document.getElementById('messageBox');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTabs = document.querySelectorAll('.auth-switch .tab');
const navButtons = document.querySelectorAll('.nav-button');
const menuForm = document.getElementById('menuForm');
const menuFormTitle = document.getElementById('menuFormTitle');
const menuCancelBtn = document.getElementById('menuCancelBtn');

let currentHotel = null;
let currentMenuItems = [];
let orderCart = [];
let editingMenuItemId = null;
let currentOpenOrderId = null;
let currentOpenOrder = null;
let tableStatuses = {};

function showMessage(text, type = 'success') {
  messageBox.textContent = text;
  messageBox.style.background = type === 'error' ? '#dc2626' : 'rgba(37, 99, 235, 0.95)';
  messageBox.classList.remove('hidden');
  setTimeout(() => messageBox.classList.add('hidden'), 3500);
}

function showView(section) {
  const views = [authSection, dashboardSection, menuSection, orderSection, salesSection];
  views.forEach(view => {
    view.style.removeProperty('display');
    if (view.id === section) {
      view.classList.add('active');
      view.classList.remove('hidden');
    } else {
      view.classList.remove('active');
      view.classList.add('hidden');
    }
  });

  if (section === 'orderSection') {
    const selectedTable = document.getElementById('tableNumber').value;
    prepareOrderForTable(selectedTable);
  }
}

function resetAuthForms() {
  loginForm.reset();
  registerForm.reset();
}

function applyAuthState(user) {
  if (user) {
    logoutBtn.classList.remove('hidden');
    authSection.classList.add('hidden');
    loadHotelData(user.uid);
    showView('dashboardSection');
  } else {
    logoutBtn.classList.add('hidden');
    authSection.classList.remove('hidden');
    showView('authSection');
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    applyAuthState(user);
  } else {
    currentHotel = null;
    currentMenuItems = [];
    orderCart = [];
    resetAuthForms();
    showView('authSection');
  }
});

authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(button => button.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    document.querySelectorAll('.auth-form').forEach(form => {
      form.id === target ? form.classList.add('active') : form.classList.remove('active');
    });
  });
});

navButtons.forEach(button => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

document.getElementById('tableNumber').addEventListener('change', event => {
  prepareOrderForTable(event.target.value);
});

logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    showMessage('Logged out successfully');
  });
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showMessage('Login successful');
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

registerForm.addEventListener('change', (e) => {
  if (e.target.name === 'accountType') {
    const ownerFields = document.getElementById('ownerFields');
    const waiterFields = document.getElementById('waiterFields');
    if (e.target.value === 'owner') {
      ownerFields.style.display = 'block';
      waiterFields.style.display = 'none';
    } else {
      ownerFields.style.display = 'none';
      waiterFields.style.display = 'block';
    }
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const accountType = document.querySelector('input[name="accountType"]:checked').value;
  
  if (accountType === 'owner') {
    const hotelName = document.getElementById('hotelName').value.trim();
    const ownerName = document.getElementById('ownerName').value.trim();
    const phone = document.getElementById('hotelPhone').value.trim();
    const email = document.getElementById('hotelEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (password !== passwordConfirm) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    try {
      const account = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('Hotels').doc(account.user.uid).set({
        hotelId: account.user.uid,
        hotelName,
        ownerName,
        phone,
        email,
        role: 'owner',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showMessage('Hotel account created successfully');
      loginForm.querySelector('#loginEmail').value = email;
      loginForm.querySelector('#loginPassword').value = password;
      authTabs[0].click();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  } else {
    showMessage('Waiter accounts require full Firebase setup. Please use the test version for now.', 'error');
  }
});

async function loadHotelData(hotelId) {
  if (!hotelId) return;

  const hotelDoc = await db.collection('Hotels').doc(hotelId).get();
  const hotel = hotelDoc.exists ? hotelDoc.data() : null;

  if (!hotel) {
    showMessage('Hotel profile could not be loaded', 'error');
    return;
  }

  currentHotel = hotel;
  hotelGreeting.textContent = `Welcome, ${hotel.hotelName}`;
  await loadDashboardMetrics();
  await loadTableStatuses();
  await loadMenuItems();
  await loadOrderMenu();
  await loadSalesReport();
}

function formatCurrency(value) {
  return `₹${Number(value).toFixed(0)}`;
}

function formatDate(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

async function loadDashboardMetrics() {
  const hotelId = auth.currentUser.uid;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayQuery = db.collection('Orders')
    .where('hotelId', '==', hotelId)
    .where('orderDate', '>=', firebase.firestore.Timestamp.fromDate(startOfDay));

  const todaySnapshot = await todayQuery.get();
  let salesTotal = 0;

  todaySnapshot.forEach(doc => {
    salesTotal += doc.data().totalAmount || 0;
  });

  todaySales.textContent = formatCurrency(salesTotal);
  todayOrders.textContent = todaySnapshot.size;

  const menuSnapshot = await db.collection('MenuItems')
    .where('hotelId', '==', hotelId)
    .get();
  menuCount.textContent = menuSnapshot.size;
}

async function loadTableStatuses() {
  if (!auth.currentUser) return;
  const hotelId = auth.currentUser.uid;
  const openOrdersSnapshot = await db.collection('Orders')
    .where('hotelId', '==', hotelId)
    .where('status', '==', 'OPEN')
    .get();

  tableStatuses = {};
  openOrdersSnapshot.forEach(doc => {
    const order = doc.data();
    tableStatuses[order.tableNumber] = {
      status: 'Occupied',
      orderId: doc.id,
      orderNumber: order.orderNumber || null
    };
  });

  tableStatusGrid.innerHTML = '';
  for (let index = 1; index <= 10; index += 1) {
    const tableNumber = String(index);
    const statusInfo = tableStatuses[tableNumber] || { status: 'Available' };
    tableStatusGrid.insertAdjacentHTML('beforeend', `
      <button class="table-status-card-item ${statusInfo.status.toLowerCase()}" onclick="openTableOrder('${tableNumber}')">
        <div>
          <h4>Table ${tableNumber}</h4>
          <p>${statusInfo.status}</p>
        </div>
        ${statusInfo.orderNumber ? `<span class="badge">#${statusInfo.orderNumber}</span>` : ''}
      </button>
    `);
  }
}

async function prepareOrderForTable(tableNumber) {
  if (!auth.currentUser) return;
  const hotelId = auth.currentUser.uid;
  const openQuery = await db.collection('Orders')
    .where('hotelId', '==', hotelId)
    .where('tableNumber', '==', tableNumber)
    .where('status', '==', 'OPEN')
    .limit(1)
    .get();

  if (!openQuery.empty) {
    const orderDoc = openQuery.docs[0];
    currentOpenOrderId = orderDoc.id;
    currentOpenOrder = orderDoc.data();
    orderCart = currentOpenOrder.items.map(item => ({
      id: item.id || item.itemName,
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price
    }));
    setTableBanner(currentOpenOrderId, currentOpenOrder.status || 'OPEN', currentOpenOrder.orderNumber);
    completeOrderBtn.disabled = false;
  } else {
    currentOpenOrderId = null;
    currentOpenOrder = null;
    orderCart = [];
    setTableBanner(null, 'Available');
    completeOrderBtn.disabled = true;
  }

  renderOrderCart();
  saveOrderBtn.disabled = orderCart.length === 0;
}

function setTableBanner(orderId, status, orderNumber = null) {
  if (!orderId) {
    tableOrderBanner.classList.add('hidden');
    openOrderLabel.textContent = '';
    openOrderStatus.textContent = '';
    return;
  }

  tableOrderBanner.classList.remove('hidden');
  openOrderLabel.textContent = orderNumber ? `#${orderNumber}` : orderId;
  openOrderStatus.textContent = status;
}

window.openTableOrder = async function (tableNumber) {
  showView('orderSection');
  document.getElementById('tableNumber').value = tableNumber;
  await prepareOrderForTable(tableNumber);
};

async function loadMenuItems() {
  const hotelId = auth.currentUser.uid;
  const querySnapshot = await db.collection('MenuItems')
    .where('hotelId', '==', hotelId)
    .orderBy('itemName')
    .get();

  currentMenuItems = [];
  menuItemsList.innerHTML = '';

  querySnapshot.forEach(doc => {
    const item = { id: doc.id, ...doc.data() };
    currentMenuItems.push(item);
    menuItemsList.insertAdjacentHTML('beforeend', createMenuItemHtml(item));
  });

  if (currentMenuItems.length === 0) {
    menuItemsList.innerHTML = '<p class="empty-state">No menu items yet. Add your first dish above.</p>';
  }
}

function createMenuItemHtml(item) {
  return `
    <div class="menu-item">
      <div class="item-info">
        <h4>${item.itemName}</h4>
        <p>${item.category} • ${formatCurrency(item.price)}</p>
      </div>
      <div class="item-actions">
        <button class="button secondary" onclick="editMenuItem('${item.id}')">Edit</button>
        <button class="button secondary" onclick="deleteMenuItem('${item.id}')">Delete</button>
      </div>
    </div>
  `;
}

window.editMenuItem = async function (id) {
  const item = currentMenuItems.find(menuItem => menuItem.id === id);
  if (!item) return;

  editingMenuItemId = id;
  menuFormTitle.textContent = 'Edit Menu Item';
  document.getElementById('itemName').value = item.itemName;
  document.getElementById('itemPrice').value = item.price;
  document.getElementById('itemCategory').value = item.category;
  menuCancelBtn.classList.remove('hidden');
};

menuCancelBtn.addEventListener('click', () => {
  editingMenuItemId = null;
  menuFormTitle.textContent = 'Add Menu Item';
  menuForm.reset();
  menuCancelBtn.classList.add('hidden');
});

window.deleteMenuItem = async function (id) {
  if (!confirm('Remove this menu item?')) return;
  try {
    await db.collection('MenuItems').doc(id).delete();
    showMessage('Menu item deleted');
    loadMenuItems();
    loadOrderMenu();
    loadDashboardMetrics();
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

menuForm.addEventListener('submit', async event => {
  event.preventDefault();

  const itemName = document.getElementById('itemName').value.trim();
  const price = Number(document.getElementById('itemPrice').value.trim());
  const category = document.getElementById('itemCategory').value;
  const hotelId = auth.currentUser.uid;

  if (!itemName || !price || !category) {
    showMessage('Please complete every field', 'error');
    return;
  }

  const payload = { hotelId, itemName, category, price };

  try {
    if (editingMenuItemId) {
      await db.collection('MenuItems').doc(editingMenuItemId).update(payload);
      showMessage('Menu item updated');
    } else {
      await db.collection('MenuItems').add(payload);
      showMessage('Menu item added');
    }

    editingMenuItemId = null;
    menuFormTitle.textContent = 'Add Menu Item';
    menuForm.reset();
    menuCancelBtn.classList.add('hidden');
    loadMenuItems();
    loadOrderMenu();
    loadDashboardMetrics();
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

async function loadOrderMenu() {
  const hotelId = auth.currentUser.uid;
  const querySnapshot = await db.collection('MenuItems')
    .where('hotelId', '==', hotelId)
    .orderBy('itemName')
    .get();

  orderMenuItems.innerHTML = '';

  querySnapshot.forEach(doc => {
    const item = { id: doc.id, ...doc.data() };
    orderMenuItems.insertAdjacentHTML('beforeend', createOrderItemHtml(item));
  });
}

function createOrderItemHtml(item) {
  return `
    <div class="order-card">
      <div>
        <h4>${item.itemName}</h4>
        <p>${item.category} • ${formatCurrency(item.price)}</p>
      </div>
      <button class="button primary" onclick="addToOrder('${item.id}')">Add</button>
    </div>
  `;
}

window.addToOrder = function (menuItemId) {
  const item = currentMenuItems.find(menuItem => menuItem.id === menuItemId) || null;
  if (!item) return;

  const existing = orderCart.find(orderItem => orderItem.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    orderCart.push({ ...item, quantity: 1 });
  }

  renderOrderCart();
};

function renderOrderCart() {
  orderCartList.innerHTML = '';
  let total = 0;

  if (orderCart.length === 0) {
    orderCartList.innerHTML = '<p class="empty-state">Add items from the menu to start the order.</p>';
    saveOrderBtn.disabled = true;
  } else {
    orderCart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      orderCartList.insertAdjacentHTML('beforeend', `
        <div class="cart-item">
          <div class="charge-row">
            <div>
              <h4>${item.itemName}</h4>
              <p>${item.quantity} • ${formatCurrency(item.price)}</p>
            </div>
            <strong>${formatCurrency(itemTotal)}</strong>
          </div>
          <div class="quantity-actions">
            <button class="button secondary" onclick="updateQuantity('${item.id}', -1)">-</button>
            <button class="button secondary" onclick="updateQuantity('${item.id}', 1)">+</button>
            <button class="button secondary" onclick="removeFromOrder('${item.id}')">Remove</button>
          </div>
        </div>
      `);
    });
    saveOrderBtn.disabled = false;
  }

  orderTotal.textContent = formatCurrency(total);
  orderItemCount.textContent = orderCart.reduce((sum, item) => sum + item.quantity, 0);
}

window.updateQuantity = function (id, delta) {
  const item = orderCart.find(entry => entry.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    orderCart = orderCart.filter(entry => entry.id !== id);
  }

  renderOrderCart();
};

window.removeFromOrder = function (id) {
  orderCart = orderCart.filter(entry => entry.id !== id);
  renderOrderCart();
};

async function getNextOrderNumber(hotelId) {
  const snapshot = await db.collection('Orders')
    .where('hotelId', '==', hotelId)
    .orderBy('orderNumber', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const lastNumber = snapshot.docs[0].data().orderNumber || 100;
    return lastNumber + 1;
  }

  return 101;
}

saveOrderBtn.addEventListener('click', async () => {
  if (orderCart.length === 0) return;

  const tableNumber = document.getElementById('tableNumber').value;
  const hotelId = auth.currentUser.uid;
  const totalAmount = orderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderPayload = {
    hotelId,
    tableNumber,
    items: orderCart.map(item => ({ id: item.id, itemName: item.itemName, quantity: item.quantity, price: item.price })),
    totalAmount,
    orderDate: firebase.firestore.Timestamp.now(),
    status: 'OPEN'
  };

  try {
    if (currentOpenOrderId) {
      await db.collection('Orders').doc(currentOpenOrderId).update({
        ...orderPayload,
        updatedAt: firebase.firestore.Timestamp.now(),
        orderNumber: currentOpenOrder.orderNumber || currentOpenOrderId
      });
      showMessage('Open order updated successfully');
    } else {
      orderPayload.orderNumber = await getNextOrderNumber(hotelId);
      await db.collection('Orders').add(orderPayload);
      showMessage('Order saved successfully');
    }

    await loadTableStatuses();
    await loadDashboardMetrics();
    await loadSalesReport();
    await prepareOrderForTable(tableNumber);
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

completeOrderBtn.addEventListener('click', async () => {
  if (!currentOpenOrderId) {
    showMessage('No open order to complete', 'error');
    return;
  }

  const totalAmount = orderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    await db.collection('Orders').doc(currentOpenOrderId).update({
      status: 'COMPLETED',
      completedAt: firebase.firestore.Timestamp.now(),
      totalAmount,
      updatedAt: firebase.firestore.Timestamp.now()
    });
    showMessage('Order completed and table is now available');
    orderCart = [];
    currentOpenOrderId = null;
    currentOpenOrder = null;
    setTableBanner(null, 'Available');
    renderOrderCart();
    await loadTableStatuses();
    await loadDashboardMetrics();
    await loadSalesReport();
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

async function loadSalesReport() {
  const hotelId = auth.currentUser.uid;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = firebase.firestore.Timestamp.fromDate(todayStart);

  const query = db.collection('Orders')
    .where('hotelId', '==', hotelId)
    .orderBy('orderDate', 'desc');

  const snapshot = await query.get();
  let todayTotal = 0;
  let todayCount = 0;

  salesHistory.innerHTML = '';

  snapshot.forEach(doc => {
    const order = doc.data();
    const orderDate = order.orderDate || todayTimestamp;

    if (orderDate.toDate() >= todayStart) {
      todayTotal += order.totalAmount || 0;
      todayCount += 1;
    }

    salesHistory.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="charge-row">
          <div>
            <h4>Table ${order.tableNumber} ${order.orderNumber ? `#${order.orderNumber}` : ''}</h4>
            <p>${formatDate(orderDate)} • ${order.status || 'COMPLETED'}</p>
          </div>
          <strong>${formatCurrency(order.totalAmount)}</strong>
        </div>
        <p>${order.items.length} item(s) • ${order.items.map(item => `${item.itemName} x${item.quantity}`).join(', ')}</p>
      </div>
    `);
  });

  reportSales.textContent = formatCurrency(todayTotal);
  reportOrders.textContent = todayCount;
}

menuForm.addEventListener('reset', () => {
  editingMenuItemId = null;
  menuFormTitle.textContent = 'Add Menu Item';
  menuCancelBtn.classList.add('hidden');
});

function init() {
  showView('authSection');
  renderOrderCart();
}

init();
