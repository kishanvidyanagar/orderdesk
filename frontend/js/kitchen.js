import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";

const currentUser = requireLogin();
const hotelId = currentUser.hotelId;
const kitchenOrders =
  document.getElementById("kitchenOrders");

function updateStatus(orderId, newStatus) {
  const order = Storage.getOrder(orderId);

  if (!order) return;

  Storage.updateOrder(orderId, {
    kitchenStatus: newStatus
  });

  renderOrders();
}

function renderOrders() {
  const openOrders =
    Storage.getHotelOpenOrders(hotelId);

  kitchenOrders.innerHTML = "";

  if (!openOrders.length) {
    kitchenOrders.innerHTML = `
      <div class="card">
        <p>No kitchen orders available.</p>
      </div>
    `;
    return;
  }

  openOrders.forEach(order => {

    const kitchenStatus =
      order.kitchenStatus || "PENDING";

    const statusLabel =
      kitchenStatus === "PENDING" ? "Pending" :
      kitchenStatus === "PREPARING" ? "Preparing" :
      kitchenStatus === "READY" ? "Ready" :
      kitchenStatus === "SERVED" ? "Served" :
      kitchenStatus;

    const itemsHtml =
      order.items
        .map(
          item => `
            <li>
              ${item.quantity} × ${item.itemName}
            </li>
          `
        )
        .join("");

    kitchenOrders.innerHTML += `
      <div
        class="card"
        style="margin-bottom:20px;"
      >

        <h3>
          Table ${order.tableNumber}
        </h3>

        <p>
          Order #${order.orderNumber}
        </p>

        <p>
          Waiter: ${order.waiterName || "Unassigned"}
        </p>

        <ul>
          ${itemsHtml}
        </ul>

        <p>
          <strong>Status:</strong>
          ${statusLabel}
        </p>

        <div style="
          display:flex;
          gap:10px;
          margin-top:15px;
          flex-wrap:wrap;
        ">
          ${kitchenStatus === "PENDING" ? `
            <button
              class="button secondary"
              onclick="startCooking('${order.id}')"
            >
              Start Cooking
            </button>
          ` : ""}

          ${kitchenStatus === "PREPARING" ? `
            <button
              class="button primary"
              onclick="markReady('${order.id}')"
            >
              Mark Ready
            </button>
          ` : ""}

          ${kitchenStatus === "READY" ? `
            <button
              class="button secondary"
              onclick="markServed('${order.id}')"
            >
              Mark Served
            </button>
          ` : ""}
        </div>

      </div>
    `;
  });
}

window.startCooking =
  function(orderId) {
    updateStatus(
      orderId,
      "PREPARING"
    );
  };

window.markReady =
  function(orderId) {
    updateStatus(
      orderId,
      "READY"
    );
  };

window.markServed =
  function(orderId) {
    updateStatus(
      orderId,
      "SERVED"
    );
  };

renderOrders();