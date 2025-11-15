// frontend/src/pages/admin/AdminMovie.jsx
import { useEffect, useState, useContext, useCallback } from "react";
import api from "../../lib/axios";
import { AuthContext } from "../../context/AuthProvider";

const AdminMovie = () => {
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newMovies, setNewMovie] = useState({
          title: "",
          box_office: "",
          budget: "",
          rating: "",
          poster: "",
          summary: "",
          trailer: "",
          wiki: "",
  });


  const normalizeItem = (item) => ({
    id: item._id,
    title: item.title,
    box_office: item.box_office,
    budget: item.budget,
    rating: item.rating || "",
    poster: item.poster || item.poster || "",
    summary: item.summary || item.summary || "",
    trailer: item.trailer || "",
    wiki: item.wiki || "",
  });
  

const fetchMovies = useCallback(async () => {
  try {
    const res = await api.get(`/movies`);
    const moviesData = res.data.map(normalizeItem);
    setMovies(moviesData);
    setFiltered(moviesData);
    console.log("Movies normalized:", moviesData);
  } catch (err) {
    console.error("Error fetching movies:", err);
  } finally {
    setLoading(false);
  }
}, []); // empty deps = stable function

useEffect(() => {
  fetchMovies();
}, [user, fetchMovies]);



  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(
      movies.filter((c) =>
        (c.title ?? "").toLowerCase().includes(lower) ||
        (c.summary ?? "").toLowerCase().includes(lower) ||
        (c.box_office ?? "").toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, movies]);


  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    setNewMovie({ ...newMovies, [e.target.name]: e.target.value });
  };

  // Add 'POST' a Movie
    const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // POST request to create a new movie
      const { data: createMovie } = await api.post("/movies", newMovies);
      await fetchMovies();
      // Update state immediately to reflect new data in UI
      const updated = [...movies, createMovie];
      setMovies(updated);
      setFiltered(updated);

      // Reset form fields
      setNewMovie({
          title: "",
          box_office: "",
          budget: "",
          rating: "",
          poster: "",
          summary: "",
          trailer: "",
          wiki: "",
      });
       
      setSuccessMessage("Movie added successfully!");
    } catch (err) {
      console.error("Error adding movie:", err);
    }
  };

// Update 'PUT' a Movie
const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    const { data: updatedMovie } = await api.put(
      `/movies/${editingId}`,
      newMovies
    );

    // ✅ Update local state immediately so UI refreshes
    setMovies((prev) =>
      prev.map((char) => (char.id === editingId ? updatedMovie : char))
    );
    setFiltered((prev) =>
      prev.map((char) => (char.id === editingId ? updatedMovie : char))
    );
  ;
    setEditingId(null);
    setNewMovie({
        title: "",
        box_office: "",
        budget: "",
        rating: "",
        poster: "",
        summary: "",
        trailer: "",
        wiki: "",
    });

    setSuccessMessage("Movie updated successfully!");
  } catch (err) {
    console.error("Error updating movie:", err);
  }
};


  const handleDelete = async (id) => {
    try {
      await api.delete(`/movies/${id}`);

      // Update local state manually
      const updatedList = movies.filter((char) => char.id !== id);
      setMovies(updatedList);
      setFiltered(updatedList);

      setSuccessMessage("Movie deleted successfully!");
    } catch (err) {
      console.error("Error deleting movie:", err);
    }
  };

  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md min-h-screen">
      <h3 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Movie" : "Add New Movie"}
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
          "title",
          "box_office",
          "budget",
          "rating",
          "poster",
          "summary",
          "trailer",
          "wiki",
        ].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newMovies[field]}
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
            {editingId ? "Update Movie" : "Add Movie"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewMovie({
                  title: "",
                  box_office: "",
                  budget: "",
                  rating: "",
                  poster: "",
                  summary: "",
                  trailer: "",
                  wiki: "",
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
        <h3 className="text-xl font-semibold">Movie Records</h3>
        <input
          type="text"
          placeholder="Search movies..."
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
                  "title",
                  "box_office",
                  "budget",
                  "rating",
                  "poster",
                  "summary",
                  "trailer",
                  "wiki",
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
                    key={char.id}
                    className="border-b border-gray-700 hover:bg-[#332b73] transition cursor-pointer"
                    onClick={() => {
                      setEditingId(char.id);
                      setNewMovie({
                        title: char.title,
                        box_office: char.box_office,
                        budget: char.budget,
                        rating: char.rating,
                        poster: char.poster,
                        summary: char.summary,
                        trailer: char.trailer,
                        wiki: char.wiki,
                      });
                    }}
                  >
                    <td className="p-3">
                      {char.title?.trim()
                        ? char.title.trim().charAt(0).toUpperCase() + char.title.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.box_office?.trim()
                        ? char.box_office.trim().charAt(0).toUpperCase() + char.box_office.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.budget?.trim()
                        ? char.budget.trim().charAt(0).toUpperCase() + char.budget.trim().slice(1)
                        : "No data found"}
                    </td>
                     <td className="p-3">
                      {char.rating?.trim()
                        ? char.rating.trim().charAt(0).toUpperCase() + char.rating.trim().slice(1)
                        : "No data found"}
                    </td>
                     <td className="p-3">
                      {char.poster?.trim()
                        ? char.poster.trim().charAt(0).toUpperCase() + char.poster.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.summary?.trim()
                        ? char.summary.trim().charAt(0).toUpperCase() + char.summary.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.trailer?.trim()
                        ? char.trailer.trim().charAt(0).toUpperCase() + char.trailer.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.wiki?.trim()
                        ? char.wiki.trim().charAt(0).toUpperCase() + char.wiki.trim().slice(1)
                        : "No data found"}
                    </td>

                     <td className="p-3">
                      <button
                        onClick={() => handleDelete(char.id)}
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
                    No movies found.
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

export default AdminMovie;