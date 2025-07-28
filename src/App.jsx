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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage onSignUp={() => window.location.href = '/signup'} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/user" element={<ErrorBoundary><UserPage /></ErrorBoundary>} />
        <Route path="/uploads" element={<UploadsPage />} />
        <Route path="/upload" element={<Navigate to="/uploads" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/thrift" element={<ThriftPage />} />
        <Route path="/stylist-chat" element={<StylistChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;