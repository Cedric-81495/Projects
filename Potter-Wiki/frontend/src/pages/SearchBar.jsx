// fronmtend/src/pages/SearchBar.jsx
import { useEffect, useState } from "react";

const SearchBar = ({
  label = "Search",
  placeholder = "Search...",
  searchTerm,
  setSearchTerm,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    handleScroll(); // ✅ Run once on mount
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`flex items-center gap-4 w-[320px] transition-all duration-300 ${
        scrolled
          ? "sticky top-16 z-20 bg-[#6b4ea0]  w-[310px] p-4 rounded-xl shadow-lg border border-amber-700"
          : "relative mb-6 bg-[#6b4ea0] p-4 w-[310px] rounded-xl shadow-lg border border-amber-700"
      }`}
    >
      {label && (
        <h2
          className={`font-serif font-bold whitespace-nowrap transition-all duration-300 ${
            scrolled ? "text-xl text-amber-200" : "text-2xl text-amber-200"
          }`}
        >
          {label}:
        </h2>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-[192px] p-2 rounded-xl  shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-amber-100 text-white border border-amber-700 bg-[#6b4ea0]"
      />
    </div>
  );
};

export default SearchBar;