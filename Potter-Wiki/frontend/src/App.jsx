import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import AdminRoute from "./components/AdminRoute";
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

const App = () => {
  const Layout = () => {
    const location = useLocation();

    // Hide Header on specific pages
    const hideHeader =
      location.pathname === "/" ||
      location.pathname.startsWith("/characters/") ||
      location.pathname.startsWith("/spells/") ||
      location.pathname.startsWith("/students/") ||
      location.pathname.startsWith("/staff/") ||
      location.pathname.startsWith("/dashboard") ||
      ["/login", "/register", "/profile", "/dashboard"].includes(location.pathname);

    // Hide Footer on login/register/home
    const hideFooter = ["/login", "/register", "/"].includes(location.pathname);

    return (
      <>
        <BackToTopButton />
        <Navbar />

        {!hideHeader && <Header />}

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

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <p className="text-center mt-20 text-red-500">404: Page not found</p>
            }
          />
        </Routes>

        {!hideFooter && <Footer />}
      </>
    );
  };

  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
};

export default App;
