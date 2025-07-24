// pages/BookCardPage.jsx
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
  const [prevBookId, setPrevBookId] = useState(null);
  
  // Reading state
  const [isReading, setIsReading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageContent, setPageContent] = useState('');

  useEffect(() => {
    async function fetchBookDetails() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.potterdb.com/v1/books';
        // Make sure there's a slash between the base URL and the book ID
        const response = await axios.get(`${API_BASE}/${id}`);
        
        if (response.data && response.data.data) {
          // Extract book details from the attributes
          const bookData = response.data.data;
          const bookDetails = {
            id: bookData.id,
            title: bookData.attributes?.title || 'Unknown Title',
            author: bookData.attributes?.author || 'J.K. Rowling',
            cover: bookData.attributes?.cover || '',
            summary: bookData.attributes?.summary || 'No description available.',
            release_date: bookData.attributes?.release_date || 'Unknown',
            pages: bookData.attributes?.pages || '0',
          };
          
          setBook(bookDetails);
          setTotalPages(parseInt(bookDetails.pages) || 30); // Default to 30 pages if not available
          
          // Fetch adjacent book IDs
          fetchAdjacentBooks(id);
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

    async function fetchAdjacentBooks(currentId) {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.potterdb.com/v1/books';
        const response = await axios.get(`${API_BASE}`);
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          const books = response.data.data;
          const currentIndex = books.findIndex(book => book.id === currentId);
          
          if (currentIndex > 0) {
            setPrevBookId(books[currentIndex - 1].id);
          } else {
            setPrevBookId(null);
          }
          
          if (currentIndex !== -1 && currentIndex < books.length - 1) {
            setNextBookId(books[currentIndex + 1].id);
          } else {
            setNextBookId(null);
          }
        }
      } catch (err) {
        console.error('Error fetching adjacent books:', err);
      }
    }

    if (id) {
      fetchBookDetails();
    }
  }, [id]);

  // Generate dummy page content based on page number
  useEffect(() => {
    if (isReading && book) {
      // In a real app, you would fetch actual page content from an API
      // This is just a simulation for demonstration purposes
      const generatePageContent = (pageNum) => {
        const bookTitle = book.title;
        const paragraphs = [
          `This is page ${pageNum} of "${bookTitle}". In a real application, this would contain the actual text content of the book.`,
          `The story continues as our heroes face new challenges. The world of magic unfolds with every turn of the page.`,
          `Characters develop and plots thicken as you progress through the book. This is where the real content would be displayed.`,
          `In a production environment, this content would be fetched from a database or API that contains the full text of the book.`
        ];
        
        // Add different content for different pages to simulate progression
        if (pageNum % 3 === 0) {
          paragraphs.push(`"What will happen next?" wondered Harry as he gazed across the grounds of Hogwarts.`);
        } else if (pageNum % 3 === 1) {
          paragraphs.push(`The castle stood silent against the night sky, its many windows glowing with warm light.`);
        } else {
          paragraphs.push(`Magic filled the air as students practiced their spells in the great hall.`);
        }
        
        return paragraphs.join('\n\n');
      };
      
      setPageContent(generatePageContent(currentPage));
    }
  }, [isReading, currentPage, book]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const startReading = () => {
    setIsReading(true);
    setCurrentPage(1);
  };

  const stopReading = () => {
    setIsReading(false);
  };

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

  // Reading mode view
  if (isReading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Reading mode header */}
          <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
            <h1 className="text-xl font-bold">{book.title}</h1>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          
          {/* Page content */}
          <div className="p-6 min-h-[60vh] bg-amber-50">
            <div className="prose max-w-none">
              {pageContent.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
          
          {/* Navigation controls */}
          <div className="bg-gray-100 p-4 border-t flex justify-between items-center">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={`px-4 py-2 rounded ${
                currentPage <= 1 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              ← Previous Page
            </button>
            
            <button 
              onClick={stopReading}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Back to Details
            </button>
            
            <button 
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded ${
                currentPage >= totalPages 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next Page →
            </button>
          </div>
        </div>
        
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
      </div>
    );
  }

  // Book details view (default)
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
          
          {/* Read button */}
          <button
            onClick={startReading}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Read Book Free
          </button>
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
            <div>
              <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
            </div>
            <div className="flex gap-4">
              {prevBookId && (
                <Link to={`/book/${prevBookId}`} className="text-blue-600 hover:underline">← Previous Book</Link>
              )}
              {nextBookId && (
                <Link to={`/book/${nextBookId}`} className="text-blue-600 hover:underline">Next Book →</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}