import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
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
        <section className="min-h-screen pt-[130px] md:pt-[290px] flex flex-col items-center justify-start px-4 bg-white text-black">
          <div className="w-full max-w-6xl mx-auto">
            {/* 🪄 Student Card */}
            <div className="bg-white border border-black text-black shadow-md hover:shadow-xl transition duration-300 border-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-10">
              {/* Image */}
                  {student.image ? (
                    <img
                      src={student.image}
                      alt={student.name}
                      className="w-full max-w-[180px] aspect-[3/4] object-cover border border-black shadow-md mx-auto md:mx-0"
                    />
                  ) : (
                    <div className="w-full max-w-[180px] aspect-[3/4] flex items-center justify-center border border-black bg-gray-100 text-gray-500 shadow-md mx-auto md:mx-0">
                      No Image Available
                    </div>
                  )}
            
               
              {/* Info Grid */}
              <div className="flex-1 flex flex-col justify-center">
                {/* 🧑‍🎓 Student Name */}
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center md:text-left mb-6">
                {student.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base md:text-lg font-normal justify-item-center leading-relaxed md:leading-relaxed">
                  <p><span className="font-semibold text-black">House:</span> {student.house || "N/A"}</p>
                  <p><span className="font-semibold text-black">Gender:</span> {student.gender || "N/A"}</p>
                  <p><span className="font-semibold text-black">Date of Birth:</span> {student.dateOfBirth || "Unknown"}</p>
                  <p><span className="font-semibold text-black">Wizard:</span> {student.wizard ? "Yes" : "No"}</p>
                  <p><span className="font-semibold text-black">Ancestry:</span> {student.ancestry || "Unknown"}</p>
                  <p><span className="font-semibold text-black">Patronus:</span> {student.patronus || "Unknown"}</p>
                  <p><span className="font-semibold text-black">Alive:</span> {student.alive ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            {/* 🧭 Navigation Buttons */}
            <div className="grid grid-cols-2 mb-6 md:grid-cols-3 gap-4 mt-10 w-full max-w-xl mx-auto px-4 font-serif">
              {/* ← Prev */}
              <button
                onClick={() => prevStudent && navigate(`/students/${prevStudent._id}`)}
                disabled={!prevStudent}
                className={`w-full px-6 py-3 border-md border border-black shadow-md transition-all duration-300 tracking-wide ${
                  prevStudent
                  ? "text-black hover:bg-gray-200"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                ← Prev
              </button>

              {/* Next → */}
              <button
                onClick={() => nextStudent && navigate(`/students/${nextStudent._id}`)}
                disabled={!nextStudent}
                className={`w-full px-6 py-3 border-md border border-black shadow-md transition-all duration-300 tracking-wide ${
                  nextStudent
                  ? "text-black hover:bg-gray-200"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next →
              </button>

              {/* ← Back */}
              <button
                onClick={() => navigate("/students")}
                className="w-full px-6 py-3 border border-black text-white bg-black hover:bg-white hover:text-black shadow-md hover:shadow-lg transition-all duration-300 tracking-wide col-span-2 md:col-span-1"
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