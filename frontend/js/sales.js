import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import {
  formatCurrency,
  formatDate
} from "./utils.js";
import {
  isWaiter, isOwner
} from "./permissions.js";

const user = requireLogin();
const hotelId = user.hotelId;

const reportSales =
  document.getElementById(
    "reportSales"
  );

const reportOrders =
  document.getElementById(
    "reportOrders"
  );

const topWaiter =
  document.getElementById(
    "topWaiter"
  );

const topWaiterSales =
  document.getElementById(
    "topWaiterSales"
  );

const lifetimeRevenue =
  document.getElementById(
    "lifetimeRevenue"
  );

const startDateInput =
  document.getElementById(
    "startDate"
  );

const endDateInput =
  document.getElementById(
    "endDate"
  );

const waiterFilter =
  document.getElementById(
    "waiterFilter"
  );

const applyFiltersBtn =
  document.getElementById(
    "applyFiltersBtn"
  );

const resetFiltersBtn =
  document.getElementById(
    "resetFiltersBtn"
  );

const historyCount =
  document.getElementById(
    "historyCount"
  );

const salesHistory =
  document.getElementById(
    "salesHistory"
  );

if (isWaiter) {
  window.location.href =
    "dashboard.html";
}

if (!isOwner) {
  window.location.href =
    "dashboard.html";
}

function getFilteredOrders() {
  const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
  const waiter = waiterFilter.value;

  const endOfDay = endDate ? new Date(endDate.getTime()) : null;
  if (endOfDay) {
    endOfDay.setHours(23, 59, 59, 999);
  }

  return Storage.getHotelCompletedOrders(hotelId).filter(order => {
    const orderDate = new Date(order.orderDate);

    if (startDate && orderDate < startDate) {
      return false;
    }

    if (endOfDay && orderDate > endOfDay) {
      return false;
    }

    if (waiter !== "all" && order.waiterName !== waiter) {
      return false;
    }

    return true;
  });
}

function populateWaiterFilter() {
  const waiters = Storage.getWaitersByHotel(hotelId);

  waiterFilter.innerHTML = `
    <option value="all">All Waiters</option>
  `;

  waiters.forEach(waiter => {
    waiterFilter.insertAdjacentHTML(
      "beforeend",
      `<option value="${waiter.waiterName}">${waiter.waiterName}</option>`
    );
  });
}

applyFiltersBtn.addEventListener("click", () => {
  loadSales();
});

resetFiltersBtn.addEventListener("click", () => {
  startDateInput.value = "";
  endDateInput.value = "";
  waiterFilter.value = "all";
  loadSales();
});

populateWaiterFilter();

function loadSales() {
  const completedOrders = getFilteredOrders();
  const lifetimeOrders = Storage.getHotelCompletedOrders(hotelId);

  const total =
    completedOrders.reduce(
      (sum, o) =>
        sum +
        o.totalAmount,
      0
    );

  const lifetimeTotal = lifetimeOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );

  const waiterTotals = completedOrders.reduce((map, order) => {
    const name = order.waiterName || "Unassigned";
    map[name] = (map[name] || 0) + order.totalAmount;
    return map;
  }, {});

  const topWaiterEntry = Object.entries(waiterTotals).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

  reportSales.textContent =
    formatCurrency(
      total
    );

  reportOrders.textContent =
    completedOrders.length;

  topWaiter.textContent =
    topWaiterEntry[0];

  topWaiterSales.textContent =
    formatCurrency(topWaiterEntry[1]);

  lifetimeRevenue.textContent =
    formatCurrency(
      lifetimeTotal
    );

  historyCount.textContent =
    `${completedOrders.length} Orders`;

  salesHistory.innerHTML =
    "";

  completedOrders.forEach(
    order => {
      salesHistory.insertAdjacentHTML(
        "beforeend",
        `
        <div class="history-item">
          <h4>
            Order #${order.orderNumber} - Table ${order.tableNumber}
          </h4>

          <p>
            ${formatDate(
              order.orderDate
            )}
          </p>

          <p>
            Waiter: ${order.waiterName || "N/A"}
          </p>

          <p>
            Kitchen: ${order.kitchenStatus || "PENDING"}
          </p>

          <strong>
            ${formatCurrency(
              order.totalAmount
            )}
          </strong>
        </div>
      `
      );
    }
  );
}

loadSales();