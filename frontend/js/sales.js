import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import {
  formatCurrency,
  formatDate
} from "./utils.js";
import {
  isWaiter
} from "./permissions.js";

const user = requireLogin();

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

  if (isWaiter) {

  window.location.href =
    "dashboard.html";
}

function loadSales() {
  const orders =
    Storage.getOrders()
      .filter(
        o =>
          o.hotelId ===
          user.uid
      )
      .sort(
        (a, b) =>
          new Date(
            b.orderDate
          ) -
          new Date(
            a.orderDate
          )
      );

  const today =
    new Date()
      .toDateString();

  const todayOrders =
    orders.filter(
      o =>
        new Date(
          o.orderDate
        ).toDateString() ===
        today
    );

  const total =
    todayOrders.reduce(
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
    todayOrders.length;

  salesHistory.innerHTML =
    "";

  orders.forEach(
    order => {
      salesHistory.insertAdjacentHTML(
        "beforeend",
        `
        <div class="history-item">
          <h4>
            Table ${order.tableNumber}
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