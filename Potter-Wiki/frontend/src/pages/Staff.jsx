// src/pages/Staff.jsx
import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext} from "../context/AuthProvider";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "./SearchBar";

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
    <PageWrapper loading={loading}>
      <section className="min-h-screen flex flex-col items-center justify-start pt-28 px-4">
        {/* 🔍 Search Bar */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-3xl">
            <SearchBar
              label="Search"
              placeholder="Type a staff name..."
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        </div>

        {/* 🧑‍🏫 Staff Results */}
        {!loading && filteredStaff.length === 0 && searchTerm.trim() !== "" ? (
          <p className="text-gray-400 mt-8 text-center">
            No results found for <span className="font-semibold">"{searchTerm}"</span>.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {filteredStaff.slice(0, visibleCount).map((member) => (
                <Link key={member._id} to={`/staff/${member._id}`}>
                  <Card
                    title={member.name}
                    description={`House: ${member.house || "Unknown"}`}
                  />
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredStaff.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold mb-5 border-lg shadow-md transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </PageWrapper>
  );
};

export default Staff;