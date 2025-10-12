// frontend/src/Card.jsx
const Card = ({ title, description }) => (
  <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
    <h3 className="text-xl font-semibold text-indigo-700 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Card;