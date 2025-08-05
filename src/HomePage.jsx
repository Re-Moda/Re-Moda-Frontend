import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom"; // Removed
import "./HomePage.css";
import logo from "./assets/logo.png";
import model from "./assets/model.jpg";
import model2 from "./assets/model2.jpg";
import model3 from "./assets/model3.jpg";
import model4 from "./assets/model4.jpg";
import model5 from "./assets/model5.jpg";
import model6 from "./assets/model6.jpg";
import model7 from "./assets/model7.mp4";
import model8 from "./assets/model8.jpg";
import Paola from "./assets/Paola.png";
import Sarvesh from "./assets/Sarvesh.png";
import Liliana from "./assets/Liliana.jpg";


const HomePage = (props) => {
  // const navigate = useNavigate(); // Removed
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [isAuthenticated, setIsAuthenticated] = useState(false);

 // Check authentication status on component mount
 useEffect(() => {
 const token = sessionStorage.getItem('token') || localStorage.getItem('token');
 setIsAuthenticated(!!token);
 }, []);

  const scrollToMission = () => {
    const missionSection = document.getElementById('mission-section');
    if (missionSection) {
      missionSection.scrollIntoView({ behavior: 'smooth' });
    }
 setIsMobileMenuOpen(false); // Close mobile menu after clicking
  };

  const handleLogin = () => {
    window.location.href = "/signin";
 setIsMobileMenuOpen(false); // Close mobile menu after clicking
 };

 const handleSignUp = () => {
 props.onSignUp();
 setIsMobileMenuOpen(false); // Close mobile menu after clicking
 };

 const handleMyCloset = () => {
 window.location.href = "/user";
 setIsMobileMenuOpen(false); // Close mobile menu after clicking
 };

 const handleLogout = () => {
 // Clear authentication tokens
 sessionStorage.removeItem('token');
 localStorage.removeItem('token');
 // Update authentication state
 setIsAuthenticated(false);
 // Redirect to home page
 window.location.href = "/";
 setIsMobileMenuOpen(false); // Close mobile menu after clicking
 };

 const toggleMobileMenu = () => {
 setIsMobileMenuOpen(!isMobileMenuOpen);
 setIsSearchOpen(false); // Close search when opening menu
 };

 const toggleSearch = () => {
 setIsSearchOpen(!isSearchOpen);
 setIsMobileMenuOpen(false); // Close menu when opening search
 };

 const handleSearchEnter = (e) => {
 if (e.key === 'Enter') {
 // Handle search functionality here
 console.log('Search submitted:', e.target.value);
 // You can add your search logic here
 }
 };

 const handleSearchSubmit = () => {
 // Handle search button click
 const searchInput = document.querySelector('.mobile-search-input');
 if (searchInput) {
 console.log('Search submitted:', searchInput.value);
 // You can add your search logic here
 }
  };

  return (
 <>
      <div className="logo-overlay">
        <img src={logo} alt="Re:Moda Logo" className="site-logo" />
      </div>
      
      <div className="homepage-container">

      <nav className="navbar">
        <div className="navbar-content">
 {/* Desktop search bar */}
 {/* <div className="searchbar">
            <input type="text" placeholder="Search styles..." />
            <button className="search-button">Enter</button>
 </div> */}
 
 {/* Mobile search button */}
 {/* <div className={`mobile-search-button ${isSearchOpen ? 'active' : ''}`} onClick={toggleSearch}></div> */}
 
 {/* Hamburger menu button */}
 <div className="hamburger-menu" onClick={toggleMobileMenu}>
 <span></span>
 <span></span>
 <span></span>
 </div>
 
 {/* Desktop navigation */}
 <div className="nav-buttons">
 <button onClick={scrollToMission}>About Us</button>
 {isAuthenticated ? (
 <>
 <button onClick={handleMyCloset}>My Closet</button>
 <button onClick={handleLogout}>Logout</button>
 </>
 ) : (
 <>
 <button onClick={handleLogin}>Sign In</button>
 <button onClick={handleSignUp}>Sign Up</button>
 </>
 )}
 </div>
 </div>
 
 {/* Mobile search bar */}
 {/* <div className={`mobile-search-bar ${isSearchOpen ? 'active' : ''}`}>
 <div className="mobile-search-container">
 <input 
 type="text" 
 placeholder="Search styles..." 
 className="mobile-search-input"
 autoFocus={isSearchOpen}
 onKeyPress={handleSearchEnter}
 />
 <button className="mobile-enter-button" onClick={handleSearchSubmit}>Enter</button>
          </div>
 </div> */}
 
 {/* Mobile menu */}
 <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="nav-buttons">
            <button onClick={scrollToMission}>About Us</button>
 {isAuthenticated ? (
 <>
 <button onClick={handleMyCloset}>My Closet</button>
 <button onClick={handleLogout}>Logout</button>
 </>
 ) : (
 <>
            <button onClick={handleLogin}>Sign In</button>
 <button onClick={handleSignUp}>Sign Up</button>
 </>
 )}
          </div>
        </div>
      </nav>

      <div className="banner">
        <img src={model} alt="Fashion Model Banner" className="banner-img" />
        <img src={model2} alt="Scrapbook Side Image" className="banner-side-img model2" />
        <img src={model3} alt="Scrapbook Side Image 3" className="banner-side-img model3" />
        <img src={model4} alt="Scrapbook Side Image 4" className="banner-side-img model4" />
        <div className="banner-text" style={{ top: "510px", right: "40px", left: "auto", zIndex: 14 }}>
          <div className="scrapbook-overlay" style={{ top: "-33px", right: "-10px", left: "auto", bottom: "auto", transform: "rotate(3deg)" }}>
            <p>💖 Express urself freely! 🌟</p>
          </div>
          <h2>Style your truth</h2>
          <p>Transform your closet into a curated collection that evolves with your style 🌼</p>
        </div>
        <div className="banner-text">
          <h2>Welcome to Re:Moda</h2>
 <p>A fresh approach to fashion that's nostalgic, expressive, and kind to the planet ✨</p>
          <div className="scrapbook-overlay">
            <p>🌸 Re:Define ur style! 🌈</p>
          </div>
        </div>
        <img src={model5} alt="Scrapbook Side Image 5" className="banner-side-img model5" />
      </div>

 {/* Mobile scrapbook carousel */}
 <div className="mobile-scrapbook-carousel">
 <div className="mobile-scrapbook-track">
 <img src={model2} alt="Scrapbook Image 1" className="mobile-scrapbook-image" />
 <img src={model3} alt="Scrapbook Image 2" className="mobile-scrapbook-image" />
 <img src={model4} alt="Scrapbook Image 3" className="mobile-scrapbook-image" />
 <img src={model5} alt="Scrapbook Image 4" className="mobile-scrapbook-image" />
 <img src={model6} alt="Scrapbook Image 5" className="mobile-scrapbook-image" />
 <img src={model8} alt="Scrapbook Image 6" className="mobile-scrapbook-image" />
 {/* Duplicate images for seamless loop */}
 <img src={model2} alt="Scrapbook Image 1" className="mobile-scrapbook-image" />
 <img src={model3} alt="Scrapbook Image 2" className="mobile-scrapbook-image" />
 <img src={model4} alt="Scrapbook Image 3" className="mobile-scrapbook-image" />
 <img src={model5} alt="Scrapbook Image 4" className="mobile-scrapbook-image" />
 <img src={model6} alt="Scrapbook Image 5" className="mobile-scrapbook-image" />
 <img src={model8} alt="Scrapbook Image 6" className="mobile-scrapbook-image" />
 </div>
 </div>

      <section className="hero">
        <h1>Welcome to Re:Moda</h1>
        <p>Rediscover your closet with AI-powered styling, Y2K flair, and sustainable fashion magic ✨</p>

        <div id="mission-section" className="mission-section">
          <div className="scrapbook-sticker sticker-flower" style={{ top: "20px", left: "30px" }}></div>
          <div className="scrapbook-sticker sticker-bow" style={{ bottom: "20px", right: "30px" }}></div>
          <div className="scrapbook-sticker sticker-heart" style={{ top: "50%", left: "-20px" }}></div>

          <div className="mission-left-page" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, maxWidth: "50%" }}>
            <div className="mission-text" style={{ width: "100%", maxWidth: "100%", height: "760px", overflowY: "auto", alignSelf: "center" }}>
              <div className="mission-video-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                <video autoPlay loop muted playsInline style={{ width: "80%", maxWidth: "500px", border: "3px dashed #cba1ff", borderRadius: "12px", backgroundColor: "#f7f0ff", padding: "6px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
                  <source src={model7} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <h2>Our Mission</h2>
              <p><strong>Rediscover your style. Revive your wardrobe. Reshape your impact.</strong></p>
              <p>At Re:Moda, we help you fall back in love with the clothes you already own. Our platform turns your closet into a curated collection that evolves with you.</p>
              <p>Style looks, explore upcycling ideas, or donate what no longer sparks joy—all in one beautiful, personalized space.</p>
 <p>Every piece in your wardrobe holds a memory, a moment, a mood. Why not celebrate those stories by giving them new life? With Re:Moda, you can reimagine, restyle, and reinvent—turning everyday outfits into powerful expressions of who you are and where you're headed.</p>
              <p className="caption">Curate your closet. Create your aesthetic. Contribute to the planet.</p>
              <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "22px" }}>
                <img src={model8} alt="Model Display" style={{ width: "185px", border: "3px dashed #ffc0cb", borderRadius: "12px", backgroundColor: "#fff0f5", boxShadow: "4px 4px 12px rgba(0,0,0,0.15)" }} />
              </div>
            </div>
          </div>

          <div className="mission-right-page mission-image" style={{ position: "relative", flex: 1, maxWidth: "50%" }}>
            <img src={model6} alt="Right page image" style={{ width: "100%", maxWidth: "100%", height: "840px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }} />
          </div>
        </div>

 {/* Mobile mission modal */}
 <div className="mobile-mission-modal">
 <div className="mobile-mission-content">
 <div className="mobile-mission-video-wrapper">
 <video autoPlay loop muted playsInline>
 <source src={model7} type="video/mp4" />
 Your browser does not support the video tag.
 </video>
 </div>
 <h2>Our Mission</h2>
 <p><strong>Rediscover your style. Revive your wardrobe. Reshape your impact.</strong></p>
 <p>At Re:Moda, we help you fall back in love with the clothes you already own. Our platform turns your closet into a curated collection that evolves with you.</p>
 <p>Style looks, explore upcycling ideas, or donate what no longer sparks joy—all in one beautiful, personalized space.</p>
 <p>Every piece in your wardrobe holds a memory, a moment, a mood. Why not celebrate those stories by giving them new life? With Re:Moda, you can reimagine, restyle, and reinvent—turning everyday outfits into powerful expressions of who you are and where you're headed.</p>
 <p className="caption">Curate your closet. Create your aesthetic. Contribute to the planet.</p>
 <div className="mobile-mission-image-container">
 <img src={model8} alt="Model Display" />
 </div>
 </div>
 </div>

        <div className="carousel">
          <div className="carousel-track">
            {[
 "🌟 4.3 — \"I never realized how much potential was hiding in my closet until Re:Moda!\"",
 "🌟 4.5 — \"The AI stylist gets my vibe perfectly—every look feels so me!\"",
 "🌟 4.6 — \"Love that I can reuse my clothes in new ways instead of buying more.\"",
 "🌟 4.8 — \"The outfit suggestions are not just smart—they're actually stylish.\"",
 "🌟 5.0 — \"Re:Moda made sustainable fashion fun and personal for me 💕\"",
 "🌟 4.4 — \"Thanks to Re:Moda, I've fallen in love with my wardrobe again.\"",
 "🌟 4.7 — \"I've donated 8 pieces thanks to their upcycling guide!\"",
 "🌟 5.0 — \"Re:Moda helps me feel like a stylist in my own closet 💫\"",
 "🌟 4.9 — \"Perfect for anyone who wants to be more eco-conscious and still look cute.\"",
 "🌟 4.3 — \"Game-changer for minimalist fashion lovers like me.\""
            ].map((review, idx) => (
              <div key={idx} className="review-card">{review}</div>
            ))}
          </div>
        </div>
      </section>

 <section className="founders">
 <h2>Meet Our Founders</h2>
 <div className="founders-container">
 <div className="founder-card" onClick={() => window.open('https://www.linkedin.com/in/paola-negron-lopez/', '_blank')}>
 <div className="founder-image">
 <img src={Paola} alt="Founder 1" />
 </div>
 <div className="founder-info">
 <h3>Paola Negrón-López</h3>
 <p className="founder-university">University of Puerto Rico - Bayamón</p>
 <p className="founder-email">paola.negron13@upr.edu</p>
 </div>
 </div>
 <div className="founder-card" onClick={() => window.open('https://www.linkedin.com/in/sarveshtiku/', '_blank')}>
 <div className="founder-image">
 <img src={Sarvesh} alt="Founder 2" />
 </div>
 <div className="founder-info">
 <h3>Sarvesh Tiku</h3>
 <p className="founder-university">Georgia Institute of Technology</p>
 <p className="founder-email">stiku6@gatech.edu</p>
 </div>
 </div>
 <div className="founder-card" onClick={() => window.open('https://www.linkedin.com/in/liliana-cantero', '_blank')}>
 <div className="founder-image">
 <img src={Liliana} alt="Founder 3" />
 </div>
 <div className="founder-info">
 <h3>Liliana Cantero</h3>
 <p className="founder-university">University of Florida</p>
 <p className="founder-email">lcantero@ufl.edu</p>
 </div>
 </div>
 </div>
 </section>

 <section className="journey-section">
 <div className="journey-content">
 <h2>Start Your Styling Journey</h2>
 <p>Ready to rediscover your wardrobe? Join thousands of users who are already transforming their style with Re:Moda.</p>
 <button className="journey-signup-btn" onClick={handleSignUp}>
 Sign Up Now
 </button>
 </div>
 </section>

      <footer>
 <div className="footer-content">
 <div className="footer-section">
 <p>© 2024 Re:Moda. All rights reserved. Made with ♡ by TechStyle</p>
 </div>
        </div>
      </footer>
 </div>
 </>
  );
};

export default HomePage;
