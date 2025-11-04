import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import NotFound from "../components/NotFound";
import { formatDate } from "../utils/dateUtils";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
        try {
        const res = await axios.get("/api/movies");
        const data = Array.isArray(res.data?.movies)
            ? res.data.movies
            : Array.isArray(res.data)
            ? res.data
            : [];

        setMovies(data); // ✅ store all movies here

        const found = data.find((s) => s.id === id);
        setMovie(found || null); // ✅ single selected movie
        setError(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
        console.error("Failed to fetch movie:", err);
        setError(true);
        } finally {
        setLoading(false);
        }
    };

    fetchMovies();
    }, [id, user]);

  const currentIndex = movies.findIndex((s) => s.id === id);
  const prevMovie = currentIndex > 0 ? movies[currentIndex - 1] : null;
  const nextMovie = currentIndex < movies.length - 1 ? movies[currentIndex + 1] : null;

  if (loading) return <PageWrapper loading={true} />;
  if (error || !movie)
    return (
      <PageWrapper>
        <NotFound message="Student not found" backPath="/movies" />
      </PageWrapper>
    );

    return (
      <PageWrapper>
        <section className="min-h-screen flex flex-col items-center justify-start px-4 bg-white text-black pt-[20px]  md:pt-[20px] relative">
           <div className="w-full max-w-8xl mx-auto">
            <div className="bg-white borderk  text-black shadow-md hover:shadow-xl transition duration-300 border-2xl flex flex-col gap-8 md:flex-row p-6 sm:p-10">
              {movie.poster ? (
                <img src={movie.poster} alt={movie.name} className="w-full aspect-[5/6] object-cover border bg-gradient-to-b from-gray-200 via-gray-700 border-black shadow-md mx-auto md:mx-0 max-w-[200px] md:max-w-[250x] lg:max-w-[450px]" />
              ) : (
                <div className="w-full aspect-[5/6] flex items-center bg-gradient-to-b from-gray-200 via-gray-700 justify-center border border-black bg-gray-100 text-gray-500 shadow-md mx-auto md:mx-0 max-w-[180px] md:max-w-[200px] lg:max-w-[300px]">No Image Available</div>
              )}
              <div className="flex-1 flex flex-col px-5 gap-1 md:gap-2 text-justify">
                  <h2 className="font-serif font-bold mb-6 text-center md:text-left text-3xl sm:text-4xl">
                        {movie.name}
                  </h2>
                 <div className="grid grid-cols-1  md:grid-cols-1 gap-x-5 gap-y-4 text-base md:text-lg 
                 font-normal justify-item-center md:leading-relaxed">
                 <p><span className="font-semibold">Title: </span> {movie.title || "Unknown"}</p>
                <p><span className="font-semibold">Summary: </span> {movie.summary || "Unknown"}</p>
                <p><span className="font-semibold">Trailer: </span>   
                <a
                    href={movie.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                >
                    {movie.trailer}
                </a> </p>
                <p><span className="font-semibold">Wiki: </span> 
                <a
                    href={movie.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                >
                    {movie.wiki}
                </a> </p>
                <p><span className="font-semibold">Box Office: </span> {movie.box_office || "Unknown"}</p>
                <p><span className="font-semibold">Budget: </span> {movie.budget || "Unknown"}</p>
                <p><span className="font-semibold">Rating: </span> {movie.rating || "Unknown"}</p>
                <p><span className="font-semibold">Release date: </span> {movie.release_date ? formatDate(movie.release_date) : "Unknown"}</p>
                <p><span className="font-semibold">Running time: </span> {movie.running_time || "Unknown"}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 mb-6 md:grid-cols-3 gap-4 mt-[20px] w-full max-w-xl mx-auto px-4 font-serif">
              <button
                onClick={() => prevMovie && navigate(`/movies/${prevMovie.id}`)}
                disabled={!prevMovie}
                className={`w-full px-6 py-3 border-md border border-black shadow-md transition-all duration-300 tracking-wide ${
                  prevMovie
                  ? "text-black hover:bg-gray-200"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                ← Prev
              </button>
              <button
                onClick={() => nextMovie && navigate(`/movies/${nextMovie.id}`)}
                disabled={!nextMovie}
                className={`w-full px-6 py-3 border-md border border-black shadow-md transition-all duration-300 tracking-wide ${
                  nextMovie
                  ? "text-black hover:bg-gray-200"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
              <button
                onClick={() => navigate("/movies")}
                className="w-full px-6 py-3 border border-black text-white bg-black hover:bg-white hover:text-black shadow-md hover:shadow-lg transition-all duration-300 tracking-wide col-span-2 md:col-span-1"
              >
                ← Back
              </button>
            </div>
          </div>
        </section>
      </PageWrapper>
    );
};

export default MovieDetails;