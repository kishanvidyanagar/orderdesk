import { Storage } from "./storage.js";

const currentUser = Storage.getCurrentUser();

export const isAdmin = currentUser?.role === "admin";
export const isOwner = currentUser?.role === "owner";
export const isWaiter = currentUser?.role === "waiter";
export const currentRole = currentUser?.role;