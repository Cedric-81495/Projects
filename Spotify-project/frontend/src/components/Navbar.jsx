import { Link, useLocation } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';
import { useState } from 'react';
import spotifyLogo from '../assets/spotify-logo.png';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useSpotify();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-spotify-black text-white font-sans shadow-sm sticky top-0 z-50 border-b border-spotify-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={spotifyLogo} alt="Spotify Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">Spotify Project</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {[
              { to: '/', label: 'Home' },
              { to: '/projects', label: 'Projects' },
              { to: '/contact', label: 'Contact' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                  isActive(to)
                    ? 'bg-spotify-green text-black'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-spotify-gray'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Auth Button or User */}
            {isAuthenticated ? (
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer bg-spotify-light px-3 py-1.5 rounded-full hover:bg-spotify-gray">
                  {user?.images?.[0] ? (
                    <img src={user.images[0].url} alt="User" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 bg-spotify-green rounded-full flex items-center justify-center">
                      <span className="text-black font-semibold text-sm">
                        {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm">{user?.display_name || 'User'}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-spotify-light border border-spotify-gray rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-[#b3b3b3] hover:text-white hover:bg-spotify-gray">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-[#b3b3b3] hover:text-white hover:bg-spotify-gray">Settings</Link>
                  <div className="border-t border-spotify-gray my-1" />
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-[#b3b3b3] hover:text-white hover:bg-spotify-gray">Logout</button>
                </div>
              </div>
            ) : (
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/login`}
                className="bg-spotify-green hover:bg-opacity-90 text-black px-4 py-2 rounded-full text-sm font-medium flex items-center"
              >
                {/* <img src={spotifyLogo} alt="Spotify Icon" className="w-4 h-4 mr-2" /> */}
                Login
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#b3b3b3] hover:text-white hover:bg-spotify-gray"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-spotify-black px-4 pt-4 pb-6 space-y-2 border-t border-spotify-light">
          {['/', '/projects', '/contact'].map((to) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-base font-medium px-4 py-2 rounded-full ${
                isActive(to)
                  ? 'bg-spotify-green text-black'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-spotify-gray'
              }`}
            >
              {to === '/' ? 'Home' : to.slice(1).charAt(0).toUpperCase() + to.slice(2)}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 rounded-full text-base font-medium text-[#b3b3b3] hover:text-white hover:bg-spotify-gray">Profile</Link>
              <div className="border-t border-spotify-light" />
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-base font-medium text-[#b3b3b3] hover:text-white hover:bg-spotify-gray"
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/login`}
              className="block text-base font-medium rounded-full px-4 py-2 bg-spotify-green text-black hover:bg-opacity-90"
            >
              Login with Spotify
            </a>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
