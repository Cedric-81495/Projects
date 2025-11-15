// frontend/src/pages/GoogleRegisterPage.jsx
import { GoogleLogin } from "@react-oauth/google";
//import { jwtDecode } from "jwt-decode";
import api from "../lib/axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import bgImage from "../assets/aesthetic-bg.jpg";

const GoogleRegisterPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleGoogleRegister = async (credentialResponse) => {
    try {
      toast.loading("Registering with Google...");

      const res = await api.post(`/auth/google-auth`, {
        token: credentialResponse.credential,
       
      });
      login(res.data);
      toast.dismiss();
      toast.success(`Welcome, ${res.data.user.firstname}!`);
      navigate("/profile");
    } catch (err) {
      console.error("Google registration error:", err.response?.data || err.message || err);
      toast.dismiss();
      toast.error("Registration failed. Try again.");
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
      <div className="relative z-10 w-full max-w-md bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-lg rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-serif font-bold mb-6">Register with Google</h2>
        <p className="text-sm mb-8 text-gray-300">
          Use your Gmail account to create your wizarding profile.
        </p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleRegister}
            onError={() => toast.error("Google registration failed")}
          />
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-[#cfae6d] hover:underline">
            Log in
          </a>
        </p>
        <p className="mt-6 text-xs text-gray-400">
          <Link 
                to="/" 
                className="text-[#cfae6d] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default GoogleRegisterPage;
