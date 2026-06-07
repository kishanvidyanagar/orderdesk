import { Storage } from "./storage.js";
import { requireLogin } from "./config.js";
import { showMessage } from "./utils.js";
import {
  isWaiter
} from "./permissions.js";

const user = requireLogin();

const menuForm =
  document.getElementById("menuForm");

const menuItemsList =
  document.getElementById("menuItemsList");

let editingId = null;

if (isWaiter) {

  document
    .getElementById("menuNav")
    ?.remove();

  document
    .getElementById("salesNav")
    ?.remove();

  alert(
    "Only hotel owners can manage menu items."
  );

  window.location.href =
    "dashboard.html";
}

function loadMenu() {
  const items =
    Storage.getMenuItems()
      .filter(
        m => m.hotelId === user.uid
      );

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
  const item =
    Storage.getMenuItems()
      .find(m => m.id === id);

  editingId = id;

  itemName.value =
    item.itemName;

  itemPrice.value =
    item.price;

  itemCategory.value =
    item.category;
};

window.deleteItem = id => {
  const items =
    Storage.getMenuItems()
      .filter(
        i => i.id !== id
      );

  Storage.saveMenuItems(
    items
  );

  loadMenu();

  showMessage(
    "Item deleted"
  );
};

menuForm.addEventListener(
  "submit",
  e => {
    e.preventDefault();

    const items =
      Storage.getMenuItems();

    const data = {
      id:
        editingId ||
        "menu_" +
          Date.now(),
      hotelId:
        user.uid,
      itemName:
        itemName.value,
      price:
        Number(
          itemPrice.value
        ),
      category:
        itemCategory.value
    };

    if (editingId) {
      const idx =
        items.findIndex(
          i =>
            i.id ===
            editingId
        );

      items[idx] =
        data;
    } else {
      items.push(data);
    }

    Storage.saveMenuItems(
      items
    );

    editingId = null;

    menuForm.reset();

    loadMenu();

    showMessage(
      "Saved"
    );
  }
);

loadMenu();