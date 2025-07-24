import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BookCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextBookId, setNextBookId] = useState(null);

  useEffect(() => {
    async function fetchBookDetails() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        // Make sure there's a slash between the base URL and the book ID
        const response = await axios.get(`${API_BASE}/${id}`);
        
        console.log('Book API response:', response.data);
        
        if (response.data && response.data.data) {
          // Extract book details from the attributes
          const bookData = response.data.data;
          setBook({
            id: bookData.id,
            title: bookData.attributes?.title || 'Unknown Title',
            author: bookData.attributes?.author || 'J.K. Rowling',
            cover: bookData.attributes?.cover || '',
            summary: bookData.attributes?.summary || 'No description available.',
            release_date: bookData.attributes?.release_date || 'Unknown',
            pages: bookData.attributes?.pages || 'Unknown',
            // Add any other attributes you need
          });
          
          // Optionally fetch the next book ID
          fetchNextBookId(id);
        } else {
          setError('Book data not found');
        }
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError('Failed to load book.');
      } finally {
        setLoading(false);
      }
    }

    async function fetchNextBookId(currentId) {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        // Get all books to find the next one
        const response = await axios.get(`${API_BASE}`);
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          const books = response.data.data;
          const currentIndex = books.findIndex(book => book.id === currentId);
          
          if (currentIndex !== -1 && currentIndex < books.length - 1) {
            setNextBookId(books[currentIndex + 1].id);
          }
        }
      } catch (err) {
        console.error('Error fetching next book:', err);
      }
    }

    if (id) {
      fetchBookDetails();
    }
  }, [id]);

  if (loading) {
    return <div className="text-center p-8">Loading book details...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="mb-4">Book not found.</p>
        <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      {/* Fixed position button to view all books */}
      <div className="fixed bottom-6 right-6 z-10">
        <Link 
          to="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full shadow-lg flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
          All Books
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          {book.cover ? (
            <img 
              src={book.cover} 
              alt={`Cover of ${book.title}`} 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No cover available</span>
            </div>
          )}
        </div>
        
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-lg mb-4">By {book.author}</p>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{book.summary}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold">Release Date</h3>
              <p>{book.release_date}</p>
            </div>
            <div>
              <h3 className="font-semibold">Pages</h3>
              <p>{book.pages}</p>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
            {nextBookId && (
              <Link to={`/book/${nextBookId}`} className="text-blue-600 hover:underline">Next Book →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}