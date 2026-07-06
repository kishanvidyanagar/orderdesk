import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import { showMessage, formatCurrency } from "./utils.js";
import {
  populateTableDropdown,
  getNextOrderNumber
} from "./tables.js";
import {
  isWaiter, isOwner
} from "./permissions.js";

const user = requireLogin();
const hotelId = user.hotelId;
const currentWaiterId = user.role === "waiter" ? user.waiterId : null;
const currentWaiterName = user.role === "waiter" ? user.waiterName : null;

const tableSelect =
  document.getElementById("tableSelect");

const menuOrderList =
  document.getElementById("menuOrderList");

const cartList =
  document.getElementById("cartList");

const subTotalEl =
  document.getElementById("subTotal");

const gstAmountEl =
  document.getElementById("gstAmount");

const serviceAmountEl =
  document.getElementById("serviceAmount");

const gstRowEl =
  document.getElementById("gstRow");

const serviceRowEl =
  document.getElementById("serviceRow");

const grandTotalEl =
  document.getElementById("grandTotal");

const completeOrderBtn =
  document.getElementById("completeOrderBtn");

const tableOrderBanner =
  document.getElementById("tableOrderBanner");

const currentTableText =
  document.getElementById("currentTableText");

const currentOrderNumber =
  document.getElementById("currentOrderNumber");

let selectedTable = null;
let currentOrderId = null;
let currentOrderNumberValue = null;

let cart = [];

init();

if (isWaiter) {
  document
    .getElementById("addTableBtn")
    ?.remove();

  document
    .getElementById("menuNav")
    ?.remove();

  document
    .getElementById("salesNav")
    ?.remove();

  document
    .getElementById("waitersNav")
    ?.remove();

  document
    .getElementById("settingsNav")
    ?.remove();
}

function init() {
  populateTableDropdown(
    "tableSelect",
    hotelId
  );

  loadMenuItems();

  const params =
    new URLSearchParams(
      window.location.search
    );

  const table =
    params.get("table");

  if (table) {
    tableSelect.value = table;

    loadTableOrder(table);
  }
}

tableSelect.addEventListener(
  "change",
  e => {
    const table =
      e.target.value;

    if (!table) return;

    loadTableOrder(table);
  }
);

function loadTableOrder(
  tableNumber
) {
  selectedTable =
    Number(tableNumber);

  const openOrder = Storage.getTableOrder(hotelId, Number(tableNumber));

  if (openOrder) {
    currentOrderId =
      openOrder.id;

    currentOrderNumberValue =
      openOrder.orderNumber;

    cart =
      openOrder.items || [];

    currentTableText.textContent =
      `Table ${tableNumber}`;

    currentOrderNumber.textContent =
      `Order #${openOrder.orderNumber}`;

    tableOrderBanner.classList.remove(
      "hidden"
    );

    showMessage(
      "Existing order loaded"
    );
  } else {
    currentOrderId = null;

    const allOrders = Storage.getHotelOrders(hotelId);
    const nextNum = allOrders.length > 0
      ? Math.max(...allOrders.map(o => o.orderNumber)) + 1
      : 101;

    currentOrderNumberValue = nextNum;

    cart = [];

    currentTableText.textContent =
      `Table ${tableNumber}`;

    currentOrderNumber.textContent =
      `Order #${currentOrderNumberValue}`;

    tableOrderBanner.classList.remove(
      "hidden"
    );
  }

  renderCart();
}

function loadMenuItems() {
  const items =
    Storage.getHotelMenuItems(hotelId);

  menuOrderList.innerHTML = "";

  items.forEach(item => {
    menuOrderList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="menu-item">

        <div class="item-info">

          <h4>
            ${item.itemName}
          </h4>

          <p>
            ${item.category}
          </p>

          <strong>
            ${formatCurrency(
        item.price
      )}
          </strong>

        </div>

        <button
          class="button primary add-item-btn"
          data-id="${item.id}"
        >
          Add
        </button>

      </div>
    `
    );
  });

  document
    .querySelectorAll(
      ".add-item-btn"
    )
    .forEach(btn => {
      btn.addEventListener(
        "click",
        () => {
          addToCart(
            btn.dataset.id
          );
        }
      );
    });
}

function addToCart(id) {
  if (!selectedTable) {
    showMessage(
      "Select a table first",
      "error"
    );

    return;
  }

  const menuItem = Object.values(Storage.getMenuItems()).find(
    item => item.id === id
  );

  if (!menuItem) {
    showMessage("Item not found", "error");
    return;
  }

  const existing =
    cart.find(
      item =>
        item.id === id
    );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: menuItem.id,
      itemName:
        menuItem.itemName,
      price:
        menuItem.price,
      quantity: 1
    });
  }

  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";

  if (!cart.length) {
    cartList.innerHTML =
      `
      <p>
        No items selected
      </p>
      `;

    updateBill();

    return;
  }

  cart.forEach(item => {
    cartList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="order-card">

        <div>

          <h4>
            ${item.itemName}
          </h4>

          <p>
            ${formatCurrency(
        item.price
      )}
          </p>

        </div>

        <div class="quantity-actions">

          <button
            class="decrease-btn"
            data-id="${item.id}"
          >
            −
          </button>

          <span>
            ${item.quantity}
          </span>

          <button
            class="increase-btn"
            data-id="${item.id}"
          >
            +
          </button>

          <button
            class="remove-btn"
            data-id="${item.id}"
          >
            Remove
          </button>

        </div>

      </div>
    `
    );
  });

  attachCartEvents();

  updateBill();
}

function attachCartEvents() {
  document
    .querySelectorAll(
      ".increase-btn"
    )
    .forEach(btn => {
      btn.onclick = () =>
        changeQuantity(
          btn.dataset.id,
          1
        );
    });

  document
    .querySelectorAll(
      ".decrease-btn"
    )
    .forEach(btn => {
      btn.onclick = () =>
        changeQuantity(
          btn.dataset.id,
          -1
        );
    });

  document
    .querySelectorAll(
      ".remove-btn"
    )
    .forEach(btn => {
      btn.onclick = () =>
        removeItem(
          btn.dataset.id
        );
    });
}

function changeQuantity(
  id,
  change
) {
  const item =
    cart.find(
      item =>
        item.id === id
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(
      i => i.id !== id
    );
  }

  renderCart();
}

function removeItem(id) {
  cart = cart.filter(
    item =>
      item.id !== id
  );

  renderCart();
}

function getBillConfig() {
  const hotel = Storage.getHotel(hotelId);
  const gstEnabled = Boolean(hotel?.gstEnabled);

  return {
    gstEnabled,
    serviceEnabled: gstEnabled,
    gstRate: 0.05,
    serviceRate: 0.02
  };
}

function calculateBill(subtotal) {
  const {
    gstEnabled,
    serviceEnabled,
    gstRate,
    serviceRate
  } = getBillConfig();

  const gst = gstEnabled ? subtotal * gstRate : 0;
  const service = gstEnabled && serviceEnabled ? subtotal * serviceRate : 0;
  const total = subtotal + gst + service;

  return {
    subtotal,
    gst,
    service,
    total,
    gstEnabled
  };
}

function updateBillVisibility(gstEnabled) {
  if (gstRowEl) {
    gstRowEl.style.display = gstEnabled ? "flex" : "none";
  }

  if (serviceRowEl) {
    serviceRowEl.style.display = gstEnabled ? "flex" : "none";
  }
}

function updateBill() {
  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );

  const {
    gst,
    service,
    total,
    gstEnabled
  } = calculateBill(subtotal);

  updateBillVisibility(gstEnabled);

  subTotalEl.textContent =
    formatCurrency(
      subtotal
    );

  gstAmountEl.textContent =
    formatCurrency(gst);

  serviceAmountEl.textContent =
    formatCurrency(
      service
    );

  grandTotalEl.textContent =
    formatCurrency(total);
}

saveOrderBtn.addEventListener(
  "click",
  () => {
    saveOrder(false);
  }
);

completeOrderBtn.addEventListener(
  "click",
  () => {
    saveOrder(true);
  }
);

function saveOrder(
  completed
) {
  if (!selectedTable) {
    showMessage(
      "Select a table",
      "error"
    );
    return;
  }

  if (!cart.length) {
    showMessage(
      "Cart is empty",
      "error"
    );
    return;
  }

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );

  const {
    gst,
    service,
    total
  } = calculateBill(subtotal);

  if (currentOrderId) {
    // Update existing order
    Storage.updateOrder(currentOrderId, {
      items: cart,
      subtotal,
      gst,
      service,
      totalAmount: total,
      status: completed ? "COMPLETED" : "OPEN",
      waiterId: currentWaiterId,
      waiterName: currentWaiterName
    });
  } else {
    // Create new order
    const orderId = Storage.createOrder(hotelId, selectedTable);
    Storage.updateOrder(orderId, {
      items: cart,
      subtotal,
      gst,
      service,
      totalAmount: total,
      status: completed ? "COMPLETED" : "OPEN",
      waiterId: currentWaiterId,
      waiterName: currentWaiterName
    });
    currentOrderId = orderId;
  }

  if (completed) {
    showMessage(
      "Payment completed"
    );

    cart = [];

    currentOrderId =
      null;

    renderCart();

    setTimeout(() => {
      window.location.href =
        "dashboard.html";
    }, 1000);
  } else {
    showMessage(
      "Order saved"
    );
  }
}