export const ADMIN = {
  email: "admin@hotel.com",
  password: "1234"
};

export function loginAdmin(email, password) {
  if (email === ADMIN.email && password === ADMIN.password) {
    localStorage.setItem("admin", "true");
    return true;
  }
  throw new Error("Invalid admin login");
}

export function requireAdmin() {
  if (!localStorage.getItem("admin")) {
    window.location.href = "admin-login.html";
  }
}