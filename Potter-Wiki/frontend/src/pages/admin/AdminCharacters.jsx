// frontend/src/pages/admin/AdminCharacters.jsx
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthProvider";
import { formatDate } from "../../utils/dateUtils";

const AdminCharacters = () => {
  const { user } = useContext(AuthContext);
  const [characters, setCharacters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    species: "",
    gender: "",
    house: "",
    dateOfBirth: "",
    ancestry: "",
    eyeColour: "",
    hairColour: "",
    patronus: "",
    image: "",
  });

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`/api/characters`);
      setCharacters(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error fetching characters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchCharacters();
}, [user]);


  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(
      characters.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.species.toLowerCase().includes(lower) ||
          c.gender.toLowerCase().includes(lower) ||
          c.house.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, characters]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    setNewCharacter({ ...newCharacter, [e.target.name]: e.target.value });
  };

  // Add 'POST' a Character
    const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // POST request to create a new character
      const { data: createCharacter } = await axios.post("/api/characters", newCharacter);
      await fetchCharacters();
      // Update state immediately to reflect new data in UI
      const updated = [...characters, createCharacter];
      setCharacters(updated);
      setFiltered(updated);

      // Reset form fields
      setNewCharacter({
        name: "",
        species: "",
        gender: "",
        house: "",
        dateOfBirth: "",
        ancestry: "",
        eyeColour: "",
        hairColour: "",
        patronus: "",
        image: "",
      });

      setSuccessMessage("Character added successfully!");
    } catch (err) {
      console.error("Error adding character:", err);
    }
  };

// Update 'PUT' a Character
const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    const { data: updatedCharacter } = await axios.put(
      `/api/characters/${editingId}`,
      newCharacter
    );

    // ✅ Update local state immediately so UI refreshes
    setCharacters((prev) =>
      prev.map((char) => (char._id === editingId ? updatedCharacter : char))
    );
    setFiltered((prev) =>
      prev.map((char) => (char._id === editingId ? updatedCharacter : char))
    );
  ;
    setEditingId(null);
    setNewCharacter({
      name: "",
      species: "",
      gender: "",
      house: "",
      dateOfBirth: "",
      ancestry: "",
      eyeColour: "",
      hairColour: "",
      patronus: "",
      image: "",
    });

    setSuccessMessage("✅ Character updated successfully!");
  } catch (err) {
    console.error("Error updating character:", err);
  }
};


  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/characters/${id}`);

      // Update local state manually
      const updatedList = characters.filter((char) => char._id !== id);
      setCharacters(updatedList);
      setFiltered(updatedList);

      setSuccessMessage("Character deleted successfully!");
    } catch (err) {
      console.error("Error deleting character:", err);
    }
  };

  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md min-h-screen">
      <h3 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Character" : "Add New Character"}
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
        {[
          "name",
          "species",
          "gender",
          "house",
          "dateOfBirth",
          "ancestry",
          "eyeColour",
          "hairColour",
          "patronus",
          "image", 
        ].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newCharacter[field]}
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
            {editingId ? "Update Character" : "Add Character"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewCharacter({
                  name: "",
                  species: "",
                  gender: "",
                  house: "",
                  dateOfBirth: "",
                  ancestry: "",
                  eyeColour: "",
                  hairColour: "",
                  patronus: "",
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
        <h3 className="text-xl font-semibold">Character Records</h3>
        <input
          type="text"
          placeholder="Search characters..."
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
                {[
                  "name",
                  "species",
                  "gender",
                  "house",
                  "dateOfBirth",
                  "ancestry",
                  "eyeColour",
                  "hairColour",
                  "patronus",
                  "image",
                  "actions",
                ].map((header) => (
                  <th key={header} className="p-3 border-b border-gray-600">
                    {header.charAt(0).toUpperCase() + header.slice(1)}
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
                      setNewCharacter({
                        name: char.name,
                        species: char.species,
                        gender: char.gender,
                        house: char.house,
                        dateOfBirth: char.dateOfBirth,
                        ancestry: char.ancestry,
                        eyeColour: char.eyeColour,
                        hairColour: char.hairColour,
                        patronus: char.patronus,
                        image: char.image,
                      });
                    }}
                  >
                    <td className="p-3">
                      {char.name?.trim()
                        ? char.name.trim().charAt(0).toUpperCase() + char.name.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.species?.trim()
                        ? char.species.trim().charAt(0).toUpperCase() + char.species.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.gender?.trim()
                        ? char.gender.trim().charAt(0).toUpperCase() + char.gender.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.house?.trim()
                        ? char.house.trim().charAt(0).toUpperCase() + char.house.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.dateOfBirth ? formatDate(char.dateOfBirth) : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.ancestry?.trim()
                        ? char.ancestry.trim().charAt(0).toUpperCase() + char.ancestry.trim().slice(1)
                        : "No data found"}
                    </td>
                     <td className="p-3">
                      {char.eyeColour?.trim()
                        ? char.eyeColour.trim().charAt(0).toUpperCase() + char.eyeColour.trim().slice(1)
                        : "No data found"}
                    </td>
                     <td className="p-3">
                      {char.hairColour?.trim()
                        ? char.hairColour.trim().charAt(0).toUpperCase() + char.hairColour.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.patronus?.trim()
                        ? char.patronus.trim().charAt(0).toUpperCase() + char.patronus.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3 max-w-[200px] break-words whitespace-normal">
                      {char.image?.trim()
                        ? char.image.trim().charAt(0).toUpperCase() + char.image.trim().slice(1)
                        : "No data found"}
                    </td>
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
                    No characters found.
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

export default AdminCharacters;