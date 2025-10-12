// frontend/src/pages/admin/AdminSpells.jsx
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const AdminSpells = () => {
  const { user } = useContext(AuthContext);
  const [spells, setSpells] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newSpells, setNewSpells] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchSpells = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/spells`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setSpells(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("Error fetching spells:", err);
      } finally {
        setLoading(false);
      }
    };
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

  const handleChange = (e) => {
    setNewSpells({ ...newSpells, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/public/spells", newSpells, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = [...spells, res.data];
      setSpells(updated);
      setFiltered(updated);
      setNewSpells({ name: "", description: ""});
    } catch (err) {
      console.error("Error adding spells:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/spells/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = spells.filter((char) => char._id !== id);
      setSpells(updated);
      setFiltered(updated);
    } catch (err) {
      console.error("Error deleting spells:", err);
    }
  };

  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Add New Spells</h3>
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 mb-6">
        {["name","description"].map((field) => (
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
        <button type="submit" className="col-span-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded">
          Add Spells
        </button>
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
                {["name","description"].map((header) => (
                  <th key={header} className="p-3 border-b border-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((char) => (
                  <tr key={char._id} className="border-b border-gray-700 hover:bg-[#332b73] transition">
                    <td className="p-3">{char.name}</td>
                    <td className="p-3">{char.description}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(char._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-400">
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