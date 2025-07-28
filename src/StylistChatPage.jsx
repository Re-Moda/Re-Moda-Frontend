import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';

const StylistChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [coinBalance, setCoinBalance] = useState(0);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load coin balance
  useEffect(() => {
    const fetchCoinBalance = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      try {
        const response = await axios.get(`${API_BASE_URL}/users/me/coins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setCoinBalance(response.data.data.coin_balance);
        }
      } catch (error) {
        console.error('Error fetching coin balance:', error);
      }
    };
    fetchCoinBalance();
  }, []);

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
        
        // Add welcome message
        setMessages([
          {
            id: 1,
            role: 'assistant',
            content: "Hi! I'm your personal AI fashion stylist! 👗✨\n\nI can help you create perfect outfits for any occasion. Just tell me what you're planning to do, where you're going, or what style you're looking for.\n\nFor example:\n• \"I'm going to a job interview\"\n• \"I want to look casual for a coffee date\"\n• \"I need something elegant for a wedding\"\n\nWhat can I help you with today? 💫",
            timestamp: new Date().toISOString()
          }
        ]);
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

        // Create assistant message with recommendations
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Here are some perfect outfit recommendations for you! 👗✨\n\nI've created ${recommendations.length} different looks based on your request. Click on any outfit to see it on your avatar and save it to your closet!`,
          timestamp: new Date().toISOString(),
          recommendations: recommendations
        };

        setMessages(prev => [...prev, assistantMessage]);
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
        
        // Add success message
        const successMessage = {
          id: Date.now(),
          role: 'assistant',
          content: `Perfect! I've created the "${recommendation.title}" outfit and updated your avatar! 🎉\n\nYou can find this outfit in your closet under the "Favourites" category.`,
          timestamp: new Date().toISOString(),
          avatarImage: avatarImage,
          outfit: outfit
        };

        setMessages(prev => [...prev, successMessage]);
        
        // Clear recommendations
        setRecommendations([]);
        
        // Update the main avatar on UserPage by storing the generated avatar URL
        // Only store if user doesn't have an actual avatar (to avoid overriding user's avatar)
        if (avatarImage) {
          // Check if user has an actual avatar first
          const userHasAvatar = localStorage.getItem('userAvatarUrl') || sessionStorage.getItem('userAvatarUrl');
          if (!userHasAvatar) {
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
              
              const successMessage = {
                id: Date.now(),
                role: 'assistant',
                content: `Perfect! I've created the "${recommendation.title}" outfit! 🎉\n\nI used items from your closet to create this look. You can find this outfit in your closet under the "Favourites" category.`,
                timestamp: new Date().toISOString(),
                avatarImage: recommendation.imageUrl,
                outfit: fallbackResponse.data.data
              };
              
              setMessages(prev => [...prev, successMessage]);
              setRecommendations([]);
              
              // Store outfit info
              localStorage.setItem('lastGeneratedOutfit', JSON.stringify({
                title: recommendation.title,
                avatarImage: recommendation.imageUrl,
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

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('stylistChatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('stylistChatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Start chat when component mounts
  useEffect(() => {
    startChatSession();
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
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
              onClick={() => {
                setMessages([]);
                localStorage.removeItem('stylistChatHistory');
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

              {/* Show avatar image if available */}
              {message.avatarImage && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <img 
                    src={message.avatarImage} 
                    alt="Avatar wearing outfit"
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '12px',
                      border: '3px solid #667eea'
                    }}
                  />
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