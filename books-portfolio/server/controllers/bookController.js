// server/controllers/bookController.js
const getAllBooks = async (req, res) => {
  try {
    const books = await req.app.locals.db.collection('books').find({}).toArray();
    // Extract just the UI-formatted data
    const uiBooks = books.map(book => book.ui);
    res.json(uiBooks);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await req.app.locals.db.collection('books').findOne({ id: req.params.id });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Get chapters for this book
    const chapters = await req.app.locals.db.collection('chapters')
      .find({ book_id: req.params.id })
      .toArray();
    
    // Extract UI data and add chapters
    const bookData = {
      ...book.ui,
      chapters: chapters.map(chapter => chapter.ui)
    };
    
    res.json(bookData);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book details' });
  }
};

module.exports = {
  getAllBooks,
  getBookById
};