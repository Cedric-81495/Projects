// pages/HPotterBooks.jsx
import React, { useEffect, useState } from "react";
import BookCard from "../components/BookCard";

const categories = [
  { id: "all", name: "All Books" },
  { id: "fiction", name: "Fiction" },
  { id: "fantasy", name: "Fantasy" },
  { id: "magic", name: "Magic" },
  { id: "adventure", name: "Adventure" },
  { id: "young-adult", name: "Young Adult" },
];

const categorySubjectsMap = {
  all: "",
  fiction: "fiction",
  fantasy: "fantasy",
  magic: "magic",
  adventure: "adventure",
  "young-adult": "young_adult",
};

export default function HPotterBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleBooks, setVisibleBooks] = useState(18);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      const subject = categorySubjectsMap[activeCategory];
      let url;

      if (!subject) {
        url = `https://openlibrary.org/search.json?q=the&limit=100`;
      } else {
        url = `https://openlibrary.org/subjects/${subject}.json?limit=100`;
      }

      try {
        const res = await fetch(url);
        const data = await res.json();

        const fetchedBooks =
          activeCategory === "all" ? data.docs : data.works || [];

        const formatted = fetchedBooks.map((book) => {
          const title = book.title || book.title_suggest;
          const author =
            book.author_name?.[0] || book.authors?.[0]?.name || "Unknown";
          const coverId = book.cover_id || book.cover_i;
          const key = book.key || book.cover_edition_key || book.edition_key?.[0];

          return {
            id: key,
            title,
            author,
            cover: coverId
              ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
              : "https://via.placeholder.com/150x220?text=No+Cover",
            link: key
              ? `https://openlibrary.org${book.key || `/works/${key}`}`
              : "#",
            category: activeCategory,
          };
        });

        setBooks(formatted);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch books.");
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [activeCategory]);

  const loadMoreBooks = () => {
    setVisibleBooks((prev) => prev + 12);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p>Loading books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className="w-64 bg-white shadow-md p-4 hidden md:block"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <h2 className="font-bold text-lg mb-4 text-gray-800">Categories</h2>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setVisibleBooks(18);
              }}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeCategory === category.id
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 capitalize">
          {activeCategory === "all"
            ? "All Books"
            : `${activeCategory} Books`}
        </h1>

        {/* Book Grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {books.slice(0, visibleBooks).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {books.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No books found.</p>
          </div>
        )}

        {visibleBooks < books.length && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreBooks}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
