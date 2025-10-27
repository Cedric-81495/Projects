// frontend/src/components
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
//import PotterWikiHeader from "../assets/PotterWikiHeader.png";
import Header from "./Header";

import {
  FaYoutube,
  FaTiktok,
  FaFacebook,
  FaInstagram,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [loggingOut, setLoggingOut] = useState(false);
  // Desktop dropdowns
  const [showBooksDropdown, setShowBooksDropdown] = useState(false);
  const [showMagicalDropdown, setShowMagicalDropdown] = useState(false);
  // Mobile dropdowns
  const [showMobileBooksDropdown, setShowMobileBooksDropdown] = useState(false);
  const [showMobileMagicalDropdown, setShowMobileMagicalDropdown] = useState(false);
  // Close desktoip dropdowns when clicking outside
  const magicalDropdownRef = useRef(null);
  const booksDropdownRef = useRef(null);

  useEffect(() => {
  const handleOutsideClick = (e) => {
    if (
      magicalDropdownRef.current &&
      !magicalDropdownRef.current.contains(e.target)
    ) {
      setShowMagicalDropdown(false);
    }
    if (
      booksDropdownRef.current &&
      !booksDropdownRef.current.contains(e.target)
    ) {
      setShowBooksDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleOutsideClick);
  return () => document.removeEventListener("mousedown", handleOutsideClick);
}, []);


  // Function that ensures only one dropdown is open at a time.
  const handleDropdownToggle = (dropdown, isMobile = false) => {
    if (isMobile) {
      setShowMobileMagicalDropdown(dropdown === "magical" ? !showMobileMagicalDropdown : false);
      setShowMobileBooksDropdown(dropdown === "books" ? !showMobileBooksDropdown : false);
    } else {
      setShowMagicalDropdown(dropdown === "magical" ? !showMagicalDropdown : false);
      setShowBooksDropdown(dropdown === "books" ? !showBooksDropdown : false);
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    toast.loading("Logging out...");
    setTimeout(() => {
      logout();
      setMenuOpen(false);
      toast.dismiss();
      toast.success("You've been logged out");
      navigate("/login");
      setLoggingOut(false);
    }, 1000);
  };


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      {loggingOut && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 w-[200px] bg-yellow-500 text-black text-center py-2 text-sm sm:text-base z-[9999] shadow-md rounded">
          Logging out...
        </div>
      )}

   <header className="fixed top-0 left-0 w-full z-50 text-white bg-[#020325] font-serif transition-transform duration-300 translate-y-0">

        {/* Top Row */}
        <div className="w-full flex justify-between items-center px-6 py-3 max-w-7xl mx-auto relative">
          {/* Social Icons */}
          <div className="hidden md:flex space-x-4">
            <a href="#" className="hover:text-amber-300 text-xl"><FaYoutube /></a>
            <a href="#" className="hover:text-amber-300 text-xl"><FaTiktok /></a>
            <a href="#" className="hover:text-amber-300 text-xl"><FaFacebook /></a>
            <a href="#" className="hover:text-amber-300 text-xl"><FaInstagram /></a>
          </div>

          {/* Logo */}
          <Header />

          {/* Search & Auth */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="bg-[#0E0E38] text-white rounded-full px-4 py-1.5 text-sm outline-none w-40 md:w-48"
              />
              <span className="absolute right-3 top-1.5 text-gray-400">🔍</span>
            </div>
           {user ? (
              <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="bg-[#5163BC] px-3 py-1.5 rounded text-sm text-white hover:bg-[#3f4fa0] transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-3 py-1.5 rounded text-sm text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
            ) : (

              <>
                <Link
                  to="/login"
                  className="border border-white px-3 py-1.5 rounded text-sm hover:bg-white hover:text-black transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-500 px-3 py-1.5 rounded text-sm text-black shadow hover:bg-amber-600 transition"
                >
                  Sign Up
                </Link>
                
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-2xl absolute right-6 top-6 z-50"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700"></div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex justify-center items-center gap-6 py-3 text-sm font-semibold uppercase tracking-wide bg-[#020325]">
          {/* Home */}
          <div className="relative">
            <button className="text-white hover:text-amber-300 transition flex items-center gap-1">
              <Link  to="/">HOME</Link>
            </button>
          </div>

          {/* Magical Data */}
          <div className="relative" ref={magicalDropdownRef}>
            <button
              onClick={() => handleDropdownToggle("magical")}
              className="text-white hover:text-amber-300 transition flex items-center gap-1"
            >
              MAGICAL DATA ▾
            </button>

            {showMagicalDropdown && (
                <div
                  className={`absolute top-full left-0 w-48 bg-[#020325] border border-gray-700 rounded shadow-lg transition-all duration-300 ease-in-out z-50 ${
                    showMagicalDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
              <Link
                to="/characters"
                onClick={() => setShowMagicalDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                Characters
              </Link>
              <Link
                to="/spells"
                onClick={() => setShowMagicalDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                Spells
              </Link>
              <Link
                to="/students"
                onClick={() => setShowMagicalDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                Students
              </Link>
              <Link
                to="/staff"
                onClick={() => setShowMagicalDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                Staff
              </Link>
            </div>
            )}
          </div>

          {/* Books  */}
          <div className="relative" ref={booksDropdownRef}>
            <button
              onClick={() => handleDropdownToggle("books")}
              className="text-white hover:text-amber-300 transition flex items-center gap-1"
            >
              BOOKS ▾
            </button>

            {showBooksDropdown && (
                <div
                  className={`absolute top-full left-0 w-48 bg-[#020325] border border-gray-700 rounded shadow-lg transition-all duration-300 ease-in-out z-50 ${
                    showBooksDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
              <Link
                to="/fiction"
                onClick={() => setShowBooksDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                fiction
              </Link>
              <Link
                to="/fantasy"
                onClick={() => setShowBooksDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                fantasy
              </Link>
              <Link
                to="/magical"
                onClick={() => setShowBooksDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                magical
              </Link>
              <Link
                to="/adventure"
                onClick={() => setShowBooksDropdown(false)}
                className="block px-4 py-2 hover:text-amber-300"
              >
                adventure
              </Link>
            </div>
            )}
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="md:hidden bg-[#020325] py-4 transition-all duration-300 max-h-[calc(100vh-80px)] overflow-y-auto"
          >
             {/* Home */}
            
            <div className="flex flex-col items-center space-y-3 text-sm font-semibold uppercase tracking-wide">
              <button className="text-white hover:text-amber-300 transition flex items-center gap-1">
                  <Link  to="/">HOME</Link>
              </button>
              {/* Magical Data (Accordion) */}
              <button
                onClick={() => handleDropdownToggle("magical", true)}
                className="text-white hover:text-amber-300 transition flex items-center gap-1"
              >
                MAGICAL DATA ▾
              </button>

              {showMobileMagicalDropdown && (
                <div className="mt-2 mx-auto w-48 bg-[#020325] shadow-lg justify-center">
                  <Link to="/characters" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    Characters
                  </Link>
                  <Link to="/spells" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    Spells
                  </Link>
                  <Link to="/students" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    Students
                  </Link>
                  <Link to="/staff" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    Staff
                  </Link>
                </div>
              )}

              <button
                onClick={() => handleDropdownToggle("books", true)}
                className="text-white hover:text-amber-300 transition flex items-center gap-1"
              >
                BOOKS ▾
              </button>

              {showMobileBooksDropdown && (
                <div className="mt-2 mx-auto w-48 bg-[#020325] shadow-lg justify-center">
                  <Link to="/fiction" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    fiction
                  </Link>
                  <Link to="/fantasy" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    fantasy
                  </Link>
                  <Link to="/magic" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    magic
                  </Link>
                  <Link to="/adventure" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:text-amber-300">
                    adventure
                  </Link>
                </div>
              )}


              {/* Divider */}
              <div className="border-t border-gray-600 w-3/4 my-2"></div>

              {/* Auth Buttons */}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 px-3 py-1.5 rounded text-sm hover:bg-red-700 transition"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="border border-white px-3 py-1.5 rounded text-sm hover:bg-white hover:text-black transition"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-block bg-amber-500 text-black px-6 py-3 rounded-lg shadow hover:bg-amber-600 transition font-semibold"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div> 
        )}      
      </header>
    </>
  );
};

export default Navbar;