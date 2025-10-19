import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import bgImage from "../assets/voyeglq-bg.jpg"; // ✅ Same background as Register

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password,
      });

      login(res.data);
      setSuccessMessage("Login successful!");
      setErrorMessage("");

      const role = res.data?.role;
      if (role === "superUser" || role === "adminUser") {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setSuccessMessage("");
      if (err.response?.status === 401) {
        setErrorMessage("Incorrect password.");
      } else if (err.response?.status === 404) {
        setErrorMessage("Account not found. Please check your email.");
      } else if (err.response?.status === 400) {
        setErrorMessage("Invalid credentials. Please try again.");
      } else {
        setErrorMessage("Something went wrong. Please try again later.");
      }
    }
  };

  const handleGoBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(from);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 py-12 sm:py-20 bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* 🧥 Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

      {/* 🔙 Back Button */}
      <button
        onClick={handleGoBack}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-amber-100 text-sm sm:text-base font-medium hover:underline z-10"
      >
        ← Back
      </button>

      {/* 🧾 Form Container */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 rounded-2xl shadow-2xl bg-[#2e1e4d] border-4 border-amber-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-amber-200 font-serif">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            placeholder="Email"
            className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#3a2b5a] text-white placeholder:text-amber-100 text-sm sm:text-base"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              placeholder="Password"
              className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#3a2b5a] text-white placeholder:text-amber-100 text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-2.5 text-amber-300 hover:text-amber-100"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {errorMessage && (
            <p className="text-red-400 text-sm font-medium text-center">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-green-400 text-sm font-medium text-center">{successMessage}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#5163BC] text-white py-2 rounded-lg hover:bg-amber-800 transition font-semibold text-sm sm:text-base"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;