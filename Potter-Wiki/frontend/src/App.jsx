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
import NotFound from "./pages/NotFound";
const App = () => {
  const Layout = () => {
    const location = useLocation();

    // ✅ Route metadata map
    const routeMeta = {
      "/": { showFooter: true },
      "/characters": { showFooter: true },
      "/characters/:id": { showFooter: true },
      "/spells": { showFooter: true },
      "/spells/:id": { showFooter: true },
      "/students": { showFooter: true },
      "/students/:id": { showFooter: true },
      "/staff": { showFooter: true },
      "/staff/:id": { showFooter: true },
      "/profile": { showFooter: true },
      "/login": { showFooter: false },
      "/login/*": { showFooter: false },
      "/register": { showFooter: false },
      "/register/*": { showFooter: false },
      "/dashboard": { showFooter: false },
      "/dashboard/*": { showFooter: false },
    };

    // ✅ Match route prefix dynamically
    const hideFooter = Object.entries(routeMeta).some(([path, meta]) =>
      location.pathname.startsWith(path.replace("/*", "")) && meta.showFooter === false
    );

    const showHeader = /^\/(characters|spells|students|staff)\/?$/i.test(location.pathname);
    const hideHeader = !showHeader;

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0B0B0B] via-[#111111] to-[#1a1a1a] text-white font-sans">
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
          <Route path="/login/*" element={<NotFound message="Page not found" backPath="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/*" element={<NotFound message="Page not found" backPath="/register" />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin dashboard routes */}
          <Route path="/dashboard/*" element={<AdminDashboard />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {!hideFooter && <Footer />}
      </div>
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