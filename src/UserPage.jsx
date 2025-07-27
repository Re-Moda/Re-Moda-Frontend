import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from './assets/logo.png';
import API_BASE_URL from './config.js';

const closetCategories = [
  { key: "all", label: "All" },
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "shoes", label: "Shoes" },
  { key: "favourites", label: "Favourites" },
  { key: "recurring", label: "Recurring" }
];

function UserAvatar({ generatedAvatarUrl, avatarUrl, username, uploading, handleAvatarChange, fileInputRef }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {(generatedAvatarUrl || avatarUrl) ? (
        <img
          src={generatedAvatarUrl || avatarUrl}
          alt="User Avatar"
          style={{
            width: 350,
            height: 700, // much taller
            borderRadius: 24,
            objectFit: 'cover',
            border: '3px solid #a78bfa',
            marginBottom: 12,
            background: '#ede9fe',
            display: 'block'
          }}
        />
      ) : (
        <div style={{
          width: 350,
          height: 700, // much taller
          borderRadius: 24,
          border: '2.5px dashed #a78bfa',
          background: '#f3e8ff',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a78bfa',
          fontSize: 64,
          fontWeight: 600
        }}>
          <span role="img" aria-label="avatar placeholder">👤</span>
        </div>
      )}
      <div style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: 20 }}>{username}</div>
      <label style={{ marginTop: 12, color: '#7c3aed', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}>
        {uploading ? "Uploading..." : "Change Avatar"}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleAvatarChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

const UserPage = () => {
  const [closetItems, setClosetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  // AI Try-On states
  const [buildMode, setBuildMode] = useState(false);
  const [selectedTopId, setSelectedTopId] = useState(null);
  const [selectedBottomId, setSelectedBottomId] = useState(null);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState(null);
  const [loadingTryOn, setLoadingTryOn] = useState(false);
  const [currentOutfitId, setCurrentOutfitId] = useState(null); // Only declare once

  // For storing all outfits (if you have an outfits endpoint)
  const [outfits, setOutfits] = useState([]);

  // Coin balance and upload count states
  const [coinBalance, setCoinBalance] = useState(100);
  const [uploadCount, setUploadCount] = useState(0);
  const [canAccessCloset, setCanAccessCloset] = useState(true);
  const [remainingUploads, setRemainingUploads] = useState(0);

  // Debug coin balance changes
  useEffect(() => {
    console.log('Coin balance changed to:', coinBalance);
  }, [coinBalance]);

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      window.location.href = "/signin";
    }
    // Removed any upload-count-based redirect or restriction here
  }, []);

  // Fetch coin balance and upload count
  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      try {
        // Fetch coin balance
        const coinResponse = await axios.get(`${API_BASE_URL}/users/me/coins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Coin response:', coinResponse.data);
        if (coinResponse.data && coinResponse.data.success) {
          const balance = coinResponse.data.data.coin_balance;
          console.log('Setting coin balance to:', balance);
          setCoinBalance(Math.max(0, balance)); // Ensure non-negative
        } else {
          // If backend doesn't have coin balance set, default to 100
          console.log('Backend response not successful, defaulting to 100');
          setCoinBalance(100);
        }

        // Fetch upload count
        const uploadResponse = await axios.get(`${API_BASE_URL}/users/me/upload-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (uploadResponse.data && uploadResponse.data.success) {
          const { count, hasMetMinimum } = uploadResponse.data.data;
          setUploadCount(count);
          setCanAccessCloset(hasMetMinimum);
          setRemainingUploads(4 - count);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If API call fails, set default values
        setCoinBalance(100);
      }
    };

    fetchUserData();
  }, []);

  // Function to spend coins for AI features
  const useAIFeature = async (featureCost = 10) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
      console.log('Current coin balance before spending:', coinBalance);
      
      // Check if user has enough coins
      if (coinBalance < featureCost) {
        alert(`Insufficient coins! You need ${featureCost} coins. Current balance: ${coinBalance}`);
        return false;
      }

      // Spend coins
      const spendResponse = await axios.post(`${API_BASE_URL}/users/me/coins/spend`, 
        { amount: featureCost },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Spend response:', spendResponse.data);
      if (spendResponse.data && spendResponse.data.success) {
        const newBalance = spendResponse.data.data.coin_balance;
        console.log('New coin balance after spending:', newBalance);
        setCoinBalance(Math.max(0, newBalance)); // Ensure non-negative
        return true; // Allow AI feature to proceed
      } else {
        alert('Failed to spend coins. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Error using AI feature:', error);
      // If backend call fails, manually subtract coins
      const newBalance = Math.max(0, coinBalance - featureCost);
      console.log('Backend failed, manually updating balance to:', newBalance);
      setCoinBalance(newBalance);
      return true; // Allow AI feature to proceed
    }
  };

  // Function to add coins (for donations/thrift store)
  const addCoins = async (amount) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/users/me/coins/add`, 
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        setCoinBalance(response.data.data.coin_balance);
        alert(`+${amount} coins added! New balance: ${response.data.data.coin_balance}`);
      }
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    axios.get(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data && res.data.success && res.data.data) {
        setAvatarUrl(res.data.data.avatar_url);
        setUsername(res.data.data.username);
      }
    });
  }, []);

  useEffect(() => {
    const jwtToken = sessionStorage.getItem("token");
    axios.get(`${API_BASE_URL}/clothing-items`, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    }).then(response => {
      setClosetItems(Array.isArray(response.data.data) ? response.data.data : []);
      setLoading(false);
    }).catch(() => {
      setClosetItems([]);
      setLoading(false);
    });
  }, []);

  // Fetch outfits (if you have an endpoint)
  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    axios.get(`${API_BASE_URL}/outfits`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data && Array.isArray(res.data.data)) {
        setOutfits(res.data.data);
      }
    });
  }, []);

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await axios.post(`${API_BASE_URL}/users/me/avatar`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh avatar
      const res = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success && res.data.data) {
        setAvatarUrl(res.data.data.avatar_url);
      }
    } catch (err) {
      alert("Failed to upload avatar.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // AI Try-On handler
  const handleTryOn = async () => {
    // Check if user has enough coins first
    const hasEnoughCoins = await useAIFeature(10);
    if (!hasEnoughCoins) {
      return; // Stop if not enough coins
    }

    setLoadingTryOn(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/outfits/generate-avatar`,
        { topId: selectedTopId, bottomId: selectedBottomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedAvatarUrl(res.data.generated_avatar_url);
      // Optionally, store the outfit ID if your backend returns it:
      // setCurrentOutfitId(res.data.outfit_id);
    } catch (err) {
      alert("Failed to generate try-on image.");
    }
    setLoadingTryOn(false);
  };

  // PATCH to favorite or recurring
  const handleFavorite = async () => {
    if (!currentOutfitId) return;
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    await axios.patch(`${API_BASE_URL}/outfits/${currentOutfitId}`,
      { is_favorite: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Optionally, refetch outfits or update state
  };
  const handleRecurring = async () => {
    if (!currentOutfitId) return;
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    await axios.patch(`${API_BASE_URL}/outfits/${currentOutfitId}`,
      { is_recurring: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Optionally, refetch outfits or update state
  };

  // Update closet filter logic
  const filteredItems = (() => {
    if (selectedCategory === "favourites") {
      return outfits.filter(o => o.is_favorite);
    }
    if (selectedCategory === "recurring") {
      return outfits.filter(o => o.is_recurring);
    }
    return closetItems.filter(item =>
      selectedCategory === "all"
        ? true
        : (item.category || item.tag)?.toLowerCase() === selectedCategory
    );
  })();
  
  // Top and bottom items for try-on
  const tops = closetItems.filter(item => (item.category || item.tag)?.toLowerCase() === 'top');
  const bottoms = closetItems.filter(item => (item.category || item.tag)?.toLowerCase() === 'bottom');

  // Add the moving text animation CSS to the page head if not present
  useEffect(() => {
    if (!document.getElementById('moveTextKeyframes')) {
      const style = document.createElement('style');
      style.id = 'moveTextKeyframes';
      style.innerHTML = `@keyframes moveText { 0% { transform: translateX(100%);} 100% { transform: translateX(-100%);} }`;
      document.head.appendChild(style);
    }
  }, []);

  if (loading) return <div>Loading your closet...</div>;

  return (
    <div style={{
      fontFamily: "'EB Garamond', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      background: "inherit",
      position: "relative"
    }}>
      {/* Logo in top left purple space */}
      <img
        src={logo}
        alt="ReModa Logo"
        style={{
          position: 'fixed',
          top: 16,
          left: 120,
          width: 140,
          height: 'auto',
          zIndex: 101,
          background: 'transparent',
          borderRadius: 18,
          boxShadow: '0 2px 16px #a78bfa22',
          objectFit: 'contain',
        }}
      />
      {/* Selected Top/Bottom display in purple area, right side */}
      <div style={{
        position: 'fixed',
        top: 40,
        right: 40,
        zIndex: 100,
        background: '#ede9fe',
        border: '2px solid #a78bfa',
        borderRadius: 18,
        padding: '24px 32px',
        minWidth: 220,
        boxShadow: '0 2px 16px #a78bfa22',
        fontFamily: "'EB Garamond', serif",
        color: '#7c3aed',
        fontWeight: 700,
        fontSize: 20,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div>
          Selected Top:<br/>
          <span style={{ color: '#232323', fontWeight: 600, fontSize: 18 }}>
            {selectedTopId ? closetItems.find(i => i.id === selectedTopId)?.label || closetItems.find(i => i.id === selectedTopId)?.title : 'None'}
          </span>
        </div>
        <div>
          Selected Bottom:<br/>
          <span style={{ color: '#232323', fontWeight: 600, fontSize: 18 }}>
            {selectedBottomId ? closetItems.find(i => i.id === selectedBottomId)?.label || closetItems.find(i => i.id === selectedBottomId)?.title : 'None'}
          </span>
        </div>
        {/* Try On and Cancel buttons, only in buildMode */}
        {buildMode && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleTryOn}
              disabled={!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10}
              style={{ 
                fontWeight: 600, 
                fontSize: 18, 
                padding: '10px 32px', 
                borderRadius: 8, 
                background: '#7c3aed', 
                color: '#fff', 
                border: 'none', 
                cursor: (!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10) ? 'not-allowed' : 'pointer', 
                marginBottom: 6,
                opacity: (!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10) ? 0.6 : 1
              }}
            >
              {loadingTryOn ? "Generating outfit..." : `Try On (10 coins)`}
            </button>
            <button
              onClick={() => {
                setBuildMode(false);
                setSelectedTopId(null);
                setSelectedBottomId(null);
                setGeneratedAvatarUrl(null); // This will revert to the original avatar
              }}
              style={{ fontWeight: 600, fontSize: 18, padding: '10px 32px', borderRadius: 8, background: '#eee', color: '#232323', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {/* Coin balance display */}
      <div style={{
        position: 'fixed',
        top: 20,
        left: 300,
        zIndex: 1000,
        background: '#fff9c4',
        border: '2px solid #fbbf24',
        borderRadius: 12,
        padding: '12px 20px',
        boxShadow: '0 2px 16px #fbbf2444',
        fontFamily: "'EB Garamond', serif",
        color: '#92400e',
        fontWeight: 700,
        fontSize: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 120
      }}>
        <span style={{ fontSize: 24 }}>🪙</span>
        <span>{Math.max(0, coinBalance)} coins</span>
      </div>

      {/* Upload progress display */}
      {!canAccessCloset && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: 280,
          zIndex: 100,
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: 12,
          padding: '16px 20px',
          boxShadow: '0 2px 16px #f59e0b44',
          fontFamily: "'EB Garamond', serif",
          color: '#92400e',
          fontWeight: 600,
          fontSize: 16,
          minWidth: 200
        }}>
          <div style={{ marginBottom: 8 }}>
            Upload {remainingUploads} more item(s) to access your full closet
          </div>
          <div style={{ marginBottom: 8 }}>
            Current uploads: {uploadCount}/4
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: '#fbbf24',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(uploadCount / 4) * 100}%`,
              height: '100%',
              background: '#f59e0b',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      {/* Top-center button row */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 24,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxWidth: 1400,
        margin: "32px auto 0 auto"
      }}>
        <button
          style={{
            background: "#e0e7ff",
            color: "#232323",
            border: "none",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 18,
            padding: "14px 32px",
            cursor: coinBalance < 10 ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px #e3f6fd44",
            opacity: coinBalance < 10 ? 0.6 : 1
          }}
                      onClick={() => {
              if (coinBalance < 10) {
                alert(`You need 10 coins to use AI Try-On. Current balance: ${coinBalance} coins`);
                return;
              }
            setBuildMode(true);
            setSelectedTopId(null);
            setSelectedBottomId(null);
            setGeneratedAvatarUrl(null);
          }}
        >
          Build your own (10 coins)
        </button>
        <button
          style={{
            background: "#ffe066",
            color: "#232323",
            border: "none",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 18,
            padding: "14px 32px",
            cursor: "pointer",
            boxShadow: "0 2px 8px #e3f6fd44"
          }}
          onClick={() => window.location.href = "/thrift"}
        >
          Get More Coins
        </button>
        <button style={{
          background: "#fff9c4",
          color: "#232323",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 18,
          padding: "14px 32px",
          cursor: "pointer",
          boxShadow: "0 2px 8px #e3f6fd44"
        }}>
          Chat w/ ur stylist
        </button>
      </div>
      {/* Main white card */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        width: "95vw",
        maxWidth: 1400,
        margin: "32px auto 0 auto",
        background: "#fff",
        borderRadius: 32,
        boxShadow: "0 4px 32px #e3f6fd44",
        padding: 32,
        minHeight: 600
      }}>
        {/* Avatar Section */}
        <div style={{
          flex: "0 0 260px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginRight: 32,
          position: "relative"
        }}>
          {/* Heart icon */}
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 24,
              fontSize: 32,
              color: "#e25555",
              cursor: "pointer"
            }}
            onClick={handleFavorite}
            title="Add to Favourites"
          >❤️</span>
          <UserAvatar
            generatedAvatarUrl={generatedAvatarUrl}
            avatarUrl={avatarUrl}
            username={username}
            uploading={uploading}
            handleAvatarChange={handleAvatarChange}
            fileInputRef={fileInputRef}
          />
          {/* Animated moving text under avatar */}
          <div style={{
            marginTop: 24,
            width: '100%',
            textAlign: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontWeight: 700,
            fontSize: 22,
            color: '#7c3aed',
            letterSpacing: 1,
            position: 'relative',
            fontFamily: "'EB Garamond', serif"
          }}>
            <span className="moving-beautiful-text" style={{
              display: 'inline-block',
              animation: 'moveText 7s linear infinite'
            }}>
              No matter what you wear you are beautiful
            </span>
          </div>
        </div>
        {/* Closet Category Filter */}
        <div style={{
          flex: "0 0 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          marginRight: 32
        }}>
          {closetCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                background: selectedCategory === cat.key ? "#e0e7ff" : "transparent",
                color: "#232323",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 18,
                padding: "10px 0",
                marginBottom: 4,
                cursor: "pointer",
                outline: selectedCategory === cat.key ? "2px solid #7c3aed" : "none",
                transition: "background 0.18s"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Closet Grid: 2 items per row */}
        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 32,
          alignContent: "flex-start"
        }}>
          {filteredItems.length === 0 && <div>No items in this category.</div>}
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 12px #e3f6fd44",
                padding: 16,
                width: 200,
                textAlign: "center",
                border: buildMode && ((selectedTopId && selectedTopId === item.id) || (selectedBottomId && selectedBottomId === item.id)) ? '3px solid #7c3aed' : 'none',
                cursor: buildMode ? 'pointer' : 'default',
                opacity: buildMode && ((item.category || item.tag)?.toLowerCase() === 'top' || (item.category || item.tag)?.toLowerCase() === 'bottom') ? 1 : buildMode ? 0.5 : 1
              }}
              onClick={() => {
                if (!buildMode) return;
                if ((item.category || item.tag)?.toLowerCase() === 'top') setSelectedTopId(item.id);
                if ((item.category || item.tag)?.toLowerCase() === 'bottom') setSelectedBottomId(item.id);
              }}
            >
              {/* AI-generated image */}
              <img
                src={item.generatedImageUrl}
                alt={item.label || item.title}
                style={{ width: 120, height: 120, objectFit: "contain", borderRadius: 12, marginBottom: 8 }}
              />
              {/* Original image (optional) */}
              {item.originalImageUrl && (
                <img
                  src={item.originalImageUrl}
                  alt="Original"
                  style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, marginBottom: 8, border: "1px solid #eee" }}
                />
              )}
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{item.label || item.title}</div>
              <div style={{ color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}>{item.category || item.tag}</div>
              <div style={{ color: "#444", fontSize: 15 }}>{item.description}</div>
            </div>
          ))}
          {/* Add (+) button with label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
            <button
              onClick={() => window.location.href = "/uploads"}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "#b3d1f7",
                color: "#fff",
                fontSize: 48,
                fontWeight: 700,
                border: "none",
                boxShadow: "0 2px 12px #e3f6fd44",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Add more clothes"
            >+</button>
            <div style={{
              marginTop: 10,
              color: "#7c3aed",
              fontWeight: 600,
              fontSize: 20,
              fontFamily: "'EB Garamond', serif"
            }}>
              Add more clothes
            </div>
          </div>
        </div>
      </div>
      {/* AI Try-On Controls removed from bottom, now in right box */}
    </div>
  );
};

export default UserPage; 