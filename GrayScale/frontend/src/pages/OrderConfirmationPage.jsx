// /order-confirmation/:id
// Only reached AFTER the backend has verified the payment and created the Order.
// Loads the real Order by ID (the old version showed the in-memory *checkout*, called its ID
// the "Order ID", and was shown even when payment failed).
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetails } from "../../redux/slices/orderSlice";

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails: order, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  // orderDetails may still hold a previously viewed order until this fetch finishes
  const isCurrent = order?._id === id;

  if (loading || (!isCurrent && !error)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!isCurrent) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <p className="text-gray-600 mb-6">{error || "We couldn't load this order."}</p>
        <Link to="/my-orders" className="text-blue-500 underline">Go to My Orders</Link>
      </div>
    );
  }

  const estimatedDelivery = () => {
    const date = new Date(order.createdAt);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString();
  };

  const addr = order.shippingAddress || {};
  const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center pt-12 text-emerald-700 mb-8">
        Thank You for Your Order!
      </h1>

      <div className="p-6 rounded-lg bg-gray-300 border">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-12">
          <div>
            <h2 className="text-xl font-semibold mb-2 break-all">Order ID: {order._id}</h2>
            <p className="text-gray-600">
              Order date: {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Payment: {order.isPaid ? "Paid" : "Pending"}
              {order.paidAt && ` on ${new Date(order.paidAt).toLocaleDateString()}`}
            </p>
          </div>
          <p className="text-emerald-700 text-sm">Estimated Delivery: {estimatedDelivery()}</p>
        </div>

        <div className="mb-12">
          {order.orderItems.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex items-center mb-4">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
              )}
              <div>
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-600">{item.color} | {item.size}</p>
              </div>
              <div className="ml-auto text-right">
                <p>₱{(item.price * item.quantity).toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  Qty: {item.quantity} × ₱{item.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          <p className="text-right font-bold mt-4">
            Total Paid: ₱{order.totalPrice.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-semibold">Payment</h4>
            <p>{order.paymentMethod}</p>
          </div>
          <div>
            <h4 className="font-semibold">Delivery</h4>
            {fullName && <p>{fullName}</p>}
            <p>{addr.address}</p>
            <p>{addr.city} {addr.postalCode}, {addr.country}</p>
            {addr.phone && <p>{addr.phone}</p>}
          </div>
        </div>

        <div className="flex gap-6">
          <Link to={`/order/${order._id}`} className="text-blue-500 hover:underline">View Order Details</Link>
          <Link to="/my-orders" className="text-blue-500 hover:underline">Back to My Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
