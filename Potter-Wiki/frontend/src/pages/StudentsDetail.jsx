import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import PageWrapper from "../components/PageWrapper";
import NotFound from "./NotFound";    


const StudentsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, allRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/students/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/students`)
        ]);
        setStudent(studentRes.data);
        setAllStudents(Array.isArray(allRes.data?.students) ? allRes.data.students : []);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch student or list:", err);
        setError(true); // ✅ handle API failure
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const currentIndex = Array.isArray(allStudents)
  ? allStudents.findIndex((s) => s._id === id)
  : -1;
  const prevStudent = currentIndex > 0 ? allStudents[currentIndex - 1]._id : null;
  const nextStudent = currentIndex < allStudents.length - 1 ? allStudents[currentIndex + 1]._id : null;

 if (loading) {
      return <PageWrapper loading={true} />;
    }

    if (error || !student) {
      return (
        <PageWrapper loading={false}>
          <NotFound message="Student not found" backPath="/student" />
        </PageWrapper>
      );
    }
    return (
    <PageWrapper loading={false}>
        <div className="flex flex-col items-center mt-10">
        <div className="bg-gray-50 border mt-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-4xl px-4 py-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left: Image */}
            <div className="flex justify-center md:justify-start md:w-1/3">
              {student.image ? (
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-64 h-64 object-cover rounded-lg border border-gray-400"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center rounded-lg border border-gray-400 bg-gray-100 text-gray-500">
                  No Available Image
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-amber-900 mb-4">{student.name}</h2>
              <p className="text-gray-700 mb-2"><strong>House:</strong> {student.house}</p>
              <p className="text-gray-700 mb-2"><strong>Year:</strong> {student.year}</p>
              <p className="text-gray-700"><strong>Blood Status:</strong> {student.ancestry}</p>
              <p className="text-gray-700"><strong>Gender:</strong> {student.gender}</p>
              <p className="text-gray-700"><strong>House:</strong> {student.house}</p>
              <p className="text-gray-700 mb-2"><strong>Wizard:</strong> {student.wizard ? "Yes" : "No"}</p>
              <p className="text-gray-700"><strong>Species:</strong> {student.species}</p>
              <p className="text-gray-700 mb-2">Date of Birth: {student.dateOfBirth}</p>
        
              
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-4 mt-[48px]">
          <button
            onClick={() => navigate("/spells")}
            className="px-4 py-2 text-sm sm:text-base bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            ← Back
          </button>

          {prevStudent && (
            <button
              onClick={() => navigate(`/students/${prevStudent}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              ← Prev
            </button>
          )}

          {nextStudent && (
            <button
              onClick={() => navigate(`/students/${nextStudent}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Next →
            </button>
          )}
        </div>
        </div>
    </PageWrapper>
  );
};

export default StudentsDetail;