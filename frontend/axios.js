import axios from "axios";

// Environment variables
const localURL = import.meta.env.VITE_API_URL;
const renderURL = import.meta.env.VITE_RENDER_API_URL;

// Mode ke hisaab se base URL select karega
const baseURL =
  import.meta.env.MODE === "development"
    ? localURL
    : renderURL;

// Axios instance
const API = axios.create({
  baseURL: `${baseURL}/api/auth`,
  withCredentials: true,
});

// Access token automatically attach karega
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
