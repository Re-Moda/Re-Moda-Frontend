import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';
import favStar from './assets/fav-star.webp';
import logo from './assets/logo.png';

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

// AvatarSelector component for changing avatars
const AvatarSelector = ({ currentAvatarId, onAvatarChange }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarId || 1);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleAvatarSelect = async (avatarId) => {
    if (isUpdating) return;
    
    setSelectedAvatar(avatarId);
    setIsUpdating(true);
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/users/me/avatar-id`, 
        { avatar_id: avatarId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onAvatarChange(avatarId);
      showToast('Avatar updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating avatar:', error);
      showToast('Failed to update avatar', 'error');
      setSelectedAvatar(currentAvatarId); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  // Avatar images array (you'll need to import these)
  const AVATAR_IMAGES = [
    '/src/assets/avatars/atar-1.png',
    '/src/assets/avatars/atar-2.png',
    '/src/assets/avatars/atar-3.png',
    '/src/assets/avatars/atar-4.png',
    '/src/assets/avatars/atar-5.png',
    '/src/assets/avatars/atar-6.png',
    '/src/assets/avatars/atar-7.png',
    '/src/assets/avatars/atar-8.png',
    '/src/assets/avatars/atar-9.png',
    '/src/assets/avatars/atar-10.png',
    '/src/assets/avatars/atar-11.png',
    '/src/assets/avatars/atar-12.png',
    '/src/assets/avatars/atar-13.png',
    '/src/assets/avatars/atar-14.png',
    '/src/assets/avatars/atar-15.png'
  ];

  return (
    <div style={{ 
      marginTop: 16,
      padding: 16,
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      border: '1px solid rgba(168, 139, 250, 0.2)'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: '#7c3aed', 
        fontSize: 16,
        fontWeight: '600'
      }}>
        Change Avatar
      </h4>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 8, 
        justifyContent: 'center',
        maxHeight: 200,
        overflowY: 'auto'
      }}>
        {AVATAR_IMAGES.map((avatar, index) => (
          <img
            key={index}
            src={avatar}
            alt={`Avatar ${index + 1}`}
            style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              border: selectedAvatar === index + 1 ? '3px solid #7c3aed' : '1px solid #ddd',
              opacity: isUpdating ? 0.6 : selectedAvatar === index + 1 ? 1 : 0.7,
              transition: 'all 0.2s ease'
            }}
            onClick={() => !isUpdating && handleAvatarSelect(index + 1)}
          />
        ))}
      </div>
    </div>
  );
};

const StylistChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! Welcome to Re:Moda by TechStyles! I am your StyleForce assistant. I can help you find the perfect outfit for any occasion. What are you looking for today?',
      timestamp: Date.now().toString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [userAvatarId, setUserAvatarId] = useState(1);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // Chat history states
  const [chatSessions, setChatSessions] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Toast notification function
  const showToast = (message, type = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      ${type === 'success' ? 'background: #22c55e;' : 
        type === 'error' ? 'background: #ef4444;' : 
        type === 'warning' ? 'background: #f59e0b;' : 
        'background: #3b82f6;'}
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Star animation helper functions
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

  // Generate animated stars for background
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

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add CSS for star animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes moveX {
        0% { transform: translateX(0px); }
        100% { transform: translateX(100px); }
      }
      @keyframes moveY {
        0% { transform: translateY(0px); }
        100% { transform: translateY(100px); }
      }
      @keyframes moveXY {
        0% { transform: translateX(0px) translateY(0px); }
        100% { transform: translateX(50px) translateY(50px); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
          setUserAvatarId(userResponse.data.data.avatar_id || 1);
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
  const sendMessage = async (messageContent = null) => {
    const contentToSend = messageContent || inputMessage;
    if (!contentToSend.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: contentToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage(''); // Clear input only if it was from input field
    setIsTyping(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
        message: contentToSend
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.data.message,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);

        const chatTitle = generateChatTitle(contentToSend);

        // Create assistant message with recommendations
        if (response.data.data.recommendations && response.data.data.recommendations.length > 0) {
          const recommendationMessage = {
            id: Date.now() + 2,
            role: 'assistant',
            content: 'Here are some outfit recommendations for you:',
            recommendations: response.data.data.recommendations,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, recommendationMessage]);
        }

        // Update session title if it's the first message
        if (messages.length === 0) {
          try {
            await axios.patch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
              title: chatTitle
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (error) {
            console.error('Error updating session title:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');
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

  // Function to render messages with JSON parsing
  const renderMessage = (message) => {
    // Try to parse JSON content
    try {
      const jsonContent = JSON.parse(message.content);
      
      if (jsonContent.type === 'welcome') {
        return <div>{jsonContent.content}</div>;
      }
      
      if (jsonContent.type === 'promptOptions') {
        return (
          <div>
            <p>{jsonContent.content}</p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '12px'
            }}>
              {jsonContent.suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  onClick={() => sendMessage(suggestion)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    margin: '4px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        );
      }
      
      // If not a special type, display as regular message
      return <div>{message.content}</div>;
      
    } catch (e) {
      // If not JSON, display as regular message
      return <div>{message.content}</div>;
    }
  };

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

  // Function to spend coins for AI features

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* Animated star background */}
      <div 
        className="star-bg" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 1, 
          pointerEvents: 'none',
          background: 'transparent'
        }}
      >
        {stars}
      </div>
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
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(168, 139, 250, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(168, 139, 250, 0.2)',
        zIndex: 2,
        height: '100vh'
      }}>
        <div style={{
          color: '#a78bfa',
          fontWeight: 700,
          fontSize: 20,
          marginBottom: 24,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(168, 139, 250, 0.2)',
          position: 'relative'
        }}>
          {/* Logo on top of "Your Avatar" text */}
          <img 
            src={logo} 
            alt="Re:Moda Logo" 
            style={{ 
              position: 'absolute',
              top: '-160px',
              left: '50%',
              transform: 'translateX(-50%)',
              height: '180px',
              width: 'auto',
              zIndex: 10,
              filter: 'drop-shadow(0 4px 8px rgba(168, 139, 250, 0.3))'
            }} 
          />
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
          
          {/* Heart and Worn buttons - show when there's a generated outfit */}
          {generatedAvatarUrl && (
            <>
              {/* Heart button */}
              <button
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
                      showToast('❤️ Outfit added to favorites!', 'success');
                    } else {
                      showToast('Failed to add to favorites. Please try again.', 'error');
                    }
                  } catch (error) {
                    console.error('Error favoriting outfit:', error);
                    showToast('Failed to add to favorites. Please try again.', 'error');
                  }
                }}
                title="Add to Favourites"
              >
                ❤️
              </button>
              
              {/* Add to Worn button */}
              <button
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
                      showToast('✓ Outfit added to recurring!', 'success');
                    } else {
                      showToast('Failed to add to recurring. Please try again.', 'error');
                    }
                  } catch (error) {
                    console.error('Error marking outfit as recurring:', error);
                    showToast('Failed to add to recurring. Please try again.', 'error');
                  }
                }}
                title="Add to Recurring"
              >
                ✓
              </button>
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
        
        {/* Avatar Change Button */}
        <button
          onClick={() => setShowAvatarSelector(!showAvatarSelector)}
          style={{
            marginTop: 16,
            background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(168, 139, 250, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(168, 139, 250, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(168, 139, 250, 0.3)';
          }}
        >
          {showAvatarSelector ? 'Hide Avatar Selector' : 'Change Avatar'}
        </button>
        
        {/* Avatar Selector */}
        {showAvatarSelector && (
          <AvatarSelector 
            currentAvatarId={userAvatarId}
            onAvatarChange={(newAvatarId) => {
              setUserAvatarId(newAvatarId);
              setShowAvatarSelector(false);
            }}
          />
        )}
      </div>

      {/* Right Side - Chat Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '16px 24px 8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(168, 139, 250, 0.15)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(168, 139, 250, 0.2)',
          zIndex: 999,
          position: 'relative',
          flexShrink: 0,
          minHeight: '60px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/src/assets/image copy.png" 
                alt="Heart Icon" 
                style={{ 
                  height: '48px',
                  width: 'auto',
                  filter: 'drop-shadow(0 2px 4px rgba(168, 139, 250, 0.2))',
                  transition: 'transform 0.3s ease'
                }} 
              />
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#7c3aed', 
                  fontSize: '24px',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(168, 139, 250, 0.2)'
                }}>StyleForce</h2>
                <p style={{ 
                  margin: 0, 
                  color: '#a78bfa', 
                  fontSize: '16px',
                  fontWeight: '500'
                }}>Your personal style assistant</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        flex: 0.8,
        overflowY: 'auto',
        padding: '0px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        background: 'rgba(255, 255, 255, 0.3)',
        zIndex: 1,
        position: 'relative',
        minHeight: 0
      }}>
        {messages.map((message) => (
          <div key={`${message.id}-${message.timestamp}`} style={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '1px'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '18px 24px',
              borderRadius: message.role === 'user' ? '24px 24px 8px 24px' : '24px 24px 24px 8px',
              background: message.role === 'user' 
                ? 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)' 
                : 'rgba(255, 255, 255, 0.95)',
              color: message.role === 'user' ? 'white' : '#4c1d95',
              boxShadow: message.role === 'user' 
                ? '0 8px 25px rgba(168, 139, 250, 0.3)' 
                : '0 4px 20px rgba(168, 139, 250, 0.15)',
              backdropFilter: 'blur(10px)',
              whiteSpace: 'pre-line',
              border: message.role === 'user' 
                ? 'none' 
                : '1px solid rgba(168, 139, 250, 0.2)'
            }}>
              {renderMessage(message)}
              
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
        padding: '0px 20px',
        borderTop: '1px solid rgba(168, 139, 250, 0.2)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 20px rgba(168, 139, 250, 0.1)',
        flexShrink: 0,
        marginTop: '500px'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
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
                minHeight: '30px',
                maxHeight: '120px',
                padding: '14px 18px',
                borderRadius: '25px',
                border: '2px solid rgba(168, 139, 250, 0.3)',
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#7c3aed'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a78bfa';
                e.target.style.boxShadow = '0 0 0 3px rgba(168, 139, 250, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(168, 139, 250, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              background: inputMessage.trim() && !isLoading 
                ? 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)' 
                : 'rgba(168, 139, 250, 0.3)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '18px',
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: inputMessage.trim() && !isLoading 
                ? '0 4px 15px rgba(168, 139, 250, 0.4)' 
                : 'none',
              transform: inputMessage.trim() && !isLoading ? 'scale(1)' : 'scale(0.95)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (inputMessage.trim() && !isLoading) {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(168, 139, 250, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputMessage.trim() && !isLoading) {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(168, 139, 250, 0.4)';
              }
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