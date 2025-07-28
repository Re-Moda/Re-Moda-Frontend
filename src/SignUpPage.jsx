import React, { useState, useRef, useEffect } from "react";
import "./SignUpPage.css";
import html2canvas from "html2canvas";
import logo from "./assets/logo.png";
import axios from "axios";
import pic from "./assets/pic.jpg";
import favStar from "./assets/fav-star.webp";
import API_BASE_URL from './config.js';

// Use Vite's import.meta.glob to import all avatar images
const avatarModules = import.meta.glob('./assets/avatars/*.{png,jpg,jpeg,webp}', { eager: true });
const AVATAR_IMAGES = Object.values(avatarModules)
  .map(mod => mod.default)
  .sort((a, b) => a.localeCompare(b));

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

const IdCard = React.forwardRef(({ username, email, photo, avatarType }, ref) => (
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
        <div className="idcard-year">{CURRENT_YEAR}
          <div className="idcard-role" style={{ fontSize: '1.1rem', color: '#b48bbd', fontWeight: 'bold', marginTop: '2px', letterSpacing: '0.08em' }}>Stylist</div>
        </div>
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

// Helper to copy computed styles from src to dest recursively
function copyComputedStyles(src, dest) {
  const computed = window.getComputedStyle(src);
  for (let key of computed) {
    dest.style[key] = computed.getPropertyValue(key);
  }
  for (let i = 0; i < src.children.length; i++) {
    if (dest.children[i]) {
      copyComputedStyles(src.children[i], dest.children[i]);
    }
  }
}

// Helper: Convert asset avatar URL to File
const fetchAvatarAsFile = async (avatarUrl) => {
  const response = await fetch(avatarUrl);
  const blob = await response.blob();
  return new File([blob], "avatar.png", { type: blob.type });
};

// Helper: Upload avatar to backend
const uploadAvatar = async (avatarFile, jwtToken) => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);

  await axios.post(`${API_BASE_URL}/users/me/avatar`, formData, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

const SignUpPage = () => {
  const [step, setStep] = useState(1); // Start directly on the profile form
  const [avatarType] = useState("boy"); // Default to boy icon
  const [form, setForm] = useState({
    username: "",
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
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(null); // avatar is required
  const [avatarError, setAvatarError] = useState("");
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselAnimating, setCarouselAnimating] = useState(false);
  const [avatarLocked, setAvatarLocked] = useState(false);

  // Arrow handlers for horizontal avatar carousel (with animation)
  const handlePrevAvatar = (e) => {
    if (e) e.preventDefault();
    if (selectedAvatarIdx === null) return setSelectedAvatarIdx(0);
    setCarouselAnimating(true);
    setTimeout(() => {
      setSelectedAvatarIdx((idx) => (idx - 1 + AVATAR_IMAGES.length) % AVATAR_IMAGES.length);
      setCarouselAnimating(false);
    }, 200);
  };
  const handleNextAvatar = (e) => {
    if (e) e.preventDefault();
    if (selectedAvatarIdx === null) return setSelectedAvatarIdx(0);
    setCarouselAnimating(true);
    setTimeout(() => {
      setSelectedAvatarIdx((idx) => (idx + 1) % AVATAR_IMAGES.length);
      setCarouselAnimating(false);
    }, 200);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAvatarIdx === null || !avatarLocked) {
      setAvatarError("Please select and lock in your avatar.");
      return;
    }
    setAvatarError("");

    try {
      // 1. Sign up the user
      const signupResponse = await axios.post(`${API_BASE_URL}/auth/signup`, {
        username: form.username,
        email: form.email,
        password: form.password,
        security_question: form.securityQuestion,
        security_answer: form.securityAnswer,
      });

      // 2. Log in to get JWT token (if signup doesn't return it)
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
        username: form.username,
        password: form.password,
      });
      const jwtToken = loginResponse.data.token;

      // 3. Prepare avatar file (user photo or selected asset)
      let avatarFile;
      if (photo) {
        avatarFile = photo;
      } else if (selectedAvatarIdx !== null) {
        avatarFile = await fetchAvatarAsFile(AVATAR_IMAGES[selectedAvatarIdx]);
      }

      // 4. Upload avatar if available
      if (avatarFile) {
        await uploadAvatar(avatarFile, jwtToken);
      }

      // ...rest of your animation and UI logic
    setShowAnimation(true);
    // If a photo was uploaded, wait for photoPreview to be set before showing the card
    if (photo && !photoPreview) {
      await new Promise((resolve) => {
        const check = () => {
          if (photoPreview) resolve();
          else setTimeout(check, 50);
        };
        check();
      });
    }
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
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setAvatarError("That username or email is already taken. Please choose another.");
      } else {
        setAvatarError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleSaveCard = async () => {
    if (!idCardRef.current) return;

    // Clone the card and append to body for a clean capture
    const clone = idCardRef.current.cloneNode(true);
    copyComputedStyles(idCardRef.current, clone); // <-- Copy styles!
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.opacity = '1';
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.display = 'block';
    document.body.appendChild(clone);

    // Wait for all images in the clone to load
    const images = clone.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = img.onerror = resolve;
      });
    }));

    // Wait a short time for rendering
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Capture the clone
    const canvas = await window.html2canvas
      ? window.html2canvas(clone, { backgroundColor: null, useCORS: true })
      : await import('html2canvas').then(m => m.default(clone, { backgroundColor: null, useCORS: true }));

    document.body.removeChild(clone);

    if (!canvas) {
      alert('Failed to capture the card.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    if (!dataUrl || dataUrl.length < 100) {
      alert('The downloaded image is empty. Please make sure your card is visible and try again.');
      return;
    }
    const link = document.createElement('a');
    link.download = 'remoda-id-card.png';
    link.href = dataUrl;
    link.click();
  };

  const goToProfile = () => {
    // Redirect to sign in page after card creation
    window.location.href = "/signin";
  };

  return (
    <div className={`magazine-signup-bg ${bgClass}`} style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {step === 1 && (
          <div className={`desktop-window${showAnimation ? " window-slide-out" : ""}`} style={{ zIndex: 2, opacity: showIdCard ? 0.5 : 1, transition: 'opacity 0.5s' }}>
            <div className="desktop-titlebar">
              <div className="window-controls">
                <span className="window-dot red"></span>
                <span className="window-dot yellow"></span>
                <span className="window-dot green"></span>
              </div>
              Sign Up
            </div>
            <div className="desktop-window-content" style={{ flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 48, padding: '1.2rem 1.5rem', minHeight: 500, height: '100%', overflow: 'auto' }}>
              {/* Avatar selector takes up half the window */}
              <div className="carousel-column" style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', minWidth: 120, height: '100%', overflow: 'hidden', position: 'relative' }}>
                <button
                  onClick={() => window.location.href = '/'}
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: 4,
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
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className={`carousel-avatar-picker${carouselAnimating ? ' animating' : ''}`}
                    onMouseEnter={() => setCarouselPaused(true)}
                    onMouseLeave={() => setCarouselPaused(false)}
                    style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                  >
                    <button className="avatar-arrow-btn" onClick={handlePrevAvatar} aria-label="Previous Avatar" disabled={avatarLocked} style={avatarLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>◀</button>
                    <div className="carousel-avatar-list" style={{ justifyContent: 'center', width: '100%', display: 'flex', alignItems: 'center', height: '100%', position: 'relative' }}>
                      <img
                        src={AVATAR_IMAGES[selectedAvatarIdx === null ? 0 : selectedAvatarIdx]}
                        alt={`Avatar ${(selectedAvatarIdx === null ? 0 : selectedAvatarIdx) + 1}`}
                        className={`carousel-avatar-img selected${avatarLocked ? ' locked' : ''}`}
                        style={{
                          width: '98%',
                          height: '98%',
                          maxWidth: '1000px',
                          maxHeight: '600px',
                          minWidth: '320px',
                          minHeight: '400px',
                          objectFit: 'contain',
                          margin: '-10px 0 0 0',
                          display: 'block',
                          borderRadius: '2.5rem',
                          boxShadow: '0 4px 32px #e6d6fa33',
                          border: avatarLocked ? '3px solid #cdfa9c' : '3px solid #b0b0ff',
                          background: avatarLocked ? '#f7c7db' : 'transparent',
                        }}
                        onClick={() => { if (!avatarLocked) setAvatarError(""); }}
                      />
                      <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translate(-50%, 50%)', zIndex: 3 }}>
                        {!avatarLocked ? (
                          <button className="avatar-select-btn" style={{ background: '#bfaeec', color: '#7c3aed', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px #b7e6e044', transition: 'background 0.18s' }}
                            onClick={() => { setAvatarLocked(true); setAvatarError(""); }}
                            disabled={selectedAvatarIdx === null}
                          >Select</button>
                        ) : (
                          <button className="avatar-select-btn" style={{
                            background: avatarLocked ? '#f7c7db' : '#bfaeec',
                            color: avatarLocked ? '#d72660' : '#7c3aed',
                            border: avatarLocked ? '2px solid #f7c7db' : 'none',
                            borderRadius: 8,
                            padding: '8px 24px',
                            fontWeight: 600,
                            fontSize: '1.08rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #b7e6e044',
                            transition: 'background 0.18s, color 0.18s, border 0.18s',
                          }}
                            onClick={() => setAvatarLocked(false)}
                          >Change</button>
                        )}
                      </div>
                    </div>
                    <button className="avatar-arrow-btn" onClick={handleNextAvatar} aria-label="Next Avatar" disabled={avatarLocked} style={avatarLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>▶</button>
                  </div>
                  {avatarError && <div style={{ color: '#d72660', fontWeight: 600, marginTop: 4 }}>{avatarError}</div>}
                </div>
              </div>
              {/* Right: Form fields */}
              <div className="form-scrollable" style={{ flex: '1 1 0', minWidth: 320, maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', height: '100%' }}>
                <form className="magazine-signup-form" onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                    <label htmlFor="photo-upload-inline" style={{ cursor: 'pointer', marginRight: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
                      <div style={{ position: 'relative', width: 140, height: 140 }}>
                        <img
                          src={photoPreview || pic}
                          alt="Profile"
                          style={{ width: 140, height: 140, borderRadius: '22px', objectFit: 'cover', border: '2.5px solid #bfaeec', background: '#fff', boxShadow: '0 1px 8px #e6d6fa44', transition: 'box-shadow 0.2s' }}
                        />
                        <label htmlFor="photo-upload-inline" style={{
                          position: 'absolute',
                          bottom: -8,
                          right: -8,
                          background: '#fff',
                          borderRadius: '50%',
                          boxShadow: '0 1.5px 6px #b0b0ff33',
                          padding: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #b0b0ff',
                          zIndex: 10,
                          width: 26,
                          height: 26,
                        }}>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.3 9.3-2.12.71.71-2.12 9.3-9.3zM3 17h14v2H3v-2z" fill="#7c3aed"/>
                          </svg>
                  <input
                            id="photo-upload-inline"
                    type="file"
                    accept="image/*"
                            style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 220, maxWidth: '100%', marginTop: 0 }}>
                      <label className="magazine-label" style={{ marginTop: 12 }}>Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Your Username"
                  value={form.username}
                  onChange={handleChange}
                        className="magazine-signup-input"
                        required
                        autoComplete="username"
                        style={{ marginBottom: 8, minWidth: 120, maxWidth: 260, width: '100%' }}
                      />
                      <label className="magazine-label">Password</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="magazine-signup-input"
                  required
                        autoComplete="new-password"
                        style={{ minWidth: 120, maxWidth: 260, width: '100%' }}
                />
                    </div>
                  </div>
                <label className="magazine-label">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@moda.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                <label className="magazine-label">Security Question</label>
                <select
                  name="securityQuestion"
                  value={form.securityQuestion}
                  onChange={handleChange}
                  className="magazine-signup-select"
                  required
                        style={{ width: '100%' }}
                >
                  {securityQuestions.map((q, i) => (
                    <option key={i} value={q}>{q}</option>
                  ))}
                </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                <label className="magazine-label">Security Answer</label>
                <input
                  type="text"
                  name="securityAnswer"
                  placeholder="Your Answer"
                  value={form.securityAnswer}
                  onChange={handleChange}
                        className="magazine-signup-input"
                  required
                        style={{ marginLeft: 12, flex: 1, maxWidth: 260, minWidth: 120 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 18, width: '100%' }}>
                    <button type="submit" className="magazine-signup-btn" style={{
                      flex: 0.6,
                      marginTop: 0,
                      background: '#e3f0ff',
                      color: '#3a5a8c',
                      border: '2px solid #b0b0ff',
                      borderRadius: '0.7rem',
                      boxShadow: '0 2px 8px #b0b0ff33, 0 1.5px 0 #fff inset',
                      fontWeight: 700,
                      fontFamily: 'Poppins, Arial, sans-serif',
                      fontSize: '1.08rem',
                      padding: '10px 0',
                      letterSpacing: '0.04em',
                      transition: 'background 0.18s, box-shadow 0.18s',
                      outline: 'none',
                      cursor: 'pointer',
                    }}>Sign Up</button>
                    <button
                      type="button"
                      className="google-auth-btn"
                      style={{
                        flex: 1.4,
                        background: '#e3f0ff',
                        color: '#3a5a8c',
                        border: '2px solid #b0b0ff',
                        borderRadius: '0.7rem',
                        boxShadow: '0 2px 8px #b0b0ff33, 0 1.5px 0 #fff inset',
                        fontWeight: 700,
                        fontSize: '1.08rem',
                        padding: '10px 0',
                        marginLeft: 12,
                        fontFamily: 'Poppins, Arial, sans-serif',
                        letterSpacing: '0.04em',
                        outline: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      onClick={() => alert('Google sign up coming soon!')}
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 22, height: 22, marginRight: 8 }} />
                      <span style={{ fontWeight: 700, fontSize: '1.08rem' }}>Sign Up with Google</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
                    <span style={{ fontSize: '1rem', color: '#7c3aed', textAlign: 'center', width: '100%' }}>
                      Already have an account? <a href="/signin" className="signin-link" style={{ color: '#3a5a8c', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
                      <style>{`
                        .signin-link:hover {
                          text-decoration: underline;
                        }
                      `}</style>
                    </span>
                  </div>
              </form>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            </div>
          </div>
        )}
        {/* Right: Avatar Carousel */}
        {/* Removed avatar carousel section */}
        {showIdCard && (
          <div className={startCardAnim ? "idcard-twirl-in" : ""} style={{ position: 'absolute', left: 0, right: 0, margin: 'auto', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <IdCard ref={idCardRef} username={form.username} email={form.email} photo={photoPreview} avatarType={selectedAvatarIdx} />
            <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1.2rem' }}>
              <button className="magazine-signup-btn download-btn" onClick={handleSaveCard} aria-label="Download ID Card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="4" y="17" width="16" height="4" rx="2" fill="currentColor"/>
                </svg>
              </button>
              <button className="magazine-signup-btn" onClick={goToProfile}>Sign In</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
