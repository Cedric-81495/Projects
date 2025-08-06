// pages/About.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">About This Library</h1>
        
        <p className="text-gray-700 mb-4">
          This web app allows you to browse a collection of books sourced from the 
          <a 
            href="https://openlibrary.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline ml-1"
          >
            Open Library
          </a>
          , an initiative of the Internet Archive. You can explore books by category, view book details, and access free online reading options where available.
        </p>

        <p className="text-gray-700 mb-4">
          Whether you're looking for fantasy, fiction, adventure, or young adult literature, our goal is to provide a fast and simple interface to help you discover great reads.
        </p>

        <p className="text-gray-700 mb-4">
          This app was built using modern web technologies including React, Tailwind CSS, and the Open Library public API. Book data is fetched in real-time from their catalog.
        </p>

        <p className="text-gray-700 mb-4">
          Please note: All book data and covers belong to their respective copyright holders. This site is for educational and informational purposes only.
        </p>

        <div className="mt-6">
          <Link 
            to="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
