// Use fallback for safety (if VITE_API_BASE is undefined)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const fetchBooks = async () => {
  const res = await fetch(`${API_BASE}/books`);
  if (!res.ok) throw new Error("Failed to fetch books");
  return res.json();
};

export const fetchBookById = async (id) => {
  const res = await fetch(`${API_BASE}/books/${id}`);
  if (!res.ok) throw new Error("Book not found");
  return res.json();
};
