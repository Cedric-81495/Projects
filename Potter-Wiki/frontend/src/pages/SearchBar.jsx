// frontend/
const SearchBar = ({ label = "Search", placeholder = "Search...", searchTerm, setSearchTerm }) => {
  return (
    <div
      className="flex  gap-3 top-[35px] w-[380px] px-4 py-[5px] shadow-md rounded-md transition-all duration-300 relative mb-6">

      <p className="font-serif text-[#f5e6c8] text-sm sm:text-base font-medium">{label}:</p>
      <form className="w-full">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 px-3 py-1.5 rounded-md border border-[#cfae6d] 
                     focus:outline-none focus:ring-1 focus:ring-[#cfae6d] 
                     bg-transparent text-white placeholder:text-[#cfae6d] text-sm transition"
        />
      </form>
    </div>
  );
};

export default SearchBar;
