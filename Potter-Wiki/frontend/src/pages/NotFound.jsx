import { Link, useLocation } from "react-router-dom";

const NotFound = ({ message = "Page not found" }) => {
  const location = useLocation();

  const getBackPath = () => {
    const path = location.pathname;
    if (path.startsWith("/characters")) return "/characters";
    if (path.startsWith("/spells")) return "/spells";
    if (path.startsWith("/students")) return "/students";
    if (path.startsWith("/staff")) return "/staff";
    if (path.startsWith("/profile")) return "/profile";
    if (path.startsWith("/dashboard")) return "/dashboard";
    if (path.startsWith("/login") || path.startsWith("/register")) return "/";
    return "/";
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#0B0B0B] to-black text-center px-6 py-12 font-serif text-amber-100">
      <h1 className="text-7xl sm:text-8xl font-bold text-red-600 drop-shadow-lg">404</h1>
      <h2 className="text-3xl sm:text-4xl font-semibold mt-6 text-amber-200">
        {message}
      </h2>
      <p className="mt-4 text-[#f5e6c8] max-w-xl">
        Oops! The page you’re looking for doesn’t exist or may have been moved.
      </p>

        <Link
        to={getBackPath()}
        className="mt-8 px-6 py-3 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-[#3a2e1e] via-[#6b4f2c] to-[#3a2e1e] hover:from-[#5a3e2e] hover:to-[#8c6b3f] shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
      >
        Go Back
      </Link>
    </div>
  );
};

export default NotFound;