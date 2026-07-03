import { Storage } from "./storage.js";
import { showMessage } from "./utils.js";

/* =========================
   ACCESS CONTROL
========================= */

const currentUser = Storage.getCurrentUser();
if (!currentUser || currentUser.role !== "admin") {
  window.location.href = "admin-login.html";
}

document.getElementById("changeAdminPasswordBtn")?.addEventListener("click", () => {
  const currentPassword = prompt("Enter current admin password:");
  if (!currentPassword) return;

  const admin = Storage.getAdminByLoginId("admin");
  if (!admin) {
    showMessage("Admin account not found", "error");
    return;
  }

  if (admin.password !== currentPassword) {
    showMessage("Current password is incorrect", "error");
    return;
  }

  const newPassword = prompt("Enter new admin password:");
  if (!newPassword || newPassword.length < 4) {
    showMessage("Password must be at least 4 characters", "error");
    return;
  }

  Storage.updateAdminPassword("admin", newPassword);
  showMessage("Admin password updated successfully", "success");
});

/* =========================
   ADD HOTEL
========================= */

const hotelForm = document.getElementById("hotelForm");

hotelForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const input = document.getElementById("hotelName");
  const hotelName = input.value.trim();
  const gstEnabled = document.getElementById("hotelGstEnabled").checked;
  const cookEnabled = document.getElementById("hotelCookEnabled").checked;
  const addBtn = document.getElementById("addHotelBtn");

  // basic validation
  if (hotelName.length < 2) {
    showMessage("Hotel name must be at least 2 characters", "error");
    return;
  }

  if (!hotelName) {
    showMessage("Enter hotel name", "error");
    return;
  }

  const hotels = Storage.getHotels();

  const normalize = name => name.replace(/\s+/g, ' ').trim().toLowerCase();
  const exists = Object.values(hotels).some(
    h => normalize(h.hotelName) === normalize(hotelName)
  );

  if (exists) {
    showMessage("Hotel already exists", "error");
    return;
  }

  try {
    if (addBtn) addBtn.disabled = true;
    Storage.createHotel(hotelName, gstEnabled, cookEnabled);
    input.value = "";
    document.getElementById("hotelGstEnabled").checked = false;
    document.getElementById("hotelCookEnabled").checked = false;
    showMessage("Hotel created successfully", "success");
    loadHotels();
    populateHotelDropdowns();
  } finally {
    if (addBtn) addBtn.disabled = false;
  }
});

/* =========================
   LOAD HOTELS
========================= */

function loadHotels() {
  const list = document.getElementById("hotelList");
  const hotels = Storage.getHotels();

  list.innerHTML = "";

  Object.values(hotels).forEach(hotel => {
    const ownerCount = Storage.getOwnersByHotel(hotel.hotelId).length;
    
    const card = document.createElement("div");
    card.className = "admin-item";

    card.innerHTML = `
      <div class="card-row">
        <div>
          <strong style="font-size:1.1rem;">${hotel.hotelName}</strong>
          <div class="small-text" style="margin-top: 4px;">${hotel.hotelId}</div>
          <div class="small-text" style="margin-top: 6px;">Owners: ${ownerCount}</div>
        </div>

        <div class="feature-pill-group">
          <span class="feature-pill ${hotel.gstEnabled ? 'enabled' : 'disabled'}">
            GST ${hotel.gstEnabled ? 'On' : 'Off'}
          </span>
          <span class="feature-pill ${hotel.cookEnabled ? 'enabled' : 'disabled'}">
            Kitchen ${hotel.cookEnabled ? 'On' : 'Off'}
          </span>
        </div>
      </div>

      <div class="card-row">
        <div style="display:flex; gap:18px; align-items:center; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:8px; font-weight:600;">
            <input type="checkbox"
              data-id="${hotel.hotelId}"
              data-type="gst"
              ${hotel.gstEnabled ? "checked" : ""}>
            GST
          </label>

          <label style="display:flex; align-items:center; gap:8px; font-weight:600;">
            <input type="checkbox"
              data-id="${hotel.hotelId}"
              data-type="cook"
              ${hotel.cookEnabled ? "checked" : ""}>
            Kitchen
          </label>
        </div>

        <div class="admin-actions">
          <button class="button secondary" onclick="editHotel('${hotel.hotelId}')">
            Edit
          </button>
          <button class="button danger" onclick="deleteHotel('${hotel.hotelId}')">
            Delete
          </button>
        </div>
      </div>
    `;

    list.appendChild(card);
  });

  attachHotelToggleEvents();
}

function attachHotelToggleEvents() {
  document.querySelectorAll("#hotelList input[type='checkbox']")
    .forEach(cb => {
      cb.addEventListener("change", (e) => {
        const hotelId = e.target.dataset.id;
        const type = e.target.dataset.type;
        // Persist change via Storage.updateHotel and re-render list
        const updates = {};
        if (type === "gst") updates.gstEnabled = e.target.checked;
        if (type === "cook") updates.cookEnabled = e.target.checked;

        if (Object.keys(updates).length > 0) {
          Storage.updateHotel(hotelId, updates);
          showMessage("Hotel updated", "success");
          // Re-render to update feature pills and controls
          loadHotels();
          populateHotelDropdowns();
        }
      });
    });
}

window.editHotel = function(hotelId) {
  const hotel = Storage.getHotel(hotelId);
  const newName = prompt("Enter new hotel name:", hotel.hotelName);
  
  if (newName && newName.trim()) {
    Storage.updateHotel(hotelId, { hotelName: newName.trim() });
    showMessage("Hotel updated", "success");
    loadHotels();
    populateHotelDropdowns();
  }
};

window.deleteHotel = function(hotelId) {
  if (confirm("Delete this hotel? All associated data will be removed.")) {
    Storage.deleteHotel(hotelId);
    showMessage("Hotel deleted", "success");
    loadHotels();
    populateHotelDropdowns();
  }
};

/* =========================
   OWNERS MANAGEMENT
========================= */

const ownerForm = document.getElementById("ownerForm");

ownerForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const hotelId = document.getElementById("ownerHotel").value;
  const ownerName = document.getElementById("ownerName").value.trim();
  const phone = document.getElementById("ownerPhone").value.trim();
  const loginId = document.getElementById("ownerLoginId").value.trim();
  const password = document.getElementById("ownerPassword").value;

  if (!hotelId || !ownerName || !phone || !loginId || !password) {
    showMessage("All fields are required", "error");
    return;
  }

  // Check if loginId already exists
  const existingOwner = Storage.getOwnerByLoginId(loginId);
  if (existingOwner) {
    showMessage("Login ID already in use", "error");
    return;
  }

  Storage.createOwner(hotelId, ownerName, phone, loginId, password);
  
  showMessage("Owner created successfully", "success");
  ownerForm.reset();
  loadOwners();
  populateHotelDropdowns();
});

function populateHotelDropdowns() {
  const selects = document.querySelectorAll(".hotelSelect");
  const hotels = Storage.getHotels();

  selects.forEach(select => {
    select.innerHTML = `<option value="">Select Hotel</option>`;
    Object.values(hotels).forEach(hotel => {
      const option = document.createElement("option");
      option.value = hotel.hotelId;
      option.textContent = hotel.hotelName;
      select.appendChild(option);
    });
  });
}

function loadOwners() {
  const list = document.getElementById("ownerList");
  const owners = Storage.getOwners();

  list.innerHTML = "";

  if (Object.keys(owners).length === 0) {
    list.innerHTML = "<p style='color: #999;'>No owners yet</p>";
    return;
  }

  Object.values(owners).forEach(owner => {
    const status = owner.enabled ? "Enabled" : "Disabled";
    const statusColor = owner.enabled ? "#10b981" : "#ef4444";

    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.flexDirection = "column";
    card.style.alignItems = "flex-start";
    card.style.gap = "12px";

    card.innerHTML = `
      <div style="width: 100%;">
        <strong>${owner.ownerName}</strong>
        <div class="small-text">Hotel: ${owner.hotelName}</div>
        <div class="small-text">Login ID: ${owner.loginId}</div>
        <div class="small-text">Status: <span style="color: ${statusColor};">${status}</span></div>
      </div>

      <div style="display:flex; gap:10px; width: 100%; flex-wrap: wrap;">
        <button class="button secondary" onclick="editOwner('${owner.ownerId}')">
          Edit
        </button>
        <button class="button secondary" onclick="toggleOwner('${owner.ownerId}')">
          ${owner.enabled ? "Disable" : "Enable"}
        </button>
        <button class="button secondary" onclick="resetOwnerPassword('${owner.ownerId}')">
          Reset Password
        </button>
        <button class="button danger" onclick="deleteOwner('${owner.ownerId}')">
          Delete
        </button>
      </div>
    `;

    list.appendChild(card);
  });
}

window.editOwner = function(ownerId) {
  const owner = Storage.getOwner(ownerId);
  const action = prompt("Type new name to update owner name, or type 'reset' to reset password:", owner.ownerName);

  if (!action) return;

  if (action.trim().toLowerCase() === 'reset') {
    // Delegate to reset flow which explicitly updates password
    window.resetOwnerPassword(ownerId);
    return;
  }

  const newName = action.trim();
  if (newName) {
    Storage.updateOwner(ownerId, { ownerName: newName });
    showMessage("Owner updated", "success");
    loadOwners();
  }
};

window.toggleOwner = function(ownerId) {
  const owner = Storage.getOwner(ownerId);
  Storage.updateOwner(ownerId, { enabled: !owner.enabled });
  showMessage(`Owner ${owner.enabled ? "disabled" : "enabled"}`, "success");
  loadOwners();
};

window.resetOwnerPassword = function(ownerId) {
  const newPassword = prompt("Enter new password:");
  if (newPassword) {
    Storage.updateOwner(ownerId, { password: newPassword });
    showMessage("Password reset successfully", "success");
    loadOwners();
  }
};

window.deleteOwner = function(ownerId) {
  if (confirm("Delete this owner permanently?")) {
    Storage.deleteOwner(ownerId);
    showMessage("Owner deleted", "success");
    loadOwners();
  }
};

/* =========================
   LOGOUT
========================= */

document.getElementById("logoutAdmin")?.addEventListener("click", () => {
  Storage.clearCurrentUser();
  window.location.href = "admin-login.html";
});

/* =========================
   INIT
========================= */

loadHotels();
loadOwners();
populateHotelDropdowns();