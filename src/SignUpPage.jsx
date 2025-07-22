import React, { useState, useRef, useEffect } from "react";
import "./SignUpPage.css";
import html2canvas from "html2canvas";
import logo from "./assets/logo.png";
import axios from "axios";
import pic from "./assets/pic.jpg";
import favStar from "./assets/fav-star.webp";

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

  await axios.post('http://localhost:3000/users/me/avatar', formData, {
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

  // Auto-rotate carousel
  useEffect(() => {
    if (carouselPaused || avatarLocked) return;
    const interval = setInterval(() => {
      handleNextAvatar();
    }, 2500);
    return () => clearInterval(interval);
  }, [carouselPaused, avatarLocked, selectedAvatarIdx]);

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
      const signupResponse = await axios.post("http://localhost:3000/auth/signup", {
        username: form.username,
        email: form.email,
        password: form.password,
        security_question: form.securityQuestion,
        security_answer: form.securityAnswer,
      });

      // 2. Log in to get JWT token (if signup doesn't return it)
      const loginResponse = await axios.post("http://localhost:3000/auth/signin", {
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
            <div className="desktop-window-content" style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 32 }}>
              {/* Left: Upload photo (optional) */}
              <div className="magazine-photo-section" style={{ minWidth: 200, maxWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label htmlFor="photo-upload" className="magazine-avatar-label">
                  <img src={photoPreview || pic} alt="Your Avatar" className="magazine-avatar magazine-avatar-uploadable" style={{ width: 160, height: 160, objectFit: 'cover' }} />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                  <div className="magazine-photo-label" style={{ textAlign: 'center', marginTop: 12 }}>{photo ? "Change Photo" : "Upload Photo (optional)"}</div>
                </label>
                {/* Avatar picker required label and carousel directly below upload photo */}
                <div className="avatar-picker-label" style={{ margin: '18px 0 6px 0', fontWeight: 600, color: '#7c3aed', fontSize: '1.08rem', textAlign: 'center' }}>Pick Your Avatar <span style={{ color: '#d72660', fontWeight: 700 }}>*</span></div>
                <div
                  className={`carousel-avatar-picker${carouselAnimating ? ' animating' : ''}`}
                  onMouseEnter={() => setCarouselPaused(true)}
                  onMouseLeave={() => setCarouselPaused(false)}
                >
                  <button className="avatar-arrow-btn" onClick={handlePrevAvatar} aria-label="Previous Avatar" disabled={avatarLocked}>◀</button>
                  <div className="carousel-avatar-list" style={{ justifyContent: 'center' }}>
                    <img
                      src={AVATAR_IMAGES[selectedAvatarIdx === null ? 0 : selectedAvatarIdx]}
                      alt={`Avatar ${(selectedAvatarIdx === null ? 0 : selectedAvatarIdx) + 1}`}
                      className={`carousel-avatar-img selected${avatarLocked ? ' locked' : ''}`}
                      style={{ opacity: 1, transform: 'scale(1)', zIndex: 2, border: avatarLocked ? '3px solid #22c55e' : '3px solid #7c3aed', height: 180, width: 90 }}
                      onClick={() => { if (!avatarLocked) setAvatarError(""); }}
                    />
                  </div>
                  <button className="avatar-arrow-btn" onClick={handleNextAvatar} aria-label="Next Avatar" disabled={avatarLocked}>▶</button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  {!avatarLocked ? (
                    <button className="avatar-select-btn" style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: '1.08rem', cursor: 'pointer', marginTop: 6, boxShadow: '0 2px 8px #b7e6e044', transition: 'background 0.18s' }}
                      onClick={() => { setAvatarLocked(true); setAvatarError(""); }}
                      disabled={selectedAvatarIdx === null}
                    >Select</button>
                  ) : (
                    <button className="avatar-select-btn" style={{ background: '#b0b0b0', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: '1.08rem', cursor: 'pointer', marginTop: 6, boxShadow: '0 2px 8px #b7e6e044', transition: 'background 0.18s' }}
                      onClick={() => setAvatarLocked(false)}
                    >Change</button>
                  )}
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                  <img src={favStar} alt="Favorite Star" style={{ width: 100, height: 100, filter: 'drop-shadow(0 2px 8px #b7e6e0)', display: 'block' }} />
                </div>
                {avatarError && <div style={{ color: '#d72660', fontWeight: 600, marginTop: 4 }}>{avatarError}</div>}
              </div>
              {/* Right: Form fields */}
              <div style={{ flex: 1, minWidth: 260, maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <form className="magazine-signup-form" onSubmit={handleSubmit}>
                  <label className="magazine-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Your Username"
                    value={form.username}
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
                  <button type="submit" className="magazine-signup-btn" style={{ marginTop: 18 }}>Sign Up</button>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, width: '100%' }}>
                    <button
                      type="button"
                      className="google-auth-btn"
                      style={{
                        flex: 1,
                        background: '#fff',
                        color: '#232323',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: '1.08rem',
                        padding: '10px 0',
                        boxShadow: '0 2px 8px #e3f6fd44',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        transition: 'background 0.18s, border 0.18s',
                      }}
                      onClick={() => alert('Google sign up coming soon!')}
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 22, height: 22, marginRight: 8 }} />
                      Sign up with Google
                    </button>
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
