import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllOrders,
  updateOrderStatus,
} from "../../../redux/slices/adminOrderSlice";
import PageWrapper from "../Common/PageWrapper";

const STATUS_STYLES = {
  Processing: {
    color: "bg-yellow-500 hover:bg-yellow-600",
    label: "Processing",
  },
  Shipped: {
    color: "bg-blue-500 hover:bg-blue-600",
    label: "Shipped",
  },
  Delivered: {
    color: "bg-green-600 cursor-not-allowed",
    label: "Delivered",
 
  },
  Cancelled: {
    color: "bg-red-500 cursor-not-allowed",
    label: "Cancelled",

  },
};

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector(
    (state) => state.adminOrders
  );

  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, user, navigate]);

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({ id: orderId, status }));
  };


  if(error) return <p>Session expired. Please Logout and re-login</p>

  return (
    <PageWrapper loading={loading}>
    <div className="max-w-7xl mx-auto p-6 rounded-md">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-300 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Total Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => {
                const statusConfig = STATUS_STYLES[order.status];

                return (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">#{order._id}</td>

                    <td className="py-4 px-4">
                    {order.user ? order.user.name : "Unknown User"}
                    </td>
                    <td className="py-4 px-4">
                      ₱{order.totalPrice.toLocaleString()}
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order._id,
                            e.target.value
                          )
                        }
                        disabled={statusConfig?.disabled}
                        className="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded p-2"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() =>
                          handleStatusChange(order._id, "Delivered")
                        }
                        disabled={statusConfig?.disabled}
                        className={`text-white px-4 py-2 rounded transition-colors
                          ${statusConfig?.color || "bg-gray-400"}
                        `}
                      >
                        {statusConfig?.label || "Unknown"}
                      </button>
                    </td>
                  </tr>
                );
            })

            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-4 text-gray-500"
                >
                  No orders found.
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

export default OrderManagement;
