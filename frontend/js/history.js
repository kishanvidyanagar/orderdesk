import { Storage } from "./storage.js";
import { formatCurrency, formatDate } from "./utils.js";

/* =========================
   ACCESS CONTROL
========================= */

const currentUser = Storage.getCurrentUser();
if (!currentUser || currentUser.role !== "owner") {
  window.location.href = "dashboard.html";
}

const hotelId = currentUser.hotelId;

/* =========================
   UPDATE GREETING
========================= */

document.getElementById("hotelGreeting").textContent = `${currentUser.hotelName} - History`;

/* =========================
   LOAD ORDER HISTORY
========================= */

function loadOrderHistory() {
  const list = document.getElementById("orderHistory");
  const completedOrders = Storage.getHotelCompletedOrders(hotelId, new Date());

  list.innerHTML = "";

  if (completedOrders.length === 0) {
    list.innerHTML = "<p style='color: #999;'>No completed orders yet</p>";
    document.getElementById("orderCount").textContent = "Total: 0";
    return;
  }

  document.getElementById("orderCount").textContent = `Total: ${completedOrders.length}`;

  completedOrders.forEach(order => {
    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.flexDirection = "column";
    card.style.alignItems = "flex-start";
    card.style.gap = "8px";

    const itemsText = order.items
      .map(item => `${item.quantity}x ${item.itemName}`)
      .join(", ");

    card.innerHTML = `
      <div style="width: 100%;">
        <strong>Order #${order.orderNumber}</strong>
        <div class="small-text">Table ${order.tableNumber} • ${formatDate(order.orderDate)}</div>
      </div>

      <div style="width: 100%; padding: 8px; background: #f3f4f6; border-radius: 4px;">
        <div class="small-text" style="margin-bottom: 4px;">${itemsText}</div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total:</span>
          <span>${formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    `;

    list.appendChild(card);
  });

  updateSummaryStats(completedOrders);
}

/* =========================
   UPDATE SUMMARY STATS
========================= */

function updateSummaryStats(completedOrders) {
  const totalSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrder = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

  document.getElementById("totalSales").textContent = formatCurrency(totalSales);
  document.getElementById("totalOrders").textContent = completedOrders.length;
  document.getElementById("avgOrderValue").textContent = formatCurrency(avgOrder);
}

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

loadOrderHistory();
