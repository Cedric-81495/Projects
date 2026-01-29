import axios from "axios";
import { logoutUser } from "../../redux/slices/authSlice";

const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:5000"
    : import.meta.env.VITE_BACKEND_URL,
});


axiosInstance.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem("userInfo"))?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
(response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { default: store } = import("../../redux/store");
      store.dispatch(logoutUser());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
