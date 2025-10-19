import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import bgImage from "../assets/aesthetic-bg.jpg";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const { login } = useContext(AuthContext);
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
      login(res.data);
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleGoBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/register");
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
              className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#3a2b5a] text-white placeholder:text-amber-100 text-sm sm:text-base"
            />
          ))}

          <button
            type="submit"
            className="w-full bg-[#5163BC] text-white py-2 rounded-lg hover:bg-amber-800 transition font-semibold text-sm sm:text-base"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;