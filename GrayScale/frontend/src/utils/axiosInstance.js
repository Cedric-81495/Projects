import axios from "axios";

// NOTE: this file must NOT import the store or any slice.
// authSlice imports axiosInstance, so importing authSlice here created a circular import.
// The 401 -> logout interceptor is registered from redux/store.js via setupAxiosInterceptors().

const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:5000"
    : import.meta.env.VITE_BACKEND_URL,
  // Never spin forever on a dead connection. Payment calls retry on timeout (see retry.js).
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  try {
    const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // corrupted userInfo — ignore, request goes out as guest
  }
  return config;
});

export default axiosInstance;
