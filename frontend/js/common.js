import { auth } from "./auth.js";
import { Storage } from "./storage.js";

document
  .getElementById("logoutBtn")
  ?.addEventListener("click", () => {
    auth.logout();
  });

function updateKitchenNavigation() {
  const currentUser = Storage.getCurrentUser();
  const role = currentUser?.role;
  const kitchenEnabled = Boolean(currentUser?.hotelId && Storage.getHotel(currentUser.hotelId)?.cookEnabled);

  const dashboardLink = document.querySelector('a[href="dashboard.html"]');
  const ordersLink = document.querySelector('a[href="orders.html"]');
  const menuLink = document.querySelector('a[href="menu.html"]');
  const kitchenLink = document.querySelector('a[href="kitchen.html"]');
  const salesLink = document.querySelector('a[href="sales.html"]');
  const waitersLink = document.querySelector('a[href="waiter-management.html"]');
  const historyLink = document.querySelector('a[href="history.html"]');
  const settingsLink = document.querySelector('a[href="settings.html"]');

  const showLink = (link, visible) => {
    if (!link) return;
    link.style.display = visible ? "" : "none";
  };

  const showCustomerLinks = {
    owner: {
      dashboard: true,
      orders: true,
      menu: true,
      kitchen: kitchenEnabled,
      sales: true,
      waiters: true,
      history: true,
      settings: true
    },
    waiter: {
      dashboard: true,
      orders: true,
      menu: false,
      kitchen: false,
      sales: false,
      waiters: false,
      history: false,
      settings: false
    },
    cook: {
      dashboard: true,
      orders: false,
      menu: false,
      kitchen: kitchenEnabled,
      sales: false,
      waiters: false,
      history: false,
      settings: false
    }
  };

  const config = showCustomerLinks[role] || showCustomerLinks.owner;

  showLink(dashboardLink, config.dashboard);
  showLink(ordersLink, config.orders);
  showLink(menuLink, config.menu);
  showLink(kitchenLink, config.kitchen);
  showLink(salesLink, config.sales);
  showLink(waitersLink, config.waiters);
  showLink(historyLink, config.history);
  showLink(settingsLink, config.settings);

  if (waitersLink) {
    waitersLink.textContent = kitchenEnabled ? "Cooks / Waiters" : "Waiters";
  }
}

// Hamburger menu toggle
function initHamburgerMenu() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  if (!hamburger || !navMenu) {
    // Try again if elements not found yet
    if (!window.hamburgerInitialized) {
      window.hamburgerInitialized = true;
      setTimeout(initHamburgerMenu, 100);
    }
    return;
  }

  // Remove any previous listeners
  hamburger.onclick = null;

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();

    const isActive =
      navMenu.classList.contains("active");

    if (isActive) {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
      hamburger.textContent = "☰";
    } else {
      hamburger.classList.add("active");
      navMenu.classList.add("active");
      hamburger.textContent = "✕";
    }
  });

  // Close menu when a link or button is clicked
  const menuItems = navMenu.querySelectorAll("a, button");
  menuItems.forEach((item) => {
    if (item.id !== "hamburger") {
      item.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      });
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
      hamburger.textContent = "☰";
    }
  });

  // Close menu on window resize if back to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    }
  });
}

// Initialize after DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    updateKitchenNavigation();
    initHamburgerMenu();
  });
} else {
  updateKitchenNavigation();
  initHamburgerMenu();
}

window.addEventListener("storage", updateKitchenNavigation);