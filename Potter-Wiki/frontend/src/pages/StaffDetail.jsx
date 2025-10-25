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
      <section className="min-h-screen pt-[160px] flex flex-col items-center justify-start px-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* 🧑‍🏫 Staff Name */}
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#f5e6c8] mb-10 text-center">
            {staff.name}
          </h2>

          {/* 🪄 Staff Card */}
          <div className="bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-md hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-10">
            {/* Image */}
            <div className="w-full max-w-[180px] aspect-[3/4] flex items-center justify-center rounded-xl border-4 border-[#cfae6d] shadow-lg mx-auto md:mx-0 overflow-hidden bg-[#2c2c44]">
              {staff.image ? (
                <img
                  src={staff.image}
                  alt={staff.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-300 text-sm text-center px-2">No Image Available</span>
              )}
            </div>

            {/* Info Grid */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-base sm:text-lg font-medium leading-relaxed">
                <p><span className="text-[#cfae6d] font-semibold">House:</span> {staff.house || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Specialty:</span> {staff.specialty || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Actor:</span> {staff.actor || "Unknown"}</p>
                <p><span className="text-[#cfae6d] font-semibold">Alive:</span> {staff.alive ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* 🧭 Navigation Buttons */}
          <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
            <button
              onClick={() => navigate("/staff")}
              className="px-6 py-2 bg-[#cfae6d] hover:bg-[#e0c98c] text-black font-semibold rounded-lg shadow-md transition"
            >
              ← Back
            </button>

            <button
              onClick={() => prevStaff && navigate(`/staff/${prevStaff._id}`)}
              disabled={!prevStaff}
              className={`px-6 py-2 font-semibold rounded-lg shadow-md transition ${
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
              className={`px-6 py-2 font-semibold rounded-lg shadow-md transition ${
                nextStaff
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default StaffDetail;