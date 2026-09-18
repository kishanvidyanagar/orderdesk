// tables.js

import { Storage } from "./storage.js";

export function getHotelTableCount(hotelId) {
  return Storage.getTableCount(hotelId);
}

export function setHotelTableCount(hotelId, count) {
  Storage.setTableCount(hotelId, count);
}

export function addTableForHotel(hotelId) {
  const count = Storage.getTableCount(hotelId) + 1;
  Storage.setTableCount(hotelId, count);
  return count;
}

export function removeLastTable(hotelId) {
  const count = Storage.getTableCount(hotelId);
  if (count <= 1) return;
  Storage.setTableCount(hotelId, count - 1);
}

export function populateTableDropdown(selectId, hotelId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "";

  const total = Storage.getTableCount(hotelId);

  for (let i = 1; i <= total; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Table ${i}`;
    select.appendChild(option);
  }
}

export function getNextOrderNumber(hotelId) {
  const orders = Storage.getHotelOrders(hotelId);
  if (!orders.length) return 101;

  const max = Math.max(...orders.map(o => o.orderNumber || 100));
  return max + 1;
}