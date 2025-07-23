// components/BookCard.jsx
import { Link } from 'react-router-dom';

export default function BookCard({ book }) {
  return (
    <div className="bg-white shadow rounded overflow-hidden hover:shadow-lg transition">
      <img
        src={book.cover || 'https://via.placeholder.com/150x220?text=No+Cover'}
        alt={book.title}
        className="w-full h-56 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{book.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{book.author || 'Unknown author'}</p>
        <Link
          to={`/book/${book.id}`} // Ensure book.id is passed correctly here
          className="inline-block bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800"
        >
          Read
        </Link>
      </div>
    </div>
  );
}
