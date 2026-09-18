import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import { showMessage } from "./utils.js";
import {
  isWaiter, isOwner
} from "./permissions.js";

const user = requireLogin();
const hotelId = user.hotelId;

const menuForm =
  document.getElementById("menuForm");

const menuItemsList =
  document.getElementById("menuItemsList");

let editingId = null;

if (!isOwner) {
  alert(
    "Only hotel owners can manage menu items."
  );

  window.location.href =
    "dashboard.html";
}

function loadMenu() {
  const items =
    Storage.getHotelMenuItems(hotelId);

  menuItemsList.innerHTML = "";

  items.forEach(item => {
    menuItemsList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="menu-item">
        <div>
          <h4>${item.itemName}</h4>
          <p>${item.category}</p>
        </div>

        <div class="order-actions">
          <button
           class="button secondary sm"
           onclick="editItem('${item.id}')"
          >
           Edit
          </button>

          <button
           class="button secondary sm"
           onclick="deleteItem('${item.id}')"
          >
           Delete
          </button>
        </div>
      </div>
    `
    );
  });
}

window.editItem = id => {
  const items = Storage.getHotelMenuItems(hotelId);
  const item = items.find(m => m.id === id);

  editingId = id;

  document.getElementById("itemName").value =
    item.itemName;

  document.getElementById("itemPrice").value =
    item.price;

  document.getElementById("itemCategory").value =
    item.category;
};

window.deleteItem = id => {
  Storage.deleteMenuItem(id);
  loadMenu();
  showMessage("Item deleted");
};

menuForm.addEventListener(
  "submit",
  e => {
    e.preventDefault();

    const itemName = document.getElementById("itemName").value;
    const itemPrice = Number(document.getElementById("itemPrice").value);
    const itemCategory = document.getElementById("itemCategory").value;

    if (editingId) {
      Storage.updateMenuItem(editingId, {
        itemName,
        price: itemPrice,
        category: itemCategory
      });
    } else {
      Storage.addMenuItem(hotelId, itemName, itemPrice, itemCategory);
    }

    editingId = null;
    menuForm.reset();
    loadMenu();
    showMessage("Menu item saved");
  }
);

loadMenu();