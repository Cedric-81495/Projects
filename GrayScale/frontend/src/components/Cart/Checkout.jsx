import { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PayPalbutton from "./PayPalbutton";
import GCashButton from "./GCashButton";
import { createCheckout } from "../../../redux/slices/checkoutSlice";
import { clearCart } from "../../../redux/slices/cartSlice";

const PAYMENT_METHODS = ["GCash", "PayPal"];

const EMPTY_ADDRESS = {
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Philippines",
  phone: "",
};

// Labeled input with REAL validation attributes (the old form had `required` in className)
const Field = ({ label, name, value, onChange, className = "", ...inputProps }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-gray-700">{label}</label>
    <input
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full p-2 border rounded bg-white disabled:bg-gray-100"
      {...inputProps}
    />
  </div>
);

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading: cartLoading, error: cartError } = useSelector((state) => state.cart);
  const { loading: checkoutLoading } = useSelector((state) => state.checkout);
  const { user } = useSelector((state) => state.auth);

  const [checkoutId, setCheckoutId] = useState(null);
  const [checkoutTotal, setCheckoutTotal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [shippingAddress, setShippingAddress] = useState(EMPTY_ADDRESS);
  const [paymentDone, setPaymentDone] = useState(false);

  const products = cart?.products ?? [];
  const hasItems = products.length > 0;
  const displayTotal = checkoutTotal ?? cart?.totalPrice ?? 0;

  const handleChange = (e) => {
    setShippingAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (!hasItems) return;

    // Only product/size/color/quantity are sent — the server prices everything itself
    const res = await dispatch(
      createCheckout({
        checkoutItems: products.map(({ productId, size, color, quantity }) => ({
          productId,
          size,
          color,
          quantity,
        })),
        shippingAddress,
        paymentMethod,
      })
    );

    if (res.payload?._id) {
      setCheckoutId(res.payload._id);
      setCheckoutTotal(res.payload.totalPrice); // server-computed total
    } else {
      toast.error(res.payload?.message || "Unable to create checkout");
    }
  };

  // Lets the user fix their details; a new checkout is created on the next submit
  const handleEditDetails = () => {
    setCheckoutId(null);
    setCheckoutTotal(null);
  };

  // Called only after the BACKEND captured and verified the PayPal payment
  const handlePaymentSuccessPayPal = (order) => {
    toast.dismiss("paypal-retry");
    setPaymentDone(true);
    dispatch(clearCart());
    navigate(order?._id ? `/order-confirmation/${order._id}` : "/my-orders", { replace: true });
  };

  const handlePaymentErrorPayPal = (err) => {
    console.error("PayPal payment error:", err);
    toast.dismiss("paypal-retry");
    if (err?.userMessage) {
      // Connection trouble after approval: payment may have gone through — don't say "failed"
      toast.warning(err.userMessage, { duration: 15000 });
      return;
    }
    toast.error(err?.response?.data?.message || "Payment failed. Please try again.");
  };

  const handlePayPalRetrying = () => {
    toast.loading("Slow connection — still confirming your payment…", { id: "paypal-retry" });
  };

  // GCash: the customer had already paid in another tab/attempt -> go to the order
  const handleAlreadyPaid = (order) => {
    setPaymentDone(true);
    dispatch(clearCart());
    navigate(order?._id ? `/order-confirmation/${order._id}` : "/my-orders", { replace: true });
  };

  // ---------- Page states (these used to be dead JSX that never rendered) ----------
  if (paymentDone) return null; // navigating to confirmation

  if (cartLoading && !hasItems) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4">
        {cartError && <p className="text-red-600">Error: {cartError}</p>}
        <p>Your cart is empty.</p>
        <Link to="/" className="bg-black text-white px-6 py-2 rounded">Continue Shopping</Link>
      </div>
    );
  }

  const locked = Boolean(checkoutId); // details can't change once payment starts

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Left Section */}
      <div className="bg-gray-300 rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <fieldset disabled={locked}>
            <h3 className="text-lg mb-4">Contact Details</h3>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={user ? user.email : ""}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>

            <h3 className="text-lg mb-4">Delivery</h3>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <Field label="First Name" name="firstName" value={shippingAddress.firstName}
                onChange={handleChange} autoComplete="given-name" maxLength={100} />
              <Field label="Last Name" name="lastName" value={shippingAddress.lastName}
                onChange={handleChange} autoComplete="family-name" maxLength={100} />
            </div>
            <Field label="Address" name="address" value={shippingAddress.address}
              onChange={handleChange} autoComplete="street-address" maxLength={200} className="mb-4" />
            <div className="mb-4 grid grid-cols-2 gap-4">
              <Field label="City" name="city" value={shippingAddress.city}
                onChange={handleChange} autoComplete="address-level2" maxLength={100} />
              <Field label="Postal Code" name="postalCode" value={shippingAddress.postalCode}
                onChange={handleChange} autoComplete="postal-code" maxLength={20} />
            </div>
            <Field label="Country" name="country" value={shippingAddress.country}
              onChange={handleChange} autoComplete="country-name" maxLength={100} className="mb-4" />
            <Field label="Phone Number" name="phone" type="tel" value={shippingAddress.phone}
              onChange={handleChange} autoComplete="tel" placeholder="09171234567"
              pattern="\+?[0-9\s\-]{7,20}" title="7–20 digits, optionally starting with +"
              className="mb-6" />

            <h3 className="text-lg mb-4">Payment Method</h3>
            <div className="mb-6 grid grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-2 p-3 border rounded bg-white ${
                    paymentMethod === method ? "border-black ring-1 ring-black" : "border-gray-300"
                  } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  {method}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mb-4">
            {!locked ? (
              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full bg-black text-white py-3 rounded disabled:opacity-60"
              >
                {checkoutLoading ? "Preparing payment..." : "Continue to Payment"}
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg">Pay with {paymentMethod}</h3>
                  <button type="button" onClick={handleEditDetails} className="text-sm underline">
                    Edit details
                  </button>
                </div>
                <p className="mb-3">Total: ₱{Number(displayTotal).toLocaleString()}</p>

                {paymentMethod === "GCash" ? (
                  <>
                    <GCashButton
                      checkoutId={checkoutId}
                      onAlreadyPaid={handleAlreadyPaid}
                      amount={displayTotal}
                      billing={{
                        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
                        phone: shippingAddress.phone,
                      }}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      You'll be redirected to GCash to complete payment, then brought back here.
                    </p>
                  </>
                ) : (
                  <PayPalbutton
                    checkoutId={checkoutId}
                    onSuccess={handlePaymentSuccessPayPal}
                    onError={handlePaymentErrorPayPal}
                    onRetrying={handlePayPalRetrying}
                  />
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className="p-6 rounded-lg">
        <h3 className="text-lg mb-4">Summary</h3>
        <div className="border-t py-4 mb-4 max-h-[500px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={`${product.productId}-${product.size}-${product.color}`}
              className="flex items-start justify-between py-2 border-b"
            >
              <div className="flex items-start">
                {product.image && (
                  <img src={product.image} alt={product.name}
                    className="w-20 h-24 object-cover rounded mr-4" />
                )}
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <p className="text-gray-500">{product.size} | {product.color}</p>
                  <p className="text-gray-500">Qty: {product.quantity}</p>
                </div>
              </div>
              <p className="text-xl">₱{(product.price * product.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Subtotal</p>
          <p>₱{Number(displayTotal).toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4">
          <p>Total</p>
          <p>₱{Number(displayTotal).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
