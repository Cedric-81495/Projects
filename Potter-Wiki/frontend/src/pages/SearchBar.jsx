const SearchBar = ({ label = "Search", placeholder = "Search...", searchTerm, setSearchTerm }) => {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-3 mb-6 
                    shadow-md rounded-xl transition-all duration-300">
      <label className="font-serif text-[#f5e6c8] text-sm sm:text-base font-medium whitespace-nowrap">
        {label}:
      </label>
      <form className="w-full max-w-md">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-[#cfae6d] 
                     focus:outline-none focus:ring-2 focus:ring-[#cfae6d] 
                     bg-[#2c2c44] text-white placeholder:text-[#f5e6c8] text-sm sm:text-base transition"
        />
      </form>
    </div>
  );
};

export default SearchBar;