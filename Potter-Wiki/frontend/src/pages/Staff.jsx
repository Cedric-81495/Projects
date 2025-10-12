// frontend/src/pages/Staff.jsx
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import SearchBar from "../pages/SearchBar";
import { Link } from "react-router-dom";


const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error] = useState(null);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/staff`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        console.log("API response:", res.data);

        const data = Array.isArray(res.data?.staff)
          ? res.data.staff
          : Array.isArray(res.data)
          ? res.data
          : [];

        setStaff(data);
      } catch (err) {
        console.error("Fetch error:", err);
        //setError("Failed to load staff.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [user]);

  return (
    <PageWrapper loading={loading}>
      <div className="p-2">
        {/* Search Bar */}
         <SearchBar
            label="Search"
            placeholder="Type a staff name..."
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />
        {/* Error Message */}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Staff Cards */}
        {staff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff
              .filter((member) =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((member) => (
                <Link to={`/staff/${member._id}`} key={member._id}>
                  <Card
                    title={member.name}
                    description={`House: ${member.house || "Unknown"}`}
                  />
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">No staff found.</p>
        )}
      </div>
    </PageWrapper>
  );
};

export default Staff;