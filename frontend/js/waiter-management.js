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
const kitchenEnabled = Boolean(Storage.getHotel(hotelId)?.cookEnabled);

function updatePageState() {
  const greeting = document.getElementById("hotelGreeting");
  const pageTitle = document.getElementById("pageTitle");
  const pageDescription = document.getElementById("pageDescription");
  const cookSection = document.getElementById("cookSection");
  const cookListSection = document.getElementById("cookListSection");

  if (greeting) {
    greeting.textContent = kitchenEnabled ? "Waiters & Cooks" : "Waiter Management";
  }

  if (pageTitle) {
    pageTitle.textContent = kitchenEnabled ? "Manage Waiters & Cooks" : "Manage Waiters";
  }

  if (pageDescription) {
    pageDescription.textContent = kitchenEnabled
      ? "Add, edit, and manage waiter and cook accounts for your hotel"
      : "Add, edit, and manage waiter accounts for your hotel";
  }

  if (cookSection) {
    cookSection.style.display = kitchenEnabled ? "" : "none";
  }

  if (cookListSection) {
    cookListSection.style.display = kitchenEnabled ? "" : "none";
  }
}

/* =========================
   ADD WAITER
========================= */

const addWaiterForm = document.getElementById("addWaiterForm");

addWaiterForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const waiterName = document.getElementById("waiterName").value.trim();
  const loginId = document.getElementById("waiterLoginId").value.trim();
  const password = document.getElementById("waiterPassword").value;

  if (!waiterName || !loginId || !password) {
    showMessage("All fields are required", "error");
    return;
  }

  const allStaff = Storage.getWaiters();
  const exists = Object.values(allStaff).some(staff => staff.loginId === loginId);

  if (exists) {
    showMessage("Login ID already in use", "error");
    return;
  }

  Storage.createWaiter(hotelId, waiterName, loginId, password);

  showMessage("Waiter added successfully", "success");
  addWaiterForm.reset();
  loadWaiters();
});

/* =========================
   ADD COOK
========================= */

const addCookForm = document.getElementById("addCookForm");

addCookForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const cookName = document.getElementById("cookName").value.trim();
  const loginId = document.getElementById("cookLoginId").value.trim();
  const password = document.getElementById("cookPassword").value;

  if (!cookName || !loginId || !password) {
    showMessage("All fields are required", "error");
    return;
  }

  const allStaff = Storage.getWaiters();
  const exists = Object.values(allStaff).some(staff => staff.loginId === loginId);

  if (exists) {
    showMessage("Login ID already in use", "error");
    return;
  }

  Storage.createCook(hotelId, cookName, loginId, password);

  showMessage("Cook added successfully", "success");
  addCookForm.reset();
  loadCooks();
});

/* =========================
   LOAD WAITERS
========================= */

function loadWaiters() {
  const list = document.getElementById("waiterList");
  const waiters = Storage.getWaitersByHotel(hotelId);

  list.innerHTML = "";

  if (waiters.length === 0) {
    list.innerHTML = "<p style='color: #999;'>No waiters yet</p>";
    return;
  }

  waiters.forEach(waiter => {
    const status = waiter.enabled ? "Enabled" : "Disabled";
    const statusColor = waiter.enabled ? "#10b981" : "#ef4444";

    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.flexDirection = "column";
    card.style.alignItems = "flex-start";
    card.style.gap = "12px";

    card.innerHTML = `
      <div style="width: 100%;">
        <strong>${waiter.waiterName}</strong>
        <div class="small-text">Login ID: ${waiter.loginId}</div>
        <div class="small-text">Status: <span style="color: ${statusColor};">${status}</span></div>
      </div>

      <div style="display:flex; gap:10px; width: 100%; flex-wrap: wrap;">
        <button class="button secondary" onclick="editWaiter('${waiter.waiterId}')">
          Edit
        </button>
        <button class="button secondary" onclick="toggleWaiter('${waiter.waiterId}')">
          ${waiter.enabled ? "Disable" : "Enable"}
        </button>
        <button class="button secondary" onclick="resetPassword('${waiter.waiterId}')">
          Reset Password
        </button>
        <button class="button secondary" onclick="changeLoginId('${waiter.waiterId}')">
          Change Login ID
        </button>
        <button class="button danger" onclick="deleteWaiter('${waiter.waiterId}')">
          Delete
        </button>
      </div>
    `;

    list.appendChild(card);
  });
}

/* =========================
   LOAD COOKS
========================= */

function loadCooks() {
  const list = document.getElementById("cookList");
  const cooks = Storage.getCooksByHotel(hotelId);

  list.innerHTML = "";

  if (cooks.length === 0) {
    list.innerHTML = "<p style='color: #999;'>No cooks yet</p>";
    return;
  }

  cooks.forEach(cook => {
    const status = cook.enabled ? "Enabled" : "Disabled";
    const statusColor = cook.enabled ? "#10b981" : "#ef4444";

    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.flexDirection = "column";
    card.style.alignItems = "flex-start";
    card.style.gap = "12px";

    card.innerHTML = `
      <div style="width: 100%;">
        <strong>${cook.waiterName}</strong>
        <div class="small-text">Login ID: ${cook.loginId}</div>
        <div class="small-text">Status: <span style="color: ${statusColor};">${status}</span></div>
      </div>

      <div style="display:flex; gap:10px; width: 100%; flex-wrap: wrap;">
        <button class="button secondary" onclick="editCook('${cook.waiterId}')">
          Edit
        </button>
        <button class="button secondary" onclick="toggleCook('${cook.waiterId}')">
          ${cook.enabled ? "Disable" : "Enable"}
        </button>
        <button class="button secondary" onclick="resetCookPassword('${cook.waiterId}')">
          Reset Password
        </button>
        <button class="button secondary" onclick="changeCookLoginId('${cook.waiterId}')">
          Change Login ID
        </button>
        <button class="button danger" onclick="deleteCook('${cook.waiterId}')">
          Delete
        </button>
      </div>
    `;

    list.appendChild(card);
  });
}

window.editWaiter = function (waiterId) {
  const waiter = Storage.getWaiter(waiterId);
  const newName = prompt("Enter waiter name:", waiter.waiterName);

  if (newName && newName.trim()) {
    Storage.updateWaiter(waiterId, { waiterName: newName.trim() });
    showMessage("Waiter updated", "success");
    loadWaiters();
  }
};

window.toggleWaiter = function (waiterId) {
  const waiter = Storage.getWaiter(waiterId);
  Storage.updateWaiter(waiterId, { enabled: !waiter.enabled });
  showMessage(`Waiter ${waiter.enabled ? "disabled" : "enabled"}`, "success");
  loadWaiters();
};

window.resetPassword = function (waiterId) {
  const newPassword = prompt("Enter new password:");
  if (newPassword) {
    Storage.updateWaiter(waiterId, { password: newPassword });
    showMessage("Password reset successfully", "success");
    loadWaiters();
  }
};

window.changeLoginId = function (waiterId) {
  const waiter = Storage.getWaiter(waiterId);
  const newLoginId = prompt("Enter new login ID:", waiter.loginId);

  if (newLoginId && newLoginId.trim()) {
    const allStaff = Storage.getWaiters();
    const exists = Object.values(allStaff).some(
      staff => staff.loginId === newLoginId.trim() && staff.waiterId !== waiterId
    );

    if (exists) {
      showMessage("Login ID already in use", "error");
      return;
    }

    Storage.updateWaiter(waiterId, { loginId: newLoginId.trim() });
    showMessage("Login ID changed successfully", "success");
    loadWaiters();
  }
};

window.deleteWaiter = function (waiterId) {
  if (confirm("Delete this waiter permanently?")) {
    Storage.deleteWaiter(waiterId);
    showMessage("Waiter deleted", "success");
    loadWaiters();
  }
};

window.editCook = function (cookId) {
  const cook = Storage.getWaiter(cookId);
  const newName = prompt("Enter cook name:", cook.waiterName);

  if (newName && newName.trim()) {
    Storage.updateWaiter(cookId, { waiterName: newName.trim() });
    showMessage("Cook updated", "success");
    loadCooks();
  }
};

window.toggleCook = function (cookId) {
  const cook = Storage.getWaiter(cookId);
  Storage.updateWaiter(cookId, { enabled: !cook.enabled });
  showMessage(`Cook ${cook.enabled ? "disabled" : "enabled"}`, "success");
  loadCooks();
};

window.resetCookPassword = function (cookId) {
  const newPassword = prompt("Enter new password:");
  if (newPassword) {
    Storage.updateWaiter(cookId, { password: newPassword });
    showMessage("Password reset successfully", "success");
    loadCooks();
  }
};

window.changeCookLoginId = function (cookId) {
  const cook = Storage.getWaiter(cookId);
  const newLoginId = prompt("Enter new login ID:", cook.loginId);

  if (newLoginId && newLoginId.trim()) {
    const allStaff = Storage.getWaiters();
    const exists = Object.values(allStaff).some(
      staff => staff.loginId === newLoginId.trim() && staff.waiterId !== cookId
    );

    if (exists) {
      showMessage("Login ID already in use", "error");
      return;
    }

    Storage.updateWaiter(cookId, { loginId: newLoginId.trim() });
    showMessage("Login ID changed successfully", "success");
    loadCooks();
  }
};

window.deleteCook = function (cookId) {
  if (confirm("Delete this cook permanently?")) {
    Storage.deleteWaiter(cookId);
    showMessage("Cook deleted", "success");
    loadCooks();
  }
};

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

updatePageState();
loadWaiters();
loadCooks();
