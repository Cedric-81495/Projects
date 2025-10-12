// frotend/src/pages/Students.jsx
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import { Link } from "react-router-dom";
import SearchBar from "../pages/SearchBar";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error] = useState(null);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/public/students`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        console.log("API response:", res.data);

        // Ensure students is always an array
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

  return (
    <PageWrapper loading={loading}>
      <div className="p-2">
        {/* Search Bar */}
        <SearchBar
            label="Search"
            placeholder="Type a student name..."
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />

        {/* Error Message */}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Student Cards */}
        {students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {students
              .filter((student) =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((student) => (
                <Link to={`/students/${student._id}`} key={student._id}>
                  <Card
                    title={student.name}
                    description={`House: ${student.house || "Unknown"}`}
                  />
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">No students found.</p>
        )}
      </div>
    </PageWrapper>
  );
};

export default Students;