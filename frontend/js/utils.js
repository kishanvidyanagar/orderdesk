// utils.js

export function showMessage(message, type = "success") {
  const box = document.getElementById("messageBox");

  if (!box) return;

  box.textContent = message;

  box.style.background =
    type === "error"
      ? "#dc2626"
      : "rgba(37,99,235,0.95)";

  box.classList.remove("hidden");

  setTimeout(() => {
    box.classList.add("hidden");
  }, 3000);
}

export function formatCurrency(amount) {
  return `₹${Number(amount).toFixed(0)}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function generateId(prefix) {
  return `${prefix}_${Date.now()}`;
}