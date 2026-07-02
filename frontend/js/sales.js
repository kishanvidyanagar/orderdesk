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

const salesHistory =
  document.getElementById(
    "salesHistory"
  );

if (!isOwner) {
  window.location.href =
    "dashboard.html";
}

function loadSales() {
  const completedOrders =
    Storage.getHotelCompletedOrders(hotelId, new Date());

  const total =
    completedOrders.reduce(
      (sum, o) =>
        sum +
        o.totalAmount,
      0
    );

  reportSales.textContent =
    formatCurrency(
      total
    );

  reportOrders.textContent =
    completedOrders.length;

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