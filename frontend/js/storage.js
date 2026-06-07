export const Storage = {
  /* =========================
     HOTELS (GLOBAL MASTER)
  ========================= */

  getHotels() {
    return JSON.parse(localStorage.getItem("hotels")) || {};
  },

  saveHotels(data) {
    localStorage.setItem("hotels", JSON.stringify(data));
  },


  /* =========================
     WAITERS
  ========================= */

  getWaiters() {
    return JSON.parse(localStorage.getItem("waiters")) || [];
  },

  saveWaiters(data) {
    localStorage.setItem("waiters", JSON.stringify(data));
  },


  /* =========================
     ORDERS (FIXED KEY CASE)
  ========================= */

  getOrders() {
    return JSON.parse(localStorage.getItem("orders")) || [];
  },

  saveOrders(data) {
    localStorage.setItem("orders", JSON.stringify(data));
  },


  /* =========================
     MENU ITEMS
  ========================= */

  getMenuItems() {
    return JSON.parse(localStorage.getItem("menuItems")) || [];
  },

  saveMenuItems(data) {
    localStorage.setItem("menuItems", JSON.stringify(data));
  },


  /* =========================
     AUTH USER
  ========================= */

  getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  },

  saveCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem("currentUser");
  },


  /* =========================
     TABLE CONFIGS
  ========================= */

  getTableConfigs() {
    return JSON.parse(localStorage.getItem("tableConfigs")) || {};
  },

  saveTableConfigs(data) {
    localStorage.setItem("tableConfigs", JSON.stringify(data));
  },


  /* =========================
     ADMIN SETTINGS (GLOBAL)
  ========================= */

  getAdminSettings() {
    return JSON.parse(localStorage.getItem("adminSettings")) || {
      gstEnabled: true,
      cookEnabled: false
    };
  },

  saveAdminSettings(data) {
    localStorage.setItem("adminSettings", JSON.stringify(data));
  }
};