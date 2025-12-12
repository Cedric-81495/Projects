const OrderManagement = () => {
    const orders = [
        {
            _id: 1234,
            user: {
                name: "Cedric",
            },
            totalPrice: 1100,
            status: "Processing",
        },
        {
            _id: 12345,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
                {
            _id: 12346,
            user: {
                name: "Cedric",
            },
            totalPrice: 1300,
            status: "Processing",
        },
    ];

    const handleStatusChange = (orderId, status) => {
        console.log({id: orderId, status: status});
    }
  return (
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
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {orders.length > 0 ? (
                        orders.map((order) => (
                        <tr key={order._id} className="border-b hover:bg-gray-50 cursor-pointer">
                            <td className="py-4 px-4">#{order._id}</td>
                            <td className="py-4">{order.user.name}</td>
                            <td className="py-4">₱{order.totalPrice.toLocaleString()}</td>
                            <td className="py-4">
                                <select 
                                    value={order.status} 
                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                    className="bg-gray-50 border border-gray-500 text-gray-900 text-sm 
                                    focus:ring-blue-500 focus:border-blue-500 block p-2.2"
                                >
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </td>
                            <td className="p-4">
                                <button
                                    onClick={() => handleStatusChange(order._id, "Delivered")}
                                    className="bg-green-500 text-white px-4 py-2 rounded hove:bg-gray-600"
                                >
                                Mark as Delivered
                                </button>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan={5} className="text-center p-4 text-gray-500">
                            No orders found.
                        </td>
                        </tr>
                    )}
                    </tbody>

            </table>
        </div>
    </div>
  );
};

export default OrderManagement;