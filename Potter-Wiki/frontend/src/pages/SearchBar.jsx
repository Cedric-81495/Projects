import { useEffect, useState } from "react";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsFloating(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <form
      className={`flex items-center gap-3 w-[320px] transition-all duration-300 ${
        isFloating
          ? "sticky top-16 z-20 w-[310px] px-4 py-3 shadow-md backdrop-blur-sm rounded-md"
          : "relative mb-6 px-4 py-3 shadow-md rounded-md"
      }`}
    >
      <label
        htmlFor="search"
        className="font-serif text-[#f5e6c8] text-sm sm:text-base font-medium"
      >
        Search:
      </label>
      <input
        id="search"
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Type a name..."
        className="w-full sm:w-72 px-3 py-1.5 rounded-md border border-[#cfae6d] focus:outline-none focus:ring-1 focus:ring-[#cfae6d] bg-transparent text-white placeholder:text-[#cfae6d] text-sm transition"
      />
    </form>
  );
};

export default SearchBar;