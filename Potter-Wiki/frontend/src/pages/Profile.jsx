// frontend/src/pages/Profile.jsx
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import axios from "axios";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  const handlePasswordUpdate = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/update-password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setStatus("Password updated successfully.");
      setNewPassword("");
    } catch (err) {
      setStatus("Failed to update password.");
      console.error(err);
    }
  };

  if (!user) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-amber-200 text-lg font-serif">
            You must be logged in to view this page.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pt-24 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Profile Info */}
          <div className="bg-[#6b4ea0] text-white shadow-lg rounded-xl p-6 border border-amber-700">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-200 mb-4 text-center">
              Welcome, {user.firstname} {user.lastname}
            </h2>
            <div className="space-y-2 text-sm sm:text-base text-amber-100">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Update Password */}
          {(user.role === "publicUser" || user.role === "adminUser" || user.role === "superUser") && (
            <div className="bg-[#6b4ea0] text-white shadow-lg rounded-xl p-6 border border-amber-700">
              <h3 className="text-xl sm:text-2xl font-semibold font-serif text-amber-200 mb-4 text-center">
                Update Password
              </h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-amber-600 bg-[#3a2b5a] text-white placeholder:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handlePasswordUpdate}
                  className="w-full px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg transition"
                >
                  Update Password
                </button>
                {status && (
                  <p className="text-sm text-amber-100 text-center">{status}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Profile;