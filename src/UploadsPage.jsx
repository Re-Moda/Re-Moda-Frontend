import React, { useRef, useState } from "react";
import axios from "axios";
import favStar from "./assets/fav-star.webp";
import "./UploadsPage.css";

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

// Helper: Generate random animation for a star
const animationNames = ['moveX', 'moveY', 'moveXY'];
function getRandomAnimation() {
  const name = animationNames[Math.floor(Math.random() * animationNames.length)];
  const duration = 8 + Math.random() * 12; // 8s to 20s
  const delay = Math.random() * 10; // 0-10s
  return {
    animation: `${name} ${duration}s linear infinite`,
    animationDelay: `${delay}s`
  };
}

export default function UploadsPage() {
  const fileInputRef = useRef();
  const [images, setImages] = useState([]); // { url, name, category, status: 'pending'|'uploading'|'success'|'error', errorMsg }
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // Count successful uploads by category
  const categoryCounts = images.reduce((acc, img) => {
    if (img.status === 'success') {
      acc[img.category] = (acc[img.category] || 0) + 1;
    }
    return acc;
  }, { Top: 0, Bottom: 0, Shoe: 0 });

  // Minimum requirements
  const canContinue = categoryCounts.Top >= 2 && categoryCounts.Bottom >= 2;

  // Handle file selection
  const handleFiles = (files) => {
    const newImages = Array.from(files).map(file => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onload = e => resolve({ url: e.target.result, name: file.name, category: null, status: 'pending' });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(newImages).then(imgs => setImages(prev => [...prev, ...imgs]));
  };

  // Handle drag-and-drop
  const handleDrop = e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // Handle category selection
  const handleCategoryChange = (idx, category) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, category } : img));
  };

  // Handle upload for a single image
  const uploadClothingItem = async (img, idx) => {
    setImages(prev => prev.map((item, i) => i === idx ? { ...item, status: 'uploading', errorMsg: null } : item));
    try {
      const file = dataURLtoFile(img.url, img.name);
      const jwtToken = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', img.category);
      await axios.post('http://localhost:3000/clothing-items/upload', formData, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      // Only update the status of the uploaded image, do NOT reset or replace the array
      setImages(prev => prev.map((item, i) => i === idx ? { ...item, status: 'success' } : item));
      setNotification({ type: 'success', message: 'File uploaded successfully! 1 item added to your wardrobe.' });
    } catch (error) {
      setImages(prev => prev.map((item, i) => i === idx ? { ...item, status: 'error', errorMsg: 'Upload failed.' } : item));
      setNotification({ type: 'error', message: 'Upload failed. Please try again.' });
    }
  };

  // Handle upload for all images with selected category and not yet uploaded
  const handleUpload = () => {
    images.forEach((img, idx) => {
      if (img.category && img.status === 'pending') {
        uploadClothingItem(img, idx);
      }
    });
  };

  // Handle Continue to Closet
  const handleContinue = () => {
    if (canContinue) {
      window.location.href = "/user";
    }
  };

  // Dismiss notification after 2.5s
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Progress bar helper
  const ProgressBar = ({ value, max }) => (
    <div style={{ background: '#ede9fe', borderRadius: 8, height: 8, width: '100%', margin: '6px 0' }}>
      <div style={{ background: '#a78bfa', height: 8, borderRadius: 8, width: `${(value / max) * 100}%`, transition: 'width 0.3s' }} />
    </div>
  );

  // Generate 60 random star positions and animations
  const stars = Array.from({ length: 60 }).map((_, i) => {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = 18 + Math.random() * 52; // 18px to 70px
    const opacity = 0.18 + Math.random() * 0.45; // 0.18 to 0.63
    const anim = getRandomAnimation();
    const style = {
      position: 'absolute',
      zIndex: 0,
      pointerEvents: 'none',
      opacity,
      width: size,
      height: size,
      top: `${top}%`,
      left: `${left}%`,
      filter: 'drop-shadow(0 2px 8px #b7e6e0)',
      ...anim
    };
    return <img src={favStar} alt="star" key={i} style={style} />;
  });

  console.log("Current images state:", images);

  return (
    <>
      {/* Animated star background, always behind content */}
      <div className="star-bg">{stars}</div>
      {/* Main content, always above stars */}
      <div className="uploads-bg" style={{ minHeight: '100vh', fontFamily: 'Crimson Text, serif', position: 'relative', zIndex: 2 }}>
        {/* Decorative stars */}
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto', padding: '32px 0 0 0' }}>
          <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 28, letterSpacing: 0.5 }}>Build Your Digital Wardrobe</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#f3e8ff', color: '#a78bfa', borderRadius: 16, padding: '4px 16px', fontWeight: 600, fontSize: 16 }}>{images.filter(img => img.status === 'success').length} items processed</div>
            <div style={{ background: '#fee2e2', color: '#d72660', borderRadius: 16, padding: '4px 16px', fontWeight: 600, fontSize: 16 }}>Need {Math.max(0, 4 - (categoryCounts.Top + categoryCounts.Bottom))} more items</div>
            <button onClick={handleContinue} disabled={!canContinue} style={{ background: canContinue ? '#a78bfa' : '#ede9fe', color: canContinue ? '#fff' : '#a78bfa', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, padding: '10px 32px', cursor: canContinue ? 'pointer' : 'not-allowed', transition: 'background 0.18s' }}>Continue to Closet</button>
          </div>
        </div>
        {/* Main content */}
        <div className="uploads-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 40, maxWidth: 1100, margin: '32px auto' }}>
          {/* Main card */}
          <div className="uploads-main-card" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px #e3f6fd44', padding: 40, flex: 1, minWidth: 420, maxWidth: 540 }}>
            <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Initialize Your Digital Closet</div>
            <div style={{ color: '#444', fontSize: 17, marginBottom: 18 }}>Upload high-quality images of your garments to build your personalized style analytics profile.</div>
            <div style={{ background: '#f3e8ff', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 18 }}>Minimum Upload Requirements</span>
              <span style={{ color: '#444', fontSize: 15 }}>Upload at least <b>2 tops</b> and <b>2 bottoms</b> to unlock advanced AI styling recommendations and personalized wardrobe analytics.</span>
            </div>
            {/* Upload area */}
            <div
              className="uploads-dropzone"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              style={{ border: '2px dashed #a78bfa', borderRadius: 16, padding: 36, textAlign: 'center', background: '#fafaff', marginBottom: 24, cursor: 'pointer' }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)}
              />
              <div style={{ fontSize: 48, color: '#a78bfa', marginBottom: 8 }}>⬆️</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#232323', marginBottom: 4 }}>Upload Garment Images</div>
              <div style={{ color: '#444', fontSize: 15, marginBottom: 8 }}>Drag and drop your photos here, or click to browse your files</div>
              <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: 15 }}>Browse Files &bull; JPG, PNG, JPEG</div>
            </div>
            {/* Uploaded images list */}
            {images.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16, background: '#f8fafc', borderRadius: 10, padding: 10 }}>
                    <img src={img.url} alt={img.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #a78bfa' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#232323', fontSize: 16 }}>{img.name}</div>
                      <div style={{ color: '#7c3aed', fontWeight: 500, fontSize: 15, marginTop: 2 }}>
                        <select
                          value={img.category || ''}
                          onChange={e => handleCategoryChange(idx, e.target.value)}
                          disabled={img.status === 'uploading' || img.status === 'success'}
                          style={{ fontSize: 15, borderRadius: 6, border: '1px solid #a78bfa', padding: '2px 8px', marginRight: 8 }}
                        >
                          <option value="" disabled>Select category</option>
                          {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {img.status === 'pending' && img.category && (
                          <button onClick={() => uploadClothingItem(img, idx)} style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '4px 14px', cursor: 'pointer', marginLeft: 8 }}>Upload</button>
                        )}
                        {img.status === 'uploading' && <span style={{ color: '#a78bfa', marginLeft: 8 }}>Uploading...</span>}
                        {img.status === 'success' && <span style={{ color: '#22c55e', marginLeft: 8 }}>Uploaded!</span>}
                        {img.status === 'error' && <span style={{ color: '#d72660', marginLeft: 8 }}>{img.errorMsg}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Sidebar */}
          <div className="uploads-sidebar" style={{ minWidth: 320, maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Category Analysis */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #e3f6fd44', padding: 24, marginBottom: 8 }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Category Analysis</div>
              <div style={{ color: '#444', fontSize: 15, marginBottom: 4 }}>Organize items for optimal AI recommendations</div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600, color: '#232323', fontSize: 15 }}>Tops <span style={{ float: 'right' }}>{categoryCounts.Top}/2</span></div>
                <ProgressBar value={categoryCounts.Top} max={2} />
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Shirts, blouses, sweaters</div>
                <div style={{ fontWeight: 600, color: '#232323', fontSize: 15 }}>Bottoms <span style={{ float: 'right' }}>{categoryCounts.Bottom}/2</span></div>
                <ProgressBar value={categoryCounts.Bottom} max={2} />
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Jeans, pants, skirts</div>
                <div style={{ fontWeight: 600, color: '#232323', fontSize: 15 }}>Shoes <span style={{ float: 'right' }}>{categoryCounts.Shoe}/2</span></div>
                <ProgressBar value={categoryCounts.Shoe} max={2} />
                <div style={{ color: '#888', fontSize: 13 }}>Sneakers, heels, boots</div>
              </div>
            </div>
            {/* Setup Progress */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #e3f6fd44', padding: 24, marginBottom: 8 }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Setup Progress</div>
              <div style={{ fontWeight: 600, color: '#232323', fontSize: 15, marginBottom: 4 }}>Overall Progress <span style={{ float: 'right' }}>{categoryCounts.Top + categoryCounts.Bottom}/4</span></div>
              <ProgressBar value={categoryCounts.Top + categoryCounts.Bottom} max={4} />
              <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>Almost there! Upload {Math.max(0, 4 - (categoryCounts.Top + categoryCounts.Bottom))} more items to complete your wardrobe initialization.</div>
            </div>
            {/* Optimization Tips */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #e3f6fd44', padding: 24 }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Optimization Tips</div>
              <ul style={{ color: '#444', fontSize: 15, paddingLeft: 18, margin: 0 }}>
                <li style={{ marginBottom: 6 }}><span style={{ color: '#a78bfa', fontWeight: 700, marginRight: 6 }}>•</span>Use clean, well-lit backgrounds for optimal AI recognition accuracy</li>
                <li style={{ marginBottom: 6 }}><span style={{ color: '#a78bfa', fontWeight: 700, marginRight: 6 }}>•</span>Include multiple angles and lighting conditions for comprehensive analysis</li>
                <li><span style={{ color: '#a78bfa', fontWeight: 700, marginRight: 6 }}>•</span>Focus on frequently worn items for personalized recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* Notification */}
      {notification && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: notification.type === 'success' ? '#d1fae5' : '#fee2e2', color: notification.type === 'success' ? '#065f46' : '#b91c1c', borderRadius: 12, padding: '18px 32px', fontWeight: 600, fontSize: 17, boxShadow: '0 2px 12px #e3f6fd44', zIndex: 1000 }}>
          {notification.message}
        </div>
      )}
    </>
  );
}
