import { Storage } from "./storage.js";

/**
 * Admin authentication using loginId
 */

export async function loginAdmin(loginId, password) {
  const adminUser = await Storage.signIn(loginId, password);
  if (!adminUser || adminUser.role !== "admin") {
    Storage.clearCurrentUser();
    throw new Error("Admin account not found");
  }
  return adminUser;
}

export function requireAdmin() {
  const currentUser = Storage.getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    window.location.replace("index.html");
  }
}