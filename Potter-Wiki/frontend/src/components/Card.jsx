// frontend/src/components/Card.jsx
const Card = ({ title,  }) => {
  return (
      <div className="bg-white border border-black border-lg shadow-md hover:shadow-xl transition duration-300 p-5 flex flex-col justify-between h-full">
        <p className="text-lg sm:text-xl font-serif font-bold text-black mb-3 text-center leading-tight break-words">
          {title}
        </p>
      </div>
  );
};

export default Card;