import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { mergeCart } from "../../redux/slices/cartSlice";
import { generateNewGuestId } from "../../redux/slices/authSlice";

// Only allow internal paths ("/order/123"). Anything that could leave the site is sent to "/":
//   "//evil.com", "/\evil.com" (browsers treat \ like /), "https://...", "javascript:...",
//   and control characters. The browser's own URL parser has the final say.
const BACKSLASH = String.fromCharCode(92);
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export const getSafeRedirect = (search) => {
  let target = new URLSearchParams(search).get("redirect") || "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return "/"; // "https:", "javascript:", "data:" ...
  if (!target.startsWith("/")) target = `/${target}`; // "checkout" -> "/checkout"

  if (target.includes(BACKSLASH) || CONTROL_CHARS.test(target)) return "/";
  if (target.startsWith("//")) return "/";

  try {
    const base = "https://grayscale.invalid";
    const url = new URL(target, base);
    if (url.origin !== base) return "/"; // resolved to another site
    target = url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }

  if (target.startsWith("/login") || target.startsWith("/register")) return "/";
  return target;
};

// Shared by Login and Register: once a user exists, merge the guest cart ONCE,
// then go back to where they came from.
const usePostLoginRedirect = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId } = useSelector((state) => state.auth);
  const handled = useRef(false);

  const redirect = getSafeRedirect(location.search);

  useEffect(() => {
    if (!user || handled.current) return;
    handled.current = true; // prevents re-firing when the merge updates the cart

    const finish = () => navigate(redirect, { replace: true });

    if (!guestId) return finish();

    // Always ask the server to merge — it knows whether a guest cart exists.
    dispatch(mergeCart({ guestId }))
      .finally(() => {
        dispatch(generateNewGuestId()); // old guest cart is merged/adopted now
        finish();
      });
  }, [user, guestId, dispatch, navigate, redirect]);

  return redirect;
};

export default usePostLoginRedirect;
