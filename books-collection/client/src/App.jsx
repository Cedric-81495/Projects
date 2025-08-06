import { Routes, Route, Navigate } from 'react-router-dom';
import About from './components/About';
import Contact from './components/Contact';
import HPotterBooks from './pages/HPotterBooks';
import BookCardPage from './pages/BookCardPage';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Routes>
          {/* Home page: either show books or redirect */}
          <Route path="/" element={<HPotterBooks />} />

          {/* About page */}
          <Route path="/about" element={<About />} />

          {/* Contact page */}
          <Route path="/contact" element={<Contact />} />

          {/* Book detail page */}
          <Route path="/book/:id" element={<BookCardPage />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="text-center p-10">
                <h2 className="text-2xl font-semibold mb-4">404 - Page Not Found</h2>
                <a href="/" className="text-blue-600 underline">← Back to Home</a>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
