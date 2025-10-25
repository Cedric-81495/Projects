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
      <section className="min-h-screen pt-[160px] flex flex-col items-center justify-start">
        <div className="w-full max-w-6xl mx-auto">
          {/* 🧙 Character Name */}
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#f5e6c8] mb-10 text-center">
            {character.name}
          </h2>

          {/* 🪄 Character Card */}
          <div className="bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-md hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-10">
            {/* Image */}
            {character.image ? (
              <img
                src={character.image}
                alt={character.name}
                className="w-full max-w-[180px] aspect-[3/4] object-cover rounded-xl border-4 border-[#cfae6d] shadow-lg mx-auto md:mx-0"
              />
            ) : (
              <div className="w-full max-w-[180px] aspect-[3/4] flex items-center justify-center rounded-xl border-4 border-[#cfae6d] bg-[#2c2c44] text-gray-300 shadow-lg mx-auto md:mx-0">
                No Image Available
              </div>
            )}

            {/* Info Grid */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-base sm:text-lg font-medium leading-relaxed">
                <p><span className="text-[#cfae6d] font-semibold">Species:</span> {character.species || "N/A"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Gender:</span> {character.gender || "N/A"}</p>
                <p><span className="text-[#cfae6d] font-semibold">House:</span> {character.house || "N/A"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Date of Birth:</span> {character.dateOfBirth || "N/A"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Wizard:</span> {character.wizard ? "Yes" : "No"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Ancestry:</span> {character.ancestry || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Eye Colour:</span> {character.eyeColour || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Hair Colour:</span> {character.hairColour || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Hogwarts Student:</span> {character.hogwartsStudent ? "Yes" : "No"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Hogwarts Staff:</span> {character.hogwartsStaff ? "Yes" : "No"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Actor:</span> {character.actor || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Alive:</span> {character.alive ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* 🧭 Navigation Buttons */}
          <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
            <button
              onClick={() => navigate("/characters")}
              className="px-6 py-2 bg-[#cfae6d] hover:bg-[#e0c98c] text-black font-semibold rounded-lg shadow-md transition"
            >
              ← Back
            </button>

            <button
              onClick={() => prevCharacter && navigate(`/characters/${prevCharacter._id}`)}
              disabled={!prevCharacter}
              className={`px-6 py-2 font-semibold rounded-lg shadow-md transition ${
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
              className={`px-6 py-2 font-semibold rounded-lg shadow-md transition ${
                nextCharacter
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default CharacterDetail;