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
      navigate("/");
      setLoggingOut(false);
    }, 2000); // 2-second delay
  };

  // ✅ Close dropdown when clicking outside
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

 {loggingOut && (
  <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black text-center py-2 z-[9999]">
      Logging out...
    </div>
  )}
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-navbar text-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-white hover:text-white transition-colors duration-200"
        >
          Potter Wiki
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link to="/characters" className="text-gray-300 hover:text-white">Characters</Link>
          <Link to="/spells" className="text-gray-300 hover:text-white">Spells</Link>
          <Link to="/students" className="text-gray-300 hover:text-white">Students</Link>
          <Link to="/staff" className="text-gray-300 hover:text-white">Staff</Link>
         {(user?.role === "adminUser" || user?.role === "superUser") && (
            <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
          )}

          {user ? (
            <>
              <Link to="/profile" className="text-gray-300 hover:text-white">Profile</Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            // ✅ Put Login + Register in same row
            <div className="flex space-x-3">
              <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div ref={menuRef} className="md:hidden bg-navbar px-4 py-3 space-y-2">
          <Link to="/characters" className="block text-gray-300 hover:text-white">Characters</Link>
          <Link to="/spells" className="block text-gray-300 hover:text-white">Spells</Link>
          <Link to="/students" className="block text-gray-300 hover:text-white">Students</Link>
          <Link to="/staff" className="block text-gray-300 hover:text-white">Staff</Link>
          {(user?.role === "adminUser" || user?.role === "superUser") && (
            <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
          )}
           {(user?.role === "adminUser" || user?.role === "superUser") && (
            <Link to="/dashboard" className="block text-gray-300 hover:text-white">Profile</Link>
          )}

          {user ? (
              <div className="flex items-center justify-start space-x-3">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                >
                  Logout  
                </button> 
                  <p>{user.username} 's Profile</p>      
              </div>
            ) : (

            // ✅ Same row for login + register on mobile
            <div className="flex flex-col space-y-2">
              <Link to="/login" className="text-gray-300 hover:text-white">
                Login
              </Link>
              <Link to="/register" className="text-gray-300 hover:text-white">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
