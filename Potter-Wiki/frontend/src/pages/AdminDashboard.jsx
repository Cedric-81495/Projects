// frontend/src/pages/AdminDashboard.jsx
import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import AdminCharacters from "./admin/AdminCharacters";
import AdminSpells from "./admin/AdminSpells";
import AdminStudents from "./admin/AdminStudents";
import AdminStaffs from "./admin/AdminStaffs";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [admins, setAdmins] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role: "",
  });

    useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/public/admins`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );

        let superRes = { data: [] };
        try {
          superRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/public/admins/super`,
            {
              headers: { Authorization: `Bearer ${user?.token}` },
            }
          );
        } catch (superErr) {
          console.warn(
            "Super admins fetch failed:",
            superErr.response?.data || superErr.message
          );
        }
        const combined = [...adminRes.data, ...superRes.data];
        const uniqueAdmins = Array.from(new Map(combined.map(a => [a._id, a])).values());
        setAdmins(uniqueAdmins);
      } catch (err) {
        console.error("Error fetching admins:", err);
      }
    };

    if (user?.token) fetchAdmins();
  }, [user]);

  const handleDelete = async (id) => {
    if (user.role !== "superUser") {
      alert("Only Super Admins can delete other admins!");
      return;
    }
    if (id === user._id) {
      alert("You cannot delete yourself.");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this admin?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/public/admins/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setAdmins((prev) => prev.filter((admin) => admin._id !== id));
      alert("Admin deleted successfully!");
      if (selectedAdmin?._id === id) {
        setSelectedAdmin(null);
        setEditForm({ firstname: "", lastname: "", email: "", role: "" });
      }
    } catch (err) {
      console.error("Error deleting admin:", err);
      alert(err.response?.data?.message || "Failed to delete admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      await axios.put(`${import.meta.env.VITE_API_URL}/api/public/admins/${id}`, editForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = admins.map((admin) =>
        admin._id === id ? { ...admin, ...editForm } : admin
      );
      setAdmins(updated);
      alert("Admin updated successfully!");
      setSelectedAdmin(null);
      setEditForm({ firstname: "", lastname: "", email: "", role: "" });
    } catch (err) {
      console.error("Error updating admin:", err);
      alert(err.response?.data?.message || "Failed to update admin.");
    } finally {
      setLoading(false);
    }
  };

  const sortedAdmins = [...admins].sort((a, b) => {
    if (a.role === "superUser" && b.role !== "superUser") return -1;
    if (b.role === "superUser" && a.role !== "superUser") return 1;
    return 0;
  });

  return (
    <div className="p-6 bg-[#1a1244] text-white min-h-screen">
      <section className="border-b border-gray-600 pb-4 mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {user?.firstname}{" "}
          {user?.middlename && `${user.middlename} `}{user?.lastname}
        </h2>
        <p>Email: {user?.email}</p>
        <p>
          Role:{" "}
          <span className={`px-2 py-1 rounded text-sm ${
            user?.role === "superUser"
              ? "bg-blue-600"
              : user?.role === "adminUser"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}>
            {user?.role}
          </span>
        </p>
      </section>

      <nav className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => setActiveSection("dashboard")} className="btn-blue">Dashboard</button>
        <button onClick={() => setActiveSection("characters")} className="btn-purple">Characters</button>
        <button onClick={() => setActiveSection("spells")} className="btn-green">Spells</button>
        <button onClick={() => setActiveSection("students")} className="btn-yellow">Students</button>
        <button onClick={() => setActiveSection("staff")} className="btn-red">Staff</button>
      </nav>

      {activeSection === "dashboard" && (
        <section aria-label="Admin Accounts" className="mb-10">
          <h3 className="text-xl font-semibold mb-3 border-b border-gray-600 pb-2">Admin Accounts</h3>

          {selectedAdmin && user?.role === "superUser" && (
            <div className="mt-6 bg-[#251c5a] p-4 rounded-lg border border-gray-600">
              <h4 className="text-lg font-semibold mb-2">Edit Admin</h4>
              <p className="text-sm mb-2 text-gray-300">Selected: {selectedAdmin.username}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={editForm.firstname}
                  onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value })}
                  className="px-3 py-2 rounded bg-[#1a1244] text-white border border-gray-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={editForm.lastname}
                  onChange={(e) => setEditForm({ ...editForm, lastname: e.target.value })}
                  className="px-3 py-2 rounded bg-[#1a1244] text-white border border-gray-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="px-3 py-2 rounded bg-[#1a1244] text-white border border-gray-500"
                />
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="px-3 py-2 rounded bg-[#1a1244] text-white border border-gray-500"
                >
                  <option value="adminUser">Admin User</option>
                  <option value="superUser">Super User</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdate(selectedAdmin._id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(selectedAdmin._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setSelectedAdmin(null);
                    setEditForm({ firstname: "", lastname: "", email: "", role: "" });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {sortedAdmins.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 border border-gray-700 rounded-lg scrollbar-thin scrollbar-thumb-[#4338ca] scrollbar-track-[#1a1244] scrollbar-thumb-rounded scrollbar-track-rounded">
              {sortedAdmins.map((admin) => (
                <div
                  key={admin._id}
                  className={`p-3 rounded-lg flex justify-between items-center transition cursor-pointer ${
                    selectedAdmin?._id === admin._id ? "bg-[#332b73]" : "bg-[#251c5a]"
                  }`}
                  onClick={() => {
                    setSelectedAdmin(admin);
                    setEditForm({
                      firstname: admin.firstname,
                      lastname: admin.lastname,
                      email: admin.email,
                      role: admin.role,
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
                      Role: <span className={`font-semibold ${admin.role === "superUser" ? "text-blue-400" : "text-red-400"}`}>
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
                      disabled={loading || admin._id === user._id}
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
          ) : (
            <p>No admin accounts found.</p>
          )}
        </section>
      )}

      {/* ================= SUB SECTIONS ================= */}
      {activeSection === "characters" && <AdminCharacters />}
      {activeSection === "spells" && <AdminSpells />}
      {activeSection === "students" && <AdminStudents />}
      {activeSection === "staff" && <AdminStaffs />}
    </div>
  );
};

export default AdminDashboard;