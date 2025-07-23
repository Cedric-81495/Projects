import { Routes, Route } from 'react-router-dom';
import HPotterBooks from './pages/HPotterBooks';
import BookCardPage from './pages/BookCardPage';
import Header from './components/Header';      // Optional: create a shared header
import Footer from './components/Footer';      // Optional: shared footer

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header /> {/* Optional: add your own component */}
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HPotterBooks />} />
          <Route path="/book/:id" element={<BookCardPage />} />
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

      <Footer /> {/* Optional: create a footer */}
    </div>
  );
}

export default App;
