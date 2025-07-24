// components/BookCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ book }) {
  return (
    <div className="book-card">
      <Link to={`/book/${book.id}`} className="book-card-link">
        <div className="book-cover-container">
          {book.cover ? (
            <img 
              src={book.cover} 
              alt={`Cover of ${book.title}`} 
              className="book-cover"
            />
          ) : (
            <div className="book-cover-placeholder">
              <span>No Cover</span>
            </div>
          )}
        </div>
        <div className="book-info">
          <h3 className="book-title">{book.title}</h3>
        </div>
      </Link>
      <div className="book-card-footer">
        <Link to={`/book/${book.id}`} className="read-free-btn">
          Read Book Free
        </Link>
      </div>
    </div>
  );
}