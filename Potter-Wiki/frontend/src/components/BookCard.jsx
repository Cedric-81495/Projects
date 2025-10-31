// frontend/src/pages/BookCard.jsx
import { Link } from "react-router-dom";

export default function BookCard({ book }) {

  const bookId = book.id || book._id || book.raw?.id;
  if (!book || !bookId || !book.title) return null;

  return (
   <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col w-full">
      <Link to={`/books/${bookId}`} className="block relative w-full aspect-[2/3]">
        {book.cover ? (
          <img
            src={book.cover}
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 text-xs">
            No Cover Available
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm font-semibold text-gray-800 truncate">{book.title}</h3>
        <p className="text-xs text-gray-500 mb-2 truncate">
          {book.author || "Unknown Author"}
        </p>

        <div className="mt-auto">
          <Link
            to={`/books/${bookId}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-md text-center transition-colors"
          >
            Read Book Free
          </Link>
        </div>
      </div>
    </div>
  );
}