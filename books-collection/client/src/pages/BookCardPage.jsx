import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

// ✅ Move regex outside the component
const validWorkIdRegex = /^works\/OL\d+W$/;

export default function BookCardPage() {
  const { id } = useParams(); // e.g., "works/OL66554W" or "works/OL66554W/read"
  const parts = id.split('/');
  const isRead = parts[parts.length - 1] === 'read';
  const bookId = isRead ? parts.slice(0, -1).join('/') : id;
  const olid = bookId.split('/')[1]; // OL66554W

  const [bookData, setBookData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`https://openlibrary.org/works/${olid}.json`);
        if (!res.ok) throw new Error('Not Found');
        const data = await res.json();
        setBookData(data);
      } catch {
        // ✅ no unused "err" warning now
        setError(true);
      }
    }

    if (validWorkIdRegex.test(bookId)) {
      fetchBook();
    } else {
      setError(true);
    }
  }, [bookId, olid]); // ✅ Removed validWorkIdRegex from dependency list

  if (error) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">404 - Page Not Found</h1>
        <p className="mb-4">The book you are looking for does not exist.</p>
        <Link to="/" className="text-blue-600 underline hover:text-blue-800">← Back to Home</Link>
      </div>
    );
  }

  if (!bookData) {
    return <div className="p-4 text-center text-gray-500">Loading book details…</div>;
  }

  const title = bookData.title || 'Untitled';
  const description = typeof bookData.description === 'string'
    ? bookData.description
    : bookData.description?.value || 'No description available.';
  const subjects = bookData.subjects?.slice(0, 10) || [];

  const archiveEmbedUrl = `https://archive.org/embed/${olid}?view=theater`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {isRead ? (
        <>
          <h2 className="text-2xl font-bold mb-2">Reading: {title}</h2>
          <iframe
            title="Book Reader"
            src={archiveEmbedUrl}
            width="100%"
            height="600px"
            allowFullScreen
            className="rounded shadow-md border"
          />
          <p className="text-sm text-gray-500">
            Having trouble? Try viewing directly on <a href={`https://archive.org/details/${olid}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">archive.org</a>.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-4xl font-bold">{title}</h2>
          <p className="text-gray-700 whitespace-pre-line">{description}</p>

          {subjects.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-lg mb-2">Subjects</h4>
              <ul className="flex flex-wrap gap-2">
                {subjects.map((s, idx) => (
                  <li key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to={`/book/${bookId}/read`}
            className="inline-block mt-6 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            📖 Read in Theater Mode
          </Link>
        </>
      )}
    </div>
  );
}
