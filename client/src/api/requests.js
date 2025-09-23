import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

// User login
export const login = async (username, password) => {
  const res = await api.post("/login", { username, password });
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

// Fetch items in a list
export const fetchItems = async (listId) => {
  const res = await api.get("/dashboard/home", { params: { list_id: listId } });
  return res.data;
};

// Add new item
export const addItem = async (listId, item) => {
  const res = await api.post("/dashboard/add_item", { listId, item });
  return res.data;
};

// Edit item
export const editItem = async (listId, oldItem, newItem) => {
  const res = await api.post("/dashboard/edit_item", { listId, oldItem, newItem });
  return res.data;
};

// Delete item
export const deleteItem = async (listId, itemId) => {
  const res = await api.post("/dashboard/delete_item", { currentListId: listId, itemId: itemId });
  return res.data;
};

// Retrieve autofill suggestions
export const getItemSuggestions = async (query, signal) => {
  const res = await api.get("/dashboard/get_item_suggestions", { 
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