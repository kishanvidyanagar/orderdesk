import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import { formatCurrency, formatDate, showMessage } from "./utils.js";
import { isWaiter, isOwner, isCook } from "./permissions.js";

const currentUser = requireLogin();
const hotelId = currentUser.hotelId;

const todaySales = document.getElementById("todaySales");
const todayOrders = document.getElementById("todayOrders");
const menuCount = document.getElementById("menuCount");
const hotelGreeting = document.getElementById("hotelGreeting");

const openOrdersList = document.getElementById("openOrdersList");
const tableStatusGrid = document.getElementById("tableStatusGrid");
const addTableBtn = document.getElementById("addTableBtn");

/* =========================
   HIDE OWNER-ONLY FEATURES FOR WAITERS
========================= */

if (isWaiter || isCook) {
  document.getElementById("menuNav")?.remove();
  document.getElementById("salesNav")?.remove();
  document.getElementById("waitersNav")?.remove();
  document.getElementById("settingsNav")?.remove();
  if (addTableBtn) addTableBtn.remove();
  todaySales.closest(".stat-card")?.remove();
}

/* =========================
   LOAD DASHBOARD METRICS
========================= */

function loadDashboardMetrics() {
  const allOrders = Storage.getHotelOrders(hotelId);
  const menuItems = Storage.getHotelMenuItems(hotelId);

  const today = new Date().toDateString();

  const todayOrders_ = allOrders.filter(
    o => new Date(o.orderDate).toDateString() === today && o.status === "COMPLETED"
  );

  const total = todayOrders_.reduce((sum, o) => sum + o.totalAmount, 0);

  todaySales.textContent = formatCurrency(total);
  todayOrders.textContent = todayOrders_.length;
  menuCount.textContent = menuItems.length;
}

/* =========================
   LOAD GREETING
========================= */

function loadGreeting() {
  const userName = isOwner ? currentUser.ownerName : currentUser.waiterName;
  hotelGreeting.textContent = `Welcome, ${userName}`;
}

/* =========================
   LOAD OPEN ORDERS
========================= */

function loadOpenOrders() {
  const orders = Storage.getHotelOpenOrders(hotelId);
  const kitchenEnabled = Boolean(Storage.getHotel(hotelId)?.cookEnabled);

  openOrdersList.innerHTML = "";

  if (orders.length === 0) {
    openOrdersList.innerHTML = "<p style='color: #999; padding: 20px; text-align: center;'>No open orders</p>";
    return;
  }

  orders.forEach(order => {
    const kitchenStatus = order.kitchenStatus || "OPEN";

    openOrdersList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="history-item compact">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:12px;
        ">

          <div>

            <h4>
              Order #${order.orderNumber} - Table ${order.tableNumber}
            </h4>

            <p>
              ${formatDate(order.orderDate)}
            </p>

            <strong>
              ${formatCurrency(order.totalAmount)}
            </strong>

            ${kitchenEnabled ? `
              <p style="
                margin-top:8px;
                font-weight:bold;
              ">
                Kitchen: ${kitchenStatus}
              </p>
            ` : ""}

          </div>

          <button
            class="button primary sm flat"
            onclick="
              window.location.href=
              'orders.html?table=${order.tableNumber}'
            "
            style="
              white-space:nowrap;
              font-size:0.75rem;
              padding:6px 10px;
            "
          >
            Continue
          </button>

        </div>

      </div>
      `
    );
  });
}

/* =========================
   LOAD TABLE STATUS
========================= */

function loadTableStatus() {
  tableStatusGrid.innerHTML = "";

  const tableCount = Storage.getTableCount(hotelId);
  const openOrders = Storage.getHotelOpenOrders(hotelId);

  for (let i = 1; i <= tableCount; i++) {
    const openOrder = openOrders.find(o => o.tableNumber === i);

    tableStatusGrid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="table-card-wrapper">
        ${isOwner ? `
          <button
            class="delete-table-btn"
            onclick="event.stopPropagation();window.deleteTable(${i})"
            title="Delete table"
          >
            ×
          </button>
        ` : ""}
        <button
          class="table-status-card-item ${openOrder ? "occupied" : "available"}"
          onclick="window.location.href='orders.html?table=${i}'"
        >
          <div>
            <h4>Table ${i}</h4>
            <p>
              ${openOrder ? "Occupied" : "Available"}
            </p>
          </div>
        </button>
      </div>
    `
    );
  }
}

/* =========================
   ADD TABLE
========================= */

if (addTableBtn && isOwner) {
  addTableBtn.addEventListener("click", () => {
    const currentCount = Storage.getTableCount(hotelId);
    Storage.setTableCount(hotelId, currentCount + 1);
    loadTableStatus();
    showMessage("Table added");
  });
}

/* =========================
   DELETE TABLE
========================= */

window.deleteTable = (tableNumber) => {
  if (confirm(`Delete Table ${tableNumber}?`)) {
    const currentCount = Storage.getTableCount(hotelId);
    if (currentCount > 1) {
      Storage.setTableCount(hotelId, currentCount - 1);
      loadTableStatus();
      showMessage("Table deleted");
    } else {
      showMessage("Cannot delete the last table", "error");
    }
  }
};

/* =========================
   LOGOUT
========================= */

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  Storage.clearCurrentUser();
  window.location.href = "index.html";
});

/* =========================
   INIT
========================= */

loadGreeting();
loadDashboardMetrics();
loadOpenOrders();
loadTableStatus();