import { Link } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";

const Spells = () => {
  const [spells, setSpells] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef(null); // 👈 Scroll target

  useEffect(() => {
    const fetchSpells = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/spells`, {
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

  const filteredSpells = spells
    .filter((spell) =>
      spell.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

useEffect(() => {
    if (filteredSpells.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm,  filteredSpells.length]);


  return (
    <PageWrapper loading={loading}>
      <div className="p-2">
        <SearchBar
          label="Search"
          placeholder="Type a spell name..."
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div ref={resultsRef} className="mt-4">
          {filteredSpells.length === 0 ? (
            <div className="pt-6">
              <p className="text-center text-gray-500 text-sm sm:text-base">
                No results found for{" "}
                <span className="font-semibold">"{searchTerm}"</span>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredSpells.map((spell) => (
                <Link key={spell._id} to={`/spells/${spell._id}`}>
                  <Card title={spell.name} description={spell.effect} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Spells;