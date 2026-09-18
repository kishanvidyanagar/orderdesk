import { Storage } from "./storage.js";

export function requireLogin() {
  const user = Storage.getCurrentUser();

  if (!user || user.role === "guest") {
    window.location.href = "index.html";
  }

  return user;
}

export function logout() {
  Storage.clearCurrentUser();
  window.location.href = "index.html";
}