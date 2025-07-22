import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadsPage from "./UploadsPage.jsx";
import HomePage from "./HomePage.jsx";
import UserPage from "./UserPage.jsx";
import SignUpPage from "./SignUpPage.jsx";
import SignInPage from "./SignInPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage onSignUp={() => window.location.href = '/signup'} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/uploads" element={<UploadsPage />} />
        <Route path="/upload" element={<Navigate to="/uploads" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;