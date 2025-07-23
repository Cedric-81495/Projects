import React, { useEffect, useState } from 'react';
import BookCard from '../components/BookCard';
import axios from 'axios';

export default function HPotterBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(API_BASE); // ← uses env var
        
        console.log('Loaded books:', res.data.data.map(b => b.id));
        console.log('API response:', res);

        if (res.data && Array.isArray(res.data.data)) {
          console.log('Books data array:', res.data.data);
          res.data.data.forEach((book, index) => {
            console.log(`Book #${index + 1}:`, book);
          });

          setBooks(res.data.data);
        } else {
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
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading books...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-red-600">{error}</p>;
  }

  if (books.length === 0) {
    return <p className="text-center mt-10">No books found.</p>;
  }

  return (
    <main className="container mx-auto px-4 py-8" id="books">
      <h1 className="text-3xl font-bold mb-6 text-center">Explore Our Book Collection</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
         {/* {books.slice(0, 4).map(book => */}
        {books.map((book) =>(
          <BookCard key={book.id} book={{ id: book.id, ...book.attributes }} />
        ))}
      </div>
    </main>
  );
}
