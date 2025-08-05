import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';
import './StylistChatPage.css';

// Import UserAvatar component from UserPage
function UserAvatar({ generatedAvatarUrl, avatarUrl, username, uploading, handleAvatarChange, fileInputRef, setGeneratedAvatarUrl }) {
  // Show generated avatar if available, otherwise show user's avatar
  // This allows generated outfits to be displayed on the avatar
  const displayAvatarUrl = generatedAvatarUrl || avatarUrl;
  
  // Debug logging
  console.log('UserAvatar render:', { generatedAvatarUrl, avatarUrl, displayAvatarUrl });
  
  return (
    <div className="user-avatar-container">
      {displayAvatarUrl ? (
        <img
          className="user-avatar-image"
          src={displayAvatarUrl}
          alt="User Avatar"
        />
      ) : (
        <div className="user-avatar-placeholder">
          <span role="img" aria-label="avatar placeholder">👤</span>
        </div>
      )}
      <div className="user-avatar-username">{username}</div>
      {generatedAvatarUrl && !avatarUrl && (
        <div className="ai-generated-badge">
          ✨ AI Generated Outfit
        </div>
      )}

      {generatedAvatarUrl && !avatarUrl && (
        <button
          className="revert-avatar-btn"
          onClick={() => {
            setGeneratedAvatarUrl(null);
            localStorage.removeItem('generatedAvatarUrl');
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

  // Toast notification function
  const showToast = (message, type = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    // Add to page
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
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // Avatar states (similar to UserPage)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("User"); // Default username
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
          const username = userResponse.data.data.username || 'User';
          const avatarUrl = userResponse.data.data.avatar_url || '';
          console.log('Fetched user data:', { username, avatarUrl });
          setUsername(username);
          setAvatarUrl(avatarUrl);
        }
              } catch (error) {
          console.error('Error fetching user data:', error);
          // Set default values when API is not available
          setUsername("User");
          setAvatarUrl("");
          setCoinBalance(0);
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
        console.log('Backend response:', response.data);
        console.log('Response data structure:', response.data.data);
        console.log('Full response object:', JSON.stringify(response.data, null, 2));
        
        // Handle different response formats
        let messageContent = response.data.data.message;
        
        // Check all possible response fields
        console.log('Available fields in response.data.data:', Object.keys(response.data.data));
        
        if (response.data.data.content) {
          messageContent = response.data.data.content;
          console.log('Using content field:', messageContent);
        } else if (response.data.data.promptOptions) {
          messageContent = JSON.stringify(response.data.data.promptOptions);
          console.log('Using promptOptions field:', messageContent);
        } else if (response.data.data.welcome) {
          messageContent = JSON.stringify(response.data.data.welcome);
          console.log('Using welcome field:', messageContent);
        } else if (response.data.data.response) {
          messageContent = response.data.data.response;
          console.log('Using response field:', messageContent);
        } else if (response.data.data.answer) {
          messageContent = response.data.data.answer;
          console.log('Using answer field:', messageContent);
        } else if (response.data.data.message) {
          console.log('Using message field:', messageContent);
        } else {
          console.log('No recognized field found, using raw data:', response.data.data);
          // Try to find any field that might contain the actual response
          const possibleFields = ['content', 'response', 'answer', 'text', 'data'];
          for (const field of possibleFields) {
            if (response.data.data[field]) {
              messageContent = response.data.data[field];
              console.log(`Found response in ${field} field:`, messageContent);
              break;
            }
          }
        }
        
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: messageContent,
          timestamp: new Date().toISOString()
        };

        console.log('Created assistant message:', assistantMessage);
        
        // Check if this was a greeting
        const isGreeting = contentToSend.toLowerCase().includes('hello') || 
                          contentToSend.toLowerCase().includes('hi') ||
                          contentToSend.toLowerCase().includes('hey');
        
        // Only add the backend response if it's not a greeting (to avoid showing "Message processed successfully")
        if (!isGreeting) {
          setMessages(prev => [...prev, assistantMessage]);
        }
        
        // Add custom prompt options for greetings
        if (isGreeting) {
          const customSuggestions = [
            "Outfit I want to go out for a picnic",
            "First date dinner outfit", 
            "Hiking/outdoor stuff outfit",
            "Business casual work outfit",
            "Grabbing coffee with friends",
            "Going to the intern yacht party"
          ];
          
          const promptOptionsMessage = {
            id: Date.now() + 2,
            role: 'assistant',
            content: JSON.stringify({
              type: 'promptOptions',
              content: "Hi there! 👋 I'm your personal AI stylist. I can help you create amazing outfits from your wardrobe! Here are some ideas to get started:",
              suggestions: customSuggestions
            }),
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, promptOptionsMessage]);
        }

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
    <div className="stylist-chat-page">
      {/* Chat History Sidebar */}
      {showChatHistory && (
        <div className="chat-history-sidebar">
          {/* Chat History Header */}
          <div className="chat-history-header">
            <h3 className="chat-history-title">
              Chat History
            </h3>
            <button
              className="chat-history-close-btn"
              onClick={() => setShowChatHistory(false)}
            >
              ✕
            </button>
          </div>
          
          {/* Chat Sessions List */}
          <div className="chat-sessions-list">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`chat-session-item ${selectedSessionId === session.id ? 'selected' : ''}`}
                onClick={() => switchToSession(session.id)}
              >
                <div className="chat-session-title">
                  {session.title}
                </div>
                <div className="chat-session-date">
                  {new Date(session.started_at).toLocaleDateString()}
                </div>
                <div className="chat-session-preview">
                  {session.userRequest ? `"${session.userRequest}"` : session.lastMessage || 'No messages yet'}
                </div>
              </div>
            ))}
            
            {chatSessions.length === 0 && (
              <div className="chat-sessions-empty">
                No previous chats found
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Header - Separate component at top */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-icon">
            💜
          </div>
          <div className="chat-header-info">
            <h2 className="chat-header-title">StyleForce</h2>
            <p className="chat-header-subtitle">Your personal style assistant</p>
          </div>
        </div>
        
        {/* Desktop buttons - visible on desktop only */}
        <div className="chat-header-right desktop-only">
          <button
            className="chat-clear-btn"
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
            title="Clear chat history"
          >
            Clear Chat
          </button>
          <button
            className="chat-back-btn"
            onClick={() => window.location.href = '/user'}
            title="Go back to closet"
          >
            Back to Closet
          </button>
          <div className="chat-coin-balance">
            🪙 {coinBalance} coins
          </div>
        </div>
        
        {/* Mobile buttons - visible on mobile only */}
        <div className="chat-header-bottom-row mobile-only">
          <div className="chat-header-center">
            <button
              className="chat-back-btn"
              onClick={() => window.location.href = '/user'}
              title="Go back to closet"
            >
              Back to Closet
            </button>
          </div>
          <div className="chat-header-right">
            <button
              className="chat-clear-btn"
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
              title="Clear chat history"
            >
              Clear Chat
            </button>
            <div className="chat-coin-balance">
             {coinBalance} coins
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="avatar-section">
          <div className="avatar-section-title">
            Your Avatar
          </div>
          <div className="avatar-container">
            <UserAvatar 
              generatedAvatarUrl={generatedAvatarUrl}
              avatarUrl={avatarUrl}
              username={username}
              uploading={uploading}
              handleAvatarChange={handleAvatarChange}
              fileInputRef={fileInputRef}
              setGeneratedAvatarUrl={setGeneratedAvatarUrl}
            />
            
            {/* Heart and Worn buttons - show when there's a generated outfit */}
            {generatedAvatarUrl && (
              <>
                {/* Heart button */}
                <button
                  className="avatar-favorite-btn"
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
                  className="avatar-worn-btn"
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
            <div className="avatar-loading-indicator">
              ✨ Creating your outfit...
            </div>
          )}
        </div>

        {/* Right Side - Chat Section */}
        <div className="chat-section">

        {/* Messages Container */}
        <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message-wrapper ${message.role}`}>
            <div className={`message-bubble ${message.role}`}>
              {renderMessage(message)}
              
              {/* Show recommendations if available */}
              {message.recommendations && (
                <div className="recommendations-container">
                  <div className="recommendations-grid">
                    {message.recommendations.map((rec, index) => (
                      <div key={index} className="recommendation-card" onClick={() => createOutfitFromRecommendation(rec, index)}>
                        <div className="recommendation-image">
                          👗
                        </div>
                        <h4 className="recommendation-title">
                          {rec.title}
                        </h4>
                        <p className="recommendation-description">
                          {rec.description}
                        </p>
                        <button className="recommendation-btn">
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
          <div className="typing-indicator-wrapper">
            <div className="typing-indicator-bubble">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div className="messages-end" ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="input-container">
        <div className="input-wrapper">
          <div className="input-field-container">
            <textarea
              className="input-textarea"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what you're looking for... (e.g., 'I want to go to a job interview')"
            />
          </div>
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
              </div>
      </div> {/* Close chat-section */}

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-modal">
            <div className="loading-spinner"></div>
            <p className="loading-text">Creating your outfit...</p>
          </div>
        </div>
      )}


    </div>
  );
};

export default StylistChatPage; 