import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { logoutUser } from "../../redux/slices/authSlice";

// Logs the user out exactly when their JWT expires.
// Reacts to the token in Redux, so it re-arms after every login (the old version only
// read localStorage once on mount and was never used).
const useAutoLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.user?.token);

  useEffect(() => {
    if (!token) return;

    const expire = () => {
      dispatch(logoutUser());
      toast.error("Your session has expired. Please log in again.");
      navigate("/login", { state: { expired: true } });
    };

    let expiryTime;
    try {
      expiryTime = jwtDecode(token).exp * 1000;
    } catch (error) {
      console.error("Invalid token, logging out:", error);
      expire();
      return;
    }

    const timeLeft = expiryTime - Date.now();
    if (timeLeft <= 0) {
      expire();
      return;
    }

    // setTimeout overflows above ~24.8 days; tokens here last 1 day, but guard anyway
    const timeoutId = setTimeout(expire, Math.min(timeLeft, 2 ** 31 - 1));
    return () => clearTimeout(timeoutId);
  }, [token, dispatch, navigate]);
};

export default useAutoLogout;
