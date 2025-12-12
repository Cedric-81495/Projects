import { FaBoxOpen, FaClipboard, FaSignOutAlt, FaStore, FaUser } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";

const AdminSidebar = () => {
    const navigate = useNavigate();
     const handleLogout = () => {
        navigate("/")
     }
  return (
    <div className="p-6">
        <div className="mb-6">
            <Link to="/admin" className="text-2xl font-medium">GrayScale</Link>
        </div>
        <h2 className="text-xl font-medium mb-6 tex-center">Admin Dashboard</h2>
        <nav className="flex flex-col space-y-2">
            <NavLink 
                to="/admin/users"
                className={({isActive}) => 
                    !isActive
                        ? "bg-gray-700 text-white py-3 px-4 rounded flex items-center space-x-2"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white py-3 px-4 rounded flex items-center space-x-2"              
                }
            >
            <FaUser />
            <span>Users</span>
            </NavLink>
            <NavLink 
                to="/admin/products"
                className={({isActive}) => 
                    !isActive
                        ? "bg-gray-700 text-white py-3 px-4 rounded flex items-center space-x-2"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white py-3 px-4 rounded flex items-center space-x-2"              
                }
            >
            <FaBoxOpen />
            <span>Products</span>
            </NavLink>
            <NavLink 
                to="/admin/orders"
                className={({isActive}) => 
                    !isActive
                        ? "bg-gray-700 text-white py-3 px-4 rounded flex items-center space-x-2"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white py-3 px-4 rounded flex items-center space-x-2"              
                }
            >
            <FaClipboard />
            <span>Orders</span>
            </NavLink>
            <NavLink 
                to="/"
                className={({isActive}) => 
                    !isActive
                        ? "bg-gray-700 text-white py-3 px-4 rounded flex items-center space-x-2"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white py-3 px-4 rounded flex items-center space-x-2"              
                }
            >
            <FaStore />
            <span>Shop</span>
            </NavLink>
        </nav>
        <div className="mt-6">
            <button
                onClick={handleLogout}
                className="bg-red-500 p-2 text-sm rounded w-full hover:bg-red-600 flex items-center justify-center space-x-2"
            >
                <FaSignOutAlt />
                <span>Logout</span>
            </button>
        </div>
    </div>
  );
};

export default AdminSidebar;