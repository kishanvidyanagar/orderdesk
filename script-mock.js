// Mock Authentication & Storage (no Firebase needed for testing)
class MockAuth {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.init();
  }

  init() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      this.notifyListeners(this.currentUser);
    }
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
  }

  notifyListeners(user) {
    this.listeners.forEach(cb => cb(user));
  }

  async signInWithEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
        const waiters = JSON.parse(localStorage.getItem('waiters') || '[]');
        
        let user = Object.values(hotels).find(h => h.email === email);
        let role = 'owner';
        let hotelId = null;
        
        if (!user) {
          user = waiters.find(w => w.email === email);
          if (user) {
            role = 'waiter';
            hotelId = user.hotelId;
          }
        } else {
          hotelId = user.hotelId;
        }
        
        if (!user) {
          reject(new Error('auth/user-not-found'));
          return;
        }
        
        if (user.password !== password) {
          reject(new Error('auth/wrong-password'));
          return;
        }

        this.currentUser = { uid: user.hotelId, email: user.email, role, hotelId };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.notifyListeners(this.currentUser);
        resolve({ user: this.currentUser });
      }, 500);
    });
  }

  async createUserWithEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
        const exists = Object.values(hotels).find(h => h.email === email);
        
        if (exists) {
          reject(new Error('auth/email-already-in-use'));
          return;
        }

        const uid = 'user_' + Date.now();
        this.currentUser = { uid, email };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.notifyListeners(this.currentUser);
        resolve({ user: this.currentUser });
      }, 500);
    });
  }

  async signOut() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.notifyListeners(null);
        resolve();
      }, 300);
    });
  }
}

class MockDB {
  async addCollection(collection, data) {
    const store = JSON.parse(localStorage.getItem(collection) || '[]');
    const id = collection + '_' + Date.now();
    store.push({ ...data, id });
    localStorage.setItem(collection, JSON.stringify(store));
    return { id };
  }

  async getWhere(collection, field, op, value) {
    const store = JSON.parse(localStorage.getItem(collection) || '[]');
    return store.filter(doc => doc[field] === value);
  }

  async updateDoc(collection, id, data) {
    const store = JSON.parse(localStorage.getItem(collection) || '[]');
    const idx = store.findIndex(doc => doc.id === id);
    if (idx !== -1) {
      store[idx] = { ...store[idx], ...data };
      localStorage.setItem(collection, JSON.stringify(store));
    }
  }

  async deleteDoc(collection, id) {
    const store = JSON.parse(localStorage.getItem(collection) || '[]');
    const filtered = store.filter(doc => doc.id !== id);
    localStorage.setItem(collection, JSON.stringify(filtered));
  }
}

// Initialize mock services
const auth = new MockAuth();
const mockDB = new MockDB();

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
const openOrdersList = document.getElementById('openOrdersList');
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
const createAccountBtn = document.getElementById('createAccountBtn');
const authTabs = document.querySelectorAll('.auth-switch .tab');
const navButtons = document.querySelectorAll('.nav-button');
const menuForm = document.getElementById('menuForm');
const menuFormTitle = document.getElementById('menuFormTitle');
const menuCancelBtn = document.getElementById('menuCancelBtn');
const addTableBtn = document.getElementById('addTableBtn');
const tableCountLabel = document.getElementById('tableCountLabel');

let currentHotel = null;
let currentMenuItems = [];
let orderCart = [];
let editingMenuItemId = null;
let currentOpenOrderId = null;
let currentOpenOrder = null;
let tableStatuses = {};
let currentUserRole = null;

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
    currentUserRole = user.role;
    loadHotelData(user.uid, user.role);
    
    if (user.role === 'waiter') {
      navButtons.forEach(btn => {
        btn.style.display = 'none';
      });
      const orderBackBtn = document.getElementById('orderBackBtn');
      if (orderBackBtn) {
        orderBackBtn.style.display = 'inline-block';
        orderBackBtn.addEventListener('click', () => showView('dashboardSection'));
      }
      showView('dashboardSection');
    } else {
      navButtons.forEach(btn => btn.style.display = 'inline-block');
      showView('dashboardSection');
    }
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

if (createAccountBtn) {
  createAccountBtn.addEventListener('click', () => {
    if (typeof registerForm.requestSubmit === 'function') {
      registerForm.requestSubmit();
    } else {
      registerForm.submit();
    }
  });
}

if (addTableBtn) {
  addTableBtn.addEventListener('click', async () => {
    if (!auth.currentUser) return;
    const hotelId = auth.currentUser.uid;
    addTableForHotel(hotelId);
    await loadTableList();
    await loadTableStatuses();
    await loadOpenOrders();
    updateTableCountLabel(hotelId);
    showMessage('A new table has been added');
  });
}

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

function updateRegisterFieldState(accountType) {
  const ownerFields = document.getElementById('ownerFields');
  const waiterFields = document.getElementById('waiterFields');
  const ownerInputs = ownerFields.querySelectorAll('input');
  const waiterControls = waiterFields.querySelectorAll('input, select');

  if (accountType === 'owner') {
    ownerFields.style.display = 'block';
    waiterFields.style.display = 'none';
    ownerInputs.forEach(input => input.disabled = false);
    waiterControls.forEach(input => input.disabled = true);
  } else {
    ownerFields.style.display = 'none';
    waiterFields.style.display = 'block';
    ownerInputs.forEach(input => input.disabled = true);
    waiterControls.forEach(input => input.disabled = false);
    populateHotelSelect();
  }
}

registerForm.addEventListener('change', (e) => {
  if (e.target.name === 'accountType') {
    updateRegisterFieldState(e.target.value);
  }
});

// Ensure the form field state is correct on load
updateRegisterFieldState(document.querySelector('input[name="accountType"]:checked').value);

function populateHotelSelect() {
  const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
  const select = document.getElementById('waiterHotel');
  select.innerHTML = '<option value="">Choose a hotel...</option>';
  Object.values(hotels).forEach(hotel => {
    const option = document.createElement('option');
    option.value = hotel.hotelId;
    option.textContent = hotel.hotelName;
    select.appendChild(option);
  });
}

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const accountType = document.querySelector('input[name="accountType"]:checked').value;

  try {
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

      const account = await auth.createUserWithEmailAndPassword(email, password);
      const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
      hotels[account.user.uid] = {
        hotelId: account.user.uid,
        hotelName,
        ownerName,
        phone,
        email,
        password,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('hotels', JSON.stringify(hotels));
      
      await auth.signOut();
      showMessage('Hotel account created successfully');
      loginForm.querySelector('#loginEmail').value = email;
      loginForm.querySelector('#loginPassword').value = password;
      authTabs[0].click();
    } else {
      const waiterName = document.getElementById('waiterName').value.trim();
      const hotelId = document.getElementById('waiterHotel').value;
      const email = document.getElementById('waiterEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const passwordConfirm = document.getElementById('regPasswordConfirm').value;

      if (!hotelId) {
        showMessage('Please select a hotel', 'error');
        return;
      }

      if (password !== passwordConfirm) {
        showMessage('Passwords do not match', 'error');
        return;
      }

      const waiters = JSON.parse(localStorage.getItem('waiters') || '[]');
      const waiterExists = waiters.find(w => w.email === email);
      if (waiterExists) {
        showMessage('Email already registered', 'error');
        return;
      }

      waiters.push({
        hotelId,
        waiterName,
        email,
        password,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('waiters', JSON.stringify(waiters));

      showMessage('Waiter account created successfully');
      loginForm.querySelector('#loginEmail').value = email;
      loginForm.querySelector('#loginPassword').value = password;
      authTabs[0].click();
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

async function loadHotelData(hotelId, role) {
  if (!hotelId) return;

  const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
  const hotel = hotels[hotelId];

  if (!hotel) {
    showMessage('Hotel profile could not be loaded', 'error');
    return;
  }

  currentHotel = hotel;
  
  if (role === 'waiter') {
    hotelGreeting.textContent = `Welcome to ${hotel.hotelName}`;
  } else {
    hotelGreeting.textContent = `Welcome, ${hotel.hotelName}`;
  }

  const tableConfigs = JSON.parse(localStorage.getItem('TableConfigs') || '{}');
  if (!Object.prototype.hasOwnProperty.call(tableConfigs, hotelId)) {
    setHotelTableCount(hotelId, 10);
  }

  if (addTableBtn) {
    addTableBtn.style.display = role === 'waiter' ? 'none' : 'inline-block';
  }
  
  if (tableCountLabel) {
    tableCountLabel.textContent = `${getHotelTableCount(hotelId)} tables configured`;
  }
  
  if (role !== 'waiter') {
    loadDashboardMetrics();
    loadMenuItems();
    loadSalesReport();
  }
  await loadTableList();
  await loadOrderMenu();
  await loadTableStatuses();
  await loadOpenOrders();
  updateTableCountLabel(auth.currentUser.uid);
  if (role === 'waiter') {
    const selectedTable = document.getElementById('tableNumber').value;
    await prepareOrderForTable(selectedTable);
  }
}

function getHotelTableCount(hotelId) {
  const tableConfigs = JSON.parse(localStorage.getItem('TableConfigs') || '{}');
  return tableConfigs[hotelId] || 10;
}

function setHotelTableCount(hotelId, count) {
  const tableConfigs = JSON.parse(localStorage.getItem('TableConfigs') || '{}');
  tableConfigs[hotelId] = count;
  localStorage.setItem('TableConfigs', JSON.stringify(tableConfigs));
}

function addTableForHotel(hotelId) {
  const count = getHotelTableCount(hotelId) + 1;
  setHotelTableCount(hotelId, count);
  return count;
}

function updateTableCountLabel(hotelId) {
  if (!tableCountLabel) return;
  tableCountLabel.textContent = `${getHotelTableCount(hotelId)} tables configured`;
}

async function loadTableList() {
  const hotelId = auth.currentUser.uid;
  const tableCount = getHotelTableCount(hotelId);
  const tableSelect = document.getElementById('tableNumber');
  if (!tableSelect) return;

  tableSelect.innerHTML = '';
  for (let i = 1; i <= tableCount; i += 1) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Table ${i}`;
    tableSelect.appendChild(option);
  }
}

function formatCurrency(value) {
  return `₹${Number(value).toFixed(0)}`;
}

function formatDate(timestamp) {
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }
  return new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function loadDashboardMetrics() {
  const hotelId = auth.currentUser.uid;
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]').filter(o => o.hotelId === hotelId);
  const menuItems = JSON.parse(localStorage.getItem('MenuItems') || '[]').filter(m => m.hotelId === hotelId);
  
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === today);
  const todayTotal = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  todaySales.textContent = formatCurrency(todayTotal);
  todayOrders.textContent = todayOrders.length;
  menuCount.textContent = menuItems.length;
}

async function loadMenuItems() {
  const hotelId = auth.currentUser.uid;
  const items = JSON.parse(localStorage.getItem('MenuItems') || '[]')
    .filter(m => m.hotelId === hotelId)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  currentMenuItems = items;
  menuItemsList.innerHTML = '';

  items.forEach(item => {
    menuItemsList.insertAdjacentHTML('beforeend', createMenuItemHtml(item));
  });

  if (items.length === 0) {
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

async function loadOpenOrders() {
  if (!auth.currentUser || !openOrdersList) return;
  const hotelId = auth.currentUser.uid;
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]')
    .filter(o => o.hotelId === hotelId && o.status === 'OPEN')
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  openOrdersList.innerHTML = '';
  if (orders.length === 0) {
    openOrdersList.innerHTML = '<p class="empty-state">No open orders right now.</p>';
    return;
  }

  orders.forEach(order => {
    openOrdersList.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="charge-row">
          <div>
            <h4>Table ${order.tableNumber}</h4>
            <p>#${order.orderNumber || order.id} • ${formatDate(order.orderDate)}</p>
          </div>
          <strong>${formatCurrency(order.totalAmount)}</strong>
        </div>
        <p>${order.items.length} item(s) • ${order.items.map(item => `${item.itemName} x${item.quantity}`).join(', ')}</p>
        <button class="button secondary" onclick="openTableOrder('${order.tableNumber}')">Continue Order</button>
      </div>
    `);
  });
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
    const items = JSON.parse(localStorage.getItem('MenuItems') || '[]');
    const filtered = items.filter(m => m.id !== id);
    localStorage.setItem('MenuItems', JSON.stringify(filtered));
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

  try {
    const items = JSON.parse(localStorage.getItem('MenuItems') || '[]');
    
    if (editingMenuItemId) {
      const idx = items.findIndex(m => m.id === editingMenuItemId);
      if (idx !== -1) {
        items[idx] = { ...items[idx], itemName, price, category };
      }
      showMessage('Menu item updated');
    } else {
      const newItem = {
        id: 'menu_' + Date.now(),
        hotelId,
        itemName,
        category,
        price
      };
      items.push(newItem);
      showMessage('Menu item added');
    }

    localStorage.setItem('MenuItems', JSON.stringify(items));
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
  const items = JSON.parse(localStorage.getItem('MenuItems') || '[]')
    .filter(m => m.hotelId === hotelId)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  currentMenuItems = items;
  orderMenuItems.innerHTML = '';

  if (items.length === 0) {
    orderMenuItems.innerHTML = '<p class="empty-state">No menu items available. Ask the hotel owner to add dishes.</p>';
    return;
  }

  items.forEach(item => {
    orderMenuItems.insertAdjacentHTML('beforeend', createOrderItemHtml(item));
  });
}

async function loadTableStatuses() {
  if (!auth.currentUser) return;
  const hotelId = auth.currentUser.uid;
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]')
    .filter(o => o.hotelId === hotelId && o.status === 'OPEN');

  tableStatuses = {};
  orders.forEach(order => {
    tableStatuses[order.tableNumber] = {
      status: 'Occupied',
      orderId: order.id,
      orderNumber: order.orderNumber || null
    };
  });

  if (!tableStatusGrid) return;
  tableStatusGrid.innerHTML = '';
  const tableCount = getHotelTableCount(auth.currentUser.uid);
  const isOwner = currentUserRole === 'owner' || !currentUserRole;
  for (let index = 1; index <= tableCount; index += 1) {
    const tableNumber = String(index);
    const statusInfo = tableStatuses[tableNumber] || { status: 'Available' };
    const removeBtn = isOwner ? `<button class="button secondary tiny-btn" onclick="removeTable('${tableNumber}')">×</button>` : '';
    tableStatusGrid.insertAdjacentHTML('beforeend', `
      <div class="table-card-wrapper">
        <button class="table-status-card-item ${statusInfo.status.toLowerCase()}" onclick="openTableOrder('${tableNumber}')">
          <div>
            <h4>Table ${tableNumber}</h4>
            <p>${statusInfo.status}</p>
          </div>
          ${statusInfo.orderNumber ? `<span class="badge">#${statusInfo.orderNumber}</span>` : ''}
        </button>
        ${removeBtn}
      </div>
    `);
  }
}

window.removeTable = async function (tableNumber) {
  if (!auth.currentUser) return;
  const tableNum = parseInt(tableNumber, 10);
  const tableCount = getHotelTableCount(auth.currentUser.uid);
  if (tableNum === tableCount) {
    setHotelTableCount(auth.currentUser.uid, tableCount - 1);
    await loadTableStatuses();
    await loadOpenOrders();
    updateTableCountLabel(auth.currentUser.uid);
    showMessage('Table removed');
  } else {
    showMessage('Can only remove the last table', 'error');
  }
};

async function getNextOrderNumber(hotelId) {
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]').filter(o => o.hotelId === hotelId);
  if (orders.length === 0) return 101;
  const maxOrderNumber = orders.reduce((max, order) => Math.max(max, order.orderNumber || 100), 100);
  return maxOrderNumber + 1;
}

async function prepareOrderForTable(tableNumber) {
  if (!auth.currentUser) return;
  const hotelId = auth.currentUser.uid;
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]')
    .filter(o => o.hotelId === hotelId && o.tableNumber === tableNumber && o.status === 'OPEN');

  if (orders.length > 0) {
    const order = orders[0];
    currentOpenOrderId = order.id;
    currentOpenOrder = order;
    orderCart = order.items.map(item => ({ id: item.id || item.itemName, itemName: item.itemName, quantity: item.quantity, price: item.price }));
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

saveOrderBtn.addEventListener('click', async () => {
  if (orderCart.length === 0) return;

  const tableNumber = document.getElementById('tableNumber').value;
  const hotelId = auth.currentUser.uid;
  const totalAmount = orderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]');
  const orderPayload = {
    hotelId,
    tableNumber,
    items: orderCart.map(item => ({ id: item.id, itemName: item.itemName, quantity: item.quantity, price: item.price })),
    totalAmount,
    orderDate: new Date().toISOString(),
    status: 'OPEN'
  };

  try {
    if (currentOpenOrderId) {
      const index = orders.findIndex(o => o.id === currentOpenOrderId);
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          ...orderPayload,
          orderNumber: orders[index].orderNumber || currentOpenOrder.orderNumber || await getNextOrderNumber(hotelId),
          updatedAt: new Date().toISOString()
        };
        showMessage('Open order updated successfully');
      }
    } else {
      orderPayload.id = 'order_' + Date.now();
      orderPayload.orderNumber = await getNextOrderNumber(hotelId);
      orders.push(orderPayload);
      showMessage('Order saved successfully');
    }

    localStorage.setItem('Orders', JSON.stringify(orders));
    await loadTableStatuses();
    await loadOpenOrders();
    loadDashboardMetrics();
    loadSalesReport();
    await prepareOrderForTable(tableNumber);
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

if (completeOrderBtn) {
  completeOrderBtn.addEventListener('click', async () => {
    if (!currentOpenOrderId) {
      showMessage('No open order to complete', 'error');
      return;
    }

    const orders = JSON.parse(localStorage.getItem('Orders') || '[]');
    const index = orders.findIndex(o => o.id === currentOpenOrderId);
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        totalAmount: orderCart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('Orders', JSON.stringify(orders));
      showMessage('Order completed and table is now available');
      currentOpenOrderId = null;
      currentOpenOrder = null;
      orderCart = [];
      setTableBanner(null, 'Available');
      renderOrderCart();
      await loadTableStatuses();
      await loadOpenOrders();
      loadDashboardMetrics();
      loadSalesReport();
    }
  });
}

function loadSalesReport() {
  const hotelId = auth.currentUser.uid;
  const orders = JSON.parse(localStorage.getItem('Orders') || '[]')
    .filter(o => o.hotelId === hotelId)
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === today);
  const todayTotal = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  reportSales.textContent = formatCurrency(todayTotal);
  reportOrders.textContent = todayOrders.length;

  salesHistory.innerHTML = '';

  orders.forEach(order => {
    salesHistory.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="charge-row">
          <div>
            <h4>Table ${order.tableNumber}</h4>
            <p>${formatDate(order.orderDate)}</p>
          </div>
          <strong>${formatCurrency(order.totalAmount)}</strong>
        </div>
        <p>${order.items.length} item(s) • ${order.items.map(item => `${item.itemName} x${item.quantity}`).join(', ')}</p>
      </div>
    `);
  });
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
