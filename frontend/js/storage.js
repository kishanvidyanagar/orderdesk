/**
 * Storage Module - Centralized Data Persistence
 * Handles all localStorage operations for OrderDesk
 */

const STORAGE_KEYS = {
  ADMINS: "orderdesk_admins",
  HOTELS: "orderdesk_hotels",
  OWNERS: "orderdesk_owners",
  WAITERS: "orderdesk_waiters",
  MENU_ITEMS: "orderdesk_menu_items",
  ORDERS: "orderdesk_orders",
  TABLE_CONFIGS: "orderdesk_table_configs",
  CURRENT_USER: "orderdesk_current_user"
};

export const Storage = {
  /* ====================================
     ADMIN MANAGEMENT
  ==================================== */

  getAdmins() {
    const data = localStorage.getItem(STORAGE_KEYS.ADMINS);

    if (!data) {
      return this._initializeDefaultAdmin();
    }

    const admins = JSON.parse(data);
    const admin = Object.values(admins).find(a => a.loginId === "admin" || a.role === "admin");

    if (admin && (!admin.password || admin.password !== "1234")) {
      admin.password = "1234";
      this.saveAdmins(admins);
    }

    return admins;
  },

  saveAdmins(admins) {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  },

  _initializeDefaultAdmin() {
    const admin = {
      admin_001: {
        adminId: "admin_001",
        loginId: "admin",
        password: "1234",
        role: "admin",
        createdAt: new Date().toISOString()
      }
    };
    this.saveAdmins(admin);
    return admin;
  },

  getAdminByLoginId(loginId) {
    const admins = this.getAdmins();
    return Object.values(admins).find(a => a.loginId === loginId);
  },

  updateAdminPassword(loginId, newPassword) {
    const admins = this.getAdmins();
    const admin = Object.values(admins).find(a => a.loginId === loginId);

    if (admin) {
      admin.password = newPassword;
      this.saveAdmins(admins);
      return true;
    }

    return false;
  },

  /* ====================================
     HOTEL MANAGEMENT
  ==================================== */

  getHotels() {
    const data = localStorage.getItem(STORAGE_KEYS.HOTELS);
    return data ? JSON.parse(data) : {};
  },

  saveHotels(hotels) {
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
  },

  createHotel(hotelName, gstEnabled = false, cookEnabled = false) {
    const hotels = this.getHotels();
    const hotelId = "hotel_" + Date.now();

    hotels[hotelId] = {
      hotelId,
      hotelName,
      gstEnabled,
      cookEnabled,
      createdAt: new Date().toISOString()
    };

    this.saveHotels(hotels);
    return hotelId;
  },

  updateHotel(hotelId, updates) {
    const hotels = this.getHotels();
    if (hotels[hotelId]) {
      hotels[hotelId] = { ...hotels[hotelId], ...updates };
      this.saveHotels(hotels);
    }
  },

  deleteHotel(hotelId) {
    const hotels = this.getHotels();
    delete hotels[hotelId];
    this.saveHotels(hotels);
  },

  getHotel(hotelId) {
    const hotels = this.getHotels();
    return hotels[hotelId] || null;
  },

  /* ====================================
     OWNER MANAGEMENT
  ==================================== */

  getOwners() {
    const data = localStorage.getItem(STORAGE_KEYS.OWNERS);
    return data ? JSON.parse(data) : {};
  },

  saveOwners(owners) {
    localStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(owners));
  },

  createOwner(hotelId, ownerName, phone, loginId, password) {
    const owners = this.getOwners();
    const ownerId = "owner_" + Date.now();

    owners[ownerId] = {
      ownerId,
      hotelId,
      hotelName: this.getHotel(hotelId)?.hotelName || "",
      ownerName,
      phone,
      loginId,
      password,
      role: "owner",
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.saveOwners(owners);
    return ownerId;
  },

  updateOwner(ownerId, updates) {
    const owners = this.getOwners();
    if (owners[ownerId]) {
      owners[ownerId] = { ...owners[ownerId], ...updates };
      this.saveOwners(owners);
    }
  },

  deleteOwner(ownerId) {
    const owners = this.getOwners();
    delete owners[ownerId];
    this.saveOwners(owners);
  },

  getOwner(ownerId) {
    const owners = this.getOwners();
    return owners[ownerId] || null;
  },

  getOwnerByLoginId(loginId) {
    const owners = this.getOwners();
    return Object.values(owners).find(o => o.loginId === loginId);
  },

  getOwnersByHotel(hotelId) {
    const owners = this.getOwners();
    return Object.values(owners).filter(o => o.hotelId === hotelId);
  },

  /* ====================================
     WAITER MANAGEMENT
  ==================================== */

  getWaiters() {
    const data = localStorage.getItem(STORAGE_KEYS.WAITERS);
    return data ? JSON.parse(data) : {};
  },

  saveWaiters(waiters) {
    localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(waiters));
  },

  createWaiter(hotelId, waiterName, loginId, password) {
    const waiters = this.getWaiters();
    const waiterId = "waiter_" + Date.now();

    waiters[waiterId] = {
      waiterId,
      hotelId,
      waiterName,
      loginId,
      password,
      role: "waiter",
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.saveWaiters(waiters);
    return waiterId;
  },

  createCook(hotelId, cookName, loginId, password) {
    const waiters = this.getWaiters();
    const cookId = "cook_" + Date.now();

    waiters[cookId] = {
      waiterId: cookId,
      hotelId,
      waiterName: cookName,
      loginId,
      password,
      role: "cook",
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.saveWaiters(waiters);
    return cookId;
  },

  updateWaiter(waiterId, updates) {
    const waiters = this.getWaiters();
    if (waiters[waiterId]) {
      waiters[waiterId] = { ...waiters[waiterId], ...updates };
      this.saveWaiters(waiters);
    }
  },

  deleteWaiter(waiterId) {
    const waiters = this.getWaiters();
    delete waiters[waiterId];
    this.saveWaiters(waiters);
  },

  getWaiter(waiterId) {
    const waiters = this.getWaiters();
    return waiters[waiterId] || null;
  },

  getWaiterByLoginId(hotelId, loginId) {
    const waiters = this.getWaiters();
    return Object.values(waiters).find(
      w => w.hotelId === hotelId && w.loginId === loginId && w.enabled
    );
  },

  getWaitersByHotel(hotelId) {
    const waiters = this.getWaiters();
    return Object.values(waiters).filter(w => w.hotelId === hotelId && w.role === "waiter");
  },

  getCooksByHotel(hotelId) {
    const waiters = this.getWaiters();
    return Object.values(waiters).filter(w => w.hotelId === hotelId && w.role === "cook");
  },

  /* ====================================
     MENU MANAGEMENT
  ==================================== */

  getMenuItems() {
    const data = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    return data ? JSON.parse(data) : {};
  },

  saveMenuItems(items) {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  },

  addMenuItem(hotelId, itemName, price, category = "General") {
    const items = this.getMenuItems();
    const itemId = "menu_" + Date.now();

    items[itemId] = {
      id: itemId,
      hotelId,
      itemName,
      price,
      category,
      createdAt: new Date().toISOString()
    };

    this.saveMenuItems(items);
    return itemId;
  },

  updateMenuItem(itemId, updates) {
    const items = this.getMenuItems();
    if (items[itemId]) {
      items[itemId] = { ...items[itemId], ...updates };
      this.saveMenuItems(items);
    }
  },

  deleteMenuItem(itemId) {
    const items = this.getMenuItems();
    delete items[itemId];
    this.saveMenuItems(items);
  },

  getHotelMenuItems(hotelId) {
    const items = this.getMenuItems();
    return Object.values(items).filter(item => item.hotelId === hotelId);
  },

  /* ====================================
     ORDER MANAGEMENT
  ==================================== */

  getOrders() {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : {};
  },

  saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  createOrder(hotelId, tableNumber) {
    const orders = this.getOrders();
    const orderId = "order_" + Date.now();

    // Get next order number
    const hotelOrders = Object.values(orders).filter(o => o.hotelId === hotelId);
    const nextOrderNum = hotelOrders.length > 0
      ? Math.max(...hotelOrders.map(o => o.orderNumber)) + 1
      : 101;

    orders[orderId] = {
      id: orderId,
      orderNumber: nextOrderNum,
      hotelId,
      tableNumber,
      items: [],
      subtotal: 0,
      gst: 0,
      service: 0,
      totalAmount: 0,
      status: "OPEN",
      kitchenStatus: "PENDING",
      waiterId: null,
      waiterName: null,
      orderDate: new Date().toISOString()
    };

    this.saveOrders(orders);
    return orderId;
  },

  updateOrder(orderId, updates) {
    const orders = this.getOrders();
    if (orders[orderId]) {
      orders[orderId] = { ...orders[orderId], ...updates };
      this.saveOrders(orders);
    }
  },

  deleteOrder(orderId) {
    const orders = this.getOrders();
    delete orders[orderId];
    this.saveOrders(orders);
  },

  getOrder(orderId) {
    const orders = this.getOrders();
    return orders[orderId] || null;
  },

  getTableOrder(hotelId, tableNumber) {
    const orders = this.getOrders();
    return Object.values(orders).find(
      o => o.hotelId === hotelId && o.tableNumber === tableNumber && o.status === "OPEN"
    );
  },

  getHotelOrders(hotelId) {
    const orders = this.getOrders();
    return Object.values(orders).filter(o => o.hotelId === hotelId);
  },

  getHotelOpenOrders(hotelId) {
    const orders = this.getOrders();
    return Object.values(orders).filter(
      o => o.hotelId === hotelId && o.status === "OPEN"
    ).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  },

  getHotelCompletedOrders(hotelId, date = null) {
    const orders = this.getOrders();
    return Object.values(orders).filter(o => {
      if (o.hotelId !== hotelId || o.status !== "COMPLETED") return false;

      if (date) {
        const orderDate = new Date(o.orderDate).toDateString();
        const filterDate = new Date(date).toDateString();
        return orderDate === filterDate;
      }
      return true;
    }).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  },

  /* ====================================
     TABLE CONFIGURATION
  ==================================== */

  getTableConfigs() {
    const data = localStorage.getItem(STORAGE_KEYS.TABLE_CONFIGS);
    return data ? JSON.parse(data) : {};
  },

  saveTableConfigs(configs) {
    localStorage.setItem(STORAGE_KEYS.TABLE_CONFIGS, JSON.stringify(configs));
  },

  getTableCount(hotelId) {
    const configs = this.getTableConfigs();
    return configs[hotelId] || 10; // Default 10 tables
  },

  setTableCount(hotelId, count) {
    const configs = this.getTableConfigs();
    configs[hotelId] = Math.max(1, count); // Minimum 1 table
    this.saveTableConfigs(configs);
  },

  /* ====================================
     SESSION MANAGEMENT
  ==================================== */

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  saveCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === "admin";
  },

  isOwner() {
    const user = this.getCurrentUser();
    return user?.role === "owner";
  },

  isWaiter() {
    const user = this.getCurrentUser();
    return user?.role === "waiter";
  }
};