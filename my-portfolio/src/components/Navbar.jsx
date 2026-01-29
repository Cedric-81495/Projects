import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const isDarkNow = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    setIsDark(isDarkNow);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow dark:shadow-lg fixed w-full top-0 left-0 z-50 transition duration-300">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="text-xl font-bold mb-4 opacity-0 animate-fade-in-down">
            <a href="#hero">My Portfolio</a>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6">
            <li><a href="#about" className="hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition">About</a></li>
            <li><a href="#projects" className="hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition">Projects</a></li>
            <li><a href="#experience" className="hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition">Experience</a></li>
            <li><a href="#contact" className="hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition">Contact</a></li>
          </ul>

          {/* Desktop Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="ml-4 hidden md:block text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md transition"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Mobile Buttons */}
          <div className="md:hidden flex items-center space-x-3">

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md transition"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 dark:text-gray-300">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4">
          <ul className="space-y-2 mt-2">
            <li><a href="#about" onClick={() => setIsOpen(false)} className="block hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">About</a></li>
            <li><a href="#experience" onClick={() => setIsOpen(false)} className="block hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">Experience</a></li>
            <li><a href="#projects" onClick={() => setIsOpen(false)} className="block hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">Projects</a></li>
            <li><a href="#contact" onClick={() => setIsOpen(false)} className="block hover:text-blue-500 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">Contact</a></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
