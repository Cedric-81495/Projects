// frontend/src/context/AuthProvider.jsx
import { useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("user")) || null;
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err);
        localStorage.removeItem("user");
        return null;
      }
    });

    const login = (userData) => {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      // This will log user data object
      //console.log("User from localStorage:", localStorage.getItem("user"));
      //console.log("Login response:", userData);
      console.log("AuthProvider mounted");
    };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};