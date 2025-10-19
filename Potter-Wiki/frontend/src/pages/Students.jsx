import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24); 
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        const data = Array.isArray(res.data?.students)
          ? res.data.students
          : Array.isArray(res.data)
          ? res.data
          : [];

        setStudents(data);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (filteredStudents.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredStudents.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 36);
  };

  return (
    <PageWrapper loading={loading}>
      <div className="p-2 design-div min-h-screen">
        {/* 🔍 Search Bar */}
        <SearchBar
          label="Search"
          placeholder="Type a student name..."
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* 🧭 Results */}
        {!loading && filteredStudents.length === 0 && searchTerm.trim() !== "" ? (
          <div className="pt-6">
            <p className="text-center text-gray-400 text-sm sm:text-base">
              No results found for{" "}
              <span className="font-semibold text-amber-400">"{searchTerm}"</span>.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {filteredStudents.slice(0, visibleCount).map((student) => (
                <Link to={`/students/${student._id}`} key={student._id}>
                  <Card
                    title={student.name}
                    description={`House: ${student.house || "Unknown"}`}
                  />
                </Link>
              ))}
            </div>

            {/* 🪄 Load More Button */}
            {visibleCount < filteredStudents.length && (
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

export default Students;
