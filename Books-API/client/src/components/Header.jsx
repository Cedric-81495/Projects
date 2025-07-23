import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link to="/" className="text-2xl font-bold">
          Lorey Nexus
        </Link>
        <nav>
          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-8">
            <li><Link to="/" className="hover:text-yellow-300">Home</Link></li>
            <li><a href="#books" className="hover:text-yellow-300">Books</a></li>
            <li><a href="#about" className="hover:text-yellow-300">About</a></li>
            <li><a href="#contact" className="hover:text-yellow-300">Contact</a></li>
          </ul>
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <ul className="md:hidden bg-blue-800 text-white space-y-2 p-4">
          <li><Link to="/" className="block hover:text-yellow-300" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><a href="#books" className="block hover:text-yellow-300" onClick={() => setMenuOpen(false)}>Books</a></li>
          <li><a href="#about" className="block hover:text-yellow-300" onClick={() => setMenuOpen(false)}>About</a></li>
          <li><a href="#contact" className="block hover:text-yellow-300" onClick={() => setMenuOpen(false)}>Contact</a></li>
        </ul>
      )}
    </header>
  );
}
