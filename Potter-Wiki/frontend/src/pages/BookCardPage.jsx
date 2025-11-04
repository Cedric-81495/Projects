import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";

export default function BookCardPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [nextBookId, setNextBookId] = useState(null);
  const [prevBookId, setPrevBookId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBookDetails() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/books/${id}`);
        const data = res.data;

        //if (!data || !data.attributes) throw new Error("Book not found.");

        setBook({
          id: data.id,
          ...data.attributes,
        });

        const chapters = data.relationships?.chapters?.data || [];
        setChapters(chapters);

        const all = await axios.get("/api/books");
        const allBooks = Array.isArray(all.data) ? all.data : [];
        const index = allBooks.findIndex((b) => b.id === data.id);
        setPrevBookId(index > 0 ? allBooks[index - 1].id : null);
        setNextBookId(index < allBooks.length - 1 ? allBooks[index + 1].id : null);
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("Failed to load book details.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchBookDetails();
  }, [id, user]);

  if (loading) {
    return (
      <PageWrapper loading={true}>
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-3xl w-full">
          </div>
        </section>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-3xl w-full p-6 bg-white rounded-xl shadow-md text-center">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        </section>
      </PageWrapper>
    );
  }

  if (!book) {
    return (
      <PageWrapper>
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-3xl w-full p-6 bg-white rounded-xl shadow-md text-center">
            <p className="text-gray-500 text-lg">Book not found.</p>
          </div>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="min-h-screen max-w-4xl mx-auto p-6">
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
          {/* Cover */}
          <div className="flex flex-col items-center">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full max-w-md h-auto object-contain rounded-lg mb-6"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-1">
              {book.title}
            </h1>
            <p className="text-gray-600 text-center mb-4">By {book.author}</p>
          </div>

          {/* Details */}
          <p className="text-gray-700 mb-6 text-justify">{book.summary}</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <span className="font-semibold">Release Date:</span>{" "}
              {book.release_date?.slice(0, 10)}
            </div>
            <div>
              <span className="font-semibold">Pages:</span> {book.pages}
            </div>
          </div>

          {book.dedication && (
            <p className="italic text-gray-600 mt-4">“{book.dedication}”</p>
          )}

          {/* Chapters */}
          {chapters.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Chapters</h2>
              <ul className="list-disc pl-5 space-y-1">
                {chapters.map((ch, index) => (
                  <li key={ch._id}>
                    <Link
                      to={`/books/${book.id}/contents/${ch._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Chapter {index + 1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between mt-8 flex-wrap gap-2">
            {prevBookId && (
              <Link
                to={`/books/${prevBookId}`}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md"
              >
                ← Previous Book
              </Link>
            )}
            <Link
              to={`/books/${book.id}/contents`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              📖 Read Book
            </Link>
            {nextBookId && (
              <Link
                to={`/books/${nextBookId}`}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md"
              >
                Next Book →
              </Link>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}