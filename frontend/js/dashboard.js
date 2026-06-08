import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import { formatCurrency, formatDate, showMessage } from "./utils.js";
import {
  getHotelTableCount,
  addTableForHotel,
  removeLastTable
} from "./tables.js";
import {
  isWaiter
} from "./permissions.js";

const user = requireLogin();

const todaySales = document.getElementById("todaySales");
const todayOrders = document.getElementById("todayOrders");
const menuCount = document.getElementById("menuCount");
const hotelGreeting = document.getElementById("hotelGreeting");

const openOrdersList =
  document.getElementById("openOrdersList");

const tableStatusGrid =
  document.getElementById("tableStatusGrid");

const addTableBtn =
  document.getElementById("addTableBtn");

if (isWaiter) {
  document
    .getElementById("menuNav")
    ?.remove();

  document
    .getElementById("salesNav")
    ?.remove();

  document
    .getElementById("addTableBtn")
    ?.remove();
}

function loadDashboardMetrics() {
  const orders = Storage.getOrders()
    .filter(o => o.hotelId === user.uid);

  const menuItems = Storage.getMenuItems()
    .filter(m => m.hotelId === user.uid);

  const today = new Date().toDateString();

  const todayData = orders.filter(
    o =>
      new Date(o.orderDate)
        .toDateString() === today
  );

  const total = todayData.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );

  todaySales.textContent =
    formatCurrency(total);

  todayOrders.textContent =
    todayData.length;

  menuCount.textContent =
    menuItems.length;
}

function loadGreeting() {
  const hotels =
    Storage.getHotels();

  const hotel =
    hotels[user.uid];

  hotelGreeting.textContent =
    `Welcome, ${hotel.hotelName}`;
}

function loadOpenOrders() {

  const orders = Storage.getOrders()
    .filter(
      o =>
        o.hotelId === user.uid &&
        o.status === "OPEN"
    );

  openOrdersList.innerHTML = "";

  orders.forEach(order => {

    const kitchenStatus =
      order.kitchenStatus || "OPEN";

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
              Table ${order.tableNumber}
            </h4>

            <p>
              ${formatDate(order.orderDate)}
            </p>

            <strong>
              ${formatCurrency(order.totalAmount)}
            </strong>

            <p style="
              margin-top:8px;
              font-weight:bold;
            ">
              Kitchen Status:
              ${kitchenStatus}
            </p>

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
            Continue Order
          </button>

        </div>

      </div>
      `
    );
  });
}
function loadTableStatus() {
  tableStatusGrid.innerHTML = "";

  const tableCount =
    getHotelTableCount(user.uid);

  const orders =
    Storage.getOrders();

  const canDelete = !isWaiter;

  for (
    let i = 1;
    i <= tableCount;
    i++
  ) {
    const openOrder =
      orders.find(
        o =>
          o.hotelId === user.uid &&
          o.tableNumber == i &&
          o.status === "OPEN"
      );

    tableStatusGrid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="table-card-wrapper">
        ${canDelete ? `
<button
  class="delete-table-btn"
  onclick="event.stopPropagation();window.deleteTable(${i})"
  title="Delete table"
>
  ×
</button>
` : ""}
        <button
          class="table-status-card-item ${openOrder
        ? "occupied"
        : "available"
      }"
          onclick="window.location.href='orders.html?table=${i}'"
        >
          <div>
            <h4>Table ${i}</h4>
            <p>
              ${openOrder
        ? "Occupied"
        : "Available"
      }
            </p>
          </div>
        </button>
      </div>
    `
    );
  }
}

if (addTableBtn) {
  addTableBtn.addEventListener(
    "click",
    () => {
      addTableForHotel(user.uid);

      loadTableStatus();

      showMessage(
        "Table added"
      );
    }
  );
}

loadGreeting();
loadDashboardMetrics();
loadOpenOrders();
loadTableStatus();

// Delete table function exposed to window
window.deleteTable = (tableNumber) => {
  if (confirm(`Are you sure you want to delete Table ${tableNumber}?`)) {
    removeLastTable(user.uid);
    loadTableStatus();
    showMessage(`Table ${tableNumber} deleted`);
  }
};