// frontend/src/pages/NotFound.jsx
import { Link } from "react-router-dom";

const NotFound = ({ message = "Page not found", backPath = "/" }) => {
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
        to={backPath}
        className="mt-6 bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 transition"
      >
        Go Back
      </Link>
    </div>
  );
};

export default NotFound;
