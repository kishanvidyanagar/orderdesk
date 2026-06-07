import { Storage } from "./storage.js";

/* ==================================
   AUTH CLASS
================================== */

class MockAuth {
  constructor() {
    this.currentUser = Storage.getCurrentUser();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async login(email, password) {
    const hotels = Storage.getHotels();
    const waiters = Storage.getWaiters();

    let user = Object.values(hotels).find(h => h.email === email);
    let role = "owner";

    if (!user) {
      user = waiters.find(w => w.email === email);
      if (user) role = "waiter";
    }

    if (!user) {
      throw new Error("User not found");
    }

    if (user.password !== password) {
      throw new Error("Wrong password");
    }

    const authUser = {
      uid: user.hotelId,
      hotelId: user.hotelId,
      email: user.email,
      role
    };

    Storage.saveCurrentUser(authUser);
    this.currentUser = authUser;

    return authUser;
  }

  logout() {
    Storage.clearCurrentUser();
    this.currentUser = null;
    window.location.href = "index.html";
  }

  /* ==================================
     OWNER REGISTRATION (UPDATED)
     - NO hotel creation here anymore
     - Owner SELECTS hotel created by admin
  ================================== */

  registerOwner(data) {
    const hotels = Storage.getHotels();

    const hotel = hotels[data.hotelId];

    if (!hotel) {
      throw new Error("Invalid hotel selected");
    }

    // attach owner to existing hotel
    hotel.ownerName = data.ownerName;
    hotel.phone = data.phone;
    hotel.email = data.email;
    hotel.password = data.password;

    Storage.saveHotels(hotels);

    return data.hotelId;
  }

  /* ==================================
     WAITER REGISTRATION
  ================================== */

  registerWaiter(data) {
    const waiters = Storage.getWaiters();

    const exists = waiters.find(w => w.email === data.email);

    if (exists) {
      throw new Error("Email already exists");
    }

    waiters.push({
      hotelId: data.hotelId,
      waiterName: data.waiterName,
      email: data.email,
      password: data.password,
      createdAt: new Date().toISOString()
    });

    Storage.saveWaiters(waiters);
  }
}

export const auth = new MockAuth();

/* ==================================
   TAB SWITCHING
================================== */

const tabs = document.querySelectorAll(".tab");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));

    document
      .querySelectorAll(".auth-form")
      .forEach(form => form.classList.remove("active"));

    tab.classList.add("active");

    document
      .getElementById(tab.dataset.target)
      ?.classList.add("active");
  });
});

/* ==================================
   OWNER / WAITER TOGGLE
================================== */

const ownerFields = document.getElementById("ownerFields");
const waiterFields = document.getElementById("waiterFields");

document.querySelectorAll('input[name="accountType"]').forEach(radio => {
  radio.addEventListener("change", e => {
    if (e.target.value === "owner") {
      ownerFields.style.display = "block";
      waiterFields.style.display = "none";
    } else {
      ownerFields.style.display = "none";
      waiterFields.style.display = "block";
    }
  });
});

/* ==================================
   LOAD HOTELS (FROM ADMIN)
================================== */

function loadHotels(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const hotels = Storage.getHotels();

  select.innerHTML = `<option value="">Choose Hotel</option>`;

  Object.values(hotels).forEach(hotel => {
    const option = document.createElement("option");
    option.value = hotel.hotelId;
    option.textContent = hotel.hotelName;
    select.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", loadHotels);

/* ==================================
   LOGIN
================================== */

const loginForm = document.getElementById("loginForm");

loginForm?.addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    await auth.login(email, password);

    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});

/* ==================================
   REGISTER
================================== */

const registerForm = document.getElementById("registerForm");

registerForm?.addEventListener("submit", e => {
  e.preventDefault();

  try {
    const type = document.querySelector(
      'input[name="accountType"]:checked'
    ).value;

    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regPasswordConfirm").value;

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (type === "owner") {
      const hotelId = document.getElementById("waiterHotel").value;

      if (!hotelId) {
        throw new Error("Select a hotel");
      }

      auth.registerOwner({
        hotelId: selectedHotelId,
        ownerName,
        phone,
        email,
        password
      });

      alert("Owner assigned to hotel successfully");
    } else {
      const hotelId = document.getElementById("waiterHotel").value;

      if (!hotelId) {
        throw new Error("Select a hotel");
      }

      auth.registerWaiter({
        hotelId,
        waiterName,
        email,
        password
      });

      alert("Waiter registered successfully");
    }

    registerForm.reset();

    document
      .querySelector('.tab[data-target="loginForm"]')
      ?.click();

  } catch (error) {
    alert(error.message);
  }
});