import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "../pages/SearchBar";

const Spells = () => {
  const [spells, setSpells] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpells = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/public/spells`, {
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

  return (
    <PageWrapper loading={loading}>
      <div className="p-2">
         <SearchBar
            label="Search"
            placeholder="Type a character name..."
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />
        {/* Spells Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spells
                .filter((spell) =>
                  spell.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((spell) => (
                  <Link key={spell._id} to={`/spells/${spell._id}`}>
                    <Card title={spell.name} description={spell.effect} />
                  </Link>
                ))}
          </div>
        </div>
      
    </PageWrapper>
  );
};

export default Spells;