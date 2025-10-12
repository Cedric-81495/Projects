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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 border-4 border-amber-700">
        <div className="absolute top-0 left-0 h-full w-3 bg-amber-700 rounded-l-2xl shadow-inner" />

        <h2 className="text-3xl font-bold text-center mb-6 text-amber-900 font-serif">
          Register
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            placeholder="Firstname"
            className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900"
          />
           <input
            type="text"
            value={middlename}
            onChange={(e) => setMiddlename(e.target.value)}
            placeholder="Middle Name"
            className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900"
          />
          <input
            type="text"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            placeholder="Last Name"
            className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900"
          />
          <button
            type="submit"
            className="w-full bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition font-semibold"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;