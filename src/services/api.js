import axios from "axios";

// 🔥 Use backend URL without trailing slash
const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "https://chat-backend-727p.onrender.com/api",
});

// Attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
