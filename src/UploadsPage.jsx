import React, { useRef, useState } from "react";
import "./UploadsPage.css";
import axios from "axios";
import favStar from "./assets/fav-star.webp";

const CATEGORY_OPTIONS = ["Top", "Bottom", "Shoe"];

// Helper: Convert dataURL to File
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, {type:mime});
}

// Helper: Upload a single clothing item to backend
const uploadClothingItem = async (file, jwtToken) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await axios.post('http://localhost:3000/clothing-items/upload', formData, {
    headers: { Authorization: `Bearer ${jwtToken}` }
  });
  return response.data; // contains AI-generated image, description, tag, etc.
};

export default function UploadsPage() {
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);

  // Count tops and bottoms
  const topsCount = images.filter(img => img.category === "Top").length;
  const bottomsCount = images.filter(img => img.category === "Bottom").length;

  // Only enable continue if at least 2 tops and 2 bottoms
  const canContinue = topsCount >= 2 && bottomsCount >= 2;

  // Progress bar: 2 tops + 2 bottoms = 100%
  const progressPercent = Math.min((topsCount / 2 + bottomsCount / 2) * 50, 100);

  const handleBack = () => {
    window.location.href = "/";
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [
          ...prev,
          { url: ev.target.result, name: file.name, category: null }
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCategorySelect = (idx, category) => {
    setImages((prev) => prev.map((img, i) => i === idx ? { ...img, category } : img));
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    const jwtToken = sessionStorage.getItem("token");
    const uploadedItems = [];
    for (const img of images) {
      const file = dataURLtoFile(img.url, img.name);
      const result = await uploadClothingItem(file, jwtToken);
      uploadedItems.push(result);
    }
    sessionStorage.setItem("closetItems", JSON.stringify(uploadedItems));
    window.location.href = "/user";
  };

  return (
    <>
      <div className="uploads-animated-bg"></div>
      {/* Decorative stars - replace src with your own PNGs if desired */}
      <img src={favStar} alt="star" style={{ position: 'absolute', top: 40, left: 30, width: 48, opacity: 0.7, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', top: 120, right: 60, width: 32, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', bottom: 60, left: 80, width: 36, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', top: 80, left: 120, width: 28, opacity: 0.45, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', top: 200, left: 60, width: 22, opacity: 0.38, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', top: 30, right: 120, width: 38, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', bottom: 120, right: 80, width: 30, opacity: 0.42, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', bottom: 40, right: 30, width: 40, opacity: 0.55, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', bottom: 100, left: 160, width: 24, opacity: 0.33, pointerEvents: 'none', zIndex: 0 }} />
      <img src={favStar} alt="star" style={{ position: 'absolute', top: 180, right: 180, width: 26, opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />
      <div className="uploads-bg">
        <div className="uploads-container">
          {/* Header Progress Bar */}
          <div className="uploads-header-row">
            <div className="uploads-header-left">
              <button className="uploads-back-btn" onClick={handleBack}>← Back</button>
              <span className="uploads-step">Upload Wardrobe</span>
              <span className="uploads-step-sub">Step 1 of your Re:Moda journey</span>
            </div>
            <div className="uploads-header-right">
              <span className="uploads-progress-label">{images.length} items uploaded</span>
              <span className="uploads-progress-need">Need {Math.max(0, 2 - topsCount)} more tops, {Math.max(0, 2 - bottomsCount)} more bottoms</span>
              <button className="uploads-continue-btn" disabled={!canContinue} onClick={handleContinue}>Continue to Closet</button>
            </div>
          </div>
          <div className="uploads-progress-bar">
            <div className="uploads-progress-bar-inner" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="uploads-main-grid">
            {/* Left Main Card */}
            <div className="uploads-main-left">
              <div className="uploads-card uploads-main-card">
                <h1 className="uploads-title">Let's digitize your wardrobe! ✨</h1>
                <div className="uploads-subtitle">Upload photos of your clothing to start building your sustainable style profile.</div>
                <div className="uploads-alert">
                  <span className="uploads-alert-star">★</span>
                  <span className="uploads-alert-text"><b>Getting started:</b> Upload at least 2 tops & 2 bottoms to unlock your digital closet and AI stylist features.</span>
                </div>
                <div className="uploads-upload-box" onClick={handleBrowseClick} style={{ cursor: "pointer" }}>
                  <div className="uploads-upload-icon">⬆️</div>
                  <div className="uploads-upload-title">Upload your clothing photos</div>
                  <div className="uploads-upload-desc">Drag and drop images here, or click to browse your files</div>
                  <div className="uploads-upload-options">
                    <span className="uploads-browse-link" onClick={e => { e.stopPropagation(); handleBrowseClick(); }}>🗂️ Browse files</span>
                    <span className="uploads-dot">•</span>
                    <span>JPG, PNG, JPEG</span>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
                {/* Thumbnails */}
                {images.length > 0 && (
                  <div className="uploads-thumbnails-row">
                    {images.map((img, idx) => (
                      <div className="uploads-thumbnail uploads-thumbnail-xlarge" key={idx}>
                        <img src={img.url} alt={img.name} className="uploads-thumb-img uploads-thumb-img-xlarge" />
                        <button className="uploads-thumb-remove" onClick={e => { e.stopPropagation(); handleRemoveImage(idx); }} title="Remove">×</button>
                        {!img.category && (
                          <div className="uploads-category-select">
                            <span className="uploads-category-select-label">Is this a:</span>
                            {CATEGORY_OPTIONS.map(opt => (
                              <button
                                key={opt}
                                className="uploads-category-btn"
                                onClick={e => { e.stopPropagation(); handleCategorySelect(idx, opt); }}
                                title={opt}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {img.category && (
                          <div className="uploads-category-selected">{img.category}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="uploads-main-right">
              <div className="uploads-card uploads-categories-card">
                <div className="uploads-card-title">Categories Guide</div>
                <div className="uploads-card-desc">Organize your items for better AI recommendations</div>
                <div className="uploads-categories-list">
                  <div className="uploads-category-row">Tops <span className="uploads-category-desc">T-shirts, blouses, sweaters</span> <span className="uploads-category-count">{topsCount}</span></div>
                  <div className="uploads-category-row">Bottoms <span className="uploads-category-desc">Jeans, pants, skirts</span> <span className="uploads-category-count">{bottomsCount}</span></div>
                  <div className="uploads-category-row">Shoes <span className="uploads-category-desc">Sneakers, heels, boots</span> <span className="uploads-category-count">0</span></div>
                </div>
              </div>
              <div className="uploads-card uploads-progress-card">
                <div className="uploads-card-title">Your Progress</div>
                <div className="uploads-progress-list">
                  <div className="uploads-progress-row">Tops <span className="uploads-progress-count">{topsCount}/2</span>{topsCount >= 2 && <span style={{color:'#7c3aed',marginLeft:6}}>✓</span>}</div>
                  <div className="uploads-progress-row">Bottoms <span className="uploads-progress-count">{bottomsCount}/2</span>{bottomsCount >= 2 && <span style={{color:'#7c3aed',marginLeft:6}}>✓</span>}</div>
                  <div className="uploads-progress-almost">Almost there! Upload {Math.max(0,2-topsCount)} more tops and {Math.max(0,2-bottomsCount)} more bottoms</div>
                </div>
              </div>
              <div className="uploads-card uploads-tips-card">
                <div className="uploads-card-title">Pro Tips</div>
                <ul className="uploads-tips-list">
                  <li>Take photos on a clean background for better AI recognition</li>
                  <li>Include different angles and lighting for variety</li>
                  <li>Upload items you love and wear regularly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
