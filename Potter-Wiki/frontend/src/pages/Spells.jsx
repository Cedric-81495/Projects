// src/pages/Spells.jsx
import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";

const Spells = () => {
  const [spells, setSpells] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch spells
  useEffect(() => {
    const fetchSpells = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/spells`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setSpells(res.data);
      } catch (err) {
        console.error("Failed to fetch spells:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpells();
  }, [user]);

  // ✅ Filter and sort alphabetically
  const filteredSpells = spells
    .filter((spell) =>
      spell.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // ✅ Scroll to top when no results
  useEffect(() => {
    if (filteredSpells.length === 0 && searchTerm.trim() !== "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredSpells.length]);

  // ✅ Load more handler
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 36);
  };

  return (
    <PageWrapper loading={loading}>
         {/* Charater Section */}
      <section className="min-h-screen flex flex-col items-center justify-start pt-28 px-4">
            {/* 🔍 Search Bar pinned under navbar */}
            <div className="w-full flex justify-center mb-10">
              <div className="w-full max-w-3xl">
                <SearchBar
                  label="Search"
                  placeholder="Type a spell name..."
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </div>
            </div>
            {/* 🧙 Results */}
            {!loading && filteredSpells.length === 0 && searchTerm.trim() !== "" ? (
              <div className="mt-8">
                <p className="text-center text-gray-500 text-sm sm:text-base">
                  No results found for <span className="font-semibold">"{searchTerm}"</span>.
                </p>
              </div>
            ) : (
               <>
            {/* 🧙 Spell Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {filteredSpells.slice(0, visibleCount).map((spell) => (
                <Link key={spell._id} to={`/spells/${spell._id}`}>
                  <Card title={spell.name} />
                </Link>
              ))}
            </div>

            {/* 🧭 Load More */}
            {visibleCount < filteredSpells.length && (
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

export default Spells;
