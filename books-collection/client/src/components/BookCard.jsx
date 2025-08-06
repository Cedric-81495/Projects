import React from 'react';
import { Link } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ book }) {
  const {
    id,
    title,
    cover,
    author,
    link
  } = book;

  // Clean ID: remove leading slashes if any
  const cleanId = id ? id.replace(/^\/+/, '') : '';

  return (
    <div className="book-card">
      {/* Wrap the whole card in Link to /book/:id if id exists, else fallback to external link */}
      <Link
        to={cleanId ? `/book/${cleanId}` : link || '#'}
        className="book-card-link"
        target={cleanId ? "_self" : "_blank"}
        rel="noopener noreferrer"
      >
        <div className="book-cover-container">
          {cover ? (
            <img 
              src={cover} 
              alt={`Cover of ${title}`} 
              className="book-cover"
            />
          ) : (
            <div className="book-cover-placeholder">
              <span>No Cover</span>
            </div>
          )}
        </div>
        <div className="book-info">
          <h3 className="book-title">{title}</h3>
          {author && <p className="book-author">{author}</p>}
        </div>

        <div className="book-card-footer">
          {/* Button is just a styled element inside Link for consistent navigation */}
          <span className="read-free-btn">
            Read Book Free
          </span>
        </div>
      </Link>
    </div>
  );
}
