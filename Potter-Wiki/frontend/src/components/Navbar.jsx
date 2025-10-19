import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [loggingOut, setLoggingOut] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      {loggingOut && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-[200px] bg-yellow-500 text-black text-center py-2 text-sm sm:text-base z-[9999] shadow-md rounded">
          Logging out...
        </div>
      )}

      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-[#0B0B0B] via-[#111111] to-[#1a1a1a] text-white shadow-md font-serif">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-extrabold text-amber-200 hover:text-amber-300 transition-colors duration-200"
          >
            Potter Wiki
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link to="/characters" className="text-amber-100 hover:text-amber-300 transition">Characters</Link>
            <Link to="/spells" className="text-amber-100 hover:text-amber-300 transition">Spells</Link>
            <Link to="/students" className="text-amber-100 hover:text-amber-300 transition">Students</Link>
            <Link to="/staff" className="text-amber-100 hover:text-amber-300 transition">Staff</Link>
            {(user?.role === "adminUser" || user?.role === "superUser") && (
              <Link to="/dashboard" className="text-amber-100 hover:text-amber-300 transition">Dashboard</Link>
            )}

            {user ? (
              <>
                <Link to="/profile" className="text-amber-100 hover:text-amber-300 transition">Profile</Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-white font-serif"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-3">
                <Link to="/login" className="text-amber-100 hover:text-amber-300 transition">Login</Link>
                <Link to="/register" className="text-amber-100 hover:text-amber-300 transition">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="md:hidden text-white text-xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </nav>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div ref={menuRef} className="md:hidden bg-[#0B0B0B] px-4 py-3 space-y-2 font-serif">
            <Link to="/characters" className="block text-amber-100 hover:text-amber-300 transition">Characters</Link>
            <Link to="/spells" className="block text-amber-100 hover:text-amber-300 transition">Spells</Link>
            <Link to="/students" className="block text-amber-100 hover:text-amber-300 transition">Students</Link>
            <Link to="/staff" className="block text-amber-100 hover:text-amber-300 transition">Staff</Link>
            {(user?.role === "adminUser" || user?.role === "superUser") && (
              <Link to="/dashboard" className="block text-amber-100 hover:text-amber-300 transition">Dashboard</Link>
            )}
            {user && (
              <Link to="/profile" className="block text-amber-100 hover:text-amber-300 transition">Profile</Link>
            )}

            {user ? (
              <div className="flex items-center justify-start space-x-3">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-white font-serif"
                >
                  Logout
                </button>
                <p className="text-amber-100">{user.username}'s Profile</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link to="/login" className="text-amber-100 hover:text-amber-300 transition">Login</Link>
                <Link to="/register" className="text-amber-100 hover:text-amber-300 transition">Register</Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;