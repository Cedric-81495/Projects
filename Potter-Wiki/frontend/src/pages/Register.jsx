import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const { login } = useContext(AuthContext); // Optional: auto-login after register
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        firstname, 
        middlename, 
        lastname,
        email,
        password,
      });
      login(res.data); // Optional: log in immediately
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

    // Handle back navigation (go to previous page or fallback)
  const handleGoBack = () => {
    if (location.key !== "default") {
      navigate(-1); // Go back if user came from another page
    } else {
      navigate("/register"); // Fallback (e.g., home)
    }
  };

  return (
  <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 py-12 sm:py-20">
      {/* 🔙 Back Button */}
      <button
        onClick={handleGoBack}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-amber-900 text-sm sm:text-base font-medium hover:underline"
      >
        ← Back
      </button>

      <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 border-4 border-amber-700">
        <div className="absolute top-0 left-0 h-full w-2 sm:w-3 bg-amber-700 rounded-l-2xl shadow-inner" />

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-amber-900 font-serif">
          Register
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { value: firstname, setter: setFirstname, placeholder: "Firstname" },
            { value: middlename, setter: setMiddlename, placeholder: "Middle Name" },
            { value: lastname, setter: setLastname, placeholder: "Last Name" },
            { value: email, setter: setEmail, placeholder: "Email", type: "email" },
            { value: password, setter: setPassword, placeholder: "Password", type: "password" },
          ].map(({ value, setter, placeholder, type = "text" }, i) => (
            <input
              key={i}
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900 text-sm sm:text-base"
            />
          ))}

          <button
            type="submit"
            className="w-full bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition font-semibold text-sm sm:text-base"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;