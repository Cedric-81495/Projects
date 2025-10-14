import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        console.log("API response:", res.data);

        const data = Array.isArray(res.data?.staff)
          ? res.data.staff
          : Array.isArray(res.data)
          ? res.data
          : [];

        setStaff(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [user]);

  const filteredStaff = staff
    .filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // 👇 Scroll to top of page when search yields no results
  useEffect(() => {
    if (filteredStaff.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm,  filteredStaff.length]);

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
        {!loading && filteredStaff.length === 0 && searchTerm.trim() !== "" ? (
          <div ref={resultsRef} className="mt-4">
            <p className="text-center text-gray-500 text-sm sm:text-base">
              No results found for{" "}
              <span className="font-semibold">"{searchTerm}"</span>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {filteredStaff.map((member) => (
              <Link to={`/staff/${member._id}`} key={member._id}>
                <Card
                  title={member.name}
                  description={`House: ${member.house || "Unknown"}`}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Staff;