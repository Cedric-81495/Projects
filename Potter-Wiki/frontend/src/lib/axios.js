import axios from "axios";

// In production, there is no localhost so we have to make this dynamic
const BASE_URL = import.meta.env.MODE === "development"
  ? "http://localhost:3000/api"
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// ✅ Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Axios request error:", error);
    return Promise.reject(error);
  }
);

export default api;