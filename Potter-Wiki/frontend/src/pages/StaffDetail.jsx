import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [staff, setStaff] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/staff", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setStaffList(res.data);

        const found = res.data.find((s) => s._id === id);
        setStaff(found || null);
      } catch (err) {
        console.error("Failed to fetch staff list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id, user]);

  const currentIndex = staffList.findIndex((s) => s._id === id);
  const prevStaff = currentIndex > 0 ? staffList[currentIndex - 1] : null;
  const nextStaff = currentIndex < staffList.length - 1 ? staffList[currentIndex + 1] : null;

  return (
    <PageWrapper loading={loading}>
      {staff ? (
        <>
          <div className="flex justify-center w-full mt-10">
            <div className="mt-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-6">
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md w-full flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Image */}
                {staff?.image ? (
                  <img
                    src={staff.image}
                    alt={staff?.name}
                    className="w-48 h-[300px] object-cover rounded-lg border border-gray-400 mx-auto md:mx-0"
                  />
                ) : (
                  <div className="w-48 h-[300px] flex items-center justify-center rounded-lg border border-gray-400 bg-gray-100 text-gray-500 mx-auto md:mx-0">
                    No Image
                  </div>
                )}

                {/* Details container */}
                <div className="flex-1 flex flex-col">
                  {/* Name block with fixed height */}
                  <div className="mb-4 min-h-[48px] flex items-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900">
                      {staff?.name}
                    </h2>
                  </div>

                  {/* Staff details */}
                  <div className="space-y-2 text-gray-700 text-base">
                    <p>
                      <strong>Role:</strong> {staff?.role || staff?.position}
                    </p>
                    <p>
                      <strong>House:</strong> {staff?.house || "—"}
                    </p>
                    <p>
                      <strong>Specialty:</strong> {staff?.specialty || "—"}
                    </p>
                    <p>
                      <strong>Actor:</strong> {staff?.actor || "—"}
                    </p>
                    <p>
                      <strong>Alive:</strong> {staff?.alive ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => navigate("/staff")}
              className="px-5 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              ← Back
            </button>

            <button
              onClick={() => prevStaff && navigate(`/staff/${prevStaff._id}`)}
              disabled={!prevStaff}
              className={`px-4 py-2 rounded ${
                prevStaff
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              ← Prev
            </button>

            <button
              onClick={() => nextStaff && navigate(`/staff/${nextStaff._id}`)}
              disabled={!nextStaff}
              className={`px-4 py-2 rounded ${
                nextStaff
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-600 pt-24">Staff member not found</p>
      )}
    </PageWrapper>
  );
};

export default StaffDetail;
