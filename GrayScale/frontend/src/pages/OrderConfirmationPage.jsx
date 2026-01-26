import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../../redux/slices/cartSlice";
import PageWrapper from "../components/Common/PageWrapper";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout, loading } = useSelector((state) => state.checkout);

  const hasClearedCart = useRef(false);

  // Redirect if accessed without a checkout
  useEffect(() => {
    if (!loading && !checkout) {
      navigate("/my-orders");
    }
  }, [checkout, loading, navigate]);

  // Clear cart ONCE after successful checkout
  useEffect(() => {
    if (checkout && !hasClearedCart.current) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
      hasClearedCart.current = true;
    }
  }, [checkout, dispatch]);

  // Show loader until checkout is ready
  if (loading) return <PageWrapper loading={true} />;

  // If checkout is missing after loading, render nothing (redirect will handle)
  if (!checkout) return null;

  const estimatedDelivery = () => {
    const date = new Date(checkout.createdAt);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString();
  };

  return (
    <PageWrapper loading={loading}>
      <div className="min-h-screen max-w-4xl mx-auto p-6 bg-white">
        <h1 className="text-4xl font-bold text-center pt-12 text-emerald-700 mb-8">
          Thank You for Your Order !
        </h1>

        <div className="p-6 rounded-lg bg-gray-300 border">
          <div className="flex justify-between mb-20">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Order ID: {checkout._id}
              </h2>
              <p className="text-gray-500">
                Order date: {new Date(checkout.createdAt).toLocaleDateString()}
              </p>
            </div>

            <p className="text-emerald-700 text-sm">
              Estimated Delivery: {estimatedDelivery()}
            </p>
          </div>

          <div className="mb-20">
            {checkout.checkoutItems.map((item, index) => (
              <div key={index} className="flex items-center mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-md mr-4"
                />
                <div>
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.color} | {item.size}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p>₱{item.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}

            <p className="text-right font-bold mt-4">
              Total Paid: ₱{checkout.totalPrice.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold">Payment</h4>
              <p>{checkout.paymentMethod}</p>
            </div>

            <div>
              <h4 className="font-semibold">Delivery</h4>
              <p>{checkout.shippingAddress.address}</p>
              <p>
                {checkout.shippingAddress.city},{" "}
                {checkout.shippingAddress.country}
              </p>
            </div>
          </div>

          <Link
            to="/my-orders"
            className="text-blue-500 hover:underline"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};

export default OrderConfirmationPage;
