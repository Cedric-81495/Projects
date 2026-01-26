import axiosInstance from "./axiosInstance";
import { logoutUser } from "../../redux/slices/authSlice";

export const setupAxiosInterceptors = (store) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        store.dispatch(logoutUser());
      }
      return Promise.reject(error);
    }
  );
};
