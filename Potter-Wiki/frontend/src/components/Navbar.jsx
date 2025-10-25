import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import PotterWikiHeader from "../assets/PotterWikiHeader.png";
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
  const [showNewsDropdown, setShowNewsDropdown] = useState(false);
  const [showMagicalDropdown, setShowMagicalDropdown] = useState(false);
  const [showMobileNewsDropdown, setShowMobileNewsDropdown] = useState(false);
  const [showMobileMagicalDropdown, setShowMobileMagicalDropdown] = useState(false);



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
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-[200px] bg-yellow-500 text-black text-center py-2 text-sm sm:text-base z-[9999] shadow-md rounded">
          Logging out...
        </div>
      )}

   <header className="fixed top-0 left-0 w-full z-50 text-white bg-[#020325] font-serif transition-transform duration-300 translate-y-0">

        {/* Top Row */}
        <div className="w-full flex justify-between items-center px-6 py-4 max-w-7xl mx-auto relative">
          {/* Social Icons */}
          <div className="hidden md:flex space-x-4">
            <a href="#" className="hover:text-amber-300 text-xl"><FaYoutube /></a>
            <a href="#" className="hover:text-amber-300 text-xl"><FaTiktok /></a>
            <a href="#" className="hover:text-amber-300 text-xl"><FaFacebook /></a>
            <a href="#" className="hover:text-amber-300 text-xl"><FaInstagram /></a>
          </div>

          {/* Logo */}
          <div className="flex justify-center">
            <Link to="/">
             <img
                src={PotterWikiHeader}
                alt="Potter Wiki Logo"
                className="object-contain mx-auto w-[230px] h-[50px] sm:w-[180px] sm:h-[60px] xs:w-[150px] xs:h-[50px]"
                style={{ filter: "brightness(1.1) contrast(1.3)" }}
              />
            </Link>
          </div>

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
           {/* News and Features (click-to-toggle) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNewsDropdown((prev) => !prev);
                setShowMagicalDropdown(false);
              }}
                className="text-white hover:text-amber-300 transition flex items-center gap-1"
            >
              News & Features ▾
            </button>

            {showNewsDropdown && (
              <div className="absolute top-full left-0 w-48 bg-[#0b0b0b] border border-gray-700 rounded shadow-lg transition-all duration-300 z-50">
                <Link
                  to="/news"
                  onClick={() => setShowNewsDropdown(false)}
                  className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300"
                >
                  News
                </Link>
                <Link
                  to="/features"
                  onClick={() => setShowNewsDropdown(false)}
                  className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300"
                >
                  Features
                </Link>
              </div>
              
            )}
          </div>

          {/* Magical Data */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMagicalDropdown((prev) => !prev);
                setShowNewsDropdown(false);
              }}
              className="text-white hover:text-amber-300 transition flex items-center gap-1"
            >
              Magical Data ▾
            </button>

            {showMagicalDropdown && (
              <div className="absolute top-full left-0 w-48 bg-[#0b0b0b] border border-gray-700 rounded shadow-lg transition-all duration-300 z-50">
                <Link
                  to="/characters"
                  onClick={() => setShowMagicalDropdown(false)}
                  className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300"
                >
                  Characters
                </Link>
                <Link
                  to="/spells"
                  onClick={() => setShowMagicalDropdown(false)}
                  className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300"
                >
                  Spells
                </Link>
                <Link
                  to="/students"
                  onClick={() => setShowMagicalDropdown(false)}
                  className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300"
                >
                  Students
                </Link>
                <Link
                  to="/staff"
                  onClick={() => setShowMagicalDropdown(false)}
                  className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300"
                >
                  Staff
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
            <div className="flex flex-col items-center space-y-3 text-sm font-semibold uppercase tracking-wide">

              {/* News & Features (Accordion) */}
              <button
                onClick={() => {
                  setShowMobileNewsDropdown((prev) => !prev);
                  setShowMobileMagicalDropdown(false);
                }}
                className="w-full text-center hover:text-amber-300"
              >
                News & Features ▾
              </button>
              {showMobileNewsDropdown && (
                <div className="mt-2 mx-auto w-48 bg-[#020325] shadow-lg justify-center">
                  <Link to="/news" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300">
                    News
                  </Link>
                  <Link to="/features" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300">
                    Features
                  </Link>
                </div>
              )}

              {/* Magical Data (Accordion) */}
              <button
                onClick={() => {
                  setShowMobileMagicalDropdown((prev) => !prev);
                  setShowMobileNewsDropdown(false);
                }}
                className="w-full text-center hover:text-amber-300"
              >
                Magical Data ▾
              </button>
              {showMobileMagicalDropdown && (
                <div className="mt-2 mx-auto w-48 bg-[#020325] shadow-lg justify-center">
                  <Link to="/characters" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300">
                    Characters
                  </Link>
                  <Link to="/spells" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300">
                    Spells
                  </Link>
                  <Link to="/students" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300">
                    Students
                  </Link>
                  <Link to="/staff" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-[#141414] hover:text-amber-300">
                    Staff
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