import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const AdminStudents = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: "", species: "", gender: "", house: "", dateOfBirth: "",
    ancestry: "", eyeColour: "", hairColour: "", patronus: "",
    actor: "", alive: "", image: "", wizard: ""
  });

  const capitalize = (str) =>
    str?.trim() ? str.trim().charAt(0).toUpperCase() + str.trim().slice(1) : "No data found";

  const formatDate = (dateStr) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [day, month, year] = dateStr.split("-");
    const isoDate = `${year}-${month}-${day}`;
    const date = new Date(isoDate);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStudents(res.data.students);
        setFiltered(res.data.students);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user]);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(
      students.filter((c) =>
        Object.values(c).some((field) =>
          String(field || "").toLowerCase().includes(lower)
        )
      )
    );
  }, [searchTerm, students]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/students`, newStudent, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = [...students, res.data];
      setStudents(updated);
      setFiltered(updated);
      resetForm();
      setSuccessMessage("Student added successfully!");
    } catch (err) {
      console.error("Error adding student:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/students/${editingId}`, newStudent, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = students.map((s) =>
        s._id === editingId ? { ...s, ...newStudent } : s
      );
      setStudents(updated);
      setFiltered(updated);
      resetForm();
      setSuccessMessage("Student updated successfully!");
    } catch (err) {
      console.error("Error updating student:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = students.filter((s) => s._id !== id);
      setStudents(updated);
      setFiltered(updated);
      setSuccessMessage("Student deleted successfully!");
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setNewStudent({ ...student });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewStudent({
      name: "", species: "", gender: "", house: "", dateOfBirth: "",
      ancestry: "", eyeColour: "", hairColour: "", patronus: "",
      actor: "", alive: "", image: "", wizard: ""
    });
  };

  const displayValue = (value) =>
  value?.trim()
    ? value.trim().charAt(0).toUpperCase() + value.trim().slice(1)
    : "No data found";
 const displayBoolean = (value) => value === true ? "Yes" : "No";
 
  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md min-h-screen">
      <h3 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Student" : "Add New Student"}
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
        {Object.keys(newStudent).map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={capitalize(field)}
            value={newStudent[field]}
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
            {editingId ? "Update Student" : "Add Student"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Student Records</h3>
        <input
          type="text"
          placeholder="Search students..."
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
                {[...Object.keys(newStudent), "actions"].map((header) => (
                  <th key={header} className="p-3 border-b border-gray-600">
                    {capitalize(header)}
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
                    onClick={() => handleEdit(char)}
                  >
                  <td className="p-3">{displayValue(char.name)}</td>
                  <td className="p-3">{displayValue(char.species)}</td>
                  <td className="p-3">{displayValue(char.gender)}</td>
                  <td className="p-3">{displayValue(char.house)}</td>
                  <td className="p-3">
                    {char.dateOfBirth ? formatDate(char.dateOfBirth) : "No data found"}
                  </td>
                  <td className="p-3">{displayValue(char.ancestry)}</td>
                  <td className="p-3">{displayValue(char.eyeColour)}</td>
                  <td className="p-3">{displayValue(char.hairColour)}</td>
                  <td className="p-3">{displayValue(char.patronus)}</td>
                  <td className="p-3">{displayValue(char.actor)}</td>
                  <td className="p-3">{displayBoolean(char.alive)}</td>
                  <td className="p-3">{char.image?.trim() || "No data found"}</td>
                  <td className="p-3">{displayBoolean(char.wizard)}</td>

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
                  <td colSpan="14" className="p-4 text-center text-gray-400">
                    No students found.
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

export default AdminStudents;