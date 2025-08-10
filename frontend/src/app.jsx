import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import OnboardingPage from "@/pages/Onboarding";
import MenuPage from "@/pages/Menu";
import WorkoutPlanPage from "@/pages/WorkoutPlan";
import ProgressPage from "@/pages/Progress";
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

function RequireOnboarding({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  // Check onboarding completion from localStorage
  const onboardingComplete = Boolean(localStorage.getItem("userProfileData"));

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // If not onboarding and not on onboarding page, redirect
  if (!onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  // If onboarding complete and on onboarding page, redirect to menu
  if (onboardingComplete && location.pathname === "/onboarding") {
    return <Navigate to="/menu" replace />;
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
            <RequireOnboarding>
              <Layout />
            </RequireOnboarding>
          }
        >
          <Route index element={<Navigate to="/menu" />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="workout" element={<WorkoutPlanPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}
