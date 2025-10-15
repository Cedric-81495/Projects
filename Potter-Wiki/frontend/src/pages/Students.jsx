import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar"; // Adjusted path if needed

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        console.log("API response:", res.data);

        const data = Array.isArray(res.data?.students)
          ? res.data.students
          : Array.isArray(res.data)
          ? res.data
          : [];

        setStudents(data);
      } catch (err) {
        console.error("Fetch error:", err);
        console.log("Failed to load students.");
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

  // 👇 Scroll to top of page when search yields no results
  useEffect(() => {
    if (filteredStudents.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchTerm, filteredStudents.length]);

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
        {!loading && filteredStudents.length === 0 && searchTerm.trim() !== "" ? (
          <div className="pt-6">
            <p className="text-center text-gray-500 text-sm sm:text-base">
              No results found for{" "}
              <span className="font-semibold">"{searchTerm}"</span>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {filteredStudents.map((student) => (
              <Link to={`/students/${student._id}`} key={student._id}>
                <Card
                  title={student.name}
                  description={`House: ${student.house || "Unknown"}`}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Students;