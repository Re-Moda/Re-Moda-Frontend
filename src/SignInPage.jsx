import React, { useState, useRef } from "react";
import "./SignUpPage.css";
import logo from "./assets/logo.png";

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

const IdCard = React.forwardRef(({ name, email, photo, avatarType }, ref) => (
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
          <span className="idcard-label">NAME</span>
          <span className="idcard-value idcard-line">{name}</span>
        </div>
        <div className="idcard-field">
          <span className="idcard-label">EMAIL</span>
          <span className="idcard-value idcard-line">{email}</span>
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
  const [form, setForm] = useState({ email: "", password: "" });
  const [showIdCard, setShowIdCard] = useState(false);
  const [loading, setLoading] = useState(false);
  // Placeholder user data for demo
  const userData = {
    name: "Jane Doe",
    email: form.email,
    avatarType: "boy",
    photo: null
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setShowIdCard(true);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/user";
    }, 2000);
  };

  return (
    <div className="magazine-signup-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        {!showIdCard ? (
          <div className="desktop-window">
            <div className="desktop-titlebar">
              <div className="window-controls">
                <span className="window-dot red"></span>
                <span className="window-dot yellow"></span>
                <span className="window-dot green"></span>
              </div>
              Sign In
            </div>
            <div className="desktop-window-content">
              <form className="magazine-signup-form" onSubmit={handleSignIn} style={{ minWidth: 320 }}>
                <label className="magazine-label">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@moda.com"
                  value={form.email}
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
                <button type="submit" className="magazine-signup-btn">Sign In</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="idcard-twirl-in" style={{ position: 'absolute', left: 0, right: 0, margin: 'auto', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <IdCard name={userData.name} email={userData.email} photo={userData.photo} avatarType={userData.avatarType} />
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
