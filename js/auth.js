import { Storage } from "./storage.js";

/* ==================================
   AUTH CLASS - LoginId Based
================================== */

class OrderDeskAuth {
  constructor() {
    this.currentUser = Storage.getCurrentUser();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Login with loginId and password
   * Supports: Admin, Owner, Waiter
   */
  async login(loginId, password) {
    if (!loginId || !password) {
      throw new Error("Login ID and password are required");
    }

    const authUser = await Storage.signIn(loginId, password);
    if (!authUser) throw new Error("Invalid login ID or password");
    if (authUser.enabled === false) {
      await Storage.clearCurrentUser();
      throw new Error("Account is disabled");
    }
    this.currentUser = authUser;
    return authUser;
  }

  logout() {
    Storage.clearCurrentUser();
    this.currentUser = null;
    window.location.href = "index.html";
  }

  isAdmin() {
    return this.currentUser?.role === "admin";
  }

  isOwner() {
    return this.currentUser?.role === "owner";
  }

  isWaiter() {
    return this.currentUser?.role === "waiter";
  }
}

export const auth = new OrderDeskAuth();

/* ==================================
   LOGIN FORM HANDLER
================================== */

const loginForm = document.getElementById("loginForm");

loginForm?.addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const loginId = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;

    await auth.login(loginId, password);

    // Redirect based on role
    if (auth.isAdmin()) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    alert(error.message);
  }
});