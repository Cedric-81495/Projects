import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import NotFound from "./NotFound";

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        const found = data.find((s) => s._id === id);
        setStudent(found || null);
        setError(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Failed to fetch student:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [id, user]);

  const currentIndex = students.findIndex((s) => s._id === id);
  const prevStudent = currentIndex > 0 ? students[currentIndex - 1] : null;
  const nextStudent = currentIndex < students.length - 1 ? students[currentIndex + 1] : null;

  if (loading) return <PageWrapper loading={true} />;
  if (error || !student)
    return (
      <PageWrapper>
        <NotFound message="Student not found" backPath="/students" />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <section className="min-h-screen pt-[180px] flex flex-col items-center justify-start px-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* 🧑‍🎓 Student Name */}
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#f5e6c8] mb-10 text-center">
            {student.name}
          </h2>

          {/* 🪄 Student Card */}
          <div className="bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-md hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-10">
            {/* Image */}
            <div className="w-full max-w-[180px] aspect-[3/4] flex items-center justify-center rounded-xl border-4 border-[#cfae6d] shadow-lg mx-auto md:mx-0 overflow-hidden bg-[#2c2c44]">
              {student.image ? (
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-300 text-sm text-center px-2">No Image Available</span>
              )}
            </div>

            {/* Info Grid */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-base sm:text-lg font-medium leading-relaxed">
                <p><span className="text-[#cfae6d] font-semibold">House:</span> {student.house || "N/A"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Gender:</span> {student.gender || "N/A"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Date of Birth:</span> {student.dateOfBirth || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Wizard:</span> {student.wizard ? "Yes" : "No"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Ancestry:</span> {student.ancestry || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Patronus:</span> {student.patronus || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Alive:</span> {student.alive ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

 {/* 🧭 Navigation Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10 w-full max-w-xl mx-auto px-4 font-serif">
            {/* ← Prev */}
            <button
              onClick={() => prevStudent && navigate(`/students/${prevStudent._id}`)}
              disabled={!prevStudent}
              className={`w-full px-6 py-3 rounded-md border border-amber-400 shadow-md transition-all duration-300 tracking-wide ${
                prevStudent
                  ? "bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 text-amber-200 hover:from-indigo-700 hover:to-indigo-800"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              ← Prev
            </button>

            {/* Next → */}
            <button
              onClick={() => nextStudent && navigate(`/students/${nextStudent._id}`)}
              disabled={!nextStudent}
              className={`w-full px-6 py-3 rounded-md border border-amber-400 shadow-md transition-all duration-300 tracking-wide ${
                nextStudent
                  ? "bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 text-amber-200 hover:from-indigo-700 hover:to-indigo-800"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next →
            </button>

            {/* ← Back */}
            <button
              onClick={() => navigate("/students")}
              className="w-full px-6 py-3 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-[#5c3b00] via-[#8b5e00] to-[#5c3b00] hover:from-[#7a4a00] hover:to-[#a86f00] shadow-md hover:shadow-lg transition-all duration-300 tracking-wide col-span-2 md:col-span-1"
            >
              ← Back
            </button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default StudentDetail;