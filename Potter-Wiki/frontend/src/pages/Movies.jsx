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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselMovies, setCarouselMovies] = useState([]);

// Fetch movies for the carousel
useEffect(() => {
  async function fetchCarouselMovies() {
    try {
      const res = await axios.get("/api/movies ");
      const movies = Array.isArray(res.data) ? res.data : [];
      setCarouselMovies(movies.slice(0, 5)); // show first 5 movies
    } catch (err) {
      console.error("Error loading carousel movies:", err);
    }
  }
  fetchCarouselMovies();
}, []);

// Auto-slide every 5 seconds
useEffect(() => {
  if (carouselMovies.length === 0) return;
  const interval = setInterval(() => {
    setCarouselIndex((prev) => (prev + 1) % carouselMovies.length);
  }, 5000);
  return () => clearInterval(interval);
}, [carouselMovies]);


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
      <section className="min-h-screen flex flex-col  bg-black items-center justify-start pt-5 px-4">
       
        {/* --- Carousel --- */}
        {carouselMovies.length > 0 && (
          <div className="relative w-full max-w-5xl mx-auto mb-8 overflow-hidden rounded-xl shadow-lg">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
            >
              {carouselMovies.map((b) => (
                <Link
                  key={b.id}
                  to={`/movies/${b.id}`}
                  className="min-w-full h-[400px] bg-gray-200 flex items-center justify-center relative"
                >
                  {b.poster ? (
                    <img
                      src={b.poster}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-500 text-lg font-semibold">
                      {b.title}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-3">
                    <h3 className="text-lg font-bold">{b.title}</h3>
                    <p className="text-sm">{b.author}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dots Navigation */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
              {carouselMovies.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`w-3 h-3 rounded-full ${
                    i === carouselIndex ? "bg-white" : "bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {/* Manual Arrows */}
            <button
              onClick={() =>
                setCarouselIndex(
                  (carouselIndex - 1 + carouselMovies.length) % carouselMovies.length
                )
              }
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full hover:bg-black/70"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setCarouselIndex((carouselIndex + 1) % carouselMovies.length)
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full hover:bg-black/70"
            >
              ›
            </button>
          </div>
        )}
        {/* Header + Search Bar */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-wihte md:pl-[20px]">
              Movies
            </h1>
            <div className="w-full md:w-auto md:ml-auto">
              <div className="max-w-3xl w-full md:w-[400px]">
                <SearchBar
                  label="Search"
                  placeholder="Search movies..."
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  className="w-full p-2 border rounded-md bg-gray text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
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
                  key={movie.id || index}
                  className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1"
                >
                  <Link to={`/movies/${movie.id}`}>
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
