import { loginAdmin } from "./adminAuth.js";

document.getElementById("adminLoginBtn").addEventListener("click", async () => {
  const loginId = document.getElementById("adminLoginId").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    if (!loginId || !password) {
      alert("Please enter both login ID and password");
      return;
    }

    await loginAdmin(loginId, password);
    window.location.href = "admin-dashboard.html";
  } catch (e) {
    alert(e.message);
  }
});