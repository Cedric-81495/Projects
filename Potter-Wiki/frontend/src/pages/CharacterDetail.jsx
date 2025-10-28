import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import NotFound from "../components/NotFound";
import { formatDate } from "../utils/dateUtils";

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
        const res = await axios.get(`/api/characters`);
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
     <section className="min-h-screen pt-[130px] md:pt-[200px] flex flex-col items-center justify-start px-4 bg-white text-black">
      <div className="w-full max-w-5xl mx-auto">
        {/* 🪄 Character Card */}
           <div className="bg-white border border-black text-black shadow-md hover:shadow-xl transition duration-300 border-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-10">
          {/* Image */}
          {character.image ? (
            <img
              src={character.image}
              alt={character.name}
              className="w-full max-w-[180px] md:max-w-[200px] lg:max-w-[300px] aspect-[3/4] object-cover border border-black shadow-md mx-auto md:mx-0"
            />
          ) : (
            <div className="w-full max-w-[180px] md:max-w-[200px] lg:max-w-[300px] aspect-[3/4] flex items-center justify-center border border-black bg-gray-100 text-gray-500 shadow-md mx-auto md:mx-0">
              No Image Available
            </div>
          )}

          {/* Info Grid */}
        <div className="w-full max-w-sm md:max-w-3xl mx-auto px-4 justify-center py-6 bg-white">
          {/* 🧙 Character Name */}
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center md:text-left mb-6">
           {character.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base md:text-lg font-normal justify-item-center leading-relaxed md:leading-relaxed">
            <p><span className="font-semibold">Species:</span> {character.species || "Unknown"}</p>
            <p><span className="font-semibold">Gender:</span> {character.gender || "Unknown"}</p>
            <p><span className="font-semibold">House:</span> {character.house || "Unknown"}</p>
            <p><span className="font-semibold">Date of Birth:</span> {character.dateOfBirth ? formatDate(character.dateOfBirth) : "Unknown"}</p>
            <p><span className="font-semibold">Wizard:</span> {character.wizard ? "Yes" : "No"}</p>
            <p><span className="font-semibold">Ancestry:</span> {character.ancestry || "Unknown"}</p>
            <p><span className="font-semibold">Eye Colour:</span> {character.eyeColour || "Unknown"}</p>
            <p><span className="font-semibold">Hair Colour:</span> {character.hairColour || "Unknown"}</p>
            <p><span className="font-semibold">Hogwarts Student:</span> {character.hogwartsStudent ? "Yes" : "No"}</p>
            <p><span className="font-semibold">Hogwarts Staff:</span> {character.hogwartsStaff ? "Yes" : "No"}</p>
            <p><span className="font-semibold">Actor:</span> {character.actor || "Unknown"}</p>
            <p><span className="font-semibold">Alive:</span> {character.alive ? "Yes" : "No"}</p>
          </div>
        </div>


        </div>

        {/* 🧭 Navigation Buttons */}
        <div className="grid grid-cols-2  mb-6 md:grid-cols-3 gap-4 mt-10 w-full max-w-xl mx-auto px-4 font-sans">
          {/* ← Prev */}
          <button
            onClick={() => prevCharacter && navigate(`/characters/${prevCharacter._id}`)}
            disabled={!prevCharacter}
            className={`w-full px-6 py-3 border-md border border-black shadow-md transition-all duration-300 tracking-wide ${
              prevCharacter
                ? "text-black hover:bg-gray-200"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>

          {/* Next → */}
          <button
            onClick={() => nextCharacter && navigate(`/characters/${nextCharacter._id}`)}
            disabled={!nextCharacter}
            className={`w-full px-6 py-3 border-md border border-black shadow-md transition-all duration-300 tracking-wide ${
              nextCharacter
                ? "text-black hover:bg-gray-200"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Next →
          </button>

          {/* ← Back */}
          <button
            onClick={() => navigate("/characters")}
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

export default CharacterDetail;