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

    // Try Admin login first
    const admin = Storage.getAdminByLoginId(loginId);
    if (admin && admin.password === password) {
      const authUser = {
        uid: admin.adminId,
        adminId: admin.adminId,
        loginId: admin.loginId,
        role: "admin"
      };
      Storage.saveCurrentUser(authUser);
      this.currentUser = authUser;
      return authUser;
    }

    // Try Owner login
    const owner = Storage.getOwnerByLoginId(loginId);
    if (owner && owner.password === password) {
      if (!owner.enabled) {
        throw new Error("Owner account is disabled");
      }
      const authUser = {
        uid: owner.ownerId,
        ownerId: owner.ownerId,
        hotelId: owner.hotelId,
        hotelName: owner.hotelName,
        loginId: owner.loginId,
        ownerName: owner.ownerName,
        role: "owner"
      };
      Storage.saveCurrentUser(authUser);
      this.currentUser = authUser;
      return authUser;
    }

    // Try Waiter / Cook login
    const waiters = Storage.getWaiters();
    const waiter = Object.values(waiters).find(w => w.loginId === loginId);
    if (waiter && waiter.password === password) {
      if (!waiter.enabled) {
        throw new Error("Staff account is disabled");
      }
      const authUser = {
        uid: waiter.waiterId,
        waiterId: waiter.waiterId,
        hotelId: waiter.hotelId,
        loginId: waiter.loginId,
        waiterName: waiter.waiterName,
        role: waiter.role || "waiter"
      };
      Storage.saveCurrentUser(authUser);
      this.currentUser = authUser;
      return authUser;
    }

    throw new Error("Invalid login ID or password");
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