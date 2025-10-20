// frontend/src/pages/Characters.jsx
import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";
import voyeglq from "../assets/voyeglq.jpg";

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
    .filter((char) =>
      char.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (filteredCharacters.length === 0 && searchTerm.trim() !== "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredCharacters.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 36);
  };

  return (
    <PageWrapper loading={loading}>
      <section
              className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center bg-cover bg-center relative"
              style={{ backgroundImage: `url(${voyeglq})` }} 
            >
          {/* Search Bar */}
          <SearchBar
            label="Search"
            placeholder="Type a character name..."
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Results */}
          {!loading && filteredCharacters.length === 0 && searchTerm.trim() !== "" ? (
            <div className="mt-6">
              <p className="text-center text-gray-500 text-sm sm:text-base">
                No results found for <span className="font-semibold">"{searchTerm}"</span>.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6 w-full">
                {filteredCharacters.slice(0, visibleCount).map((char) => (
                  <Link key={char._id} to={`/characters/${char._id}`}>
                    <Card title={char.name} description={char.description} />
                  </Link>
                ))}
              </div>

              {visibleCount < filteredCharacters.length && (
                <div className="flex justify-center mt-8">
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