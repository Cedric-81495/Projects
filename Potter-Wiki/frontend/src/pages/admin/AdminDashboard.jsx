import axios from "axios";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthProvider";
import AdminCharacters from "./AdminCharacters";
import AdminSpells from "./AdminSpells";
import AdminStudents from "./AdminStudents";
import AdminStaffs from "./AdminStaffs";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [logoutMessage, setLogoutMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role: "",
    username: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/all`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error("Error fetching admins:", err));
  }, [user]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/super-admins/admins`, editForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = [...admins, res.data];
      setAdmins(updated);
      setEditForm({ firstname: "", lastname: "", email: "", role: "", username: "" });
      setSuccessMessage("Admin created successfully!");
    } catch (err) {
      console.error("Error creating admin:", err);
    }
  };

    const handleUpdate = async (e) => {
      e.preventDefault();
      try {
        const res = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/admin/super-admins/${editingId}`,
          editForm,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        console.log("🛠️ Update response:", res.data);
        console.log("🧾 Editing ID:", editingId);
        console.log("🧑‍💻 Current user ID:", user._id);

        // ✅ If the logged-in superUser updates their own role
        if (editingId === user._id && editForm.role !== user.role) {
          setLogoutMessage("You have been logged out. Please login again.");

          setTimeout(() => {
            logout();
            navigate("/login");
          }, 2500);
          return;
        }

        // ✅ Otherwise just update local state
        const updated = admins.map((admin) =>
          admin._id === editingId ? { ...admin, ...editForm } : admin
        );
        setAdmins(updated);
        setEditingId(null);
        setSelectedAdmin(null);
        setEditForm({ firstname: "", lastname: "", email: "", role: "", username: "" });
        setSuccessMessage("Admin updated successfully!");
      } catch (err) {
        console.error("❌ Error updating admin:", err);
      }
    };


  const handleDelete = async (id) => {
    if (user.role !== "superUser" || id === user._id) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this admin?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/super-admins/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = admins.filter((admin) => admin._id !== id);
      setAdmins(updated);
      if (selectedAdmin?._id === id) {
        setSelectedAdmin(null);
        setEditForm({ firstname: "", lastname: "", email: "", role: "", username: "" });
      }
      setSuccessMessage("Admin deleted successfully!");
    } catch (err) {
      console.error("Error deleting admin:", err);
    }
  };

  

  const sortedAdmins = admins.sort((a, b) =>
    a.role === "superUser" ? -1 : b.role === "superUser" ? 1 : 0
  );

  const isDashboardRoot = location.pathname === "/dashboard";

  return (
    <div className="pt-[160px] pb-[24px] bg-[#1a1244] text-white min-h-screen relative">
      {successMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded shadow-lg text-center">
            {successMessage}
          </div>
        </div>
      )}
      {logoutMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-600 text-white px-6 py-3 rounded shadow-lg text-center animate-pulse">
            {logoutMessage}
          </div>
        </div>
      )}


      <section className="border-b border-gray-600 pb-4 mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {user.firstname} {user.middlename || ""} {user.lastname}
        </h2>
        <p>Email: {user.email}</p>
        <p>
          Role:{" "}
          <span
            className={`px-2 py-1 rounded text-sm ${
              user.role === "superUser"
                ? "bg-blue-600"
                : user.role === "adminUser"
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          >
            {user.role}
          </span>
        </p>
      </section>

      <nav className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => navigate("/dashboard")} className="btn-blue">Dashboard</button>
        <button onClick={() => navigate("/dashboard/characters")} className="btn-purple">Characters</button>
        <button onClick={() => navigate("/dashboard/spells")} className="btn-green">Spells</button>
        <button onClick={() => navigate("/dashboard/students")} className="btn-yellow">Students</button>
        <button onClick={() => navigate("/dashboard/staff")} className="btn-red">Staff</button>
      </nav>

      {isDashboardRoot && (
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3 border-b border-gray-600 pb-2">Admin Accounts</h3>

          <form
            onSubmit={editingId ? handleUpdate : handleCreate}
            className="grid grid-cols-2 gap-4 mb-6 bg-[#251c5a] p-4 rounded-lg"
          >
            {["username", "firstname", "lastname", "email"].map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={editForm[field]}
                onChange={handleChange}
                className="px-3 py-2 rounded bg-[#1a1244] text-white border border-gray-500"
              />
            ))}
            <select
              name="role"
              value={editForm.role}
              onChange={handleChange}
              className="px-3 py-2 rounded bg-[#1a1244] text-white border border-gray-500 col-span-2"
            >
              <option value="">Select Role</option>
              <option value="adminUser">Admin User</option>
              <option value="superUser">Super User</option>
            </select>

            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                className={`${
                  editingId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
                } text-white px-4 py-2 rounded`}
              >
                {editingId ? "Update Admin" : "Create Admin"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setSelectedAdmin(null);
                    setEditForm({ firstname: "", lastname: "", email: "", role: "", username: "" });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 border border-gray-700 rounded-lg scrollbar-thin scrollbar-thumb-[#4338ca] scrollbar-track-[#1a1244] scrollbar-thumb-rounded scrollbar-track-rounded">
            {sortedAdmins.map((admin) => (
              <div
                key={admin._id}
                className={`p-3 rounded-lg flex justify-between items-center transition cursor-pointer ${
                  selectedAdmin?._id === admin._id ? "bg-[#332b73]" : "bg-[#251c5a]"
                }`}
                onClick={() => {
                  setSelectedAdmin(admin);
                  setEditingId(admin._id);
                  setEditForm({
                    firstname: admin.firstname,
                    lastname: admin.lastname,
                    email: admin.email,
                    role: admin.role,
                    username: admin.username,
                  });
                }}
              >
                <div>
                   <span className="font-medium">Username: {admin.username}</span>
                  <p className="text-gray-400 text-sm">Email: {admin.email}</p>
                  <p className="text-xs text-gray-400">
                    Name: {admin.firstname} {admin.lastname}
                  </p>
                  <p className="text-xs text-gray-400">
                    Role:{" "}
                    <span
                      className={`font-semibold ${
                        admin.role === "superUser" ? "text-blue-400" : "text-red-400"
                      }`}
                    >
                      {admin.role}
                    </span>
                  </p>
                </div>

                {user?.role === "superUser" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(admin._id);
                    }}
                    disabled={admin._id === user._id}
                    className={`${
                      admin._id === user._id
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white px-3 py-1 rounded-lg text-sm transition`}
                  >
                    {admin._id === user._id ? "You" : "Delete"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= SUB SECTIONS ================= */}
      <Routes>
        <Route path="characters" element={<AdminCharacters />} />
        <Route path="spells" element={<AdminSpells />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="staff" element={<AdminStaffs />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;