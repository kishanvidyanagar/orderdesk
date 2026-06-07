// tables.js

import { Storage } from "./storage.js";

export function getHotelTableCount(hotelId) {
  const configs = Storage.getTableConfigs();

  return configs[hotelId] || 10;
}

export function setHotelTableCount(
  hotelId,
  count
) {
  const configs = Storage.getTableConfigs();

  configs[hotelId] = count;

  Storage.saveTableConfigs(configs);
}

export function addTableForHotel(hotelId) {
  const count =
    getHotelTableCount(hotelId) + 1;

  setHotelTableCount(hotelId, count);

  return count;
}

export function removeLastTable(hotelId) {
  const count =
    getHotelTableCount(hotelId);

  if (count <= 1) return;

  setHotelTableCount(
    hotelId,
    count - 1
  );
}

export function populateTableDropdown(
  selectId,
  hotelId
) {
  const select =
    document.getElementById(selectId);

  if (!select) return;

  select.innerHTML = "";

  const total =
    getHotelTableCount(hotelId);

  for (let i = 1; i <= total; i++) {
    const option =
      document.createElement("option");

    option.value = i;
    option.textContent = `Table ${i}`;

    select.appendChild(option);
  }
}

export function getNextOrderNumber(
  hotelId
) {
  const orders = Storage.getOrders()
    .filter(o => o.hotelId === hotelId);

  if (!orders.length) return 101;

  const max = Math.max(
    ...orders.map(
      o => o.orderNumber || 100
    )
  );

  return max + 1;
}