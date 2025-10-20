// src/components/SearchBar.jsx

const SearchBar = ({ label, placeholder, searchTerm, setSearchTerm }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
      <label className="font-bold text-lg mr-2 text-white">{label}:</label>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full sm:w-64 px-4 py-2 border border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900"
      />
    </div>
  );
};

export default SearchBar;
