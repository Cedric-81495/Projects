// frontend/src/components/SearchBar.jsx
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

    // ✅ Run once on mount so it doesn’t bounce back
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`flex items-center gap-4 transition-all duration-300 ${
        scrolled
          ? "sticky top-16 z-20 bg-white p-4 rounded-md w-[310px] shadow"
          : "relative mb-4"
      }`}
    >
      {label && (
        <h2
          className={`font-bold whitespace-nowrap transition-all duration-300 ${
            scrolled ? "text-xl" : "text-2xl"
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
        className={`border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all duration-300 ${
          scrolled ? "w-[192px] p-2" : "w-[192px] p-2"
        }`}
      />
    </div>
  );
};

export default SearchBar;
