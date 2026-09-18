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

document.getElementById("hotelGreeting").textContent = `Settings`;

/* =========================
   LOAD RESTAURANT INFO
========================= */

function loadRestaurantInfo() {
  const owner = Storage.getOwner(currentUser.ownerId);
  const hotel = Storage.getHotel(hotelId);

  if (owner) {
    document.getElementById("hotelNameInput").value = hotel?.hotelName || "";
    document.getElementById("ownerNameInput").value = owner.ownerName || "";
    document.getElementById("phoneInput").value = owner.phone || "";
  }
}

/* =========================
   LOAD FEATURE TOGGLES
========================= */

function loadFeatureToggles() {
  const hotel = Storage.getHotel(hotelId);

  if (hotel) {
    document.getElementById("gstToggle").checked = hotel.gstEnabled || false;
    document.getElementById("cookToggle").checked = hotel.cookEnabled || false;
    // Service charge is always enabled if GST is enabled
    document.getElementById("serviceToggle").checked = hotel.gstEnabled || false;
    document.getElementById("serviceToggle").disabled = !hotel.gstEnabled;
  }
}

/* =========================
   GST TOGGLE
========================= */

document.getElementById("gstToggle")?.addEventListener("change", (e) => {
  const hotel = Storage.getHotel(hotelId);
  Storage.updateHotel(hotelId, { gstEnabled: e.target.checked });

  // Auto-enable service charge if GST is enabled
  if (e.target.checked) {
    document.getElementById("serviceToggle").checked = true;
    document.getElementById("serviceToggle").disabled = true;
  } else {
    document.getElementById("serviceToggle").checked = false;
    document.getElementById("serviceToggle").disabled = false;
  }

  showMessage("GST setting updated", "success");
});

/* =========================
   KITCHEN TOGGLE
========================= */

document.getElementById("cookToggle")?.addEventListener("change", (e) => {
  Storage.updateHotel(hotelId, { cookEnabled: e.target.checked });
  showMessage("Kitchen module setting updated", "success");
});

/* =========================
   CHANGE PASSWORD
========================= */

const passwordForm = document.getElementById("passwordForm");

passwordForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    showMessage("New passwords do not match", "error");
    return;
  }

  if (newPassword.length < 4) {
    showMessage("Password must be at least 4 characters", "error");
    return;
  }

  await Storage.changePassword(currentPassword, newPassword);
  showMessage("Password changed successfully", "success");
  passwordForm.reset();
});

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

loadRestaurantInfo();
loadFeatureToggles();
