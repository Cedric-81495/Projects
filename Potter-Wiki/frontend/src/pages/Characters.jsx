import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/characters`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setCharacters(res.data);
      } catch (err) {
        console.error("Failed to fetch characters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [user]);

  const filteredCharacters = characters
    .filter((char) => char.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (filteredCharacters.length === 0 && searchTerm.trim() !== "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredCharacters.length]);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 36);

  return (
    <PageWrapper loading={loading}>
      {/* 🧱 Main Layout */}
      <section className="min-h-screen flex flex-col items-center justify-start pt-28 px-4">
            {/* 🔍 Search Bar pinned under navbar */}
       <div className="w-full flex justify-center mt-10 px-4">
          <div className="w-full max-w-3xl">
            <SearchBar
              label="Search"
              placeholder="Type a character name..."
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        </div>

        {/* 🧙 Character Results */}
        {!loading && filteredCharacters.length === 0 && searchTerm.trim() !== "" ? (
          <p className="text-gray-400 mt-8 text-center">
            No results found for <span className="font-semibold">"{searchTerm}"</span>.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {filteredCharacters.slice(0, visibleCount).map((char) => (
                <Link key={char._id} to={`/characters/${char._id}`}>
                  <Card title={char.name} />
                </Link>
              ))}
            </div>

            {visibleCount < filteredCharacters.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shadow-md transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </PageWrapper>
  );
};

export default Characters;
