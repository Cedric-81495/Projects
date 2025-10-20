// frontend/src/components/Card.jsx
const Card = ({ title, description }) => {
  return (
    <div className="bg-[#1b1b2f] border border-[#cfae6d] rounded-lg shadow-md hover:shadow-xl transition duration-300 p-5 flex flex-col justify-between h-full">
      <h3 className="text-lg sm:text-xl font-serif font-bold text-[#f5e6c8] mb-3 text-center leading-tight break-words">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-300 text-center leading-relaxed break-words">
        {description || "No description available"}
      </p>
    </div>
  );
};

export default Card;