import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "../pages/SearchBar";

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/characters", {
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

  return (
    <PageWrapper loading={loading}>
      <div className="p-2">
        {/* ✅ Reusable SearchBar component */}
 
          <SearchBar
            label="Search"
            placeholder="Type a character name..."
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />


        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 hover:shadow-xl transition-shadow duration-200">
          {characters
            .filter((char) =>
              char.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((char) => (
              <Link key={char._id} to={`/characters/${char._id}`}>
                <Card
                  key={char._id}
                  title={char.name}
                  description={char.description}
                />
              </Link>
            ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Characters;
