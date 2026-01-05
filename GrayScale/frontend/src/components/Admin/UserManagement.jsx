import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser, updateUser, deleteUser, fetchUser } from "../../../redux/slices/adminSlice";
import PageWrapper from "../Common/PageWrapper";
const UserManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state) => state.auth);
    const { users, loading, error } = useSelector((state) => state.admin);

    useEffect(() => {
        if (user && user.role !== "admin") {
        navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user && user.role === "admin") {
            dispatch(fetchUser());
        }
    }, [dispatch, user]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer", // Default role
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(addUser(formData)).then(() => {
            dispatch(fetchUser());
        });

        setFormData({ name: "", email: "", password: "", role: "newRole" });
    };

    const handleRoleChange = (userId, newRole) => {
    dispatch(updateUser({ id: userId, role: newRole })).then(() => {
        dispatch(fetchUser());
    });
    };
    
    const handleDeleteUser = (userId) => {
        if(window.confirm("Are you sure to delete this user?")) {
            dispatch(deleteUser(userId));
        }
    }


  if(error) return <p>Session expired. Please Logout and re-login</p>
   
  return (
    <PageWrapper loading={loading}>
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>

      {/* Add New User Form */}
      <div className="p-6 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-4">Add New User</h3>
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input 
                    type="text" 
                    name="name"
                    value={formData.name} 
                    onChange={handleChange}
                    className="w-full p-2 border border-black rounded"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input 
                    type="email" 
                    name="email"
                    value={formData.email} 
                    onChange={handleChange}
                    className="w-full p-2 border border-black rounded"
                />
            </div>
             <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input 
                    type="password" 
                    name="password"  
                    value={formData.password} 
                    onChange={handleChange}
                    className="w-full p-2 border  border-black rounded"
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Role</label>
                <select 
                    name="role"
                    value={formData.role} 
                    onChange={handleChange}
                    className="w-full p-2 border border-black rounded"
                >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <button type="submit" className="bg-green-500 text-white p-2 px-4 rounded hover:bg-green-600">Add User</button>
        </form>
      </div>

      {/* User List Management */}
      <div className="overflow-x-auto p-6 shadow-md sm:rounded-lg">
        <h3 className="text-lg font-bold mb-4">User List</h3>
        <table className="min-w-full text=left text-gray-500">
            <thead className="bg-gray-100 text-xs uppcase text-gray-700">
                <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Actions</th>
                </tr>
            </thead>
             <tbody>
            {users.length > 0 ? (
                users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-black/10">
                        <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                            {user.name}
                        </td>
                        <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                            {user.email}
                        </td>
                        <td className="p-4">
                            <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                className="p-2 border rounded"
                            >
                             <option value="customer">Customer</option>
                             <option value="admin">Admin</option>
                            </select>
                        </td>
                        <td>
                            <button 
                                onClick={() => handleDeleteUser(user._id)} 
                                className="bg-red-500 text-white px-4 -y-2 rounded hover:bg-red-600"
                            >
                            Delete
                            </button>
                        </td>
                    </tr>
               ))
             ) : (
              <tr>
                <td
                  colSpan={4}
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

export default UserManagement;
