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

document.getElementById("hotelGreeting").textContent = `${currentUser.hotelName} - Waiter Management`;

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

  // Check if loginId already exists
  const allWaiters = Storage.getWaiters();
  const exists = Object.values(allWaiters).some(w => w.loginId === loginId);

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

window.editWaiter = function(waiterId) {
  const waiter = Storage.getWaiter(waiterId);
  const newName = prompt("Enter waiter name:", waiter.waiterName);
  
  if (newName && newName.trim()) {
    Storage.updateWaiter(waiterId, { waiterName: newName.trim() });
    showMessage("Waiter updated", "success");
    loadWaiters();
  }
};

window.toggleWaiter = function(waiterId) {
  const waiter = Storage.getWaiter(waiterId);
  Storage.updateWaiter(waiterId, { enabled: !waiter.enabled });
  showMessage(`Waiter ${waiter.enabled ? "disabled" : "enabled"}`, "success");
  loadWaiters();
};

window.resetPassword = function(waiterId) {
  const newPassword = prompt("Enter new password:");
  if (newPassword) {
    Storage.updateWaiter(waiterId, { password: newPassword });
    showMessage("Password reset successfully", "success");
    loadWaiters();
  }
};

window.changeLoginId = function(waiterId) {
  const waiter = Storage.getWaiter(waiterId);
  const newLoginId = prompt("Enter new login ID:", waiter.loginId);
  
  if (newLoginId && newLoginId.trim()) {
    // Check if new loginId already exists
    const allWaiters = Storage.getWaiters();
    const exists = Object.values(allWaiters).some(
      w => w.loginId === newLoginId.trim() && w.waiterId !== waiterId
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

window.deleteWaiter = function(waiterId) {
  if (confirm("Delete this waiter permanently?")) {
    Storage.deleteWaiter(waiterId);
    showMessage("Waiter deleted", "success");
    loadWaiters();
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

loadWaiters();
