// App-wide side effects that need Redux + Router. Renders nothing.
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAutoLogout from "../../hooks/useAutoLogout";
import { fetchCart } from "../../../redux/slices/cartSlice";

const AppEffects = () => {
  const dispatch = useDispatch();
  const { guestId } = useSelector((state) => state.auth);
  const loaded = useRef(false);

  // Log out exactly when the JWT expires
  useAutoLogout();

  // Load the real cart from the server once on startup (it was never fetched before, so
  // the UI only ever showed localStorage). The token identifies logged-in users;
  // guestId identifies guests. After login, the Login/Register merge updates the cart.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    dispatch(fetchCart({ guestId }));
  }, [dispatch, guestId]);

  return null;
};

export default AppEffects;
