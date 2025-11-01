import { useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";


export default function BookContents() {
  const { id, chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

  useEffect(() => {
  async function fetchChapter() {
    try {
      const res = await axios.get(`/api/books/${id}`);
      const book = res.data;
      const found = book.relationships?.chapters?.data.find(
        (ch) => ch.id === chapterId // also fix _id (see next issue)
      );
      setChapter(found);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch chapter. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  fetchChapter();
}, [id, chapterId]);


if (loading) {
  return <p className="text-center p-8 text-gray-600">Loading chapter...</p>;
}

if (error) {
  return <p className="text-center p-8 text-red-600">{error}</p>;
}

if (!chapter) {
  return <p className="text-center p-8 text-gray-500">Chapter not found.</p>;
}

  return (
        <PageWrapper loading={loading}>
            <section className="flex pt-[5px] relative px-4">
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Chapter</h1>
            <p className="text-gray-700">Chapter ID: {chapter._id}</p>
            </div>
            </section>
    </PageWrapper>
  );
}
