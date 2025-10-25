import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import aestheticbg from "../assets/aesthetic-bg.jpg";

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
      className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-cover bg-center"
      style={{ backgroundImage: `url(${aestheticbg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />


      {/* Login Card */}
      <div className="relative z-10 w-full max-w-xl bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-lg hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-8">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            placeholder="Email"
            className="w-full px-4 py-2 border border-[#cfae6d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cfae6d] bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] text-sm sm:text-base"
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
              className="w-full px-4 py-2 border border-[#cfae6d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cfae6d] bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-2.5 text-[#cfae6d] hover:text-[#e0c98c]"
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
            className="w-full bg-[#5163BC] hover:bg-[#3f4fa0] text-white py-2 rounded-lg transition font-semibold text-sm sm:text-base"
          >
            Login
          </button>
       
        </form>
           {/* Back Button */}
           <button
            onClick={handleGoBack}
            className="w-full bg-[#5c5e68] mt-[10px] hover:bg-[#3f4fa0] text-white py-2 rounded-lg transition font-semibold text-sm sm:text-base"
          >
            Back
          </button>
      </div>
    
    </div>
  );
};

export default Login;