import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      login(res.data); // Save user to context

      // Redirect based on role
      const role = res.data?.user?.role;
      if (role === "superUser" || role === "adminUser") {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error("Login failed:", err);

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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 border-4 border-amber-700">
        {/* Decorative spine effect */}
        <div className="absolute top-0 left-0 h-full w-3 bg-amber-700 rounded-l-2xl shadow-inner" />

        <h2 className="text-3xl font-bold text-center mb-6 text-amber-900 font-serif">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
            }}
            placeholder="Email"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-amber-50 text-amber-900 ${
              errorMessage ? "border-red-500 focus:ring-red-400" : "border-amber-600 focus:ring-amber-500"
            }`}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage("");
            }}
            placeholder="Password"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-amber-50 text-amber-900 ${
              errorMessage ? "border-red-500 focus:ring-red-400" : "border-amber-600 focus:ring-amber-500"
            }`}
          />

          {errorMessage && (
            <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;