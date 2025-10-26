import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

// User login
export const login = async (username, password, keepLoggedIn) => {
  const res = await api.post("/login", { username, password, keepLoggedIn });
  return res.data;
};

// User registration
export const register = async (username, password) => {
  const res = await api.post("/register", { username, password });
  return res.data;
};

// User logout
export const logout = async () => {
  const res = await api.post("/logout");
  return res.data;
};

// Fetch categories
export const fetchCategories = async () => {
  const res = await api.get("/categories");
  return res.data;
};

// Create new list
export const createNewList = async ({ listName, otherUsers }) => {
  const res = await api.post("/dashboard/create_list", { listName, otherUsers });
  return res.data;
};

// Edit list
export const editList = async({ listId, listName, otherUsers }) => {
  const res = await api.put("/dashboard/edit_list", { listId, listName, otherUsers });
  return res.data;
};

// Delete list
export const deleteList = async (listId) => {
  const res = await api.post("/dashboard/delete_list", { listId });
  return res.data;
};

// Fetch lists user has access to
export const fetchUserLists = async () => {
  const res = await api.get("/dashboard/lists");
  return res.data;
};

// Fetch list data (items, list name, modified date)
export const fetchListData = async (listId) => {
  const res = await api.get("/list/get_list_data", { params: { list_id: listId } });
  return res.data;
};

// Add new item
export const addItem = async (listId, item) => {
  const res = await api.post("/list/add_item", { listId, item });
  return res.data;
};

// Edit item
export const editItem = async (listId, oldItem, newItem) => {
  const res = await api.post("/list/edit_item", { listId, oldItem, newItem });
  return res.data;
};

// Delete item
export const deleteItem = async (listId, itemId) => {
  const res = await api.post("/list/delete_item", { currentListId: listId, itemId: itemId });
  return res.data;
};

// Add user to list
export const addUserToList = async ({ listId, username }) => {
  const res = await api.post("/list/add_user_to_list", { currentListId: listId, username });
  return res.data;
};

// Manage users of specified list
export const manageUsersOfList = async ({ listId, otherUsers }) => {
  const res = await api.post("/list/manage_users_of_list", {currentListId: listId, otherUsers: otherUsers });
  return res.data;
};

// Retrieve user's notifications
export const getNotifications = async() => {
  const res = await api.get("/get_notifications");
  return res.data;
};

// Mark notifications as read
export const markNotificationsAsRead = async (notificationIds) => {
  const res = await api.put("/mark_notifications_as_read", { notificationIds });
  return res.data;
};

// Delete notifications
export const deleteNotifications = async (notificationIds) => {
  const res = await api.post("/delete_notifications", { notificationIds });
  return res.data;
};

// Retrieve item autofill suggestions
export const getItemSuggestions = async (query, signal) => {
  const res = await api.get("/list/get_item_suggestions", { 
    params: { query },
    signal, 
  });
  return res.data;
};

// Retrieve user autofill suggestions
export const getUserSuggestions = async (query, signal) => {
  const res = await api.get("/list/get_user_suggestions", { 
    params: { query },
    signal, 
  });
  return res.data;
};

// Check current session
export const getSession = async () => {
  const res = await api.get("/me");
  return res.data;
};