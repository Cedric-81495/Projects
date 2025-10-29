import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import NotFound from "../components/NotFound";
import { formatDate } from "../utils/dateUtils";

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
        const res = await axios.get("/api/staff");
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
     <section className="min-h-screen pt-[130px] md:pt-[200px] flex flex-col items-center justify-start px-4 bg-white text-black">
        <div className="w-full max-w-5xl mx-auto">
          {/* 🪄 Staff Card */}
          <div className="bg-white border border-black text-black shadow-md hover:shadow-xl transition duration-300 
            p-6 sm:p-10 sm:gap-1 flex flex-col md:flex-row gap-10">
            {/* Image */}
            {staff.image ? (
              <img
               src={staff.image}
               alt={staff.name}
               className="w-full max-w-[180px] md:max-w-[200px] lg:max-w-[300px] aspect-[3/4] object-cover border border-black shadow-md mx-auto md:mx-0"
               />
               ) : (
                <div className="w-full max-w-[180px] md:max-w-[200px] lg:max-w-[300px] aspect-[3/4] flex items-center justify-center border border-black bg-gray-100 text-gray-500 shadow-md mx-auto md:mx-0">
                      No Image Available
                </div>
              )}

            {/* Text Content */}
            <div className="flex-1 flex flex-col px-5 justify-center gap-1 md:gap-10">
             <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center md:text-left mb-6">
                {staff.name}
              </h2>
               <div className="grid grid-cols-1 sm:gap-y-1 md:grid-cols-2  gap-y-4 text-base md:text-lg font-normal justify-item-center md:leading-relaxed">
                  <p><span className="font-semibold">Species:</span> {staff.species || "Unknown"}</p>
                  <p><span className="font-semibold">Gender:</span> {staff.gender || "Unknown"}</p>
                  <p><span className="font-semibold">House:</span> {staff.house || "Unknown"}</p>
                  <p><span className="font-semibold">Date of Birth:</span> {staff.dateOfBirth ? formatDate(staff.dateOfBirth) : "Unknown"}</p>
                  <p><span className="font-semibold">Wizard:</span> {staff.wizard ? "Yes" : "No"}</p>
                  <p><span className="font-semibold">Ancestry:</span> {staff.ancestry || "Unknown"}</p>
                  <p><span className="font-semibold">Eye Colour:</span> {staff.eyeColour || "Unknown"}</p>
                  <p><span className="font-semibold">Hair Colour:</span> {staff.hairColour || "Unknown"}</p>
                  <p><span className="font-semibold">Hogwarts Student:</span> {staff.hogwartsStudent ? "Yes" : "No"}</p>
                  <p><span className="font-semibold">Hogwarts Staff:</span> {staff.hogwartsStaff ? "Yes" : "No"}</p>
                  <p><span className="font-semibold">Actor:</span> {staff.actor || "Unknown"}</p>
                  <p><span className="font-semibold">Alive:</span> {staff.alive ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* 🧭 Navigation Buttons */}
          <div className="grid grid-cols-2 mb-6 md:grid-cols-3 gap-4 mt-10 w-full max-w-xl mx-auto px-4 font-serif">
            {/* ← Prev */}
            <button
              onClick={() => prevStaff && navigate(`/staff/${prevStaff._id}`)}
              disabled={!prevStaff}
              className={`w-full px-6 py-3 border-md border border-black shadow-sm transition-all duration-300 tracking-wide ${
                prevStaff
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-white text-gray-400 border-gray-300 cursor-not-allowed"
              }`}
            >
              ← Prev
            </button>

            {/* Next → */}
            <button
              onClick={() => nextStaff && navigate(`/staff/${nextStaff._id}`)}
              disabled={!nextStaff}
              className={`w-full px-6 py-3 border-md border border-black shadow-sm transition-all duration-300 tracking-wide ${
                nextStaff
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-white text-gray-400 border-gray-300 cursor-not-allowed"
              }`}
            >
              Next →
            </button>

            {/* ← Back */}
            <button
              onClick={() => navigate("/staff")}
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

export default StaffDetail;