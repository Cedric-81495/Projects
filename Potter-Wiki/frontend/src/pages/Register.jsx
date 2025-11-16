import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import api from "../lib/axios";
import bgImage from "../assets/aesthetic-bg.jpg";
import toast, { Toaster } from "react-hot-toast";

const Register = () => {
  const [editForm, setEditForm] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    role: "",
  });

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!editForm.role) {
      toast.error("Please select a role");
      return;
    }

    if (!user?.token && editForm.role !== "superUser") {
      toast.error("You must be logged in as a SuperUser to create an Admin account.");
      return;
    }

    try {
      const endpoint =
        editForm.role === "superUser"
          ? "/admin/super"
          : "/admin/super-admins/admins";

      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

      const res = await api.post(endpoint, editForm, { headers });

      toast.success(`${res.data.role} created successfully!`); // <- toast on success

      // Reset form
      setEditForm({
        firstname: "",
        middlename: "",
        lastname: "",
        username: "",
        email: "",
        password: "",
        role: "",
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error(err.response?.data?.message || "Something went wrong"); // <- toast on error
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
      <Toaster position="top-right" /> {/* <- Toast container */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
      <div className="relative z-10 w-full max-w-xl bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-lg hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-8">
          Create Admin / SuperUser
        </h2>

        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          {[
            { name: "firstname", placeholder: "Firstname" },
            { name: "middlename", placeholder: "Middle Name" },
            { name: "lastname", placeholder: "Last Name" },
            { name: "username", placeholder: "Username" },
            { name: "email", placeholder: "Email", type: "email" },
            { name: "password", placeholder: "Password", type: "password" },
          ].map(({ name, placeholder, type = "text" }, i) => (
            <input
              key={i}
              type={type}
              name={name}
              value={editForm[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-[#cfae6d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cfae6d] bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] text-sm sm:text-base"
            />
          ))}

          <select
            name="role"
            value={editForm.role}
            onChange={handleChange}
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
