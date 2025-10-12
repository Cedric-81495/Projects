// frontend/pages/Profile.jsx
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
          <p className="text-gray-600 text-lg">You must be logged in to view this page.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pt-24 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Profile Info */}
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {user.firstname} {user.lastname}</h2>
            <div className="space-y-2 text-gray-700 text-sm">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Update Password */}
          {(user.role === "publicUser" || user.role === "adminUser" || user.role === "superUser") && (
            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-300">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Update Password</h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
                />
                <button
                  onClick={handlePasswordUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                >
                  Update Password
                </button>
                {status && <p className="text-sm text-gray-600">{status}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Profile;