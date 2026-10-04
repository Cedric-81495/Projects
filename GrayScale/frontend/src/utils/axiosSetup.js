import axiosInstance from "./axiosInstance";
import { toast } from "sonner";
import { logoutUser } from "../../redux/slices/authSlice";

// Requests where a 401 means "wrong credentials", not "session expired"
const AUTH_ENDPOINTS = ["/api/users/login", "/api/users/register", "/api/users/google"];

let registered = false;

// Called once from redux/store.js after the store is created
export const setupAxiosInterceptors = (store) => {
  if (registered) return;
  registered = true;

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url || "";
      const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));
      const { user, loading } = store.getState().auth;

      // Only log out if someone was actually logged in (avoids loops for guests)
      if (status === 401 && !isAuthEndpoint && user && !loading) {
        toast.error("Your session has expired. Please log in again.");
        store.dispatch(logoutUser());
      }
      return Promise.reject(error);
    }
  );
};
