import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

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

  // For storing all outfits (if you have an outfits endpoint)
  const [outfits, setOutfits] = useState([]);
  const [currentOutfitId, setCurrentOutfitId] = useState(null); // Track the current try-on outfit ID

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      window.location.href = "/signin";
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    axios.get("http://localhost:3000/users/me", {
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
    axios.get("http://localhost:3000/clothing-items", {
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
    axios.get("http://localhost:3000/outfits", {
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
      await axios.post("http://localhost:3000/users/me/avatar", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh avatar
      const res = await axios.get("http://localhost:3000/users/me", {
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
    setLoadingTryOn(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const res = await axios.post(
        "http://localhost:3000/outfits/generate-avatar",
        { topId: selectedTopId, bottomId: selectedBottomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedAvatarUrl(res.data.generated_avatar_url);
      setCurrentOutfitId(res.data.outfit_id); // Save the generated outfit ID
    } catch (err) {
      alert("Failed to generate try-on image.");
    }
    setLoadingTryOn(false);
  };

  // PATCH to favorite or recurring
  const handleFavorite = async () => {
    if (!currentOutfitId) return;
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    await axios.patch(`http://localhost:3000/outfits/${currentOutfitId}`,
      { is_favorite: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Optionally, refetch outfits or update state
  };
  const handleRecurring = async () => {
    if (!currentOutfitId) return;
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    await axios.patch(`http://localhost:3000/outfits/${currentOutfitId}`,
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

  if (loading) return <div>Loading your closet...</div>;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      background: "inherit"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "row",
        width: "90vw",
        maxWidth: 1100,
        margin: "40px auto 0 auto",
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
          <div style={{
            marginTop: 16,
            color: "#7c3aed",
            fontWeight: 600,
            fontSize: 18,
            textAlign: "center"
          }}>
            Add to Worn
          </div>
          <button
            style={{
              marginTop: 8,
              background: "#e0e7ff",
              color: "#7c3aed",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              padding: "6px 18px",
              cursor: "pointer"
            }}
            onClick={handleRecurring}
          >
            Add to Recurring
          </button>
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
        {/* Closet Grid */}
        <div style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
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
          {/* Add (+) button */}
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
              alignSelf: "center",
              justifySelf: "center"
            }}
            title="Add new item"
          >+</button>
        </div>
      </div>
      {/* Bottom Buttons */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 24,
        marginTop: 32
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
            cursor: "pointer",
            boxShadow: "0 2px 8px #e3f6fd44"
          }}
          onClick={() => {
            setBuildMode(true);
            setSelectedTopId(null);
            setSelectedBottomId(null);
            setGeneratedAvatarUrl(null);
          }}
        >
          Build your own
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
      {/* AI Try-On Controls */}
      {buildMode && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <h4 style={{ color: '#7c3aed', fontWeight: 700 }}>Select a Top and a Bottom to try on!</h4>
          <div style={{ margin: '12px 0' }}>
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>Selected Top: </span>
            {selectedTopId ? closetItems.find(i => i.id === selectedTopId)?.label || closetItems.find(i => i.id === selectedTopId)?.title : 'None'}
            <span style={{ marginLeft: 24, color: '#7c3aed', fontWeight: 600 }}>Selected Bottom: </span>
            {selectedBottomId ? closetItems.find(i => i.id === selectedBottomId)?.label || closetItems.find(i => i.id === selectedBottomId)?.title : 'None'}
          </div>
          <button
            onClick={handleTryOn}
            disabled={!selectedTopId || !selectedBottomId || loadingTryOn}
            style={{ marginTop: 8, fontWeight: 600, fontSize: 18, padding: '10px 32px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: (!selectedTopId || !selectedBottomId || loadingTryOn) ? 'not-allowed' : 'pointer' }}
          >
            {loadingTryOn ? "Generating outfit..." : "Try On"}
          </button>
          <button
            onClick={() => {
              setBuildMode(false);
              setSelectedTopId(null);
              setSelectedBottomId(null);
              setGeneratedAvatarUrl(null);
            }}
            style={{ marginLeft: 16, fontWeight: 600, fontSize: 18, padding: '10px 32px', borderRadius: 8, background: '#eee', color: '#232323', border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPage; 