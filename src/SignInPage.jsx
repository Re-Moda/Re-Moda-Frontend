import React, { useState, useRef } from "react";
import "./SignUpPage.css";
import "./SignInPage.css";
import logo from "./assets/logo.png";
import axios from "axios";
import API_BASE_URL from './config.js';

const CURRENT_YEAR = new Date().getFullYear();

const BoyIcon = ({ size = 100 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="24" r="14" fill="#888888"/>
    <rect x="18" y="38" width="28" height="18" rx="8" fill="#888888"/>
  </svg>
);

const GirlIcon = ({ size = 100 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="24" r="14" fill="#888888"/>
    <rect x="18" y="38" width="28" height="18" rx="8" fill="#888888"/>
    <ellipse cx="24" cy="48" rx="4" ry="8" fill="#888888"/>
    <ellipse cx="40" cy="48" rx="4" ry="8" fill="#888888"/>
  </svg>
);

const IdCard = React.forwardRef(({ username, photo, avatarType }, ref) => (
  <div className="idcard-vertical" ref={ref}>
    <div className="idcard-sidebar">
      <span className="idcard-vertical-brand">RE:MODA</span>
    </div>
    <div className="idcard-main">
      <div className="idcard-photo-wrapper">
        {photo ? (
          <img src={photo} alt="User Avatar" className="idcard-photo" />
        ) : avatarType === "girl" ? (
          <GirlIcon size={120} />
        ) : (
          <BoyIcon size={120} />
        )}
      </div>
      <div className="idcard-fields">
        <div className="idcard-field">
          <span className="idcard-label">USER</span>
          <span className="idcard-value idcard-line">{username}</span>
        </div>
        <div className="idcard-field">
          <span className="idcard-label">ID</span>
          <span className="idcard-value idcard-line">MODA-{CURRENT_YEAR}</span>
        </div>
      </div>
      <div className="idcard-bottom-row">
        <div className="idcard-seal">
          <img src={logo} alt="Re:Moda Logo Sticker" className="idcard-seal-logo" />
        </div>
        <div className="idcard-year">{CURRENT_YEAR}</div>
      </div>
    </div>
  </div>
));

const SignInPage = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showIdCard, setShowIdCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Placeholder user data for demo
  const userData = {
    name: "Jane Doe",
    username: form.username,
    avatarType: "boy",
    photo: null
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setShowIdCard(false);
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        username: form.username,  // payload to send to backend
        password: form.password
      })
      sessionStorage.setItem("token", response.data.token);  // save token to session storage
      setShowIdCard(true);
      setTimeout(() => {
        setLoading(false);
        window.location.href = "/uploads";
      }, 2000);
      console.log("Sign in successful.", response.data);
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        setErrorMsg("Incorrect username or password. Please try again.");
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
      console.error("Error signing in.", error);
    }
  };

  return (
    <div className="magazine-signup-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        {!showIdCard ? (
          <div className="desktop-window">
            <div className="desktop-titlebar">
            <button
                  onClick={() => window.location.href = '/'}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 5,
                    zIndex: 20,
                    background: '#e3f0ff',
                    color: '#3a5a8c',
                    border: '2px solid #b0b0ff',
                    borderRadius: '1.2rem',
                    fontWeight: 600,
                    fontSize: '0.98rem',
                    padding: '6px 18px',
                    boxShadow: '0 1.5px 6px #b0b0ff33',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >Go Back Home</button>
              <div className="window-controls">
                <span className="window-dot red"></span>
                <span className="window-dot yellow"></span>
                <span className="window-dot green"></span>
              </div>
              Sign In
            </div>
            <div className="desktop-window-content">
              <form className="magazine-signup-form" onSubmit={handleSignIn} style={{ minWidth: 320 }}>
                <label className="magazine-label">Username</label>
                <input
                  type="username"
                  name="username"
                  placeholder="Your Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
                <label className="magazine-label">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                {errorMsg && <div style={{ color: '#d72660', fontWeight: 600, margin: '8px 0', textAlign: 'center' }}>{errorMsg}</div>}
                <button type="submit" className="magazine-signup-btn">Sign In</button>
                <button
                  type="button"
                  className="magazine-signup-btn"
                  style={{
                    marginTop: 10,
                    background: 'linear-gradient(90deg, #ede9fe 0%, #c4b5fd 100%)',
                    color: '#7c3aed',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '1.08rem',
                    width: '100%',
                    boxShadow: '0 2px 8px #e3f6fd44',
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                    letterSpacing: 0.01,
                  }}
                  onClick={() => window.location.href = '/forgot-password'}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="magazine-signup-btn"
                  style={{
                    marginTop: 10,
                    background: '#ede9fe',
                    color: '#7c3aed',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '1.08rem',
                    width: '100%',
                    boxShadow: '0 2px 8px #e3f6fd44',
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                    marginBottom: 10,
                  }}
                  onClick={() => window.location.href = '/signup'}
                >
                  Back to Sign Up
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="idcard-twirl-in" style={{ position: 'absolute', left: 0, right: 0, margin: 'auto', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <IdCard username={userData.username} photo={userData.photo} avatarType={userData.avatarType} />
            {loading && (
              <div style={{ width: 220, marginTop: 24, textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Logging in...</div>
                <div className="signin-loading-bar">
                  <div className="signin-loading-bar-inner" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInPage;
