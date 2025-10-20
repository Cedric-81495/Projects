import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import NotFound from "./NotFound";

const CharacterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [error, setError] = useState(false);
  const [character, setCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/characters`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setCharacters(res.data);

        const found = res.data.find((char) => char._id === id);
        setCharacter(found);
        setError(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Failed to fetch character:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [id, user]);

  const currentIndex = characters.findIndex((c) => c._id === id);
  const prevCharacter = currentIndex > 0 ? characters[currentIndex - 1] : null;
  const nextCharacter =
    currentIndex < characters.length - 1 ? characters[currentIndex + 1] : null;

  if (loading) return <PageWrapper loading={true} />;
  if (error || !character)
    return (
      <PageWrapper>
        <NotFound message="Character not found" backPath="/characters" />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="flex flex-col flex-grow design-div items-center justify-center px-4 py-12 sm:py-20">
        {/* Character Card */}
        <div className="bg-[#6b4ea0] text-white shadow-2xl rounded-2xl border border-amber-700 p-8 sm:p-10 w-full max-w-5xl flex flex-col md:flex-row gap-10">
          {/* Character Image */}
          {character.image ? (
            <img
              src={character.image}
              alt={character.name}
              className="w-64 h-80 object-cover rounded-xl border-4 border-amber-700 shadow-lg mx-auto md:mx-0"
            />
          ) : (
            <div className="w-64 h-80 flex items-center justify-center rounded-xl border-4 border-amber-700 bg-[#3a2b5a] text-gray-300 shadow-lg mx-auto md:mx-0">
              No Image Available
            </div>
          )}

          {/* Character Info */}
          <div className="flex-1 flex flex-col items-start justify-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-amber-200 font-serif mb-6 text-center md:text-left">
              {character.name}
            </h2>

            <div className="space-y-2 text-base sm:text-lg font-medium leading-relaxed">
              <p>
                <span className="text-amber-300 font-semibold">Species:</span>{" "}
                {character.species || "N/A"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Gender:</span>{" "}
                {character.gender || "N/A"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">House:</span>{" "}
                {character.house || "N/A"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Date of Birth:</span>{" "}
                {character.dateOfBirth || "N/A"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Wizard:</span>{" "}
                {character.wizard ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Ancestry:</span>{" "}
                {character.ancestry || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Eye Colour:</span>{" "}
                {character.eyeColour || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Hair Colour:</span>{" "}
                {character.hairColour || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Hogwarts Student:</span>{" "}
                {character.hogwartsStudent ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Hogwarts Staff:</span>{" "}
                {character.hogwartsStaff ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Actor:</span>{" "}
                {character.actor || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Alive:</span>{" "}
                {character.alive ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
          <button
            onClick={() => navigate("/characters")}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow"
          >
            ← Back
          </button>

          <button
            onClick={() => prevCharacter && navigate(`/characters/${prevCharacter._id}`)}
            disabled={!prevCharacter}
            className={`px-5 py-2 rounded-lg shadow ${
              prevCharacter
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>

          <button
            onClick={() => nextCharacter && navigate(`/characters/${nextCharacter._id}`)}
            disabled={!nextCharacter}
            className={`px-5 py-2 rounded-lg shadow ${
              nextCharacter
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CharacterDetail;
