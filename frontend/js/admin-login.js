import { loginAdmin } from "./adminAuth.js";

document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  try {
    loginAdmin(email, password);
    window.location.href = "admin-dashboard.html";
  } catch (e) {
    alert(e.message);
  }
});