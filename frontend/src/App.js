import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import FeedbackForm from "./components/FeedbackForm";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [currentView, setCurrentView] = useState("landing");

  const navigate = (view) => setCurrentView(view);

  return (
    <>
      {currentView === "landing" && <LandingPage navigate={navigate} />}
      {currentView === "customer" && <FeedbackForm navigate={navigate} />}
      {currentView === "admin-login" && <AdminLogin navigate={navigate} />}
      {currentView === "admin-dashboard" && <AdminDashboard navigate={navigate} />}
    </>
  );
}