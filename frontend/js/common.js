import { auth } from "./auth.js";

document
  .getElementById("logoutBtn")
  ?.addEventListener("click", () => {
    auth.logout();
  });

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

  item.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
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
  document.addEventListener("DOMContentLoaded", initHamburgerMenu);
} else {
  initHamburgerMenu();
}