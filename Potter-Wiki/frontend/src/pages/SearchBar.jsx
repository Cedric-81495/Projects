// frontend/src/pages/SearchBar.jsx
const SearchBar = ({ label = "Search", placeholder = "Search...", searchTerm, setSearchTerm }) => {
  return (
    <div className="shadow-md rounded-xl transition-all duration-300 gap-3 mb-6 px-0 pt-[10px] sm:px-4 sm:pt-[50px]">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 w-full">
  
        <form className="sm:max-w-md">
        <label className="font-serif text-[#f5e6c8] text-base sm:text-lg font-medium whitespace-nowrap">
          {label}:
        </label>
       <input
            id="search-input"
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 gap-3 py-2 rounded-md border border-[#cfae6d] 
                      focus:outline-none focus:ring-2 focus:ring-[#cfae6d] 
                      bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] 
                      text-base sm:text-lg transition"
          />
        </form>
      </div>
    </div>
  );
};

export default SearchBar;