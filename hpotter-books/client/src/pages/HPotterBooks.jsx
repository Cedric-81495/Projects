// pages/HPotterBooks.jsx
import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BookCard from '../components/BookCard';
import axios from 'axios';

export default function HPotterBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleBooks, setVisibleBooks] = useState(18); // Show more books initially
  const [activeCategory, setActiveCategory] = useState('all');

  // Categories for the sidebar
  const categories = [
    { id: 'all', name: 'All Books' },
    { id: 'fiction', name: 'Fiction' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'magic', name: 'Magic' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'young-adult', name: 'Young Adult' }
  ];

  // Additional links for the sidebar
  const links = [
    { id: 'authors', name: 'Authors', path: '/authors' },
    { id: 'characters', name: 'Characters', path: '/characters' },
    { id: 'movies', name: 'Movies', path: '/movies' },
    { id: 'about', name: 'About', path: '/about' },
    { id: 'contact', name: 'Contact', path: '/contact' }
  ];

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.potterdb.com/v1/books';
        const res = await axios.get(API_BASE);
        
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          // Extract relevant information from each book's attributes
          const formattedBooks = res.data.data.map(book => {
            if (!book.attributes) {
              return null;
            }
            
            return {
              id: book.id,
              title: book.attributes.title || "Unknown Title",
              author: book.attributes.author || "J.K. Rowling",
              cover: book.attributes.cover,
              release_date: book.attributes.release_date,
              summary: book.attributes.summary || "No description available.",
              // Assign random categories for demo purposes
              category: ['fiction', 'fantasy', 'magic', 'adventure', 'young-adult'][
                Math.floor(Math.random() * 5)
              ]
            };
          }).filter(book => book !== null);
          
          setBooks(formattedBooks);
        } else {
          console.error('Unexpected response format:', res.data);
          setError('Unexpected API response format');
          setBooks([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch books. Please try again later.');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
    
    // Add a timeout to prevent infinite loading
    // const timeoutId = setTimeout(() => {
    //   if (loading) {
    //     setLoading(false);
    //     setError('Request timed out. Please try refreshing the page.');
    //   }
    // }, 10000);
    
    // return () => clearTimeout(timeoutId);
  }, []);

  // Function to load more books
  const loadMoreBooks = () => {
    setVisibleBooks(prevCount => prevCount + 12);
  };

  // Function to filter books by category
  const filterBooksByCategory = (category) => {
    setActiveCategory(category);
  };

  // Get filtered books based on active category
  const filteredBooks = activeCategory === 'all' 
    ? books 
    : books.filter(book => book.category === activeCategory);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar skeleton */}
        <div className="w-64 bg-gray-100 p-4 hidden md:block">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-4 animate-pulse"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded w-5/6 mb-3 animate-pulse"></div>
          ))}
        </div>
        
        {/* Main content loading */}
        <div className="flex-1 p-6 flex justify-center items-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading books...</p>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-md p-4 hidden md:block">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Categories</h2>
        <div className="space-y-1 mb-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => filterBooksByCategory(category.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeCategory === category.id 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
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
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">
            {activeCategory === 'all' ? 'All Books' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Books`}
          </h1>
          
          {/* Mobile category selector */}
          <div className="md:hidden w-full mb-4">
            <select 
              value={activeCategory}
              onChange={(e) => filterBooksByCategory(e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* <button 
            onClick={() => setVisibleBooks(filteredBooks.length)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 text-sm rounded transition-colors"
          >
            View All
          </button> */}
        </div>
        
        {/* Book Grid - smaller cards with more columns */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredBooks.slice(0, visibleBooks).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
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
    </div>
  );
}