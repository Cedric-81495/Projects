import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { logoutUser } from "../../redux/slices/authSlice";

const useAutoLogout = (navigate) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000;
      const timeLeft = expiryTime - Date.now();

      if (timeLeft <= 0) {
        dispatch(logoutUser());
        navigate("/login", { state: { expired: true } });
        return;
      }

      const timeoutId = setTimeout(() => {
        dispatch(logoutUser());
        navigate("/login", { state: { expired: true } });
      }, timeLeft);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      dispatch(logoutUser());
      navigate("/login", { state: { expired: true } });
      console.error("Error decoding token:", error);
    }
  }, [dispatch, navigate]);
};

export default useAutoLogout;
