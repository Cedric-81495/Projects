import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";
import NotFound from "./NotFound";

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24); 
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        const data = Array.isArray(res.data?.staff)
          ? res.data.staff
          : Array.isArray(res.data)
          ? res.data
          : [];

        setStaff(data);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch staff list:", err);
        setError(true);
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

  useEffect(() => {
    if (filteredStaff.length === 0 && searchTerm.trim() !== "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredStaff.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 36);
  };

  if (loading) {
    return <PageWrapper loading={true} />;
  }

  if (error || !staff) {
    return (
      <PageWrapper loading={false}>
        <NotFound message="Staff not found" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper loading={false}>
      <div className="p-2">
        {/* Search Bar */}
        <SearchBar
          label="Search"
          placeholder="Type a staff name..."
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Results */}
        {!loading && filteredStaff.length === 0 && searchTerm.trim() !== "" ? (
          <div className="mt-4">
            <p className="text-center text-gray-500 text-sm sm:text-base">
              No results found for{" "}
              <span className="font-semibold">"{searchTerm}"</span>.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {filteredStaff.slice(0, visibleCount).map((member) => (
                <Link to={`/staff/${member._id}`} key={member._id}>
                  <Card
                    title={member.name}
                    description={`House: ${member.house || "Unknown"}`}
                  />
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredStaff.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shadow-md transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default Staff;