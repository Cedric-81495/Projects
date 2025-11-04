// frontend/src/pages/Books.jsx
import { Link } from "react-router-dom";
import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "../components/SearchBar";

export default function Books() {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleBooks, setVisibleBooks] = useState(7);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "all", name: "All Books" },
    { id: "fiction", name: "Fiction" },
    { id: "fantasy", name: "Fantasy" },
    { id: "magic", name: "Magic" },
    { id: "adventure", name: "Adventure" },
  ];

  const links = [
    { id: "authors", name: "Authors", path: "/authors" },
  ];

  // ✅ Fetch PotterDB Books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get("/api/books");
        const rawBooks = Array.isArray(res.data) ? res.data : [];

        // Normalize PotterDB structure
        const formattedBooks = rawBooks.map((b) => {
          const attrs = b.attributes || {};
          const inferCategory = (slug = "") => {
            if (slug.includes("stone") || slug.includes("chamber")) return "magic";
            if (slug.includes("phoenix") || slug.includes("prisoner")) return "adventure";
            if (slug.includes("half-blood") || slug.includes("deathly")) return "fantasy";
            return "fiction";
          };

          return {
            id: b.id,
            title: attrs.title || "Unknown Title",
            author: attrs.author || "Unknown Author",
            cover: attrs.cover || "",
            summary: attrs.summary || "No description available.",
            release_date: attrs.release_date || "Unknown",
            pages: attrs.pages || 0,
            category: inferCategory(attrs.slug || ""),
          };
        });

        // Optional: Limit to 7 Harry Potter books only
        const filtered = formattedBooks.filter((book) =>
          book.author.includes("Rowling")
        ).slice(0, 7);

        setBooks(filtered);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  // ✅ Filter by category + search
  const filteredBooks = books.filter((book) => {
    const matchesCategory =
      activeCategory === "all" || book.category === activeCategory;
    const matchesSearch = book.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const loadMoreBooks = () => setVisibleBooks((prev) => prev + 6);

  if (error) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 bg-gray-100 p-4 hidden md:block">
          <h2 className="font-bold text-lg mb-4">Navigation</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="px-2 py-1 text-gray-600">
                {category.name}
              </div>
            ))}
            <hr className="my-4" />
            {links.map((link) => (
              <div key={link.id} className="px-2 py-1 text-gray-600">
                {link.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper loading={loading}>
      <section className="min-h-screen flex pt-[5px] relative px-4">
        
        {/* --- Sidebar --- */}
        <div className="w-64 border shadow-md p-4 hidden md:block self-start">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Categories</h2>
          <div className="space-y-1 mb-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeCategory === category.id
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <h2 className="font-bold text-lg mb-4 text-gray-800 mt-6">
            Explore More
          </h2>
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 p-4 md:px-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              {activeCategory === "all"
                ? "All Books"
                : `${activeCategory[0].toUpperCase() + activeCategory.slice(1)} Books`}
            </h1>
            <div className="w-full md:w-auto max-w-md">
              <SearchBar
                label="Search"
                placeholder="Type a book title..."
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          </div>

          {/* --- Mobile Dropdown --- */}
          <div className="md:hidden w-full mb-3">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full p-2 border text-black rounded-md bg-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* --- Book Grid --- */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-w-full">
            {filteredBooks && filteredBooks.length > 0 ? (
              filteredBooks.slice(0, visibleBooks).map((book) => (
                <div
                  key={book.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col w-full"
                >
                  <Link
                    to={`/books/${book.id}`}
                    className="block relative w-full aspect-[2/3]"
                  >
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 text-xs">
                        No Cover Available
                      </div>
                    )}
                  </Link>

                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {book.author}
                    </p>

                    <div className="mt-auto">
                      <Link
                        to={`/books/${book.id}`}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-md text-center transition-colors"
                      >
                        Read Book Free
                      </Link>
                    </div>
                  </div>
                  {/* --- Load More --- */}
                  {visibleBooks < filteredBooks.length && (
                        <div className="text-center mt-8">
                          <button
                            onClick={loadMoreBooks}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded transition-colors"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                </div>
              ))
             ) : (
                !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-12 h-12 mb-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-center text-sm">
                        No books found.
                      </p>
                    </div>
                  )
              )}
          </div>

          {/* --- Load More --- */}
          {visibleBooks < filteredBooks.length && (
            <div className="text-center mt-8">
              <button
                onClick={loadMoreBooks}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
