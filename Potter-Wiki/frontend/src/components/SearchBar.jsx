const SearchBar = ({ placeholder = "Search...", searchTerm, setSearchTerm }) => {
  return (
    <div className="border-xl transition-all duration-300 gap-3 mb-6 px-0 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 w-full">
        <form className="sm:max-w-md flex flex-col gap-2">
          <label className="text-black text-base sm:text-lg font-medium whitespace-nowrap">
        
          </label>
          <input
            id="search-input"
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border-md border border-black
                      focus:outline-none focus:ring-2 focus:ring-black
                      bg-white text-black placeholder:text-gray-500
                      text-base sm:text-lg transition"
          />
        </form>
      </div>
    </div>
  );
};

export default SearchBar;