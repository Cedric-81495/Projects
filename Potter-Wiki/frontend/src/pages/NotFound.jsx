import { Link, useLocation } from "react-router-dom";

const NotFound = ({ message = "Page not found" }) => {
  const location = useLocation();

  // Infer fallback path based on attempted route
  const getBackPath = () => {
    const path = location.pathname;

    if (path.startsWith("/characters")) return "/characters";
    if (path.startsWith("/spells")) return "/spells";
    if (path.startsWith("/students")) return "/students";
    if (path.startsWith("/staff")) return "/staff";
    if (path.startsWith("/profile")) return "/profile";
    if (path.startsWith("/dashboard")) return "/dashboard";
    if (path.startsWith("/login") || path.startsWith("/register")) return "/";

    return "/"; // default fallback
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white text-center px-4">
      <h1 className="text-6xl sm:text-7xl font-bold text-red-600">404</h1>
      <h2 className="text-2xl sm:text-3xl font-semibold mt-4 text-gray-900">
        {message}
      </h2>
      <p className="mt-2 text-gray-600">
        Oops! The page you’re looking for doesn’t exist or may have been moved.
      </p>

      <Link
        to={getBackPath()}
        className="mt-6 bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 transition"
      >
        Go Back
      </Link>
    </div>
  );
};

export default NotFound;