// frontend/src/pages/admin/AdminSpells.jsx 
import { useEffect, useState, useContext } from "react";
import api from "../../lib/axios";
import { AuthContext } from "../../context/AuthProvider";

const AdminSpells = () => {
  const { user } = useContext(AuthContext);
  const [spells, setSpells] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newSpells, setNewSpells] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

   const fetchSpells = async () => {
    try {
      const res = await api.get(`/spells`);
      setSpells(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error fetching spells:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchSpells();
}, [user]);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(
      spells.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, spells]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);


  const handleChange = (e) => {
    setNewSpells({ ...newSpells, [e.target.name]: e.target.value });
  };


  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/spells`, newSpells);
      const updated = [...spells, res.data];
      setSpells(updated);
      setFiltered(updated);
      setNewSpells({ name: "", description: "" });
      setSuccessMessage("Spell added successfully!");
    } catch (err) {
      console.error("Error adding spell:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/spells/${editingId}`, newSpells);
      const updated = spells.map((spell) =>
        spell._id === editingId ? { ...spell, ...newSpells } : spell
      );
      setSpells(updated);
      setFiltered(updated);
      setEditingId(null);
      setNewSpells({ name: "", description: "" });
      setSuccessMessage("Spell updated successfully!");
    } catch (err) {
      console.error("Error updating spell:", err);
    }
  };

  const handleDelete = async (id) => {
      try {
        await api.delete(`/spells/${id}`);
        const updatedList = spells.filter((spell) => spell._id !== id);
        setSpells(updatedList);
        setFiltered(updatedList);
        setSuccessMessage("Spell deleted successfully!");
      } catch (err) {
        console.error("Error Spell character:", err);
      }
    };

  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md min-h-screen">
      <h3 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Spell" : "Add New Spell"}
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
        {["name", "description"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newSpells[field]}
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
            {editingId ? "Update Spell" : "Add Spell"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewSpells({ name: "", description: "" });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Spells Records</h3>
        <input
          type="text"
          placeholder="Search spells..."
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
                {["name", "description", "actions"].map((header) => (
                  <th key={header} className="p-3 border-b border-gray-600">
                    {header.charAt(0).toUpperCase() + header.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((spell) => (
                  <tr
                    key={spell._id}
                    className="border-b border-gray-700 hover:bg-[#332b73] transition cursor-pointer"
                    onClick={() => {
                      setEditingId(spell._id);
                      setNewSpells({ name: spell.name, description: spell.description });
                    }}
                  >
                 
                    <td className="p-3">
                      {spell.name?.trim()
                        ? spell.name.trim().charAt(0).toUpperCase() + spell.name.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {spell.description?.trim()
                        ? spell.description.trim().charAt(0).toUpperCase() + spell.description.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(spell._id);
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
                  <td colSpan="3" className="p-4 text-center text-gray-400">
                    No Spells found.
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

export default AdminSpells;