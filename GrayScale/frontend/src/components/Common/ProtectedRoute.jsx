// frontend/src/components/ProtectedRoute.jsx
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Wait while auth state is resolving
  if (loading) return null;

  if (!user || (role && user.role !== role)) {
    return (
     <div className="min-h-screen w-full mx-auto p-6 bg-white fixed inset-0 z-10 text-center">
        <h2 className="pt-[300px] text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6">You do not have permission to view this page.</p>
        <Link to="/login" state={{ from: location }} className="text-blue-500 underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
