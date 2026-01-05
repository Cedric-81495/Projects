import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://grayscale-alpha.vercel.app"
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userToken");
      window.location.href = "/login"; // or dispatch logout
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
