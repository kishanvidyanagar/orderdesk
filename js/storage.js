import { supabase, authEmail } from "./supabase.js";

const state = {
  admins: {}, hotels: {}, owners: {}, waiters: {}, menuItems: {}, orders: {}, tableConfigs: {}, currentUser: null
};
const GUEST_USER = Object.freeze({ uid: null, role: "guest", hotelId: null, enabled: false });

function report(error) {
  if (error) console.error("OrderDesk Supabase error:", error.message || error);
}

function userFromProfile(profile, hotel) {
  const base = {
    uid: profile.id, loginId: profile.login_id, role: profile.role,
    hotelId: profile.hotel_id, hotelName: hotel?.hotel_name || "", enabled: profile.enabled
  };
  if (profile.role === "admin") return { ...base, adminId: profile.id };
  if (profile.role === "owner") return { ...base, ownerId: profile.id, ownerName: profile.display_name, phone: profile.phone || "" };
  return { ...base, waiterId: profile.id, waiterName: profile.display_name };
}

function menuRecord(item) {
  return { id: item.id, hotelId: item.hotel_id, itemName: item.item_name, price: Number(item.price), category: item.category, createdAt: item.created_at };
}

function orderRecord(order, items) {
  return {
    id: order.id, orderNumber: order.order_number, hotelId: order.hotel_id, tableNumber: order.table_number,
    items: items.map(item => ({ id: item.id, menuItemId: item.menu_item_id, itemName: item.item_name, price: Number(item.price), quantity: item.quantity, lineTotal: Number(item.line_total) })),
    subtotal: Number(order.subtotal), gst: Number(order.gst), service: Number(order.service), totalAmount: Number(order.total_amount),
    status: order.status, kitchenStatus: order.kitchen_status, waiterId: order.waiter_id, waiterName: order.waiter_name, orderDate: order.order_date
  };
}

async function loadState() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;
  const [{ data: profiles, error: profileError }, { data: hotels, error: hotelError }] = await Promise.all([
    supabase.from("profiles").select("*"), supabase.from("hotels").select("*")
  ]);
  if (profileError) throw profileError;
  if (hotelError) throw hotelError;
  const hotelById = Object.fromEntries(hotels.map(hotel => [hotel.id, hotel]));

  Object.keys(state.hotels).forEach(key => delete state.hotels[key]);
  hotels.forEach(hotel => { state.hotels[hotel.id] = { hotelId: hotel.id, hotelName: hotel.hotel_name, gstEnabled: hotel.gst_enabled, cookEnabled: hotel.cook_enabled, serviceChargeEnabled: hotel.service_charge_enabled, createdAt: hotel.created_at }; });
  Object.keys(state.admins).forEach(key => delete state.admins[key]);
  Object.keys(state.owners).forEach(key => delete state.owners[key]);
  Object.keys(state.waiters).forEach(key => delete state.waiters[key]);
  profiles.forEach(profile => {
    const record = userFromProfile(profile, hotelById[profile.hotel_id]);
    if (profile.role === "admin") state.admins[profile.id] = { ...record, adminId: profile.id };
    else if (profile.role === "owner") state.owners[profile.id] = record;
    else state.waiters[profile.id] = record;
  });

  const [{ data: menuItems, error: menuError }, { data: orders, error: orderError }, { data: configs, error: configError }] = await Promise.all([
    supabase.from("menu_items").select("*"), supabase.from("orders").select("*").order("order_date", { ascending: false }), supabase.from("table_configs").select("*")
  ]);
  if (menuError) throw menuError;
  if (orderError) throw orderError;
  if (configError) throw configError;
  const { data: itemRows, error: itemError } = orders.length ? await supabase.from("order_items").select("*").in("order_id", orders.map(order => order.id)) : { data: [], error: null };
  if (itemError) throw itemError;
  Object.keys(state.menuItems).forEach(key => delete state.menuItems[key]);
  menuItems.forEach(item => { state.menuItems[item.id] = menuRecord(item); });
  Object.keys(state.orders).forEach(key => delete state.orders[key]);
  orders.forEach(order => { state.orders[order.id] = orderRecord(order, itemRows.filter(item => item.order_id === order.id)); });
  Object.keys(state.tableConfigs).forEach(key => delete state.tableConfigs[key]);
  configs.forEach(config => { state.tableConfigs[config.hotel_id] = config.table_count; });
  const currentProfile = profiles.find(profile => profile.id === sessionData.session.user.id);
  state.currentUser = currentProfile ? userFromProfile(currentProfile, hotelById[currentProfile.hotel_id]) : null;
}

async function manageAccount(body) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const { data, error } = await supabase.functions.invoke("manage-account", {
    body,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });
  if (error) {
    report(error);
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function saveOrderItems(order) {
  const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", order.id);
  if (deleteError) return report(deleteError);
  if (!order.items.length) return;
  const { error } = await supabase.from("order_items").insert(order.items.map(item => ({
    order_id: order.id, menu_item_id: item.menuItemId || null, item_name: item.itemName, price: item.price,
    quantity: item.quantity, line_total: item.lineTotal ?? item.price * item.quantity
  })));
  report(error);
}

export const Storage = {
  async refresh() { try { await loadState(); } catch (error) { report(error); } },
  getAdmins() { return state.admins; },
  getAdminByLoginId(loginId) { return Object.values(state.admins).find(admin => admin.loginId.toLowerCase() === loginId.toLowerCase()); },
  async updateAdminPassword(loginId, password) { const { error } = await supabase.auth.updateUser({ password }); report(error); return !error; },

  getHotels() { return state.hotels; },
  getHotel(hotelId) { return state.hotels[hotelId] || null; },
  createHotel(hotelName, gstEnabled = false, cookEnabled = false) { const hotelId = crypto.randomUUID(); state.hotels[hotelId] = { hotelId, hotelName, gstEnabled, cookEnabled, createdAt: new Date().toISOString() }; void supabase.from("hotels").insert({ id: hotelId, hotel_name: hotelName, gst_enabled: gstEnabled, cook_enabled: cookEnabled }).then(({ error }) => report(error)); return hotelId; },
  updateHotel(hotelId, updates) { state.hotels[hotelId] = { ...state.hotels[hotelId], ...updates }; void supabase.from("hotels").update({ hotel_name: updates.hotelName, gst_enabled: updates.gstEnabled, cook_enabled: updates.cookEnabled, service_charge_enabled: updates.serviceChargeEnabled }).eq("id", hotelId).then(({ error }) => report(error)); },
  deleteHotel(hotelId) { delete state.hotels[hotelId]; void supabase.from("hotels").delete().eq("id", hotelId).then(({ error }) => report(error)); },

  getOwners() { return state.owners; },
  getOwner(ownerId) { return state.owners[ownerId] || null; },
  getOwnerByLoginId(loginId) { return Object.values(state.owners).find(owner => owner.loginId.toLowerCase() === loginId.toLowerCase()); },
  getOwnersByHotel(hotelId) { return Object.values(state.owners).filter(owner => owner.hotelId === hotelId); },
  createOwner(hotelId, ownerName, phone, loginId, password) { const id = crypto.randomUUID(); state.owners[id] = { ownerId: id, hotelId, hotelName: this.getHotel(hotelId)?.hotelName || "", ownerName, phone, loginId, role: "owner", enabled: true, createdAt: new Date().toISOString() }; void manageAccount({ action: "create", id, hotelId, displayName: ownerName, phone, loginId, password, role: "owner" }).then(() => this.refresh()); return id; },
  updateOwner(ownerId, updates) { state.owners[ownerId] = { ...state.owners[ownerId], ...updates }; void manageAccount({ action: "update", id: ownerId, ...updates }).then(() => this.refresh()); },
  deleteOwner(ownerId) { delete state.owners[ownerId]; void manageAccount({ action: "delete", id: ownerId }).then(() => this.refresh()); },

  getWaiters() { return state.waiters; },
  getWaiter(waiterId) { return state.waiters[waiterId] || null; },
  getWaiterByLoginId(hotelId, loginId) { return Object.values(state.waiters).find(waiter => waiter.hotelId === hotelId && waiter.loginId.toLowerCase() === loginId.toLowerCase() && waiter.enabled); },
  getWaitersByHotel(hotelId) { return Object.values(state.waiters).filter(waiter => waiter.hotelId === hotelId && waiter.role === "waiter"); },
  getCooksByHotel(hotelId) { return Object.values(state.waiters).filter(waiter => waiter.hotelId === hotelId && waiter.role === "cook"); },
  _createStaff(hotelId, name, loginId, password, role) { const id = crypto.randomUUID(); state.waiters[id] = { waiterId: id, hotelId, waiterName: name, loginId, role, enabled: true, createdAt: new Date().toISOString() }; void manageAccount({ action: "create", id, hotelId, displayName: name, loginId, password, role }).then(() => this.refresh()); return id; },
  createWaiter(hotelId, name, loginId, password) { return this._createStaff(hotelId, name, loginId, password, "waiter"); },
  createCook(hotelId, name, loginId, password) { return this._createStaff(hotelId, name, loginId, password, "cook"); },
  updateWaiter(id, updates) { state.waiters[id] = { ...state.waiters[id], ...updates }; void manageAccount({ action: "update", id, ...updates }).then(() => this.refresh()); },
  deleteWaiter(id) { delete state.waiters[id]; void manageAccount({ action: "delete", id }).then(() => this.refresh()); },

  getMenuItems() { return state.menuItems; },
  getHotelMenuItems(hotelId) { return Object.values(state.menuItems).filter(item => item.hotelId === hotelId); },
  addMenuItem(hotelId, itemName, price, category = "General") { const id = crypto.randomUUID(); state.menuItems[id] = { id, hotelId, itemName, price, category, createdAt: new Date().toISOString() }; void supabase.from("menu_items").insert({ id, hotel_id: hotelId, item_name: itemName, price, category }).then(({ error }) => report(error)); return id; },
  updateMenuItem(id, updates) { state.menuItems[id] = { ...state.menuItems[id], ...updates }; void supabase.from("menu_items").update({ item_name: updates.itemName, price: updates.price, category: updates.category }).eq("id", id).then(({ error }) => report(error)); },
  deleteMenuItem(id) { delete state.menuItems[id]; void supabase.from("menu_items").delete().eq("id", id).then(({ error }) => report(error)); },

  getOrders() { return state.orders; },
  getOrder(id) { return state.orders[id] || null; },
  getHotelOrders(hotelId) { return Object.values(state.orders).filter(order => order.hotelId === hotelId); },
  getHotelOpenOrders(hotelId) { return this.getHotelOrders(hotelId).filter(order => order.status === "OPEN").sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); },
  getHotelCompletedOrders(hotelId, date = null) { return this.getHotelOrders(hotelId).filter(order => order.status === "COMPLETED" && (!date || new Date(order.orderDate).toDateString() === new Date(date).toDateString())).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); },
  getTableOrder(hotelId, tableNumber) { return this.getHotelOrders(hotelId).find(order => order.tableNumber === tableNumber && order.status === "OPEN"); },
  createOrder(hotelId, tableNumber) { const id = crypto.randomUUID(); const orders = this.getHotelOrders(hotelId); const order = { id, orderNumber: orders.length ? Math.max(...orders.map(item => item.orderNumber)) + 1 : 101, hotelId, tableNumber, items: [], subtotal: 0, gst: 0, service: 0, totalAmount: 0, status: "OPEN", kitchenStatus: "PENDING", waiterId: null, waiterName: null, orderDate: new Date().toISOString() }; state.orders[id] = order; void supabase.from("orders").insert({ id, hotel_id: hotelId, order_number: order.orderNumber, table_number: tableNumber }).then(({ error }) => report(error)); return id; },
  updateOrder(id, updates) { state.orders[id] = { ...state.orders[id], ...updates }; const order = state.orders[id]; void supabase.from("orders").upsert({ id, hotel_id: order.hotelId, order_number: order.orderNumber, table_number: order.tableNumber, subtotal: order.subtotal, gst: order.gst, service: order.service, total_amount: order.totalAmount, status: order.status, kitchen_status: order.kitchenStatus, waiter_id: order.waiterId, waiter_name: order.waiterName, order_date: order.orderDate }).then(({ error }) => { report(error); return saveOrderItems(order); }); },
  deleteOrder(id) { delete state.orders[id]; void supabase.from("orders").delete().eq("id", id).then(({ error }) => report(error)); },

  getTableCount(hotelId) { return state.tableConfigs[hotelId] || 10; },
  setTableCount(hotelId, count) { const tableCount = Math.max(1, count); state.tableConfigs[hotelId] = tableCount; void supabase.from("table_configs").upsert({ hotel_id: hotelId, table_count: tableCount }).then(({ error }) => report(error)); },
  getCurrentUser() { return state.currentUser || GUEST_USER; },
  clearCurrentUser() { state.currentUser = null; void supabase.auth.signOut(); },
  async signIn(loginId, password) { const { error } = await supabase.auth.signInWithPassword({ email: authEmail(loginId), password }); if (error) throw error; await this.refresh(); return state.currentUser; },
  async changePassword(currentPassword, newPassword) { const user = state.currentUser; if (!user) throw new Error("Authentication required"); await this.signIn(user.loginId, currentPassword); const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error; },
  async resetPassword(id, password) { await manageAccount({ action: "reset-password", id, password }); },
};

await Storage.refresh();
