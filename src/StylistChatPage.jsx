import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';

// Import UserAvatar component from UserPage
function UserAvatar({ generatedAvatarUrl, avatarUrl, username, uploading, handleAvatarChange, fileInputRef }) {
  // Show generated avatar if available, otherwise show user's avatar
  // This allows generated outfits to be displayed on the avatar
  const displayAvatarUrl = generatedAvatarUrl || avatarUrl;
  
  // Debug logging
  console.log('UserAvatar render:', { generatedAvatarUrl, avatarUrl, displayAvatarUrl });
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {displayAvatarUrl ? (
        <img
          src={displayAvatarUrl}
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
      {generatedAvatarUrl && !avatarUrl && (
        <div style={{ 
          color: '#22c55e', 
          fontWeight: 600, 
          fontSize: 14, 
          marginTop: 4,
          background: '#f0fdf4',
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid #22c55e'
        }}>
          ✨ AI Generated Outfit
        </div>
      )}
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
      {generatedAvatarUrl && !avatarUrl && (
        <button
          onClick={() => {
            setGeneratedAvatarUrl(null);
            localStorage.removeItem('generatedAvatarUrl');
          }}
          style={{
            marginTop: 8,
            color: '#ff6b6b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            background: 'none',
            border: 'none',
            textDecoration: 'underline'
          }}
        >
          Revert to Original Avatar
        </button>
      )}
    </div>
  );
}

const StylistChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [coinBalance, setCoinBalance] = useState(0);
  
  // Chat history states
  const [chatSessions, setChatSessions] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // Avatar states (similar to UserPage)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState(null);
  const fileInputRef = useRef();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load coin balance and user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      try {
        // Fetch coin balance
        const coinResponse = await axios.get(`${API_BASE_URL}/users/me/coins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (coinResponse.data.success) {
          setCoinBalance(coinResponse.data.data.coin_balance);
        }
        
        // Fetch user data
        const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userResponse.data.success) {
          setUsername(userResponse.data.data.username || 'User');
          setAvatarUrl(userResponse.data.data.avatar_url || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  
  // Load generated avatar URL from localStorage on mount (only if user doesn't have a real avatar)
  useEffect(() => {
    const savedGeneratedAvatarUrl = localStorage.getItem('generatedAvatarUrl');
    if (savedGeneratedAvatarUrl && !generatedAvatarUrl && !avatarUrl) {
      console.log('Loading saved generated avatar URL:', savedGeneratedAvatarUrl);
      setGeneratedAvatarUrl(savedGeneratedAvatarUrl);
    }
  }, [generatedAvatarUrl, avatarUrl]);
  
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

  // Start chat session
  const startChatSession = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/chat/sessions`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        setSelectedSessionId(response.data.data.sessionId);
        
        // Add welcome message
        setMessages([
          {
            id: 1,
            role: 'assistant',
            content: "Hi! I'm your personal AI fashion stylist! 👗✨\n\nI can help you create perfect outfits for any occasion. Just tell me what you're planning to do, where you're going, or what style you're looking for.\n\nFor example:\n• \"I'm going to a job interview\"\n• \"I want to look casual for a coffee date\"\n• \"I need something elegant for a wedding\"\n\nWhat can I help you with today? 💫",
            timestamp: new Date().toISOString()
          }
        ]);
        
        // Refresh chat sessions list
        await loadChatSessions();
      }
    } catch (error) {
      console.error('Error starting chat session:', error);
      console.log('Chat session error details:', error.response?.data);
      
      // Set a fallback session ID and welcome message
      setSessionId('fallback-session');
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: "Hi! I'm your personal AI fashion stylist! 👗✨\n\nI can help you create perfect outfits for any occasion. Just tell me what you're planning to do, where you're going, or what style you're looking for.\n\nFor example:\n• \"I'm going to a job interview\"\n• \"I want to look casual for a coffee date\"\n• \"I need something elegant for a wedding\"\n\nWhat can I help you with today? 💫",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to AI stylist
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
        message: inputMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { recommendations } = response.data.data;
        setRecommendations(recommendations);

        // Generate a descriptive title based on the user's request
        const generateChatTitle = (userRequest) => {
          const request = userRequest.toLowerCase();
          if (request.includes('party')) return 'Party Outfit Planning';
          if (request.includes('interview') || request.includes('job')) return 'Professional Interview Look';
          if (request.includes('wedding')) return 'Wedding Guest Style';
          if (request.includes('date')) return 'Date Night Outfit';
          if (request.includes('casual')) return 'Casual Style Session';
          if (request.includes('formal')) return 'Formal Event Styling';
          if (request.includes('work') || request.includes('office')) return 'Work Wardrobe Help';
          if (request.includes('weekend')) return 'Weekend Style Guide';
          return 'Fashion Consultation';
        };

        const chatTitle = generateChatTitle(inputMessage);

        // Create assistant message with recommendations
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Here are some perfect outfit recommendations for you! 👗✨\n\nI've created ${recommendations.length} different looks based on your request. Click on any outfit to see it on your avatar and save it to your closet!`,
          timestamp: new Date().toISOString(),
          recommendations: recommendations,
          chatTitle: chatTitle
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update session title in backend (if supported)
        try {
          await axios.patch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
            title: chatTitle
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.log('Could not update session title:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.log('Full error details:', error.response?.data);
      
      // Provide a fallback response if backend is not working
      const fallbackMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I understand you're looking for outfit help! 👗✨\n\nSince the AI stylist is temporarily unavailable, here are some general outfit suggestions based on your request:\n\n• Try mixing and matching items from your closet\n• Use the "Build your own" feature to create outfits\n• Check your "Favourites" and "Recurring" categories for saved looks\n\nWould you like to try the "Build your own" feature instead?`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Switch to a different chat session
  const switchToSession = async (sessionId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const sessionResponse = await axios.get(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (sessionResponse.data.success && sessionResponse.data.data.messages) {
        const backendMessages = sessionResponse.data.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.sent_at
        }));
        setMessages(backendMessages);
        setSessionId(sessionId);
        setSelectedSessionId(sessionId);
        setRecommendations([]);
        console.log('Switched to session:', sessionId);
      }
    } catch (error) {
      console.error('Error switching to session:', error);
    }
  };

  // Create outfit from recommendation
  const createOutfitFromRecommendation = async (recommendation, index) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/chat/sessions/${sessionId}/outfits`, {
        recommendationIndex: index,
        outfitData: {
          title: recommendation.title,
          clothingItemIds: recommendation.clothingItemIds,
          imageUrl: recommendation.imageUrl
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response?.data?.success) {
        // Log the response structure for debugging
        console.log('Backend response:', response.data);
        
        // Handle the actual backend response structure
        const responseData = response.data.data || response.data;
        const outfit = responseData?.outfit || responseData;
        const avatarImage = responseData?.avatarImage || responseData?.generated_avatar_url || responseData?.avatar_image;
        
        // Add success message (without showing image in chat)
        const successMessage = {
          id: Date.now(),
          role: 'assistant',
          content: `Perfect! I've created the "${recommendation.title}" outfit and updated your avatar! 🎉\n\nYou can find this outfit in your closet under the "Favourites" category.`,
          timestamp: new Date().toISOString(),
          outfit: outfit
        };

        setMessages(prev => [...prev, successMessage]);
        
        // Clear recommendations
        setRecommendations([]);
        
        // Update the avatar display in the chat page
        if (avatarImage) {
          setGeneratedAvatarUrl(avatarImage);
          
          // Store in localStorage for persistence (only if user doesn't have a real avatar)
          if (!avatarUrl) {
            localStorage.setItem('generatedAvatarUrl', avatarImage);
          }
          
          // Also store the outfit info for the UserPage
          localStorage.setItem('lastGeneratedOutfit', JSON.stringify({
            title: recommendation.title,
            avatarImage: avatarImage,
            outfit: outfit
          }));
          
          // Trigger outfit refresh on UserPage
          localStorage.setItem('refreshOutfits', 'true');
        }
        
        // Update coin balance (assuming it costs coins)
        const coinResponse = await axios.get(`${API_BASE_URL}/users/me/coins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (coinResponse.data.success) {
          setCoinBalance(coinResponse.data.data.coin_balance);
        }
      }
    } catch (error) {
      console.error('Error creating outfit via chat endpoint:', error);
      console.log('Full response data:', response?.data);
      console.log('Response structure:', JSON.stringify(response?.data, null, 2));
      
      // Fallback: Try to create outfit using the regular outfit creation endpoint
      try {
        console.log('Trying fallback outfit creation...');
        
        // Get user's clothing items to create a real outfit
        const clothingResponse = await axios.get(`${API_BASE_URL}/clothing-items`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (clothingResponse.data.success && clothingResponse.data.data.length >= 2) {
          const items = clothingResponse.data.data;
          const tops = items.filter(item => (item.category || item.tag)?.toLowerCase() === 'top');
          const bottoms = items.filter(item => (item.category || item.tag)?.toLowerCase() === 'bottom');
          
          if (tops.length > 0 && bottoms.length > 0) {
            // Create outfit with first available top and bottom
            const outfitData = {
              title: recommendation.title,
              clothingItemIds: [tops[0].id, bottoms[0].id],
              image_key: recommendation.imageUrl || 'https://via.placeholder.com/300x400/667eea/ffffff?text=Generated+Outfit',
              bucket_name: "clothing-items-remoda",
              is_favorite: true,
              is_recurring: false
            };
            
            const fallbackResponse = await axios.post(`${API_BASE_URL}/outfits`, outfitData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (fallbackResponse.data.success) {
              console.log('Fallback outfit creation successful:', fallbackResponse.data);
              
              // Update avatar with generated image
              const generatedImage = fallbackResponse.data.data?.image_key || fallbackResponse.data.data?.generated_avatar_url || recommendation.imageUrl;
              if (generatedImage) {
                setGeneratedAvatarUrl(generatedImage);
                if (!avatarUrl) {
                  localStorage.setItem('generatedAvatarUrl', generatedImage);
                }
              }
              
              const successMessage = {
                id: Date.now(),
                role: 'assistant',
                content: `Perfect! I've created the "${recommendation.title}" outfit and updated your avatar! 🎉\n\nI used items from your closet to create this look. You can find this outfit in your closet under the "Favourites" category.`,
                timestamp: new Date().toISOString(),
                outfit: fallbackResponse.data.data
              };
              
              setMessages(prev => [...prev, successMessage]);
              setRecommendations([]);
              
              // Store outfit info
              localStorage.setItem('lastGeneratedOutfit', JSON.stringify({
                title: recommendation.title,
                avatarImage: generatedImage,
                outfit: fallbackResponse.data.data
              }));
              
              // Trigger outfit refresh on UserPage
              localStorage.setItem('refreshOutfits', 'true');
              
              return; // Success, don't show error
            }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback outfit creation also failed:', fallbackError);
      }
      
      const errorMessage = {
        id: Date.now(),
        role: 'assistant',
        content: "Sorry, I couldn't create that outfit right now. Please try again! 😔",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Load all chat sessions
  const loadChatSessions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping chat sessions load');
        return;
      }

      const sessionsResponse = await axios.get(`${API_BASE_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (sessionsResponse.data.success) {
        // Filter out empty chats (only welcome message) and process meaningful sessions
        const meaningfulSessions = sessionsResponse.data.data
          .filter(session => {
            // Only include sessions with more than just the welcome message
            const messageCount = session.messages?.length || 0;
            return messageCount > 1; // More than just the welcome message
          })
          .map(session => {
            const messages = session.messages || [];
            const lastMessage = messages[messages.length - 1];
            
            // Get the first user message to understand the request
            const firstUserMessage = messages.find(msg => msg.role === 'user');
            const userRequest = firstUserMessage?.content || '';
            
            // Generate title based on user request if no title exists
            let title = session.title;
            if (!title && userRequest) {
              const request = userRequest.toLowerCase();
              if (request.includes('party')) title = 'Party Outfit Planning';
              else if (request.includes('interview') || request.includes('job')) title = 'Professional Interview Look';
              else if (request.includes('wedding')) title = 'Wedding Guest Style';
              else if (request.includes('date')) title = 'Date Night Outfit';
              else if (request.includes('casual')) title = 'Casual Style Session';
              else if (request.includes('formal')) title = 'Formal Event Styling';
              else if (request.includes('work') || request.includes('office')) title = 'Work Wardrobe Help';
              else if (request.includes('weekend')) title = 'Weekend Style Guide';
              else title = 'Fashion Consultation';
            }
            
            return {
              id: session.id,
              title: title || `Chat ${new Date(session.started_at).toLocaleDateString()}`,
              started_at: session.started_at,
              messageCount: messages.length,
              lastMessage: lastMessage?.content || '',
              userRequest: userRequest
            };
          });
        
        setChatSessions(meaningfulSessions);
        console.log('Loaded meaningful chat sessions:', meaningfulSessions.length);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  // Load chat history from backend
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping chat history load');
          return;
        }

        // Load all sessions first
        await loadChatSessions();

        // Get user's chat sessions
        const sessionsResponse = await axios.get(`${API_BASE_URL}/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (sessionsResponse.data.success && sessionsResponse.data.data.length > 0) {
          // Get the most recent session
          const latestSession = sessionsResponse.data.data[0];
          setSessionId(latestSession.id);
          setSelectedSessionId(latestSession.id);
          
          // Load messages from the latest session
          const sessionResponse = await axios.get(`${API_BASE_URL}/chat/sessions/${latestSession.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (sessionResponse.data.success && sessionResponse.data.data.messages) {
            const backendMessages = sessionResponse.data.data.messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              role: msg.role,
              timestamp: msg.sent_at
            }));
            setMessages(backendMessages);
            console.log('Loaded chat history from backend:', backendMessages.length, 'messages');
          }
        }
      } catch (error) {
        console.error('Error loading chat history from backend:', error);
      }
    };

    loadChatHistory();
  }, []);

  // Note: Messages are now saved to backend automatically via API calls
  // No need for localStorage persistence

  // Start chat when component mounts
  useEffect(() => {
    startChatSession();
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Chat History Sidebar */}
      {showChatHistory && (
        <div style={{
          width: '300px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Chat History Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '18px' }}>
              Chat History
            </h3>
            <button
              onClick={() => setShowChatHistory(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#7f8c8d'
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Chat Sessions List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px'
          }}>
            {chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => switchToSession(session.id)}
                style={{
                  padding: '12px',
                  margin: '4px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedSessionId === session.id ? '#667eea' : 'rgba(255, 255, 255, 0.8)',
                  color: selectedSessionId === session.id ? 'white' : '#2c3e50',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {session.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8,
                  marginBottom: '4px'
                }}>
                  {new Date(session.started_at).toLocaleDateString()}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {session.userRequest ? `"${session.userRequest}"` : session.lastMessage || 'No messages yet'}
                </div>
              </div>
            ))}
            
            {chatSessions.length === 0 && (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#7f8c8d',
                fontSize: '14px'
              }}>
                No previous chats found
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Left Side - Avatar Section */}
      <div style={{
        width: '400px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{
          color: '#a78bfa',
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 24,
          textAlign: 'center'
        }}>
          Your Avatar
        </div>
        <div style={{ position: 'relative' }}>
          <UserAvatar 
            generatedAvatarUrl={generatedAvatarUrl}
            avatarUrl={avatarUrl}
            username={username}
            uploading={uploading}
            handleAvatarChange={handleAvatarChange}
            fileInputRef={fileInputRef}
          />
          
          {/* Heart and Worn buttons - only show when there's a generated outfit and no real avatar */}
          {generatedAvatarUrl && !avatarUrl && (
            <>
              {/* Heart button */}
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: 24,
                  fontSize: 32,
                  color: "#e25555",
                  cursor: "pointer",
                  zIndex: 10
                }}
                onClick={async () => {
                  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                  try {
                    // Create outfit and mark as favorite
                    const outfitData = {
                      title: "Chat Generated Outfit",
                      clothingItemIds: [1, 2], // Use first two items as fallback
                      image_key: generatedAvatarUrl,
                      bucket_name: "clothing-items-remoda",
                      is_favorite: true,
                      is_recurring: false
                    };
                    
                    const response = await axios.post(`${API_BASE_URL}/outfits`, outfitData, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (response.data.success) {
                      alert('❤️ Outfit added to favorites!');
                    }
                  } catch (error) {
                    console.error('Error favoriting outfit:', error);
                    alert('Failed to add to favorites. Please try again.');
                  }
                }}
                title="Add to Favourites"
              >❤️</span>
              
              {/* Add to Worn button */}
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  right: 24,
                  fontSize: 24,
                  color: "#22c55e",
                  cursor: "pointer",
                  background: "#f0fdf4",
                  borderRadius: 8,
                  padding: "4px 8px",
                  border: "1px solid #22c55e",
                  zIndex: 10
                }}
                onClick={async () => {
                  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                  try {
                    // Create outfit and mark as recurring
                    const outfitData = {
                      title: "Chat Generated Outfit",
                      clothingItemIds: [1, 2], // Use first two items as fallback
                      image_key: generatedAvatarUrl,
                      bucket_name: "clothing-items-remoda",
                      is_favorite: false,
                      is_recurring: true
                    };
                    
                    const response = await axios.post(`${API_BASE_URL}/outfits`, outfitData, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (response.data.success) {
                      alert('✓ Outfit added to recurring!');
                    }
                  } catch (error) {
                    console.error('Error marking outfit as recurring:', error);
                    alert('Failed to add to recurring. Please try again.');
                  }
                }}
                title="Add to Recurring"
              >✓ Recurring</span>
            </>
          )}
        </div>
        {isLoading && (
          <div style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#f0fdf4',
            color: '#22c55e',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid #22c55e'
          }}>
            ✨ Creating your outfit...
          </div>
        )}
      </div>

      {/* Right Side - Chat Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              👗
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>AI Fashion Stylist</h2>
              <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>Your personal style assistant</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              style={{
                background: '#48dbfb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              title="View chat history"
            >
              {showChatHistory ? 'Hide History' : 'Chat History'}
            </button>
            <button
              onClick={async () => {
                try {
                  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                  if (sessionId && token) {
                    // Delete the current session from backend
                    await axios.delete(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('Chat session deleted from backend');
                  }
                } catch (error) {
                  console.error('Error deleting chat session:', error);
                }
                
                // Clear local state
                setMessages([]);
                setSessionId(null);
                setRecommendations([]);
                
                // Reset avatar to original
                setGeneratedAvatarUrl(null);
                localStorage.removeItem('generatedAvatarUrl');
                
                // Refresh chat sessions list to remove the deleted session
                await loadChatSessions();
                
                // Start a new session
                await startChatSession();
              }}
              style={{
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              title="Clear chat history"
            >
              Clear Chat
            </button>
            <button
              onClick={() => window.location.href = '/user'}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              title="Go back to closet"
            >
              Back to Closet
            </button>
            <div style={{
              background: '#feca57',
              padding: '8px 16px',
              borderRadius: '20px',
              color: '#2c3e50',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {coinBalance} coins
            </div>
          </div>
        </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '16px 20px',
              borderRadius: message.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
              background: message.role === 'user' ? '#667eea' : 'rgba(255, 255, 255, 0.95)',
              color: message.role === 'user' ? 'white' : '#2c3e50',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              whiteSpace: 'pre-line'
            }}>
              {message.content}
              
              {/* Show recommendations if available */}
              {message.recommendations && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    {message.recommendations.map((rec, index) => (
                      <div key={index} style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '2px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        ':hover': {
                          borderColor: '#667eea',
                          transform: 'translateY(-2px)'
                        }
                      }} onClick={() => createOutfitFromRecommendation(rec, index)}>
                        <div style={{
                          width: '100%',
                          height: '120px',
                          background: '#f0f0f0',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          👗
                        </div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#2c3e50' }}>
                          {rec.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>
                          {rec.description}
                        </p>
                        <button style={{
                          marginTop: '8px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          width: '100%'
                        }}>
                          Try This Outfit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: '20px 20px 20px 5px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#2c3e50',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#667eea',
                  animation: 'bounce 1.4s infinite ease-in-out'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#667eea',
                  animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#667eea',
                  animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what you're looking for... (e.g., 'I want to go to a job interview')"
              style={{
                width: '100%',
                minHeight: '50px',
                maxHeight: '120px',
                padding: '12px 16px',
                borderRadius: '25px',
                border: '2px solid #e0e0e0',
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              background: inputMessage.trim() && !isLoading ? '#667eea' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '20px',
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ margin: 0, color: '#2c3e50' }}>Creating your outfit...</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StylistChatPage; 