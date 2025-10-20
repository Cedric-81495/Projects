// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Navbar from "./components/Navbar";
//import Header from "./components/Header";
//import AdminRoute from "./components/AdminRoute";
import Footer from "./components/Footer";
import Home from "./pages/Home";
// import Characters from "./pages/Characters";
// import Spells from "./pages/Spells";
// import Students from "./pages/Students";
// import Staff from "./pages/Staff";
//import Login from "./pages/Login";
//import Register from "./pages/Register";
// import Profile from "./pages/Profile";
//import AdminDashboard from "./pages/AdminDashboard";
//import CharacterDetail from "./pages/CharacterDetail";
//import SpellsDetail from "./pages/SpellsDetail";
//import StaffDetail from "./pages/StaffDetail";
//import StudentsDetail from "./pages/StudentsDetail";
import BackToTopButton from "./pages/BackToTopButton";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Router>
        <BackToTopButton />
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<CharacterDetail />} />
          <Route path="/spells" element={<Spells />} />
          <Route path="/spells/:id" element={<SpellsDetail />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentsDetail />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/staff/:id" element={<StaffDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/*" element={<AdminDashboard />} />*/}
          <Route path="*" element={<NotFound />} /> 
        </Routes>

        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;