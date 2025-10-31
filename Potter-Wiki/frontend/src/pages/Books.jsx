// pages/Books.jsx
import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import axios from 'axios';
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "../components/SearchBar";

export default function Books() {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleBooks, setVisibleBooks] = useState(6);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");
  

  const categories = [
    { id: 'all', name: 'All Books' },
    { id: 'fiction', name: 'Fiction' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'magic', name: 'Magic' },
    { id: 'adventure', name: 'Adventure' },
  ];

  const links = [
    { id: 'authors', name: 'Authors', path: '/authors' },
    { id: 'characters', name: 'Characters', path: '/characters' },
    { id: 'movies', name: 'Movies', path: '/movies' },
    { id: 'about', name: 'About', path: '/about' },
    { id: 'contact', name: 'Contact', path: '/contact' }
  ];

  useEffect(() => {
  const fetchBooks = async () => {
      try {
        const res = await axios.get(`/api/books`);
        const rawBooks = Array.isArray(res.data) ? res.data : [];

      const inferCategory = (slug = "") => {
        if (slug.includes("chamber") || slug.includes("stone")) return "magic";
        if (slug.includes("prisoner") || slug.includes("phoenix")) return "adventure";
        if (slug.includes("half-blood") || slug.includes("deathly")) return "fantasy";
        return "fiction"; // default fallback
      };
      const inferTitle = (title = "") => {
        if (title);
        return title;
      };
      const formattedBooks = rawBooks.map((book, index) => {
        const attributes = book.raw?.attributes || {};
        const slug = attributes.slug || "";
        const title = attributes.title || "";

        return {
          id: book.id || `book-${index}`,
          title: inferTitle(title) || "Unknown Title",
          author: attributes.author || "Unknown Author",
          cover: attributes.cover || "",
          summary: attributes.summary || "No description available.",
          release_date: attributes.release_date || "Unknown",
          pages: attributes.pages || 0,
          slug,
          category: inferCategory(slug)
        };
      });

        setBooks(formattedBooks);
        console.log("Formatted Books:", formattedBooks.map(a => a.title));
        console.log("Formatted Books:", formattedBooks.map(b => b.category));
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch books. Please try again later.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);


  // Function to load more books
  const loadMoreBooks = () => {
    setVisibleBooks(prevCount => prevCount + 6);
  };

  // Function to filter books by category
  const filterBooksByCategory = (category) => {
    setActiveCategory(category);
  };

  // Get filtered books based on active category
  const filteredBooks = books.filter(book => {
    const matchesCategory = activeCategory === 'all' || book.category === activeCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());

    console.log("Checking Book:", book.title, "| Category:", book.category);

    return matchesCategory && matchesSearch;
  });

   useEffect(() => {
    if (filteredBooks.length === 0 && searchTerm.trim() !== "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredBooks.length]);

  if (error) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 p-4 hidden md:block">
          <h2 className="font-bold text-lg mb-4">Navigation</h2>
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category.id} className="px-2 py-1 text-gray-600">
                {category.name}
              </div>
            ))}
            <hr className="my-4" />
            {links.map(link => (
              <div key={link.id} className="px-2 py-1 text-gray-600">
                {link.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Error message */}
        <div className="flex-1 p-6 flex justify-center items-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
  <PageWrapper loading={loading}>
    <section className="flex pt-[50px] md:pt-[150px] px-4">
      {/* Category sidebar */}
      <div className="w-64 border shadow-md p-4 hidden md:block self-start">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Categories</h2>
        <div className="space-y-1 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => filterBooksByCategory(category.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeCategory === category.id 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
             
            </button>
          ))}
        </div>
        
        <h2 className="font-bold text-lg mb-4 text-gray-800 mt-6">Explore More</h2>
        <div className="space-y-1">
          {links.map(link => (
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
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
             {/* SearchBar at the top */}
           <div className="w-full flex justify-between items-center flex-wrap gap-4 mb-[10px] md:mb-[10px]">
              {/* Heading */}
              <h1 className="text-2xl md:text-3xl text-black font-bold text-center md:text-left">
                {activeCategory === 'all'
                  ? 'All Books'
                  : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Books`}
              </h1>

              {/* SearchBar */}
              <div className="w-full md:w-auto max-w-md">
                <SearchBar
                  label="Search"
                  placeholder="Type a book title..."
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </div>
            </div>

            {/* Heading + Category Selector */}
    
              {/* Mobile category selector */}
              <div className="md:hidden w-full">
                <select
                  value={activeCategory}
                  onChange={(e) => filterBooksByCategory(e.target.value)}
                  className="w-full p-2 border text-black rounded-md bg-white"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
        

        
         {/* Book Grid */}
          <div className="px-2 sm:px-0 mt-[10px]">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 max-w-full">
              {filteredBooks.slice(0, visibleBooks).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>

        
        {/* Empty state */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No books found in this category.</p>
          </div>
        )}
        
        {/* Load more button */}
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