import { Link } from "react-router-dom";

;const AdminHomePage = () => {
    const orders = [
        {
            _id: 12345123451,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
        {
            _id: 12345123452,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123453,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123454,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123455,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123456,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123457,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123458,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
              {
            _id: 12345123459,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
                      {
            _id: 123451234510,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
                      {
            _id: 123451234511,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
                      {
            _id: 123451234512,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
                      {
            _id: 123451234513,
            user: {
                name: "Cedric",
            },
            totalPrice: 1200,
            status: "Processing",
        },
    ];

  return (
    <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 shadow-mc rounded-lg">
                <h2 className="text-xl font-semibold">Revenue</h2>
                <p className="text-2xl">₱20,000</p>
            </div>
            <div className="p-4 shadow-mc rounded-lg">
                <h2 className="text-xl font-semibold">Total Orders</h2>
                <p className="text-2xl">200</p>
                <Link to="/admin/orders" className="text-blue-500 hover:underline">
                    Manage Orders
                </Link>
            </div>
            <div className="p-4 shadow-mc rounded-lg">
                 <h2 className="text-xl font-semibold">Total Products</h2>
                <p className="text-2xl">100</p>
                <Link to="/admin/produts" className="text-blue-500 hover:underline">
                    Manage Products
                </Link>
            </div>  
        </div>
        <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
            <div className="max-h-[400px] overflow-y-auto">
                <table className="min-w-full text-left text-gray-500">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                        <tr>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Total Price</th>
                            <th className="py-3 px-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                       {orders.length > 0 ? (
                        orders.map((order) =>(
                            <tr key={order._id} className="border-b hover:bg-gray-50 cursor-pointer">
                               <td className="p-4">{order._id}</td>
                               <td className="p-4">{order.user.name}</td>
                               <td className="p-4">₱{order.totalPrice.toLocaleString()}</td>
                               <td className="p-4">{order.status}</td>
                            </tr>
                        ))
                       ) : (
                        <tr>
                            <td colSpan={4} className="p-4 text-gray-500 text-center">
                                No orders found
                            </td>
                        </tr>
                       )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AdminHomePage;