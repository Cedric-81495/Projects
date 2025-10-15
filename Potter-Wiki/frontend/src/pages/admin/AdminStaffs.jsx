// frontend/src/pages/admin/AdminStaffs.jsx
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const AdminStaffs = () => {
  const { user } = useContext(AuthContext);
  const [staffs, setStaffs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [newStaff, setNewStaff] = useState({
    name: "",
    species: "",
    gender: "",
    house: "",
    dateOfBirth: "",
    yearOfBirth: "",
    ancestry: "",
    eyeColour: "",
    hairColour: "",
    patronus: "",
    hogwartsStaff: "",
    actor: "",
    alive: "",
    image: "",
  });

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStaffs(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("Error fetching staff:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffs();
  }, [user]);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(
      staffs.filter((c) =>
        Object.values(c)
          .map((v) => String(v || "").toLowerCase())
          .some((v) => v.includes(lower))
      )
    );
  }, [searchTerm, staffs]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    setNewStaff({ ...newStaff, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/staff`, newStaff, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = [...staffs, res.data];
      setStaffs(updated);
      setFiltered(updated);
      setNewStaff({
        name: "",
        species: "",
        gender: "",
        house: "",
        dateOfBirth: "",
        yearOfBirth: "",
        ancestry: "",
        eyeColour: "",
        hairColour: "",
        patronus: "",
        hogwartsStaff: "",
        actor: "",
        alive: "",
        image: "",
      });
      setSuccessMessage("Staff added successfully!");
    } catch (err) {
      console.error("Error adding staff:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/staff/${editingId}`, newStaff, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = staffs.map((s) =>
        s._id === editingId ? { ...s, ...newStaff } : s
      );
      setStaffs(updated);
      setFiltered(updated);
      setEditingId(null);
      setNewStaff({
        name: "",
        species: "",
        gender: "",
        house: "",
        dateOfBirth: "",
        yearOfBirth: "",
        ancestry: "",
        eyeColour: "",
        hairColour: "",
        patronus: "",
        hogwartsStaff: "",
        actor: "",
        alive: "",
        image: "",
      });
      setSuccessMessage("Staff updated successfully!");
    } catch (err) {
      console.error("Error updating staff:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/staff/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = staffs.filter((s) => s._id !== id);
      setStaffs(updated);
      setFiltered(updated);
      setSuccessMessage("Staff deleted successfully!");
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  const displayValue = (value) =>
    value?.trim()
      ? value.trim().charAt(0).toUpperCase() + value.trim().slice(1)
      : "No data found";

  const displayBoolean = (value) => (value === true ? "Yes" : "No");

  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md min-h-screen">
      <h3 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Staff" : "Add New Staff"}
      </h3>

      {successMessage && (
        <div className="mb-4 bg-green-600 text-white px-4 py-2 rounded text-center shadow-md">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={editingId ? handleUpdate : handleAdd}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        {Object.keys(newStaff).map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newStaff[field]}
            onChange={handleChange}
            className="p-2 rounded bg-[#2d246e] text-white"
          />
        ))}

        <div className="col-span-2 flex gap-3">
          <button
            type="submit"
            className={`${
              editingId
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white py-2 px-4 rounded`}
          >
            {editingId ? "Update Staff" : "Add Staff"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewStaff({
                  name: "",
                  species: "",
                  gender: "",
                  house: "",
                  dateOfBirth: "",
                  yearOfBirth: "",
                  ancestry: "",
                  eyeColour: "",
                  hairColour: "",
                  patronus: "",
                  hogwartsStaff: "",
                  actor: "",
                  alive: "",
                  image: "",
                });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Staff Records</h3>
        <input
          type="text"
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded bg-[#2d246e] text-white w-1/3"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="relative max-h-[600px] overflow-y-scroll border border-gray-700 rounded-lg scrollbar-thin scrollbar-thumb-[#4338ca] scrollbar-track-[#1a1244] scrollbar-thumb-rounded scrollbar-track-rounded">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#2d246e] z-10">
              <tr>
                {[...Object.keys(newStaff), "actions"].map((header) => (
                  <th key={header} className="p-3 border-b border-gray-600">
                    {displayValue(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((char) => (
                  <tr
                    key={char._id}
                    className="border-b border-gray-700 hover:bg-[#332b73] transition cursor-pointer"
                    onClick={() => {
                      setEditingId(char._id);
                      setNewStaff({ ...char });
                    }}
                  >
                    <td className="p-3">{displayValue(char.name)}</td>
                    <td className="p-3">{displayValue(char.species)}</td>
                    <td className="p-3">{displayValue(char.gender)}</td>
                    <td className="p-3">{displayValue(char.house)}</td>
                    <td className="p-3">{char.dateOfBirth || "No data found"}</td>
                    <td className="p-3">{char.yearOfBirth || "No data found"}</td>
                      <td className="p-3">{displayValue(char.ancestry)}</td>
                    <td className="p-3">{displayValue(char.eyeColour)}</td>
                    <td className="p-3">{displayValue(char.hairColour)}</td>
                    <td className="p-3">{displayValue(char.patronus)}</td>
                    <td className="p-3">{displayBoolean(char.hogwartsStaff)}</td>
                    <td className="p-3">{displayValue(char.actor)}</td>
                    <td className="p-3">{displayBoolean(char.alive)}</td>
                    <td className="p-3">{char.image?.trim() || "No data found"}</td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(char._id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Object.keys(newStaff).length + 1} className="p-4 text-center text-gray-400">
                    No staff found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminStaffs;