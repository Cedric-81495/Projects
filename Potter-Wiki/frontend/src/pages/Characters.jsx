import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar"; // Adjust path if needed

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/characters`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setCharacters(res.data);
        console.log("DOB:", typeof res.dateOfBirth);
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

  // 👇 Scroll to top of page when search yields no results
  useEffect(() => {
    if (filteredCharacters.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredCharacters.length]);

  return (
    <PageWrapper loading={loading}>
      <div className="p-2">
        {/* Search Bar */}
        <SearchBar
          label="Search"
          placeholder="Type a character name..."
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Results */}
        {filteredCharacters.length === 0 ? (
          <div className="pt-6">
            <p className="text-center text-gray-500 text-sm sm:text-base">
              
              <span className="font-semibold">"{searchTerm}"</span>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 hover:shadow-xl transition-shadow duration-200">
            {filteredCharacters.map((char) => (
              <Link key={char._id} to={`/characters/${char._id}`}>
                <Card
                  title={char.name}
                  description={char.description}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Characters;