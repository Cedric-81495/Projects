import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BookCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const nextId = parseInt(id) + 1;

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      setError(null);

      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${API_BASE}${id}`); // ← uses env var

        console.log('Book API response:', res);

        if (res.data && res.data.data && res.data.data.attributes) {
          setBook(res.data.data.attributes);
        } else {
          setError('Book data not found.');
          setBook(null);
        }
      } catch (err) {
        console.error('API Error:', err);
        setError('Failed to load book.');
        setBook(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8 text-lg">Loading book...</div>;
  }

  if (error) {
    return (
      <div className="text-center mt-8 text-red-600">
        <p>{error}</p>
        <Link to="/" className="text-blue-700 underline mt-4 inline-block">
          ← Back to Home
        </Link>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center mt-8">
        <p>No book data to display.</p>
        <Link to="/" className="text-blue-700 underline mt-4 inline-block">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={book.cover || 'https://via.placeholder.com/200x300?text=No+Cover'}
          alt={book.title}
          className="w-full md:w-1/3 object-cover shadow-md rounded"
        />

        <div className="md:flex-1">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-gray-700 text-lg mb-4">By {book.author || 'Unknown Author'}</p>

          <p className="text-gray-800 mb-6">
            {book.summary || 'No description available.'}
          </p>

          <div className="space-y-2 text-sm text-gray-600">
            {book.release_date && <p>📅 Release Date: {book.release_date}</p>}
            {book.pages && <p>📖 Pages: {book.pages}</p>}
            {book.genre && <p>🏷️ Genre: {book.genre}</p>}
          </div>

          <div className="flex gap-4 mt-6">
            <Link
              to="/"
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              ← Back to Home
            </Link>

            <button
              onClick={() => navigate(`/book/${nextId}`)}
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
            >
              Next Book →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
