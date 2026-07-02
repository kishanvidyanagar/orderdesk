import { Storage } from "./storage.js";
import { showMessage } from "./utils.js";

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

document.getElementById("hotelGreeting").textContent = `${currentUser.hotelName} - Table Management`;

/* =========================
   TABLE CONFIG
========================= */

const tableConfigForm = document.getElementById("tableConfigForm");
const tableCountInput = document.getElementById("tableCount");

// Load current table count
function loadTableCount() {
  const count = Storage.getTableCount(hotelId);
  tableCountInput.value = count;
}

tableConfigForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const count = parseInt(tableCountInput.value, 10);

  if (count < 1 || count > 50) {
    showMessage("Table count must be between 1 and 50", "error");
    return;
  }

  Storage.setTableCount(hotelId, count);
  showMessage("Table configuration updated", "success");
  loadTableGrid();
});

/* =========================
   LOAD TABLE GRID
========================= */

function loadTableGrid() {
  const grid = document.getElementById("tableGrid");
  const tableCount = Storage.getTableCount(hotelId);
  const openOrders = Storage.getHotelOpenOrders(hotelId);

  grid.innerHTML = "";

  for (let i = 1; i <= tableCount; i++) {
    const order = openOrders.find(o => o.tableNumber === i);
    const isOccupied = !!order;

    const tableBtn = document.createElement("button");
    tableBtn.type = "button";
    tableBtn.className = isOccupied ? "table-button occupied" : "table-button available";
    tableBtn.textContent = `Table ${i}`;
    tableBtn.style.padding = "15px";
    tableBtn.style.borderRadius = "8px";
    tableBtn.style.fontWeight = "bold";
    tableBtn.style.cursor = "pointer";
    tableBtn.style.backgroundColor = isOccupied ? "#fbbf24" : "#d1d5db";
    tableBtn.style.color = "#000";
    tableBtn.style.border = "1px solid #999";

    if (isOccupied) {
      tableBtn.innerHTML += `<div style="font-size: 12px; margin-top: 5px;">Order #${order.orderNumber}</div>`;
    }

    tableBtn.addEventListener("click", () => {
      window.location.href = `orders.html?table=${i}`;
    });

    grid.appendChild(tableBtn);
  }
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

loadTableCount();
loadTableGrid();
