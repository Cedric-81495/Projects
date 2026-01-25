import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../../redux/slices/orderSlice";
import PageWrapper from "../components/Common/PageWrapper";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    // Fetch user's orders when component mounts
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`)
  }

 if (loading)
  return (
    <div className="min-h-[1500px] flex items-center justify-center">
      <div className="flex flex-col items-center">Loading..
      </div>
    </div>
  );

if (error)
  return (
    <div className="min-h-[1440px] flex items-center justify-center">
      <p className="text-center text-lg text-red-600">Error: {error}</p>
    </div>
  );

  return (
    <PageWrapper loading={loading}>
    <div className="min-h-screen max-w-7xl mx-auto p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">My Orders</h2>
        <div className="relative shadow-md sm:rounded-lg overflow-auto">
            <table className="min-w-full text-left text-gray-500">
                <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                    <tr>
                        <th className="py-2 px-4 sm:p-3">Image</th>
                        <th className="py-2 px-4 sm:p-3">Order ID</th>
                        <th className="py-2 px-4 sm:p-3">Created At</th>
                        <th className="py-2 px-4 sm:p-3">Shipping Address</th>
                        <th className="py-2 px-4 sm:p-3">Items</th>
                        <th className="py-2 px-4 sm:p-3">Price</th>
                        <th className="py-2 px-4 sm:p-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? (
                        orders.map((order) => (
                           <tr key={order._id} 
                                onClick={() => handleRowClick(order._id)}
                                className="border=b hover:border-gray-50 cursor-pointer"
                            >
                                <td className="py-2 px-2 sm:py-4 sm:px-4">   
                                   <img src={order.orderItems[0].image} alt={order.orderItems[0].name} 
                                        className="w-12 h-12 object-cover rounded-lg"
                                    />
                                </td>
                                <td className="py-2 px-2 sm:py-4 sm:px-4 font-medium text-gray-900 whitespace-nowrap">
                                    #{order._id}
                                </td>
                                <td className="py-2 px-2 sm:py-4 sm:px-4">
                                    {new Date(order.createdAt).toLocaleDateString()}{" "}
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                </td>
                                <td className="py-2 px-2 sm:py-4 sm:px-4">
                                    {order.shippingAddress
                                        ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
                                        : "N/A"
                                    }
                                </td>
                                <td className="py-2 px-2 sm:py-4 sm:px-4">
                                    {order.orderItems.length}
                                </td>
                                <td className="py-2 px-2 sm:py-4 sm:px-4">
                                    ₱{order.totalPrice && `${order.totalPrice.toLocaleString()}`}
                                </td>
                                <td className="py-2 px-2 sm:py-4 sm:px-4">
                                    <span 
                                        className={`${
                                            order.isPaid
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        } px-2 py1 rounded-full text-xs sm:text-sm font-medium`}
                                    
                                    >
                                    {order.isPaid ? "Paid" : "Pending"}
                                    </span>
                                </td>
                           </tr> 
                        ))
                    ) : (
                        <tr>
                            <td 
                                colSpan={7}
                                className="py-4 px-4 text-center  text-gray-500"
                            >
                            You have no orders
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
    </PageWrapper>
  );
};

export default MyOrdersPage;