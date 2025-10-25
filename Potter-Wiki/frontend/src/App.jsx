// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthProvider";
import Navbar from "./components/Navbar";
// import AdminRoute from "./components/AdminRoute";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Characters from "./pages/Characters";
import Spells from "./pages/Spells";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import CharacterDetail from "./pages/CharacterDetail";
import SpellsDetail from "./pages/SpellsDetail";
import StaffDetail from "./pages/StaffDetail";
import StudentsDetail from "./pages/StudentsDetail";
import BackToTopButton from "./pages/BackToTopButton";
import NotFound from "./pages/NotFound";

function AppContent() {

const location = useLocation();

  // Define valid route patterns
  const validPatterns = [
    /^\/login$/, // Home
    /^\/profile$/, // Home
    /^\/dashboard$/, // Admin Dashboard
    /^\/dashboard\/characters$/, // Admin Dashboard Characters
    /^\/dashboard\/spells$/, // Admin Dashboard Spells
    /^\/dashboard\/students$/, // Admin Dashboard Students
    /^\/dashboard\/staff$/, // Admin Dashboard Staff
    /^\/register$/, // Register
    /^\/$/, // Home
    /^\/characters$/, /^\/characters\/[a-f\d]{24}$/,
    /^\/spells$/, /^\/spells\/[a-f\d]{24}$/,
    /^\/staff$/, /^\/staff\/[a-f\d]{24}$/,
    /^\/students$/, /^\/students\/[a-f\d]{24}$/,
    // Add more if needed
  ];


// Check if current path matches any valid pattern
const isValidPath = validPatterns.some((pattern) => pattern.test(location.pathname));
const hideLayout = location.pathname === "/login" || location.pathname === "/register";

if (!isValidPath) {
    return (
      <>
        <Routes>
          <Route path="*" element={<NotFound message="Invalid route format" />} />
        </Routes>
      </>
    );
  }



  return (
    <>
      {!hideLayout && <Navbar />}

      <BackToTopButton />
      
      <Routes>
           {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<CharacterDetail />} />
          <Route path="/spells" element={<Spells />} />
          <Route path="/spells/:id" element={<SpellsDetail />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentsDetail />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/staff/:id" element={<StaffDetail />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin dashboard routes */}
          <Route path="/dashboard/*" element={<AdminDashboard />} />

        {/* ⚠️ NotFound route */}
          <Route path="*" element={<NotFound message="Invalid route format" />} />

      </Routes>

       {!hideLayout && <Footer />}

    </>
  );
}

function App() {
  const [serverUp, setServerUp] = useState(true);
  const [checking, setChecking] = useState(true);

  const checkServer = async () => {
    setChecking(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL);
      if (!response.ok) throw new Error("Server error");
      setServerUp(true);
    } catch (error) {
      setServerUp(false);
      console.error("Failed to fetch characters:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Run check once on mount
    checkServer();
  }, []);

  // ⏳ Loading state while checking server
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] text-white font-serif">
        <div className="animate-spin h-10 w-10 border-4 border-yellow-400 border-t-transparent rounded-full mb-4"></div>
        <p>Checking server status...</p>
      </div>
    );
  }

  // ⚠️ Server down fallback UI
  if (!serverUp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] text-white font-serif text-center px-6">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">⚡ Server Unavailable</h1>
        <p className="text-lg mb-6">
          The magic seems unstable right now... Our servers are temporarily down.  
          Please try again later.
        </p>
        <button
          onClick={checkServer}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
