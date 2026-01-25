import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../../redux/slices/cartSlice";
import PageWrapper from "../components/Common/PageWrapper";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout, loading } = useSelector((state) => state.checkout);

  // Clear the cart when the order is confirmed
    useEffect(() => {
    if (!checkout) return;

    if (checkout) {
        dispatch(clearCart());
        localStorage.removeItem("cart");
        localStorage.removeItem("checkout");
        navigate("/my-orders");
    }
    }, [checkout, dispatch, navigate]);

    if (!checkout) {
    navigate("/my-orders");
    return null;
    }

  const calculatedEstimatedDelivery = () => {
    const orderDate = new Date(checkout.createdAt);
        orderDate.setDate(orderDate.getDate() + 10); // Add 10 days to the order date
        return orderDate.toLocaleDateString();
  };

  return (
    <PageWrapper loading={loading}>
    <div className="min-h-screen max-w-4xl mx-auto p-6 bg-white">
        <h1 className="text-4xl font-bold text-center pt-[50px] text-emerald-700 mb-8">Thank You for Your Order</h1>
        {checkout && (
        <div className="p-6 rounded-lg  bg-gray-300 border">
            <div className="flex justify-between  mb-20">
                {/* Order ID and Date */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Order ID: {checkout._id}</h2>
                    <p className="text-gray-500">
                        Order date: {new Date(checkout.createdAt).toLocaleDateString()}
                    </p>
                </div>
                {/* Estimated Delivery */}
                <div>
                    <p className="text-emerald-700 text-sm">
                        Estimated Delivery: {calculatedEstimatedDelivery(checkout.createdAt)}
                    </p>
                </div>
            </div>
            {/* Ordered Items */}
            <div className="mb-20">
                {checkout.checkoutItems.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex items-center mb-4">
                        <img 
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rouneded-md mr-4"
                        />
                        <div>
                            <h4 className="text-md font-semibold">{item.name}</h4>
                            <p className="text-sm text-gray-600">{item.color} | {item.size}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-md">₱{item.price.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                    </div>
                ))}
                <div className="text-right">
                <p className="text-gray-900 font-bold">
                    Total Amount Paid:<span className="text-gray-600"> ₱{checkout.totalPrice.toLocaleString()}</span> 
                    
                </p>      
                </div>
            </div>
      

             {/* Payment and Delivery Info */}
            <div className="grid grid-cols-2 gap-8">
                {/* Payment */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Payment</h4>
                    <p className="text-gray-600">{checkout.paymentMethod}</p>
                </div>
                {/* Delivery Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Delivery</h4>
                    <p className="text-gray-600">
                        {checkout.shippingAddress.address}
                    </p>
                    <p className="text-gray-600">
                        {checkout.shippingAddress.city}{", "}
                        {checkout.shippingAddress.country}  
                    </p>
                </div>
            </div>
            {/* Back to Orders */}
          <Link to="/my-orders" className="text-blue-500 hover:underline">Back to My Orders</Link>
        </div>
        )}
    </div> 
    </PageWrapper>
  );
};

export default OrderConfirmationPage;