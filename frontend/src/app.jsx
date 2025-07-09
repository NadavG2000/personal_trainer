import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import OnboardingPage from "@/pages/Onboarding";
import MenuPage from "@/pages/Menu";
import WorkoutPlanPage from "@/pages/WorkoutPlan";
import ProfilePage from "@/pages/Profile";
import LoginPage from "@/pages/Login";

// Simple Auth Context
const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  // Simulate user session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (userObj) => {
    setUser(userObj);
    localStorage.setItem("user", JSON.stringify(userObj));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/onboarding" />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="workout" element={<WorkoutPlanPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}
