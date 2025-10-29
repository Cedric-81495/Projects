import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import NotFound from "../components/NotFound";
import { formatDate } from "../utils/dateUtils";

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
        const res = await axios.get("/api/students");
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
        <section className="min-h-screen flex flex-col items-center justify-start px-4 bg-white text-black pt-[130px] md:pt-[200px]">
          <div className="w-full max-w-5xl mx-auto">
            <div className="bg-white border border-black text-black shadow-md hover:shadow-xl transition duration-300 border-2xl flex flex-col gap-10 md:flex-row p-6 sm:p-10">
              {student.image ? (
                <img src={student.image} alt={student.name} className="w-full aspect-[3/4] object-cover border border-black shadow-md mx-auto md:mx-0 max-w-[180px] md:max-w-[200px] lg:max-w-[300px]" />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center border border-black bg-gray-100 text-gray-500 shadow-md mx-auto md:mx-0 max-w-[180px] md:max-w-[200px] lg:max-w-[300px]">No Image Available</div>
              )}
              <div className="flex-1 flex flex-col px-5 justify-center gap-1 md:gap-10">
                  <h2 className="font-serif font-bold mb-6 text-center md:text-left text-3xl sm:text-4xl">
                        {student.name}
                  </h2>
                 <div className="grid grid-cols-1  md:grid-cols-2 gap-x-8 gap-y-4 text-base md:text-lg font-normal justify-item-center md:leading-relaxed">
                 <p><span className="font-semibold">Species:</span> {student.species || "Unknown"}</p>
                             <p><span className="font-semibold">Gender:</span> {student.gender || "Unknown"}</p>
                             <p><span className="font-semibold">House:</span> {student.house || "Unknown"}</p>
                             <p><span className="font-semibold">Date of Birth:</span> {student.dateOfBirth ? formatDate(student.dateOfBirth) : "Unknown"}</p>
                             <p><span className="font-semibold">Wizard:</span> {student.wizard ? "Yes" : "No"}</p>
                             <p><span className="font-semibold">Ancestry:</span> {student.ancestry || "Unknown"}</p>
                             <p><span className="font-semibold">Eye Colour:</span> {student.eyeColour || "Unknown"}</p>
                             <p><span className="font-semibold">Hair Colour:</span> {student.hairColour || "Unknown"}</p>
                             <p><span className="font-semibold">Hogwarts Student:</span> {student.hogwartsStudent ? "Yes" : "No"}</p>
                             <p><span className="font-semibold">Hogwarts Staff:</span> {student.hogwartsStaff ? "Yes" : "No"}</p>
                             <p><span className="font-semibold">Actor:</span> {student.actor || "Unknown"}</p>
                             <p><span className="font-semibold">Alive:</span> {student.alive ? "Yes" : "No"}</p>
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