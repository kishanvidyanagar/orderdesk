import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import { showMessage, formatCurrency } from "./utils.js";
import {
  populateTableDropdown,
  getNextOrderNumber
} from "./tables.js";
import {
  isWaiter
} from "./permissions.js";

const user = requireLogin();

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

const grandTotalEl =
  document.getElementById("grandTotal");

const saveOrderBtn =
  document.getElementById("saveOrderBtn");

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
}

function init() {
  populateTableDropdown(
    "tableSelect",
    user.uid
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

  const orders =
    Storage.getOrders();

  const openOrder =
    orders.find(
      order =>
        order.hotelId ===
          user.uid &&
        order.tableNumber ===
          Number(tableNumber) &&
        order.status === "OPEN"
    );

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

    currentOrderNumberValue =
      getNextOrderNumber(
        user.uid
      );

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
    Storage.getMenuItems()
      .filter(
        item =>
          item.hotelId ===
          user.uid
      );

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

  const menuItem =
    Storage.getMenuItems()
      .find(
        item =>
          item.id === id
      );

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

function updateBill() {
  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const gst =
    subtotal * 0.05;

  const service =
    subtotal * 0.02;

  const total =
    subtotal +
    gst +
    service;

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

  const orders =
    Storage.getOrders();

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const gst =
    subtotal * 0.05;

  const service =
    subtotal * 0.02;

  const total =
    subtotal +
    gst +
    service;

  const order = {
    id:
      currentOrderId ||
      "order_" +
        Date.now(),

    orderNumber:
      currentOrderNumberValue,

    hotelId:
      user.uid,

    tableNumber:
      selectedTable,

    items: cart,

    subtotal,

    gst,

    service,

    totalAmount:
      total,

    status:
      completed
        ? "COMPLETED"
        : "OPEN",

    orderDate:
      new Date().toISOString()
  };

  const existingIndex =
    orders.findIndex(
      o =>
        o.id ===
        order.id
    );

  if (
    existingIndex >= 0
  ) {
    orders[
      existingIndex
    ] = order;
  } else {
    orders.push(order);
  }

  Storage.saveOrders(
    orders
  );

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