import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";

const CharacterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

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
        console.log("API Response:", res.data);
      } catch (err) {
        console.error("Failed to fetch characters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [id, user]);


  // Find index of current character for prev/next navigation
  const currentIndex = characters.findIndex((c) => c._id === id);
  const prevCharacter = currentIndex > 0 ? characters[currentIndex - 1] : null;
  const nextCharacter =
    currentIndex < characters.length - 1 ? characters[currentIndex + 1] : null;

return (
  <PageWrapper loading={loading}>
<div className="bg-gray-50 min-h-screen flex flex-col items-center px-4">
  {character ? (
    <>
      {/* Character detail card */}
     <div className="bg-white border mt-[90px] border-gray-300 p-6 rounded-lg shadow-md w-full max-w-3xl flex flex-col md:flex-row gap-8">
        
        {/* Image */}
        {character.image ? (
          <img
            src={character.image}
            alt={character.name}
            className="w-64 h-80 object-cover rounded-lg border border-gray-400 mx-auto md:mx-0"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center rounded-lg border border-gray-400 bg-gray-100 text-gray-500 mx-auto md:mx-0">
            No Available Image
          </div>
        )}

        {/* Right side (name + details) */}
       
          <div className="flex-1 flex flex-col items-start text-left px-2 sm:px-6">
            
            {/* Name */}
            <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-6">
              {character.name}
            </h2>
            
            {/* Details */}
            <div className="space-y-2 text-gray-700 text-base w-full">
              <p><strong>Species:</strong> {character.species}</p>
              <p><strong>Gender:</strong> {character.gender}</p>
              <p><strong>House:</strong> {character.house || "N/A"}</p>
              <p><strong>Date of Birth:</strong> {character.dateOfBirth || "N/A"}</p>
              <p><strong>Wizard:</strong> {character.wizard ? "Yes" : "No"}</p>
              <p><strong>Ancestry:</strong> {character.ancestry}</p>
              <p><strong>Eye Colour:</strong> {character.eyeColour}</p>
              <p><strong>Hair Colour:</strong> {character.hairColour}</p>
              <p><strong>Hogwarts Student:</strong> {character.hogwartsStudent ? "Yes" : "No"}</p>
              <p><strong>Hogwarts Staff:</strong> {character.hogwartsStaff ? "Yes" : "No"}</p>
              <p><strong>Actor:</strong> {character.actor}</p>
              <p><strong>Alive:</strong> {character.alive ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-center items-center gap-4 mt-8 flex-wrap">
        <button
          onClick={() => navigate("/characters")}
          className="px-5 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          ← Back
        </button>

        {prevCharacter && (
          <button
            onClick={() => navigate(`/characters/${prevCharacter._id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            ← Prev
          </button>
        )}

        {nextCharacter && (
          <button
            onClick={() => navigate(`/characters/${nextCharacter._id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Next →
          </button>
        )}
      </div>
    </>
  ) : (
    <p className="text-center text-gray-600">Character not found</p>
  )}
</div>
  </PageWrapper>
  );
};

export default CharacterDetail;
