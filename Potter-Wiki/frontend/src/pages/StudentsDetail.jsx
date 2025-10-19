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
  const nextStudent =
    currentIndex < students.length - 1 ? students[currentIndex + 1] : null;

  if (loading) return <PageWrapper loading={true} />;
  if (error || !student)
    return (
      <PageWrapper>
        <NotFound message="Student not found" backPath="/students" />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="min-h-screen design-div flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* 🧑‍🎓 Student Card */}
        <div className="bg-[#6b4ea0] text-white shadow-2xl rounded-2xl border border-amber-700 p-8 sm:p-10 w-full max-w-5xl flex flex-col md:flex-row gap-10">
          {/* 🪄 Student Image */}
          {student.image ? (
            <img
              src={student.image}
              alt={student.name}
              className="w-64 h-80 object-cover rounded-xl border-4 border-amber-700 shadow-lg mx-auto md:mx-0"
            />
          ) : (
            <div className="w-64 h-80 flex items-center justify-center rounded-xl border-4 border-amber-700 bg-[#3a2b5a] text-gray-300 shadow-lg mx-auto md:mx-0">
              No Image Available
            </div>
          )}

          {/* 🪄 Student Info */}
          <div className="flex-1 flex flex-col items-start justify-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-amber-200 font-serif mb-6 text-center md:text-left">
              {student.name}
            </h2>

            <div className="space-y-2 text-base sm:text-lg font-medium leading-relaxed">
              <p>
                <span className="text-amber-300 font-semibold">House:</span>{" "}
                {student.house || "N/A"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Gender:</span>{" "}
                {student.gender || "N/A"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Date of Birth:</span>{" "}
                {student.dateOfBirth || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Wizard:</span>{" "}
                {student.wizard ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Ancestry:</span>{" "}
                {student.ancestry || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Patronus:</span>{" "}
                {student.patronus || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Alive:</span>{" "}
                {student.alive ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* 🪄 Navigation Buttons */}
        <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
          <button
            onClick={() => navigate("/students")}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow"
          >
            ← Back
          </button>

          <button
            onClick={() => prevStudent && navigate(`/students/${prevStudent._id}`)}
            disabled={!prevStudent}
            className={`px-5 py-2 rounded-lg shadow ${
              prevStudent
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>

          <button
            onClick={() => nextStudent && navigate(`/students/${nextStudent._id}`)}
            disabled={!nextStudent}
            className={`px-5 py-2 rounded-lg shadow ${
              nextStudent
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StudentDetail;
