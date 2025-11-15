// frontend/src/pages/admin/AdminBooks.jsx
import { useEffect, useState, useContext } from "react";
import api from "../../lib/axios";
import { AuthContext } from "../../context/AuthProvider";
import { formatDate } from "../../utils/dateUtils";

const AdminBooks = () => {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newBooks, setNewBook] = useState({
    title: "",
    author: "",
    cover: "",
    summary: "",
    release_date: "",
    pages: "",
    category: "",
  });

  const fetchBooks = async () => {
    try {
      const res = await api.get(`/books`);
      const booksData = res.data.map((item) => ({
        id: item.id,
        ...item.attributes, // spreads title, author, cover, etc.
      }));
      setBooks(booksData);
      setFiltered(booksData);
      console.log("Books normalized:", booksData);
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
  fetchBooks();
}, [user]);


  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(
      books.filter((c) =>
        (c.title ?? "").toLowerCase().includes(lower) ||
        (c.author ?? "").toLowerCase().includes(lower) ||
        (c.release_date ?? "").toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, books]);


  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    setNewBook({ ...newBooks, [e.target.title]: e.target.value });
  };

  // Add 'POST' a Books
    const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // POST request to create a new book
      const { data: createBooks } = await api.post("/books", newBooks);
      await fetchBooks();
      // Update state immediately to reflect new data in UI
      const updated = [...books, createBooks];
      setBooks(updated);
      setFiltered(updated);

      // Reset form fields
      setNewBook({
        title: "",
        author: "",
        cover: "",
        summary: "",
        release_date: "",
        pages: "",
        category: "",
      });
       
      setSuccessMessage("Books added successfully!");
    } catch (err) {
      console.error("Error adding book:", err);
    }
  };

// Update 'PUT' a Books
const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    const { data: updatedBooks } = await api.put(
      `/books/${editingId}`,
      newBooks
    );

    // ✅ Update local state immediately so UI refreshes
    setBooks((prev) =>
      prev.map((char) => (char.id === editingId ? updatedBooks : char))
    );
    setFiltered((prev) =>
      prev.map((char) => (char.id === editingId ? updatedBooks : char))
    );
  ;
    setEditingId(null);
    setNewBook({
      title: "",
      author: "",
      cover: "",
      summary: "",
      release_date: "",
      pages: "",
      category: "",
    });

    setSuccessMessage("Books updated successfully!");
  } catch (err) {
    console.error("Error updating book:", err);
  }
};


  const handleDelete = async (id) => {
    try {
      await api.delete(`/books/${id}`);

      // Update local state manually
      const updatedList = books.filter((char) => char.id !== id);
      setBooks(updatedList);
      setFiltered(updatedList);

      setSuccessMessage("Books deleted successfully!");
    } catch (err) {
      console.error("Error deleting book:", err);
    }
  };

  return (
    <section className="bg-[#251c5a] p-4 rounded-lg shadow-md min-h-screen">
      <h3 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Books" : "Add New Books"}
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
          "author",
          "cover",
          "summary",
          "release_date",
          "pages",
          "category",
        ].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newBooks[field]}
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
            {editingId ? "Update Books" : "Add Books"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewBook({
                  title: "",
                  author: "",
                  cover: "",
                  summary: "",
                  release_date: "",
                  pages: "",
                  category: "",
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
        <h3 className="text-xl font-semibold">Books Records</h3>
        <input
          type="text"
          placeholder="Search books..."
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
                  "author",
                  "cover",
                  "summary",
                  "release_date",
                  "pages",
                  "category",
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
                      setNewBook({
                        title: char.title,
                        author: char.author,
                        cover: char.cover,
                        summary: char.summary,
                        release_date: char.release_date,
                        pages: char.pages,
                        category: char.category,
                      });
                    }}
                  >
                    <td className="p-3">
                      {char.title?.trim()
                        ? char.title.trim().charAt(0).toUpperCase() + char.title.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.author?.trim()
                        ? char.author.trim().charAt(0).toUpperCase() + char.author.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.cover?.trim()
                        ? char.cover.trim().charAt(0).toUpperCase() + char.cover.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.summary?.trim()
                        ? char.summary.trim().charAt(0).toUpperCase() + char.summary.trim().slice(1)
                        : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.release_date ? formatDate(char.release_date) : "No data found"}
                    </td>
                    <td className="p-3">
                      {char.pages
                        ? String(char.pages) // convert to string if you want consistency
                        : "No data found"}
                    </td>
                     <td className="p-3">
                      {char.category?.trim()
                        ? char.category.trim().charAt(0).toUpperCase() + char.category.trim().slice(1)
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
                    No books found.
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

export default AdminBooks;