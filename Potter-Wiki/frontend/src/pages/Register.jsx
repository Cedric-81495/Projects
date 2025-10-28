import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
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
      const res = await axios.post("/api/auth/register", {     
        firstname,
        middlename,
        lastname,
        email,
        password, });
        
      login(res.data);
      navigate("/profile");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleGoBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen px-4 py-20 bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-xl bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-lg hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-8">
          Register
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              className="w-full px-4 py-2 border border-[#cfae6d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cfae6d] bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] text-sm sm:text-base"
            />
          ))}

          <button
            type="submit"
            className="w-full bg-[#5163BC] hover:bg-[#3f4fa0] text-white py-2 rounded-lg transition font-semibold text-sm sm:text-base"
          >
            Register
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            className="w-full bg-[#5c5e68] mt-[10px] hover:bg-[#3f4fa0] text-white py-2 rounded-lg transition font-semibold text-sm sm:text-base"
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;