import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadsPage from "./UploadsPage.jsx";
import HomePage from "./HomePage.jsx";
import UserPage from "./UserPage.jsx";
import SignUpPage from "./SignUpPage.jsx";
import SignInPage from "./SignInPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import ThriftPage from "./ThriftPage.jsx";
import StylistChatPage from "./StylistChatPage.jsx";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  
  if (!token) {
    // Redirect to signin if no token found
    return <Navigate to="/signin" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage onSignUp={() => window.location.href = '/signup'} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Protected Routes */}
        <Route path="/user" element={
          <ProtectedRoute>
            <ErrorBoundary><UserPage /></ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/uploads" element={
          <ProtectedRoute>
            <UploadsPage />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={<Navigate to="/uploads" replace />} />
        <Route path="/thrift" element={
          <ProtectedRoute>
            <ThriftPage />
          </ProtectedRoute>
        } />
        <Route path="/stylist-chat" element={
          <ProtectedRoute>
            <StylistChatPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;