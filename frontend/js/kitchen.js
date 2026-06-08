import { Storage } from "./storage.js";

const kitchenOrders =
  document.getElementById("kitchenOrders");

function updateStatus(orderId, newStatus) {

  const orders =
    Storage.getOrders();

  const order =
    orders.find(
      o => o.id === orderId
    );

  if (!order) return;

  order.kitchenStatus =
    newStatus;

  Storage.saveOrders(
    orders
  );

  renderOrders();
}

function renderOrders() {

  const orders =
    Storage.getOrders();

  kitchenOrders.innerHTML = "";

  const openOrders =
    orders.filter(
      order =>
        order.status === "OPEN"
    );

  if (!openOrders.length) {

    kitchenOrders.innerHTML = `
      <div class="card">
        <p>No kitchen orders available.</p>
      </div>
    `;

    return;
  }

  openOrders.forEach(order => {

    if (!order.kitchenStatus) {
      order.kitchenStatus =
        "OPEN";
    }

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

        <ul>
          ${itemsHtml}
        </ul>

        <p>
          <strong>Status:</strong>
          ${order.kitchenStatus}
        </p>

        <div style="
          display:flex;
          gap:10px;
          margin-top:15px;
        ">

          <button
            class="button secondary"
            onclick="startCooking('${order.id}')"
          >
            Start Cooking
          </button>

          <button
            class="button primary"
            onclick="markReady('${order.id}')"
          >
            Ready
          </button>

        </div>

      </div>
    `;
  });

  Storage.saveOrders(orders);
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

renderOrders();