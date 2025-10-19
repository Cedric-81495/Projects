// frontend/src/components/Card.jsx
const Card = ({ title, description }) => {
  return (
    <div className="bg-[#6b4ea0] text-white rounded-xl shadow-lg border border-amber-700 p-4 sm:p-6 hover:shadow-xl transition duration-300 flex flex-col justify-between h-full">
      <h3 className="text-lg sm:text-xl font-extrabold text-amber-200 font-serif mb-2 text-center break-words">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-amber-100 text-center break-words">
        {description || "No description available"}
      </p>
    </div>
  );
};

export default Card;