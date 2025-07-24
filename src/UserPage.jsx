import React, { useState, useEffect } from "react";
import axios from "axios";
// Removed: import avatar from "./assets/avatar.png";

const categories = [
  { key: "all", label: "All" },
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "shoes", label: "Shoes" },
  { key: "favs", label: "Favs" },
  { key: "recurr", label: "Recurr." },
  { key: "unused", label: "unused" }
];

const closetCategories = [
  { key: "all", label: "All" },
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "shoes", label: "Shoes" }
];

const UserPage = () => {
  const [closetItems, setClosetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      window.location.href = "/signin";
    }
  }, []);

  useEffect(() => {
    const jwtToken = sessionStorage.getItem("token");
    axios.get("http://localhost:3000/users/me", {
      headers: { Authorization: `Bearer ${jwtToken}` }
    }).then(res => setAvatarUrl(res.data.avatar_url));
  }, []);

  useEffect(() => {
    const fetchCloset = async () => {
      const jwtToken = sessionStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:3000/clothing-items", {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        // Use response.data.data for the items array
        setClosetItems(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
        setClosetItems([]);
      }
      setLoading(false);
    };
    fetchCloset();
  }, []);

  if (loading) return <div>Loading your closet...</div>;

  // Filter by selected category (for closet grid)
  const filteredItems = closetItems.filter(item =>
    selectedCategory === "all"
      ? true
      : (item.category || item.tag)?.toLowerCase() === selectedCategory
  );

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
          <span style={{
            position: "absolute",
            top: 12,
            left: 24,
            fontSize: 32,
            color: "#e25555"
          }}>❤️</span>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
                  style={{ 
                width: 180,
                height: 180,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 2px 12px #e3f6fd44",
                marginBottom: 16
              }}
                />
              ) : (
            <div style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              fontSize: 64,
              color: "#a78bfa"
            }}>
              <span role="img" aria-label="avatar placeholder">👤</span>
            </div>
          )}
          <div style={{
            marginTop: 16,
            color: "#7c3aed",
            fontWeight: 600,
            fontSize: 18,
            textAlign: "center"
          }}>
            Add to Worn
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
                textAlign: "center"
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
        <button style={{
          background: "#e0e7ff",
          color: "#232323",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 18,
          padding: "14px 32px",
          cursor: "pointer",
          boxShadow: "0 2px 8px #e3f6fd44"
        }}>
          Build your own
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
    </div>
  );
};

export default UserPage; 