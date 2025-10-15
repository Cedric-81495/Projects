import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";


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
      navigate(role === "superUser" || role === "adminUser" ? "/dashboard" : "/profile");
    } catch (err) {
      console.error("Login failed:", err);
      setSuccessMessage("");
      if (err.response?.status === 401) setErrorMessage("Incorrect password.");
      else if (err.response?.status === 404) setErrorMessage("Account not found.");
      else setErrorMessage("Something went wrong. Please try again later.");
    }
  };

  // ✅ Google OAuth success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { email, given_name, family_name, picture } = decoded;

      // You can send the Google user data to your backend for verification or registration
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, {
        email,
        firstname: given_name,
        lastname: family_name,
        picture,
      });

      login(res.data);
      navigate("/profile");
    } catch (err) {
      console.error("Google login failed:", err);
      setErrorMessage("Google login failed. Please try again.");
    }
  };

  // ✅ Google OAuth error handler
  const handleGoogleError = () => {
    setErrorMessage("Google sign-in was cancelled or failed. Please try again.");
  };

  const handleGoBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(from);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 bg-amber-50 relative">
      <button
        onClick={handleGoBack}
        className="absolute top-6 left-6 text-amber-900 font-medium hover:underline"
      >
        ← Back
      </button>

      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 border-4 border-amber-700">
        <div className="absolute top-0 left-0 h-full w-2 sm:w-3 bg-amber-700 rounded-l-2xl shadow-inner" />

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-amber-900 font-serif">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            placeholder="Email"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-amber-50 text-amber-900 ${
              errorMessage ? "border-red-500 focus:ring-red-400" : "border-amber-600 focus:ring-amber-500"
            }`}
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-amber-50 text-amber-900 ${
                errorMessage ? "border-red-500 focus:ring-red-400" : "border-amber-600 focus:ring-amber-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-amber-700 hover:text-amber-900"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {errorMessage && <p className="text-red-600 text-sm font-medium">{errorMessage}</p>}
          {successMessage && <p className="text-green-600 text-sm font-medium">{successMessage}</p>}

          <button
            type="submit"
            className="w-full bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition font-semibold"
          >
            Login
          </button>
        </form>

        {/* 🟡 Divider */}
        <div className="flex items-center justify-center my-4">
          <span className="h-px w-1/3 bg-amber-700"></span>
          <p className="mx-2 text-sm text-amber-800">or</p>
          <span className="h-px w-1/3 bg-amber-700"></span>
        </div>

        {/* 🔹 Google Login Button */}
        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>
      </div>
    </div>
  );
};

export default Login;
