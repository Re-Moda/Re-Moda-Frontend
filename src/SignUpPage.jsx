import React, { useState, useRef } from "react";
import "./SignUpPage.css";
import html2canvas from "html2canvas";
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

const PlaceholderPhoto = () => (
  <div className="idcard-photo-placeholder">
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="22" r="12" fill="#e0e0e0" />
      <rect x="12" y="38" width="36" height="14" rx="7" fill="#e0e0e0" />
    </svg>
  </div>
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

const securityQuestions = [
  "What is your favorite color?",
  "What was the name of your first pet?",
  "What is your mother’s maiden name?",
  "What city were you born in?",
  "What is your favorite food?"
];

const SignUpPage = () => {
  const [step, setStep] = useState(1); // Start directly on the profile form
  const [avatarType] = useState("boy"); // Default to boy icon
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    securityQuestion: securityQuestions[0],
    securityAnswer: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [bgClass, setBgClass] = useState("");
  const [startCardAnim, setStartCardAnim] = useState(false);
  const idCardRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowAnimation(true);
    setTimeout(() => {
      setShowIdCard(true);
      setBgClass("idcard-bg");
      setStartCardAnim(true);
    }, 700);
    setTimeout(() => {
      setShowAnimation(false);
      setStep(2);
      setSubmitted(true);
    }, 1100);
  };

  const handleSaveCard = async () => {
    if (idCardRef.current) {
      const canvas = await html2canvas(idCardRef.current, { backgroundColor: null });
      const link = document.createElement("a");
      link.download = `remoda-id-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const goToProfile = () => {
    // Redirect to sign in page after card creation
    window.location.href = "/signin";
  };

  return (
    <div className={`magazine-signup-bg ${bgClass}`} style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        {step === 1 && (
          <div className={`desktop-window${showAnimation ? " window-slide-out" : ""}`} style={{ position: 'absolute', left: 0, right: 0, margin: 'auto', zIndex: 2, opacity: showIdCard ? 0.5 : 1, transition: 'opacity 0.5s' }}>
            <div className="desktop-titlebar">
              <div className="window-controls">
                <span className="window-dot red"></span>
                <span className="window-dot yellow"></span>
                <span className="window-dot green"></span>
              </div>
              Create Your Profile
            </div>
            <div className="desktop-window-content">
              <div className="magazine-photo-section">
                <label htmlFor="photo-upload" className="magazine-avatar-label">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Your Avatar" className="magazine-avatar magazine-avatar-uploadable" />
                  ) : (
                    <BoyIcon size={120} />
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                  <div className="magazine-photo-label">{photo ? "Change Photo" : "Upload Photo (optional)"}</div>
                </label>
              </div>
              <form className="magazine-signup-form" onSubmit={handleSubmit}>
                <label className="magazine-label">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
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
                <label className="magazine-label">Security Question</label>
                <select
                  name="securityQuestion"
                  value={form.securityQuestion}
                  onChange={handleChange}
                  className="magazine-signup-select"
                  required
                >
                  {securityQuestions.map((q, i) => (
                    <option key={i} value={q}>{q}</option>
                  ))}
                </select>
                <label className="magazine-label">Security Answer</label>
                <input
                  type="text"
                  name="securityAnswer"
                  placeholder="Your Answer"
                  value={form.securityAnswer}
                  onChange={handleChange}
                  required
                />
                <button type="submit" className="magazine-signup-btn">Sign Up</button>
              </form>
            </div>
          </div>
        )}
        {showIdCard && (
          <div className={startCardAnim ? "idcard-twirl-in" : ""} style={{ position: 'absolute', left: 0, right: 0, margin: 'auto', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <IdCard ref={idCardRef} name={form.name} email={form.email} photo={photoPreview} avatarType={avatarType} />
            <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1.2rem' }}>
              <button className="magazine-signup-btn" onClick={handleSaveCard}>Save Card</button>
              <button className="magazine-signup-btn" onClick={goToProfile}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
