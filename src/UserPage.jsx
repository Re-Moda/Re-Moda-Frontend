import React, { useState } from "react";
import "./UserPage.css";
import avatar from "./assets/avatar.png";
import model6 from "./assets/model6.jpg";
import model7 from "./assets/model7.mp4";
import model8 from "./assets/model8.jpg";
import shirt from "./assets/shirt.png";

const categories = [
  "All",
  "Shirt",
  "Pant",
  "Acces.",
  "Fav.",
  "Recurr.",
  "unused"
];

const clothes = [
  { 
    type: "shirt", 
    id: 1, 
    tags: ["cotton", "blue"], 
    description: "A comfy blue cotton shirt perfect for casual days. Soft to the touch and breathable fabric that keeps you cool. Great for layering or wearing on its own. Pairs well with denim or khaki pants." 
  },
  { 
    type: "pant", 
    id: 2, 
    tags: ["denim", "black"], 
    description: "Classic black denim pants with a modern fit. Versatile staple that goes with everything in your wardrobe. Comfortable stretch denim that moves with you. Perfect for both casual and dressy occasions." 
  },
  { 
    type: "pant", 
    id: 3, 
    tags: ["linen", "white"], 
    description: "Breezy white linen pants for warm weather. Lightweight and breathable fabric that's perfect for summer days. The natural texture adds character while keeping you cool and comfortable." 
  },
  { 
    type: "shirt", 
    id: 4, 
    tags: ["silk", "pink"], 
    description: "Elegant pink silk blouse with a sophisticated drape. Luxurious fabric that feels amazing against your skin. Perfect for dressing up any outfit while staying comfortable throughout the day." 
  },
  {
    type: "shirt",
    id: 5,
    tags: ["shirt"],
    description: "A fancy shirt accessory!",
    image: shirt
  }
];

const typeLabels = {
  shirt: "Shirt",
  pant: "Pant",
  // Add more types as needed
};

// Helper: Try to extract outfit from LLM response
function extractOutfitFromLLMResponse(response, closetItems) {
  // Look for lines like: Shirt: [name], Pant: [name], Accessory: [name]
  const outfit = {};
  const lines = response.split(/\n|,|;/);
  lines.forEach(line => {
    const match = line.match(/(shirt|pant|accessory)\s*[:\-]?\s*(.+)/i);
    if (match) {
      const type = match[1].toLowerCase();
      const name = match[2].trim();
      // Find closet item by type and name (case-insensitive)
      const item = closetItems.find(
        i => i.type.toLowerCase() === type && i.name && i.name.toLowerCase().includes(name.toLowerCase())
      );
      if (item) outfit[type] = item;
    }
  });
  return outfit;
}

// Helper: Generate images for each clothing piece in an outfit
async function generateOutfitPieceImages(outfit) {
  const pieceEntries = Object.entries(outfit);
  const images = {};
  for (const [type, item] of pieceEntries) {
    let prompt = item.name || item.description || item.tags?.join(", ") || type;
    prompt = `Isolated ${prompt} for a woman, on a transparent background, no model, no mannequin, no person, no background, PNG.`;
    try {
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (response.ok) {
        const data = await response.json();
        images[type] = data.imageUrl;
      }
    } catch (e) {
      // Ignore errors for individual pieces
    }
  }
  return images;
}

const UserPage = (props) => {
  // Modes: 'closet' (default), 'build', or 'chat'
  const [mode, setMode] = useState("closet");
  // Track which cards are flipped (by id)
  const [flipped, setFlipped] = useState({});
  // Track user-edited descriptions by id
  const [descriptions, setDescriptions] = useState(() => {
    const initial = {};
    clothes.forEach((item) => {
      initial[item.id] = item.description;
    });
    return initial;
  });
  // Track worn items by type (e.g., { shirt: {...}, pant: {...} })
  const [wornItems, setWornItems] = useState({});
  // Remove drag state
  // const [dragOver, setDragOver] = useState(false);
  // Track which item description is being shown below the grid
  const [selectedItemId, setSelectedItemId] = useState(null);
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [closetItems, setClosetItems] = useState(clothes);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemType, setNewItemType] = useState("shirt");
  // Remove any state or logic related to avatarImage or setAvatarImage
  // Remove any code that updates wornItems or overlays in response to chat actions or generated images
  // The avatar on the left should always remain the same, regardless of chat activity
  const [pendingOutfit, setPendingOutfit] = useState(null); // For chat outfit suggestion
  const [pendingOutfitImages, setPendingOutfitImages] = useState(null);

  // Remove a worn item by type
  const handleRemove = (type) => {
    setWornItems((prev) => {
      const copy = { ...prev };
      delete copy[type];
      return copy;
    });
  };

  // Remove drag handlers
  // const handleDragStart = (item) => (e) => { ... }
  // const handleDragOver = (e) => { ... }
  // const handleDragLeave = () => { ... }
  // const handleDrop = (e) => { ... }

  // Card click: flip in closet mode, toggle worn in build mode
  const handleCardClick = (id, type, item) => {
    if (mode === "closet") {
      setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
    } else if (mode === "build") {
      if (wornItems[type] && wornItems[type].id === id) {
        handleRemove(type);
      } else {
        setWornItems((prev) => ({ ...prev, [type]: item }));
      }
    }
  };

  // Prevent card flip when clicking on textarea
  const handleTextareaClick = (e) => {
    e.stopPropagation();
  };

  // Reset all cards to front when switching to build mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "build") {
      setFlipped({}); // Flip all cards back to front
      setSelectedItemId(null); // Clear selected item when switching to build mode
    } else if (newMode === "chat") {
      setSelectedItemId(null); // Clear selected item when switching to chat mode
    }
    // Reset pagination when switching modes
    setCurrentPage(0);
    // Don't reset cards when switching back to closet mode - let user control them
  };

  // Handle description edit
  const handleDescChange = (id, value) => {
    setDescriptions((prev) => ({ ...prev, [id]: value }));
  };
  const handleDescBlur = (id, value) => {
    setDescriptions((prev) => ({ ...prev, [id]: value }));
  };
  const handleDescKeyDown = (id, e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
  };

  // Chat functionality
  const sendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);
    setPendingOutfit(null);
    setPendingOutfitImages(null);

    try {
      // Create context about current outfit
      const currentOutfit = Object.entries(wornItems)
        .map(([type, item]) => `${type}: ${item.description || item.tags?.join(", ") || "No description"}`)
        .join(", ");

      // Detect if user is asking for an outfit
      const isOutfitRequest = /show.*outfit|suggest.*outfit|pick.*outfit|choose.*outfit|style.*outfit/i.test(userMessage.content);
      
      // Detect if user is asking for an image
      const isImageRequest = /show.*image|generate.*image|create.*image|picture|photo/i.test(userMessage.content);

      let systemPrompt = `You are a fashion stylist assistant. The user is currently wearing: ${currentOutfit || "No items worn"}. 
      Provide helpful fashion advice, styling tips, and suggestions. Be friendly, knowledgeable, and encouraging. 
      Keep responses concise but informative.`;
      
      if (isOutfitRequest) {
        // Add closet info and ask for a specific outfit
        const closetList = closetItems.map(i => `${i.type}: ${i.name || "(no name)"}`).join(", ");
        systemPrompt += `\nThe user's closet contains: ${closetList}.\nIf the user asks for an outfit, suggest a specific shirt, pant, and accessory by name from their closet. Respond in the format: Shirt: [name], Pant: [name], Accessory: [name] (if available).`;
      }

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          systemPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend API Error:', response.status, response.statusText, errorData);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = { 
        role: "assistant", 
        content: data.choices[0].message.content 
      };
      setChatMessages(prev => [...prev, assistantMessage]);

      // If this was an outfit request, try to parse and update avatar
      if (isOutfitRequest) {
        const outfit = extractOutfitFromLLMResponse(assistantMessage.content, closetItems);
        if (Object.keys(outfit).length > 0) {
          // Instead of updating avatar, show outfit pieces in chat
          setPendingOutfit(outfit);
          setPendingOutfitImages(null);
          // Generate images for each piece
          const images = await generateOutfitPieceImages(outfit);
          setPendingOutfitImages(images);
        }
      }

      // Generate image for outfit requests or explicit image requests
      if (isOutfitRequest || isImageRequest) {
        try {
          let imagePrompt = "";
          if (isOutfitRequest) {
            // Create a detailed prompt for the suggested outfit
            const outfit = extractOutfitFromLLMResponse(assistantMessage.content, closetItems);
            const outfitDescription = Object.entries(outfit)
              .map(([type, item]) => `${type}: ${item.name || item.description || item.tags?.join(", ")}`)
              .join(", ");
            imagePrompt = `Fashion photography of a stylish outfit: ${outfitDescription}. Clean background, professional lighting, high quality fashion photo.`;
          } else {
            // Use the user's request as the image prompt
            imagePrompt = userMessage.content;
          }

          const imageResponse = await fetch('http://localhost:3001/api/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: imagePrompt })
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageMessage = {
              role: "assistant",
              content: "", // Set content to empty for image messages
              imageUrl: imageData.imageUrl
            };
            setChatMessages(prev => [...prev, imageMessage]);
            // Update avatar image to the generated image
            // setAvatarImage(imageData.imageUrl); // REMOVED
          }
        } catch (imageError) {
          console.error('Image generation error:', imageError);
          // Don't show error to user for image generation failures
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = "Sorry, I'm having trouble connecting right now. Please try again later!";
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = "Cannot connect to server. Make sure the backend is running on port 3001.";
      } else if (error.message.includes('401')) {
        errorMessage = "Invalid API key. Please check your OpenAI API key.";
      } else if (error.message.includes('429')) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      }
      
      const errorResponse = { 
        role: "assistant", 
        content: errorMessage 
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate image from text
  const generateImage = async (prompt) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        const imageMessage = {
          role: "assistant",
          content: "", // Set content to empty for image messages
          imageUrl: data.imageUrl
        };
        setChatMessages(prev => [...prev, imageMessage]);
        // Update avatar image to the generated image
        // setAvatarImage(data.imageUrl); // REMOVED
      } else {
        const errorData = await response.json();
        console.error('Image generation error:', errorData);
      }
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handler to wear the suggested outfit
  const handleWearOutfit = () => {
    if (pendingOutfit) {
      setWornItems(pendingOutfit);
      setPendingOutfit(null);
      setPendingOutfitImages(null);
    }
  };

  // Handler to wear a single piece
  const handleWearPiece = (type, item) => {
    setWornItems(prev => ({ ...prev, [type]: item }));
  };

  // Pagination functions
  const totalPages = Math.ceil(closetItems.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = closetItems.slice(startIndex, endIndex);

  // Filter clothes based on selectedCategory
  const filteredClothes = selectedCategory === 'All'
    ? closetItems
    : closetItems.filter(item => {
        // If category matches type (case-insensitive)
        if (item.type && selectedCategory.toLowerCase().startsWith(item.type)) return true;
        // If category matches a tag (case-insensitive)
        if (item.tags && item.tags.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase())) return true;
        return false;
      });

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Add to closet handler
  const handleAddToCloset = () => {
    const newId = closetItems.length ? Math.max(...closetItems.map(i => i.id)) + 1 : 1;
    const fullDescription = `Name: ${newItemName}\nType: ${newItemType}\nDescription: ${newItemDesc}`;
    setClosetItems([
      ...closetItems,
      {
        id: newId,
        type: newItemType,
        tags: [newItemType],
        description: fullDescription,
        image: uploadedImage,
        name: newItemName
      }
    ]);
    setShowDetailsModal(false);
    setUploadedImage(null);
    setNewItemName("");
    setNewItemDesc("");
    setNewItemType("shirt");
  };

  return (
    <div className="scrapbook-user-page">
      {props.onBack && (
        <button className="back-to-home-btn" onClick={props.onBack} style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
          ← Back to Home
        </button>
      )}
      <h1 className="scrapbook-title">
        {mode === "closet" ? "My Closet" : 
         mode === "build" ? "My Closet: Building My Own" :
         mode === "chat" ? "My Closet: Chat w/ ur Stylist" : "My Closet"}
      </h1>
      <div className={`scrapbook-main${mode === "chat" ? " chat-mode" : ""}`}>
        {/* Avatar Section with overlay */}
        <div
          className={`scrapbook-figure-box`}
          // onDragOver={handleDragOver}
          // onDragLeave={handleDragLeave}
          // onDrop={handleDrop}
        >
          <div className="avatar-overlay-container">
            <img src={avatar} alt="Avatar" className="avatar-img" />
            {/* Render all worn items as clickable overlays only in build mode */}
            {wornItems["shirt"] && (
              wornItems["shirt"].image ? (
                <img
                  src={wornItems["shirt"].image}
                  alt="Shirt"
                  className="avatar-clothes-img"
                  onClick={mode === "build" ? () => handleRemove("shirt") : undefined}
                  style={{ 
                    cursor: mode === "build" ? "pointer" : "default",
                    pointerEvents: mode === "build" ? "auto" : "none"
                  }}
                  title={mode === "build" ? "Remove shirt" : undefined}
                />
              ) : (
                <svg
                  className={`avatar-clothes-svg${mode === "build" ? " clickable" : ""}`}
                  width="320"
                  height="500"
                  viewBox="0 0 120 220"
                  onClick={mode === "build" ? () => handleRemove("shirt") : undefined}
                  style={{ cursor: mode === "build" ? "pointer" : "default" }}
                  title={mode === "build" ? "Remove shirt" : undefined}
                >
                  <g>
                    <rect x="36" y="65" width="48" height="32" rx="10" fill="#d6f0ff" stroke="#222" strokeWidth="2" />
                    <rect x="48" y="55" width="24" height="18" rx="6" fill="#fff" stroke="#222" strokeWidth="2" />
                  </g>
                </svg>
              )
            )}
            {wornItems["pant"] && (
              <svg
                className={`avatar-clothes-svg${mode === "build" ? " clickable" : ""}`}
                width="320"
                height="500"
                viewBox="0 0 120 220"
                onClick={mode === "build" ? () => handleRemove("pant") : undefined}
                style={{ cursor: mode === "build" ? "pointer" : "default" }}
                title={mode === "build" ? "Remove pant" : undefined}
              >
                <g>
                  <rect x="46" y="110" width="12" height="38" rx="5" fill="#e0e7ff" stroke="#222" strokeWidth="2" />
                  <rect x="62" y="110" width="12" height="38" rx="5" fill="#e0e7ff" stroke="#222" strokeWidth="2" />
                </g>
              </svg>
            )}
            {wornItems["accessory"] && wornItems["accessory"].image && (
              <img
                src={wornItems["accessory"].image}
                alt="Accessory"
                className="avatar-accessory-img"
                onClick={mode === "build" ? () => handleRemove("accessory") : undefined}
                style={{ cursor: mode === "build" ? "pointer" : "default" }}
                title={mode === "build" ? "Remove accessory" : undefined}
              />
            )}
          </div>
        </div>
        {/* Category List - hidden in chat mode */}
        {mode !== "chat" && (
          <div className="scrapbook-category-list">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                className={`scrapbook-category-btn${selectedCategory === cat ? " active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        
        {/* Clothing Grid and Description Container - hidden in chat mode */}
        {mode !== "chat" && (
          <div className="clothes-and-description-container">
            {/* Clothing Grid */}
            <div className="scrapbook-clothes-grid">
              {/* Navigation buttons */}
              {totalPages > 1 && (
                <>
                  <button 
                    className="nav-btn prev-btn"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    title="Previous page"
                  >
                    ‹
                  </button>
                  <button 
                    className="nav-btn next-btn"
                    onClick={nextPage}
                    disabled={currentPage === totalPages - 1}
                    title="Next page"
                  >
                    ›
                  </button>
                </>
              )}
              
              {/* Page indicator */}
              {totalPages > 1 && (
                <div className="page-indicator">
                  {currentPage + 1} / {totalPages}
                </div>
              )}
              
              {filteredClothes.map((item) => (
                <div
                  className={`scrapbook-clothes-card${flipped[item.id] ? " flipped" : ""}${mode === "build" ? " drag-enabled" : ""}`}
                  key={item.id}
                  // draggable={mode === "build"}
                  // onDragStart={handleDragStart(item)}
                  onClick={() => handleCardClick(item.id, item.type, item)}
                  title={mode === "build" ? "Drag onto avatar" : "Click for info"}
                >
                  {/* Info button for build mode */}
                  {mode === "build" && (
                    <button 
                      className="clothes-info-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemId(selectedItemId === item.id ? null : item.id);
                      }}
                      title="Show item info"
                    >
                      ℹ
                    </button>
                  )}
                  {/* Card front: always visible content */}
                  <div className="clothes-card-front">
                    {!flipped[item.id] ? (
                      <>
                        {item.image ? (
                          <img src={item.image} alt={item.type} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        ) : item.type === "shirt" ? (
                          <svg width="48" height="48" viewBox="0 0 48 48">
                            <rect x="10" y="18" width="28" height="18" rx="6" fill="#d6f0ff" stroke="#222" strokeWidth="2" />
                            <rect x="18" y="10" width="12" height="12" rx="4" fill="#fff" stroke="#222" strokeWidth="2" />
                          </svg>
                        ) : item.type === "pant" ? (
                          <svg width="48" height="48" viewBox="0 0 48 48">
                            <rect x="14" y="10" width="8" height="28" rx="4" fill="#e0e7ff" stroke="#222" strokeWidth="2" />
                            <rect x="26" y="10" width="8" height="28" rx="4" fill="#e0e7ff" stroke="#222" strokeWidth="2" />
                          </svg>
                        ) : item.type === "accessory" && item.image ? (
                          <img src={item.image} alt="Accessory" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        ) : null}
                        <div className="scrapbook-clothes-caption">not wearing ?</div>
                        {/* Show tags on front only in closet mode */}
                        {mode === "closet" && (
                          <div className="clothes-info-tags">
                            {item.tags.map((tag) => (
                              <span className="clothes-info-tag" key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Show description when flipped (only in closet mode) */
                      <div className="clothes-info-desc">
                        <textarea
                          value={descriptions[item.id]}
                          onChange={(e) => handleDescChange(item.id, e.target.value)}
                          onBlur={(e) => handleDescBlur(item.id, e.target.value)}
                          onKeyDown={(e) => handleDescKeyDown(item.id, e)}
                          onClick={handleTextareaClick}
                          placeholder="Describe your clothing item..."
                          className="clothes-info-desc-edit"
                        />
                      </div>
                    )}
                  </div>
                  {/* Card back: always hidden content */}
                  {mode === "closet" && (
                    <div className="clothes-card-back">
                      {/* Back content is always hidden, only front content is shown */}
                    </div>
                  )}
                </div>
              ))}
              {/* Floating Add Button */}
              <button className="scrapbook-add-btn" onClick={() => setShowUploadModal(true)}>+</button>
            </div>
            
            {/* Item description display for build mode */}
            {mode === "build" && selectedItemId && (
              <div className="build-mode-description">
                <div className="description-header">
                  <h3>Item Details</h3>
                  <button 
                    className="close-description-btn"
                    onClick={() => setSelectedItemId(null)}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="description-content">
                  <div className="description-tags">
                    {closetItems.find(item => item.id === selectedItemId)?.tags.map((tag) => (
                      <span className="description-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="description-text">
                    {descriptions[selectedItemId]}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Chat Interface - shown only in chat mode */}
        {mode === "chat" && (
          <div className="chat-container">
            <div className="chat-header">
              <h3>my Stylist</h3>
              <button 
                className="close-chat-btn"
                onClick={() => handleModeChange("closet")}
                title="Close chat"
              >
                ✕
              </button>
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div className="chat-welcome">
                  <p>👋 Hi! I'm your personal stylist. Ask me anything about fashion, styling tips, or get advice on your current outfit!</p>
                </div>
              )}
              {chatMessages.map((message, index) => (
                <div key={index} className={`chat-message ${message.role}`}>
                  <div className="message-content">
                    {message.content}
                    {message.imageUrl && (
                      <img src={message.imageUrl} alt="Generated" className="generated-image" />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {pendingOutfit && pendingOutfitImages && (
              <div className="chat-outfit-suggestion">
                <div className="outfit-pieces-row">
                  {Object.entries(pendingOutfit).map(([type, item]) => (
                    <div key={type} className="outfit-piece">
                      <div className="outfit-piece-label">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                      {pendingOutfitImages[type] ? (
                        <img
                          src={pendingOutfitImages[type]}
                          alt={item.name || type}
                          className="outfit-piece-img clickable"
                          onClick={() => handleWearPiece(type, item)}
                          title={`Wear this ${type}`}
                        />
                      ) : (
                        <div className="outfit-piece-placeholder">Loading...</div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="wear-outfit-btn" onClick={handleWearOutfit}>Wear this outfit</button>
              </div>
            )}
            <div className="chat-input-container">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Ask your stylist anything..."
                className="chat-input"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={!chatInput.trim() || isLoading}
                className="send-btn"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="scrapbook-bottom-btns">
        {mode === "closet" ? (
          <button className="scrapbook-build-btn" onClick={() => handleModeChange("build")}>Build your own</button>
        ) : mode === "build" ? (
          <button className="scrapbook-build-btn" onClick={() => handleModeChange("closet")}>Back to Closet</button>
        ) : (
          <button className="scrapbook-build-btn" onClick={() => handleModeChange("closet")}>Back to Closet</button>
        )}
        <button 
          className={`scrapbook-chat-btn${mode === "chat" ? " active" : ""}`}
          onClick={() => handleModeChange(mode === "chat" ? "closet" : "chat")}
        >
          {mode === "chat" ? "Close Chat" : "Chat w/ ur stylist"}
        </button>
      </div>
      {/* Modals */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-sticker">Upload 📸</div>
            <button className="modal-close-btn" onClick={() => { setShowUploadModal(false); setUploadedImage(null); }} title="Close">✕</button>
            <h2>Start Upload</h2>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => setUploadedImage(ev.target.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button
              onClick={() => {
                setShowUploadModal(false);
                setShowDetailsModal(true);
              }}
              disabled={!uploadedImage}
            >
              Upload
            </button>
          </div>
        </div>
      )}
      {showDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-sticker">Details ✏️</div>
            <button className="modal-close-btn" onClick={() => { setShowDetailsModal(false); setUploadedImage(null); }} title="Close">✕</button>
            <h2>Edit Item Details</h2>
            {uploadedImage && <img src={uploadedImage} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', marginBottom: 10 }} />}
            <input
              type="text"
              placeholder="Name"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              style={{ display: 'block', marginBottom: 8 }}
            />
            <textarea
              placeholder="Description"
              value={newItemDesc}
              onChange={e => setNewItemDesc(e.target.value)}
              style={{ display: 'block', marginBottom: 8 }}
            />
            <select
              value={newItemType}
              onChange={e => setNewItemType(e.target.value)}
              style={{ display: 'block', marginBottom: 8 }}
            >
              <option value="shirt">Shirt</option>
              <option value="pant">Pant</option>
              <option value="accessory">Accessory</option>
            </select>
            <button
              onClick={handleAddToCloset}
              disabled={!newItemName || !newItemDesc || !newItemType}
            >
              Add to Closet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage; 