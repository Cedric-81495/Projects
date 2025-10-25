// frontend/src/components/Card.jsx
const Card = ({ title,  }) => {
  return (
    <div className="bg-[#1b1b2f] border border-[#cfae6d] rounded-lg shadow-md hover:shadow-xl transition duration-300 p-5 flex flex-col justify-between h-full">
      <p className="text-lg sm:text-xl font-serif font-bold text-[#f5e6c8] mb-3 text-center leading-tight break-words">
        {title}
      </p>
    </div>
  );
};

export default Card;