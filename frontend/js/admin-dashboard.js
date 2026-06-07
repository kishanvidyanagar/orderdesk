import { Storage } from "./storage.js";

/* =========================
   ADD HOTEL
========================= */

const hotelForm = document.getElementById("hotelForm");

hotelForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const input = document.getElementById("hotelName");
  const hotelName = input.value.trim();

  if (!hotelName) {
    showMessage("Enter hotel name", "error");
    return;
  }

  const hotels = Storage.getHotels();

  const exists = Object.values(hotels).some(
    h => h.hotelName.toLowerCase() === hotelName.toLowerCase()
  );

  if (exists) {
    showMessage("Hotel already exists", "error");
    return;
  }

  const hotelId = "hotel_" + Date.now();

  hotels[hotelId] = {
    hotelId,
    hotelName,
    gstEnabled: false,
    cookEnabled: false
  };

  Storage.saveHotels(hotels);

  input.value = "";

  showMessage("Hotel added successfully", "success");

  loadHotels();
});


/* =========================
   LOAD HOTELS
========================= */

function loadHotels() {
  const list = document.getElementById("hotelList");
  const hotels = Storage.getHotels();

  list.innerHTML = "";

  Object.values(hotels).forEach(hotel => {
    const card = document.createElement("div");

    card.className = "menu-item";
    card.style.flexDirection = "column";
    card.style.alignItems = "flex-start";
    card.style.gap = "12px";

    card.innerHTML = `
      <div>
        <strong>${hotel.hotelName}</strong>
        <div class="small-text">${hotel.hotelId}</div>
      </div>

      <div style="display:flex; gap:20px; align-items:center;">

        <label>
          <input type="checkbox"
            data-id="${hotel.hotelId}"
            data-type="gst"
            ${hotel.gstEnabled ? "checked" : ""}>
          GST
        </label>

        <label>
          <input type="checkbox"
            data-id="${hotel.hotelId}"
            data-type="cook"
            ${hotel.cookEnabled ? "checked" : ""}>
          Cook
        </label>

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

        const hotels = Storage.getHotels();
        const hotel = hotels[hotelId];

        if (!hotel) return;

        hotel[type + "Enabled"] = e.target.checked;

        Storage.saveHotels(hotels);

        showMessage("Hotel updated", "success");
      });
    });
}


/* =========================
   LOAD SETTINGS (FIXED)
========================= */

const gstToggle = document.getElementById("gstToggle");
const cookToggle = document.getElementById("cookToggle");

function loadSettings() {
  const settings = Storage.getAdminSettings();

  if (gstToggle) gstToggle.checked = settings.gstEnabled;
  if (cookToggle) cookToggle.checked = settings.cookEnabled;
}

gstToggle?.addEventListener("change", (e) => {
  const settings = Storage.getAdminSettings();

  settings.gstEnabled = e.target.checked;

  Storage.saveAdminSettings(settings);

  showMessage("GST setting updated", "success");
});

cookToggle?.addEventListener("change", (e) => {
  const settings = Storage.getAdminSettings();

  settings.cookEnabled = e.target.checked;

  Storage.saveAdminSettings(settings);

  showMessage("Cook setting updated", "success");
});


/* =========================
   LOGOUT
========================= */

document.getElementById("logoutAdmin")?.addEventListener("click", () => {
  window.location.href = "admin-login.html";
});


/* =========================
   INIT
========================= */

loadHotels();
loadSettings();