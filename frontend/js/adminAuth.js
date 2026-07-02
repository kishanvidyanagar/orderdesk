import { Storage } from "./storage.js";

/**
 * Admin authentication using loginId
 */

export function loginAdmin(loginId, password) {
  const admin = Storage.getAdminByLoginId(loginId);

  if (!admin) {
    throw new Error("Admin not found");
  }

  if (admin.password !== password) {
    throw new Error("Invalid password");
  }

  // Save admin session
  const adminUser = {
    uid: admin.adminId,
    adminId: admin.adminId,
    loginId: admin.loginId,
    role: "admin"
  };

  Storage.saveCurrentUser(adminUser);
  return adminUser;
}

export function requireAdmin() {
  const currentUser = Storage.getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "admin-login.html";
  }
}