// frontend/src/routes
import { useContext } from "react";
import { Navigate, useLocation, useNavigate,  } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate

if (!user) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-4">🔒 Access Denied</h1>
      <p className="mb-6">You must be logged in to view this page.</p>
      <button
        onClick={() => navigate("/login", { state: { from: location } })}
        className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-full font-semibold transition"
      >
        Go to Login
      </button>
    </div>
  );
}

  const allowedRoles = ["adminUser", "superUser"];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  

  return children;
};

export default AdminRoute;