import { Link } from "react-router-dom";
import axios from "axios";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "../components/SearchBar";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

export default function Movies() {
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);

  // ✅ Fetch movies from backend
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get("/api/movies");
        const rawMovies = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setMovies(rawMovies);
        console.log("Fetched Movies:", rawMovies);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch movie list:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [user]);

  // ✅ Filter by title
  const filteredMovies = movies
    .filter((m) =>
      m.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleLoadMore = () => setVisibleCount((prev) => prev + 5);

  return (
    <PageWrapper loading={loading}>
      <section className="min-h-screen flex flex-col items-center justify-start pt-5 px-4">
        {/* Header + Search Bar */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-black md:pl-[20px]">
              Movies
            </h1>
            <div className="w-full md:w-auto md:ml-auto">
              <div className="max-w-3xl w-full md:w-[400px]">
                <SearchBar
                  label="Search"
                  placeholder="Search movies..."
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </div>
            </div>
          </div>

        {/* Error or Empty States */}
        {error ? (
          <p className="text-gray-500">No movie to load..</p>
        ) : filteredMovies.length === 0 && searchTerm.trim() !== "" ? (
          <p className="text-gray-500 text-center">
            No results found for{" "}
            <span className="font-semibold">"{searchTerm}"</span>.
          </p>
        ) : (
          <>
            {/* ✅ Movie Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 p-6 rounded-xl">
              {filteredMovies.slice(0, visibleCount).map((movie, index) => (
                <div
                  key={movie._id || index}
                  className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1"
                >
                  <Link to={`/movies/${movie._id}`}>
                    <img
                      src={movie.poster || "/placeholder.jpg"}
                      alt={movie.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4 text-white">
                      <h3 className="text-lg font-bold truncate">
                        {movie.title || "Untitled"}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {movie.release_date
                          ? new Date(movie.release_date).getFullYear()
                          : "Unknown Year"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        {movie.rating || "Unrated"}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredMovies.length && (
              <div className="flex justify-center mt-6 mb-6">
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
}
