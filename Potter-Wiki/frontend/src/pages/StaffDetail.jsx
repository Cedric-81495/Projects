import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import NotFound from "./NotFound";

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [staffList, setStaffList] = useState([]);
  const [staff, setStaff] = useState(null);
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

        setStaffList(data);
        const found = data.find((s) => s._id === id);
        setStaff(found || null);
        setError(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [id, user]);

  const currentIndex = staffList.findIndex((s) => s._id === id);
  const prevStaff = currentIndex > 0 ? staffList[currentIndex - 1] : null;
  const nextStaff = currentIndex < staffList.length - 1 ? staffList[currentIndex + 1] : null;

  if (loading) return <PageWrapper loading={true} />;
  if (error || !staff)
    return (
      <PageWrapper>
        <NotFound message="Staff member not found" backPath="/staff" />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* 🧑‍🏫 Staff Card */}
        <div className="bg-[#6b4ea0] text-white shadow-2xl rounded-2xl border border-amber-700 p-8 sm:p-10 w-full max-w-5xl flex flex-col md:flex-row gap-10">
          {staff.image ? (
            <img
              src={staff.image}
              alt={staff.name}
              className="w-64 h-80 object-cover rounded-xl border-4 border-amber-700 shadow-lg mx-auto md:mx-0"
            />
          ) : (
            <div className="w-64 h-80 flex items-center justify-center rounded-xl border-4 border-amber-700 bg-[#3a2b5a] text-gray-300 shadow-lg mx-auto md:mx-0">
              No Image Available
            </div>
          )}

          <div className="flex-1 flex flex-col items-start justify-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-amber-200 font-serif mb-6 text-center md:text-left">
              {staff.name}
            </h2>

            <div className="space-y-2 text-base sm:text-lg font-medium leading-relaxed">
              <p>
                <span className="text-amber-300 font-semibold">House:</span>{" "}
                {staff.house || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Specialty:</span>{" "}
                {staff.specialty || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Actor:</span>{" "}
                {staff.actor || "Unknown"}
              </p>
              <p>
                <span className="text-amber-300 font-semibold">Alive:</span>{" "}
                {staff.alive ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* 🧭 Navigation Buttons */}
        <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
          <button
            onClick={() => navigate("/staff")}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow"
          >
            ← Back
          </button>

          <button
            onClick={() => prevStaff && navigate(`/staff/${prevStaff._id}`)}
            disabled={!prevStaff}
            className={`px-5 py-2 rounded-lg shadow ${
              prevStaff
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>

          <button
            onClick={() => nextStaff && navigate(`/staff/${nextStaff._id}`)}
            disabled={!nextStaff}
            className={`px-5 py-2 rounded-lg shadow ${
              nextStaff
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

export default StaffDetail;