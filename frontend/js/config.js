// config.js

import { auth } from "./auth.js";

export function requireLogin() {
  const user = auth.getCurrentUser();

  if (!user) {
    window.location.href =
      "index.html";
    return null;
  }

  return user;
}

export function logout() {
  auth.logout();
}