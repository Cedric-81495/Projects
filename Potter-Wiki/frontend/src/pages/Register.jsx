import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import api from "../lib/axios";
import bgImage from "../assets/aesthetic-bg.jpg";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user?.token) {
    alert("You must be logged in as a SuperUser to create an account.");
    return;
  }

  try {
    const payload = {
      firstname,
      middlename,
      lastname,
      username,
      email,
      password,
      role,
    };

    const res = await api.post("/admin/super-admins/admins", payload, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    console.log("✅ Created:", res.data);
    alert("Account created successfully!");
    navigate("/dashboard");
  } catch (err) {
    console.error("❌ Registration failed:", err);
    alert("Failed to create account. Please check your input and try again.");
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
      <div className="relative z-10 w-full max-w-xl bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-lg hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-8">
          Create Admin / SuperUser
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { value: firstname, setter: setFirstname, placeholder: "Firstname" },
            { value: middlename, setter: setMiddlename, placeholder: "Middle Name" },
            { value: lastname, setter: setLastname, placeholder: "Last Name" },
            { value: username, setter: setUsername, placeholder: "Username" },
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

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border border-[#cfae6d] rounded-lg bg-[#2c2c44] text-white text-sm sm:text-base"
            required
          >
            <option value="">Select Role</option>
            <option value="adminUser">Admin User</option>
            <option value="superUser">Super User</option>
          </select>

          <button
            type="submit"
            className="w-full bg-[#5163BC] hover:bg-[#3f4fa0] text-white py-2 rounded-lg transition font-semibold text-sm sm:text-base"
          >
            Create Account
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