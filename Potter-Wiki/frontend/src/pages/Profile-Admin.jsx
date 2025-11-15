import { useContext  } from "react";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";

const Profile = () => {
  const { user } = useContext(AuthContext);
  //const [newPassword, setNewPassword] = useState("");
  //const [status, setStatus] = useState("");

  if (!user) {
    return (
      <PageWrapper>
        <div className="flex items-center pt-10 justify-center min-h-screen bg-[#0b0b0b]">
          <p className="text-amber-200 text-lg font-serif">
            You must be logged in to view this page.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="min-h-screen pt-[20px] md:pt-[20px] px-4 flex flex-col items-center justify-start bg-[#0b0b0b] text-[#f5e6c8] font-serif">
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
        </div>
      </section>
    </PageWrapper>
  );
};

export default Profile;