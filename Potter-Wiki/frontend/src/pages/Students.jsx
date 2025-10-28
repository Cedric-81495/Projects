import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("/api/students");
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
    if (filteredStudents.length === 0 && searchTerm.trim() !== "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredStudents.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 36);
  };

  return (
    <PageWrapper loading={loading}>
      <section className="min-h-screen flex flex-col items-center justify-start pt-28 px-4">
        {/* 🔍 Search Bar */}
       <div className="w-full flex justify-center">
          <div className="w-full max-w-3xl">
               <SearchBar
                 label="Search"
                 placeholder="Type a student name..."
                 searchTerm={searchTerm}
                 setSearchTerm={setSearchTerm}
               />
             </div>
           </div>

        {/*  Student Results */}
        {!loading && filteredStudents.length === 0 && searchTerm.trim() !== "" ? (
          <p className="text-gray-400 mt-8 text-center">
            No results found for <span className="font-semibold">"{searchTerm}"</span>.
          </p>
        ) : (
          <>
            {/*  Student Cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl ${
                 visibleCount >= filteredStudents.length ? "mb-6" : ""
                }`}
              >
              {filteredStudents.slice(0, visibleCount).map((student) => (
                <Link key={student._id} to={`/students/${student._id}`}>
                  <Card
                    title={student.name}
                    description={`House: ${student.house || "Unknown"}`}
                  />
                </Link>
              ))}
            </div>

            {/* 🪄 Load More Button */}
            {visibleCount < filteredStudents.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white mb-5 font-semibold border-lg shadow-md transition"
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

export default Students;