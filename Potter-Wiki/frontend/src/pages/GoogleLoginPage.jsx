// frontend/src/pages/GoogleLoginPage.jsx
import { GoogleLogin } from "@react-oauth/google";
import api from "../lib/axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import bgImage from "../assets/aesthetic-bg.jpg";

const GoogleLoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) {
      toast.error("Missing Google token. Please try again.");
      return;
    }

    toast.loading("Signing in with Google...");

    try {
      // ✅ Always POST — sending token in request body
      const res = await api.post("/auth/google-auth", { token });


      // ✅ Save auth data in your context/localStorage
      login(res.data);

      toast.dismiss();
      toast.success(`Welcome back, ${res.data.user.firstname || "User"}!`);

      // ✅ Navigate to protected route
      navigate("/profile");
    } catch (err) {
      toast.dismiss();

      console.error("❌ Google login error:", err.response?.data || err.message || err);
      const message =
        err.response?.data?.message || "Google login failed. Please try again.";
      toast.error(message);
    }
  };

  

  const handleGoogleError = () => {
    toast.error("Google Sign-In failed. Please try again.");
  };
  return (
    
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
      <div className="relative z-10 w-full max-w-md bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-lg rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-serif font-bold mb-6">Sign in with Google</h2>
        <p className="text-sm mb-8 text-gray-300">
          Use your Gmail account to securely sign in.
        </p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Don’t have an account?{" "}
          <a href="/register" className="text-[#cfae6d] hover:underline">
            Register
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

export default GoogleLoginPage;
