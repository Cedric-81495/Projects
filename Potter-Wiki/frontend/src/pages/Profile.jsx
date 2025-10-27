import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthProvider";
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
      setStatus("✅ Password updated successfully.");
      setNewPassword("");
    } catch (err) {
      setStatus("❌ Failed to update password.");
      console.error(err);
    }
  };

  if (!user) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen bg-[#0b0b0b]">
          <p className="text-amber-200 text-lg font-serif">
            You must be logged in to view this page.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="min-h-screen pt-[160px] px-4 flex flex-col items-center justify-start bg-[#0b0b0b] text-[#f5e6c8] font-serif">
        <div className="w-full max-w-2xl space-y-10">
          {/* 🧙 Profile Info */}
          <div className="bg-[#1b1b2f] border border-[#cfae6d] shadow-lg hover:shadow-xl transition rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-[#f5e6c8]">
              Welcome, {user.firstname} {user.lastname}
            </h2>
            <div className="space-y-2 text-sm sm:text-base text-[#f5e6c8]">
              <p><span className="text-[#cfae6d] font-semibold">Email:</span> {user.email}</p>
              <p><span className="text-[#cfae6d] font-semibold">Role:</span> {user.role}</p>
              <p><span className="text-[#cfae6d] font-semibold">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* 🔐 Update Password */}
          {(user.role === "publicUser" || user.role === "adminUser" || user.role === "superUser") && (
            <div className="bg-[#1b1b2f] border border-[#cfae6d] shadow-lg hover:shadow-xl transition rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-center mb-6 text-[#f5e6c8]">
                Update Password
              </h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setStatus("");
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-[#cfae6d] bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] focus:outline-none focus:ring-2 focus:ring-[#cfae6d] text-sm sm:text-base"
                />
                <button
                  onClick={handlePasswordUpdate}
                  className="w-full bg-[#5163BC] hover:bg-[#3f4fa0] text-white py-2 rounded-lg transition font-semibold text-sm sm:text-base"
                >
                  Update Password
                </button>
                {status && (
                  <p className="text-sm text-center text-[#f5e6c8]">{status}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
};

export default Profile;