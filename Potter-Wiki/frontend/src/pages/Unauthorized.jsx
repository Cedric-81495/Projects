// frontend/src/pages/Unauthorized.jsx
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] text-white font-serif px-6 text-center">
      <div className="text-red-500 text-6xl mb-4">🚫</div>
      <h1 className="text-3xl md:text-4xl font-bold text-red-500 mb-2">
        You do not have access to this page.
      </h1>
      <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-xl">
        This section is restricted to authorized users only.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition duration-300"
      >
        Go Back
      </button>
    </div>
  );
};

export default Unauthorized;