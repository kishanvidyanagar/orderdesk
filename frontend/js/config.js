import { Storage } from "./storage.js";

export function requireLogin() {
  const user = Storage.getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return null;
  }

  return user;
}

export function logout() {
  Storage.clearCurrentUser();
  window.location.href = "index.html";
}