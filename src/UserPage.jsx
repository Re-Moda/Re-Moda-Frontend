import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from './assets/logo.png';
import favStar from './assets/fav-star.webp';
import API_BASE_URL from './config.js';
import './UserPage.css';

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

const closetCategories = [
 { key: "all", label: "All" },
 { key: "top", label: "Top" },
 { key: "bottom", label: "Bottom" },
 { key: "shoes", label: "Shoes" },
 { key: "favourites", label: "Favourites" },
 { key: "recurring", label: "Recurring" },
 { key: "unused", label: "Unused" }
];

function UserAvatar({ generatedAvatarUrl, avatarUrl, username, uploading, handleAvatarChange, fileInputRef, setGeneratedAvatarUrl, handleFavorite, handleMarkAsWorn, handleMarkAsRecurring, buildMode }) {
 // Show generated avatar if it exists, otherwise show real avatar
 const displayAvatarUrl = generatedAvatarUrl || avatarUrl;
  return (
   <div className="user-avatar-container">
     {displayAvatarUrl ? (
       <div className="avatar-wrapper">
         <img
           src={displayAvatarUrl}
           alt="User Avatar"
           className="avatar-image"
         />

        
         {/* Heart button on generated avatar - positioned in top left corner in build mode */}
         {generatedAvatarUrl && (
           <div className={`avatar-heart-button ${buildMode ? 'build-mode' : ''}`}>
             <button
               onClick={handleFavorite}
               className="avatar-action-btn favorite-btn"
               title="Add to Favorites"
             >
               ❤️
             </button>
           </div>
         )}
        
         {/* Recurring button on generated avatar - positioned in bottom right corner in build mode */}
         {generatedAvatarUrl && (
           <div className={`avatar-recurring-button ${buildMode ? 'build-mode' : ''}`}>
             <button
               onClick={handleMarkAsRecurring}
               className="avatar-action-btn recurring-btn"
               title="Add to Recurring"
             >
               🔄
             </button>
           </div>
         )}
       </div>
     ) : (
       <div className="avatar-placeholder">
         <span role="img" aria-label="avatar placeholder">👤</span>
       </div>
     )}
     <div className="username">{username}</div>
     {generatedAvatarUrl && (
       <div className="avatar-buttons-container">
         <div className="ai-generated-badge">
           ✨ AI Generated Outfit
         </div>
         <button
           onClick={() => {
             setGeneratedAvatarUrl(null);
             localStorage.removeItem('generatedAvatarUrl');
           }}
           className="revert-avatar-btn"
         >
           Revert to Original Avatar
         </button>
       </div>
     )}
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
  const [selectedShoesId, setSelectedShoesId] = useState(null);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState(null);
  const [loadingTryOn, setLoadingTryOn] = useState(false);
  const [currentOutfitId, setCurrentOutfitId] = useState(null); // Only declare once

  // For storing all outfits (if you have an outfits endpoint)
  const [outfits, setOutfits] = useState([]);

  // Coin balance and upload count states
  const [coinBalance, setCoinBalance] = useState(100);
  
  // Analysis states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  
  // Load generated avatar URL from localStorage on mount (only if user doesn't have a real avatar)
  useEffect(() => {
    const savedGeneratedAvatarUrl = localStorage.getItem('generatedAvatarUrl');
    if (savedGeneratedAvatarUrl && !generatedAvatarUrl && !avatarUrl) {
      console.log('Loading saved generated avatar URL:', savedGeneratedAvatarUrl);
      setGeneratedAvatarUrl(savedGeneratedAvatarUrl);
    }
  }, [generatedAvatarUrl, avatarUrl]);

  // Add CSS for spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to process uploaded items
  const processUploadedItems = async () => {
    // If already processing, don't start another process
    if (processingUploads) {
      console.log('Already processing uploads, skipping...');
      return;
    }
    
    console.log('Starting to process uploaded items...');
    setProcessingUploads(true);
    
    try {
      // Continuous check for new items until processing is complete
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      let previousItemCount = 0;
      
      while (attempts < maxAttempts) {
        console.log(`Processing attempt ${attempts + 1}/${maxAttempts}`);
        
        // Fetch current closet items
        await fetchClosetItems();
        
        // Check if we have new items
        const currentItemCount = closetItems.length;
        console.log(`Current items: ${currentItemCount}, Previous: ${previousItemCount}`);
        
        if (currentItemCount > previousItemCount) {
          console.log('New items detected, continuing to process...');
          previousItemCount = currentItemCount;
          attempts = 0; // Reset attempts when new items are found
        } else {
          attempts++;
        }
        
        // Wait 1 second before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Load outfits after processing is complete
      console.log('Processing complete, loading outfits...');
      await loadOutfits();
      
      console.log('Uploaded items processed successfully');
      showToast('Your wardrobe has been processed successfully!', 'success');
    } catch (error) {
      console.error('Error processing uploads:', error);
      showToast('Error processing uploads. Please try again.', 'error');
    } finally {
      console.log('Setting processingUploads to false');
      setProcessingUploads(false);
      hasProcessedUploads.current = true; // Mark as processed
    }
  };
  const [uploadCount, setUploadCount] = useState(0);
  const [canAccessCloset, setCanAccessCloset] = useState(true);
  const [remainingUploads, setRemainingUploads] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});
  const [loadingItems, setLoadingItems] = useState(new Set()); // Track loading state for individual items
  const [processingUploads, setProcessingUploads] = useState(false); // Track loading state for processing uploads
  const hasProcessedUploads = useRef(false); // Track if we've already processed uploads
  const [flippedItems, setFlippedItems] = useState(new Set()); // Track which items are flipped to show details
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Track mobile menu state

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

  // Debug coin balance changes
  useEffect(() => {
    console.log('Coin balance changed to:', coinBalance);
    // Force set to 100 for testing
    if (coinBalance === 0) {
      console.log('Forcing coin balance to 100 for testing');
      setCoinBalance(100);
    }
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

    // Set up periodic check for new uploads (every 3 seconds)
    const uploadCheckInterval = setInterval(async () => {
      if (!processingUploads) { // Only check if not currently processing
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        try {
          const uploadResponse = await axios.get(`${API_BASE_URL}/users/me/upload-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (uploadResponse.data && uploadResponse.data.success) {
            const { count } = uploadResponse.data.data;
            if (count > uploadCount) {
              console.log('New uploads detected! Count changed from', uploadCount, 'to', count);
              setUploadCount(count);
              // Start processing immediately if we have new uploads
              if (!processingUploads) {
                setTimeout(() => {
                  processUploadedItems();
                }, 100);
              }
            }
          }
        } catch (error) {
          console.error('Error checking for new uploads:', error);
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(uploadCheckInterval);
  }, [uploadCount, processingUploads]);

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
      showToast("Failed to upload avatar.", 'error');
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
      console.log('Starting try-on with:', { selectedTopId, selectedBottomId, selectedShoesId });
      
      const res = await axios.post(
        `${API_BASE_URL}/outfits/generate-avatar`,
        { 
          topId: selectedTopId, 
          bottomId: selectedBottomId,
          shoesId: selectedShoesId // Include shoes if selected
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Try-on response:', res.data);
      const generatedUrl = res.data.generated_avatar_url;
      console.log('Setting generated avatar URL:', generatedUrl);
      
      setGeneratedAvatarUrl(generatedUrl);
      
      // Store in localStorage for persistence
      if (generatedUrl) {
        localStorage.setItem('generatedAvatarUrl', generatedUrl);
      }
      
      // Optionally, store the outfit ID if your backend returns it:
      // setCurrentOutfitId(res.data.outfit_id);
    } catch (err) {
      console.error('Try-on error:', err);
      showToast("Failed to generate try-on image.", 'error');
    }
    setLoadingTryOn(false);
  };

  // Heart button (favorites) functionality
  const handleFavorite = async () => {
    console.log('🔥 handleFavorite function called!');
    console.log('🔥 generatedAvatarUrl:', generatedAvatarUrl);
    console.log('🔥 selectedTopId:', selectedTopId);
    console.log('🔥 selectedBottomId:', selectedBottomId);
    console.log('🔥 selectedShoesId:', selectedShoesId);
    
    if (!generatedAvatarUrl) {
      console.log('❌ No generatedAvatarUrl, showing error toast');
      showToast('No outfit generated yet! Use "Try On" first to create an outfit.', 'error');
      return;
    }
    
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    let createResponse = null;
    
    try {
      // No duplicate checking - allow all outfits to be added
      console.log('Creating new outfit and marking as favorite...');
      
      // Create new outfit via backend
      const outfitData = {
        title: `Outfit with ${closetItems.find(i => i.id === selectedTopId)?.label || 'Top'} and ${closetItems.find(i => i.id === selectedBottomId)?.label || 'Bottom'}${selectedShoesId ? ` and ${closetItems.find(i => i.id === selectedShoesId)?.label || 'Shoes'}` : ''}`,
        clothingItemIds: selectedShoesId ? [selectedTopId, selectedBottomId, selectedShoesId] : [selectedTopId, selectedBottomId], // Include shoes if selected
        image_key: generatedAvatarUrl, // Use image_key instead of generated_image_url
        bucket_name: "clothing-items-remoda", // Add bucket name
        is_favorite: true,
        is_recurring: false
      };
      
      console.log('Sending outfit data:', outfitData);
      
      createResponse = await axios.post(`${API_BASE_URL}/outfits`, outfitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (createResponse.data && createResponse.data.success) {
        console.log('Outfit created and favorited successfully:', createResponse.data.data);
        console.log('Full response from backend:', createResponse.data);
        
        // Now update wear counts for all items in the outfit
        const outfitId = createResponse.data.data.id;
        console.log('🔄 Calling wear count update endpoint for outfit ID:', outfitId);
        console.log('🔄 Trying POST endpoint first:', `${API_BASE_URL}/outfits/${outfitId}/wear`);
        
        const wearResponse = await axios.post(`${API_BASE_URL}/outfits/${outfitId}/wear`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Wear count response:', wearResponse.data);
        
        if (wearResponse.data && wearResponse.data.success) {
          console.log('✅ Outfit marked as worn successfully, wear counts updated');
          console.log('✅ Updated outfit data:', wearResponse.data.data);
          showToast('❤️ Outfit added to favorites and marked as worn!', 'success');
        } else {
          console.error('❌ Wear count update failed:', wearResponse.data);
          showToast('❤️ Outfit added to favorites! (Wear count update failed)', 'warning');
        }
        
        // Refresh outfits from backend
        loadOutfits();
        
        // Force refresh analysis data to show updated wear counts
        console.log('🔄 Refreshing analysis data after outfit creation...');
        setTimeout(() => {
          analyzeWardrobe();
        }, 500);
      } else {
        showToast('Failed to add to favorites. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error favoriting outfit:', error);
      if (error.response) {
        console.error('Backend response:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Full error details:', JSON.stringify(error.response.data, null, 2));
      }
      showToast('Failed to add to favorites. Please try again.', 'error');
    }
  };

  // Add to Worn functionality
  const handleMarkAsWorn = async () => {
    console.log('🔥 handleMarkAsWorn function called!');
    console.log('🔥 generatedAvatarUrl:', generatedAvatarUrl);
    console.log('🔥 selectedTopId:', selectedTopId);
    console.log('🔥 selectedBottomId:', selectedBottomId);
    console.log('🔥 selectedShoesId:', selectedShoesId);
    
    if (!generatedAvatarUrl) {
      console.log('❌ No generatedAvatarUrl, showing error toast');
      showToast('No outfit generated yet! Use "Try On" first to create an outfit.', 'error');
      return;
    }
    
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    let createResponse = null;
    
    try {
      // No duplicate checking - allow all outfits to be added
      console.log('Creating new outfit and marking as worn...');
      
      // Create new outfit via backend
      const outfitData = {
        title: `Outfit with ${closetItems.find(i => i.id === selectedTopId)?.label || 'Top'} and ${closetItems.find(i => i.id === selectedBottomId)?.label || 'Bottom'}${selectedShoesId ? ` and ${closetItems.find(i => i.id === selectedShoesId)?.label || 'Shoes'}` : ''}`,
        clothingItemIds: selectedShoesId ? [selectedTopId, selectedBottomId, selectedShoesId] : [selectedTopId, selectedBottomId], // Include shoes if selected
        image_key: generatedAvatarUrl, // Use image_key instead of generated_image_url
        bucket_name: "clothing-items-remoda", // Add bucket name
        is_favorite: false,
        is_recurring: true
      };
      
      console.log('Sending outfit data:', outfitData);
      
      createResponse = await axios.post(`${API_BASE_URL}/outfits`, outfitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (createResponse.data && createResponse.data.success) {
        console.log('Outfit created and marked as worn successfully:', createResponse.data.data);
        console.log('Full response from backend:', createResponse.data);
        
        // Now update wear counts for all items in the outfit
        const outfitId = createResponse.data.data.id;
        console.log('🔄 Calling wear count update endpoint for outfit ID:', outfitId);
        console.log('🔄 Trying POST endpoint first:', `${API_BASE_URL}/outfits/${outfitId}/wear`);
        
        const wearResponse = await axios.post(`${API_BASE_URL}/outfits/${outfitId}/wear`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Wear count response:', wearResponse.data);
        
        if (wearResponse.data && wearResponse.data.success) {
          console.log('✅ Outfit marked as worn successfully, wear counts updated');
          console.log('✅ Updated outfit data:', wearResponse.data.data);
          showToast('✓ Outfit added to recurring and marked as worn!', 'success');
        } else {
          console.error('❌ Wear count update failed:', wearResponse.data);
          showToast('✓ Outfit added to recurring! (Wear count update failed)', 'warning');
        }
        
        // Refresh outfits from backend
        loadOutfits();
        
        // Force refresh analysis data to show updated wear counts
        console.log('🔄 Refreshing analysis data after outfit creation...');
        setTimeout(() => {
          analyzeWardrobe();
        }, 500);
      } else {
        showToast('Failed to mark as worn. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error marking outfit as worn:', error);
      if (error.response) {
        console.error('Backend response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      showToast('Failed to mark as worn. Please try again.', 'error');
    }
  };

  // Add to Recurring functionality
  const handleMarkAsRecurring = async () => {
    console.log('🔥 handleMarkAsRecurring function called!');
    console.log('🔥 generatedAvatarUrl:', generatedAvatarUrl);
    console.log('🔥 selectedTopId:', selectedTopId);
    console.log('🔥 selectedBottomId:', selectedBottomId);
    console.log('🔥 selectedShoesId:', selectedShoesId);
    
    if (!generatedAvatarUrl) {
      console.log('❌ No generatedAvatarUrl, showing error toast');
      showToast('No outfit generated yet! Use "Try On" first to create an outfit.', 'error');
      return;
    }
    
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    let createResponse = null;
    
    try {
      // No duplicate checking - allow all outfits to be added
      console.log('Creating new outfit and marking as recurring...');
      
      // Create new outfit via backend
      const outfitData = {
        title: `Outfit with ${closetItems.find(i => i.id === selectedTopId)?.label || 'Top'} and ${closetItems.find(i => i.id === selectedBottomId)?.label || 'Bottom'}${selectedShoesId ? ` and ${closetItems.find(i => i.id === selectedShoesId)?.label || 'Shoes'}` : ''}`,
        clothingItemIds: selectedShoesId ? [selectedTopId, selectedBottomId, selectedShoesId] : [selectedTopId, selectedBottomId], // Include shoes if selected
        image_key: generatedAvatarUrl, // Use image_key instead of generated_image_url
        bucket_name: "clothing-items-remoda", // Add bucket name
        is_favorite: false,
        is_recurring: true
      };
      
      console.log('Sending outfit data:', outfitData);
      
      createResponse = await axios.post(`${API_BASE_URL}/outfits`, outfitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (createResponse.data && createResponse.data.success) {
        console.log('Outfit created and marked as recurring successfully:', createResponse.data.data);
        console.log('Full response from backend:', createResponse.data);
        
        // Now update wear counts for all items in the outfit
        const outfitId = createResponse.data.data.id;
        console.log('🔄 Calling wear count update endpoint for outfit ID:', outfitId);
        console.log('🔄 Trying POST endpoint first:', `${API_BASE_URL}/outfits/${outfitId}/wear`);
        
        const wearResponse = await axios.post(`${API_BASE_URL}/outfits/${outfitId}/wear`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Wear count response:', wearResponse.data);
        
        if (wearResponse.data && wearResponse.data.success) {
          console.log('✅ Outfit marked as worn successfully, wear counts updated');
          console.log('✅ Updated outfit data:', wearResponse.data.data);
          showToast('✓ Outfit added to recurring and marked as worn!', 'success');
        } else {
          console.error('❌ Wear count update failed:', wearResponse.data);
          showToast('✓ Outfit added to recurring! (Wear count update failed)', 'warning');
        }
        
        // Refresh outfits from backend
        loadOutfits();
        
        // Force refresh analysis data to show updated wear counts
        console.log('🔄 Refreshing analysis data after outfit creation...');
        setTimeout(() => {
          analyzeWardrobe();
        }, 500);
      } else {
        showToast('Failed to add to recurring. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error adding outfit to recurring:', error);
      if (error.response) {
        console.error('Backend response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      showToast('Failed to add to recurring. Please try again.', 'error');
    }
  };

  // Load all outfits from backend
  const loadOutfits = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      console.log('Loading outfits from backend...');
      // Load all outfits (favorites and recurring)
      const response = await axios.get(`${API_BASE_URL}/outfits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Backend response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Outfits loaded from backend:', response.data.data);
        // Debug: log each outfit to see the structure
        response.data.data.forEach((outfit, index) => {
          console.log(`Outfit ${index}:`, outfit);
          console.log(`Outfit ${index} is_favorite:`, outfit.is_favorite);
          console.log(`Outfit ${index} is_recurring:`, outfit.is_recurring);
        });
        setOutfits(response.data.data);
      } else {
        console.log('No outfits found or backend response not successful');
        setOutfits([]);
      }
    } catch (error) {
      console.error('Error loading outfits from backend:', error);
      setOutfits([]);
    }
  };

  // Load outfits when component mounts
  useEffect(() => {
    console.log('Component mounted, loading outfits...');
    // Add a small delay to ensure localStorage is ready
    setTimeout(() => {
      loadOutfits();
    }, 100);
  }, []);

  // Load closet items when component mounts
  useEffect(() => {
    console.log('Component mounted, loading closet items...');
    
    // Reset the processed flag
    hasProcessedUploads.current = false;
    
    // Check if we should show processing state immediately
    const showProcessing = localStorage.getItem('showProcessingUploads');
    const storedUploadCount = localStorage.getItem('uploadCount');
    
    if (showProcessing === 'true' && storedUploadCount) {
      console.log('Showing processing state immediately for', storedUploadCount, 'uploads');
      setUploadCount(parseInt(storedUploadCount));
      setProcessingUploads(true);
      // Clear the flag
      localStorage.removeItem('showProcessingUploads');
      localStorage.removeItem('uploadCount');
      
      // Start processing immediately
      setTimeout(() => {
        processUploadedItems();
      }, 100);
    } else {
      // Check if we have recent uploads by checking upload count
      const checkForRecentUploads = async () => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        try {
          const uploadResponse = await axios.get(`${API_BASE_URL}/users/me/upload-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (uploadResponse.data && uploadResponse.data.success) {
            const { count } = uploadResponse.data.data;
            if (count > 0) {
              console.log('Detected recent uploads, starting processing...');
              setUploadCount(count);
              setProcessingUploads(true);
              setTimeout(() => {
                processUploadedItems();
              }, 100);
            } else {
              fetchClosetItems();
            }
          } else {
            fetchClosetItems();
          }
        } catch (error) {
          console.error('Error checking for recent uploads:', error);
          fetchClosetItems();
        }
      };
      
      checkForRecentUploads();
    }
  }, []);

  // Process uploaded items when upload count changes
  useEffect(() => {
    // Only trigger if we have uploads and we're not already processing
    if (uploadCount > 0 && !processingUploads && !hasProcessedUploads.current) {
      console.log('Upload count changed to:', uploadCount, '- triggering processing...');
      // Small delay to ensure the loading state is visible
      setTimeout(() => {
        processUploadedItems();
      }, 100);
    }
  }, [uploadCount]); // Remove processingUploads from dependencies to prevent loops

  // Check for generated avatar from chat (but don't override user's actual avatar)
  useEffect(() => {
    const savedAvatarUrl = localStorage.getItem('generatedAvatarUrl');
    if (savedAvatarUrl && !generatedAvatarUrl && !avatarUrl) {
      // Only set generated avatar if user doesn't have an actual avatar
      setGeneratedAvatarUrl(savedAvatarUrl);
    }
  }, [generatedAvatarUrl, avatarUrl]);

  // Check for outfit refresh trigger from chat
  useEffect(() => {
    const refreshTrigger = localStorage.getItem('refreshOutfits');
    if (refreshTrigger === 'true') {
      console.log('Refreshing outfits from chat trigger...');
      loadOutfits();
      localStorage.removeItem('refreshOutfits');
    }
  }, []);

  // Toggle favorite status for existing outfits
  const toggleFavorite = async (outfitId) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const response = await axios.patch(`${API_BASE_URL}/outfits/${outfitId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        console.log('Favorite status toggled successfully');
        showToast('Favorite status updated successfully!', 'success');
        // Refresh outfits from backend
        loadOutfits();
      } else {
        showToast('Failed to toggle favorite status. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to toggle favorite status. Please try again.', 'error');
    }
  };

  // Toggle outfit recurring status
  const markAsWorn = async (outfitId) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      // First, mark the outfit as worn to update wear counts using POST endpoint
      console.log('🔄 Calling wear count update endpoint for outfit ID:', outfitId);
      console.log('🔄 Trying POST endpoint first:', `${API_BASE_URL}/outfits/${outfitId}/wear`);
      
      const wearResponse = await axios.post(`${API_BASE_URL}/outfits/${outfitId}/wear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Wear count response:', wearResponse.data);
      
      if (wearResponse.data && wearResponse.data.success) {
        console.log('✅ Outfit marked as worn successfully, wear counts updated');
        console.log('✅ Updated outfit data:', wearResponse.data.data);
        showToast('Outfit marked as worn! Wear counts updated.', 'success');
        
        // Refresh closet items to show updated wear counts
        await fetchClosetItems();
        
        // Then toggle the recurring status using PATCH endpoint
        const recurringResponse = await axios.patch(`${API_BASE_URL}/outfits/${outfitId}`, {
          is_recurring: false
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (recurringResponse.data && recurringResponse.data.success) {
          console.log('✅ Outfit removed from recurring successfully');
          // Refresh outfits from backend
          loadOutfits();
        }
      } else {
        console.error('❌ Wear count update failed:', wearResponse.data);
        showToast('Failed to mark outfit as worn. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ POST endpoint failed, trying PATCH endpoint...');
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Fallback to PATCH endpoint
      try {
        console.log('🔄 Trying PATCH endpoint:', `${API_BASE_URL}/outfits/${outfitId}/worn`);
        
        const wearResponse = await axios.patch(`${API_BASE_URL}/outfits/${outfitId}/worn`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ PATCH Wear count response:', wearResponse.data);
        
        if (wearResponse.data && wearResponse.data.success) {
          console.log('✅ Outfit marked as worn successfully via PATCH, wear counts updated');
          console.log('✅ Updated outfit data:', wearResponse.data.data);
          showToast('Outfit marked as worn! Wear counts updated.', 'success');
          
          // Refresh closet items to show updated wear counts
          await fetchClosetItems();
          
          // Then toggle the recurring status using PATCH endpoint
          const recurringResponse = await axios.patch(`${API_BASE_URL}/outfits/${outfitId}`, {
            is_recurring: false
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (recurringResponse.data && recurringResponse.data.success) {
            console.log('✅ Outfit removed from recurring successfully');
            // Refresh outfits from backend
            loadOutfits();
          }
        } else {
          console.error('❌ PATCH Wear count update failed:', wearResponse.data);
          showToast('Failed to mark outfit as worn. Please try again.', 'error');
        }
      } catch (patchError) {
        console.error('❌ Both POST and PATCH endpoints failed');
        console.error('❌ PATCH Error response:', patchError.response?.data);
        console.error('❌ PATCH Error status:', patchError.response?.status);
        showToast('Failed to mark outfit as worn. Please try again.', 'error');
      }
    }
  };

  // Mark existing outfit as worn (for wear count updates)
  const markExistingOutfitAsWorn = async (outfitId) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      console.log('🔄 Marking existing outfit as worn for outfit ID:', outfitId);
      console.log('🔄 Trying POST endpoint first:', `${API_BASE_URL}/outfits/${outfitId}/wear`);
      
      // Try POST endpoint first
      const wearResponse = await axios.post(`${API_BASE_URL}/outfits/${outfitId}/wear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Wear count response:', wearResponse.data);
      
      if (wearResponse.data && wearResponse.data.success) {
        console.log('✅ Existing outfit marked as worn successfully, wear counts updated');
        console.log('✅ Updated outfit data:', wearResponse.data.data);
        showToast('Outfit marked as worn! Wear counts updated.', 'success');
        
        // Refresh closet items to show updated wear counts
        await fetchClosetItems();
        
        // Refresh outfits from backend
        loadOutfits();
      } else {
        console.error('❌ Wear count update failed:', wearResponse.data);
        showToast('Failed to mark outfit as worn. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ POST endpoint failed, trying PATCH endpoint...');
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Fallback to PATCH endpoint
      try {
        console.log('🔄 Trying PATCH endpoint:', `${API_BASE_URL}/outfits/${outfitId}/worn`);
        
        const wearResponse = await axios.patch(`${API_BASE_URL}/outfits/${outfitId}/worn`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ PATCH Wear count response:', wearResponse.data);
        
        if (wearResponse.data && wearResponse.data.success) {
          console.log('✅ Existing outfit marked as worn successfully via PATCH, wear counts updated');
          console.log('✅ Updated outfit data:', wearResponse.data.data);
          showToast('Outfit marked as worn! Wear counts updated.', 'success');
          
          // Refresh closet items to show updated wear counts
          await fetchClosetItems();
          
          // Refresh outfits from backend
          loadOutfits();
        } else {
          console.error('❌ PATCH Wear count update failed:', wearResponse.data);
          showToast('Failed to mark outfit as worn. Please try again.', 'error');
        }
      } catch (patchError) {
        console.error('❌ Both POST and PATCH endpoints failed');
        console.error('❌ PATCH Error response:', patchError.response?.data);
        console.error('❌ PATCH Error status:', patchError.response?.status);
        showToast('Failed to mark outfit as worn. Please try again.', 'error');
      }
    }
  };

  // Test function to check if wear count endpoint exists
  const testWearCountEndpoint = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      console.log('�� Testing wear count endpoints...');
      console.log('🧪 Trying POST endpoint first:', `${API_BASE_URL}/outfits/1/wear`);
      
      // Try POST endpoint first
      const response = await axios.post(`${API_BASE_URL}/outfits/1/wear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ POST Wear count endpoint test response:', response.data);
      showToast('POST wear count endpoint is working!', 'success');
    } catch (error) {
      console.error('❌ POST endpoint failed, trying PATCH...');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      // Try PATCH endpoint as fallback
      try {
        console.log('🧪 Trying PATCH endpoint:', `${API_BASE_URL}/outfits/1/worn`);
        
        const patchResponse = await axios.patch(`${API_BASE_URL}/outfits/1/worn`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ PATCH Wear count endpoint test response:', patchResponse.data);
        showToast('PATCH wear count endpoint is working!', 'success');
      } catch (patchError) {
        console.error('❌ Both POST and PATCH endpoints failed');
        console.error('❌ PATCH Error status:', patchError.response?.status);
        console.error('❌ PATCH Error data:', patchError.response?.data);
        showToast(`Both wear count endpoints failed: POST(${error.response?.status || 'Unknown'}), PATCH(${patchError.response?.status || 'Unknown'})`, 'error');
      }
    }
  };

  // Analyze wardrobe function
  const analyzeWardrobe = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      // First refresh closet items to get latest wear count data
      console.log('🔄 Refreshing closet items before analysis...');
      await fetchClosetItems();
      
      // Add a small delay to ensure backend has processed the wear count updates
      console.log('⏳ Waiting for backend to process wear count updates...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Running wardrobe analysis...');
      const response = await axios.post(
        `${API_BASE_URL}/mcp/analyze-wardrobe`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Analysis response:', response.data);
      
      if (response.data && response.data.success) {
        const { data } = response.data;
        console.log('📊 Analysis data received:', data);
        console.log('📊 itemsWornOnce:', data.analysis?.itemsWornOnce);
        console.log('📊 itemsWornZeroTimes:', data.analysis?.itemsWornZeroTimes);
        console.log('📊 itemsNotWornIn6Months:', data.analysis?.itemsNotWornIn6Months);
        displayAnalysisModal(data);
      } else {
        showToast('Failed to analyze wardrobe. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ Error analyzing wardrobe:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      showToast('Failed to analyze wardrobe. Please try again.', 'error');
    }
  };

  // Display analysis modal function
  const displayAnalysisModal = (data) => {
    setAnalysisData(data);
    setShowAnalysisModal(true);
  };

  const fetchClosetItems = async () => {
    const jwtToken = sessionStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/clothing-items`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('✅ API call successful - Clothing items fetched');
      console.log('📋 Sample item data:', response.data.data?.[0]);
      
      // Check if items need label updates
      const items = Array.isArray(response.data.data) ? response.data.data : [];
      const itemsNeedingUpdate = items.filter(item => 
        item.label && item.label.includes('Screenshot') && item.description
      );
      
      if (itemsNeedingUpdate.length > 0) {
        console.log(`🔄 Found ${itemsNeedingUpdate.length} items that need label updates`);
        // Update labels for items with filenames
        await updateItemLabels(itemsNeedingUpdate);
      }
      
      setClosetItems(items);
    } catch (error) {
      console.error('❌ Error fetching closet items:', error);
      setClosetItems([]);
    }
  };

  // Function to update item labels using descriptions
  const updateItemLabels = async (items) => {
    const jwtToken = sessionStorage.getItem("token");
    
    for (const item of items) {
      try {
        // Generate short, concise label from description
        let newLabel = item.description;
        
        // Remove common prefixes
        if (newLabel.startsWith('This is a ')) {
          newLabel = newLabel.substring(10);
        } else if (newLabel.startsWith('This is ')) {
          newLabel = newLabel.substring(8);
        }
        
        // Take only the first part (before the first period or comma)
        const firstSentence = newLabel.split(/[.,]/)[0];
        
        // Limit to first 4-5 words for a concise label
        const words = firstSentence.split(' ');
        const shortLabel = words.slice(0, 5).join(' ');
        
        // Update the item label via API
        const updateResponse = await axios.patch(`${API_BASE_URL}/clothing-items/${item.id}`, {
          label: shortLabel
        }, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        
        console.log(`✅ Updated label for item ${item.id}: "${shortLabel}"`);
      } catch (error) {
        console.error(`❌ Failed to update label for item ${item.id}:`, error);
      }
    }
  };

  const moveToUnused = async (itemId) => {
    console.log('moveToUnused called with itemId:', itemId);
    setLoadingItems(prev => new Set(prev).add(itemId));
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    console.log('Token available:', !!token);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      console.log('Making request to:', `${API_BASE_URL}/clothing-items/${itemId}/unused`);
      const response = await axios.patch(`${API_BASE_URL}/clothing-items/${itemId}/unused`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response received:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Item moved to unused successfully:', response.data.message);
        // Refresh closet items from backend
        await fetchClosetItems();
        console.log('Closet items refreshed');
        // Show success toast
        showToast('Item moved to unused successfully!', 'success');
      } else {
        console.error('Failed to move item to unused:', response.data);
        showToast('Failed to move item to unused. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error moving to unused:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle different error cases
      if (error.response?.status === 401) {
        showToast('Please log in again to continue.', 'error');
      } else {
        showToast('Failed to move item to unused. Please try again.', 'error');
      }
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Restore item from unused back to closet
  const restoreFromUnused = async (itemId) => {
    console.log('restoreFromUnused called with itemId:', itemId);
    setLoadingItems(prev => new Set(prev).add(itemId));
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    console.log('Token available:', !!token);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      console.log('Making request to:', `${API_BASE_URL}/clothing-items/${itemId}/restore`);
      const response = await axios.patch(`${API_BASE_URL}/clothing-items/${itemId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response received:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Item restored from unused successfully:', response.data.message);
        // Refresh closet items from backend
        await fetchClosetItems();
        console.log('Closet items refreshed');
        // Show success toast
        showToast('Item restored to closet successfully!', 'success');
      } else {
        console.error('Failed to restore item from unused:', response.data);
        showToast('Failed to restore item from unused. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error restoring from unused:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle different error cases
      if (error.response?.status === 401) {
        showToast('Please log in again to continue.', 'error');
      } else {
        showToast('Failed to restore item from unused. Please try again.', 'error');
      }
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Update closet filter logic
  const filteredItems = (() => {
    console.log('Current selectedCategory:', selectedCategory);
    console.log('All closetItems:', closetItems);
    console.log('Items with is_unused flag:', closetItems.filter(item => item.is_unused === true));
    
    if (selectedCategory === "favourites") {
      const favoriteOutfits = outfits.filter(o => o.is_favorite);
      console.log('Favorite outfits:', favoriteOutfits);
      return favoriteOutfits;
    }
    if (selectedCategory === "recurring") {
      const recurringOutfits = outfits.filter(o => o.is_recurring);
      console.log('Recurring outfits:', recurringOutfits);
      return recurringOutfits;
    }
    if (selectedCategory === "unused") {
      const unusedItems = closetItems.filter(item => item.is_unused === true);
      console.log('Unused items found:', unusedItems.length, unusedItems);
      return unusedItems;
    }
    const allItems = closetItems.filter(item =>
      selectedCategory === "all"
        ? !item.is_unused // Exclude unused items from "All" category
        : (item.category || item.tag)?.toLowerCase() === selectedCategory && !item.is_unused // Exclude unused items from specific categories too
    );
    console.log('Filtered items for category', selectedCategory, ':', allItems.length);
    return allItems;
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

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('State update - processingUploads:', processingUploads, 'uploadCount:', uploadCount);
  }, [processingUploads, uploadCount]);

  // Fallback mechanism to prevent stuck processing state
  useEffect(() => {
    if (processingUploads) {
      const timeout = setTimeout(() => {
        console.log('Processing timeout reached - forcing state reset');
        setProcessingUploads(false);
        showToast('Processing completed (timeout). Your wardrobe has been updated.', 'success');
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [processingUploads]);

  if (loading) return <div>Loading your closet...</div>;

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

  return (
    <div className={`user-page ${buildMode ? 'build-mode' : ''}`} style={{
      fontFamily: "'EB Garamond', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      background: "inherit",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* Logo overlay */}
      <div className="logo-overlay" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Re:Moda Logo" className="site-logo" />
      </div>

      {/* Navbar */}
      <nav className={`navbar ${buildMode ? 'build-mode' : ''}`}>
        <div className="navbar-content">
          {/* Page title in navbar */}
          <div className="navbar-title">{buildMode ? 'Build Your Own Mode' : 'My Closet'}</div>
          
          {/* Desktop navigation */}
          <div className="uploads-nav-buttons">
            <button
              className={`nav-btn build-btn ${coinBalance < 10 ? 'disabled' : ''}`}
              onClick={() => {
                if (buildMode) {
                  // Exit build mode
                  setBuildMode(false);
                  setSelectedTopId(null);
                  setSelectedBottomId(null);
                  setGeneratedAvatarUrl(null);
                } else {
                  // Enter build mode
                  if (coinBalance < 10) {
                    alert(`You need 10 coins to use AI Try-On. Current balance: ${coinBalance} coins`);
                    return;
                  }
                  setBuildMode(true);
                  setSelectedTopId(null);
                  setSelectedBottomId(null);
                  setGeneratedAvatarUrl(null);
                }
              }}
            >
              <span className="btn-icon">{buildMode ? '🏠 ' : '✨ '}</span>
              <span className="btn-text">{buildMode ? 'Back to My Closet' : 'Build your own (10 coins)'}</span>
              <span className="btn-text-mobile">{buildMode ? 'Back' : 'Build'}</span>
            </button>
            
            <button
              className="nav-btn analyze-btn"
              onClick={analyzeWardrobe}
            >
              <span className="btn-icon">📊 </span>
              <span className="btn-text">Analyze Wardrobe</span>
              <span className="btn-text-mobile">Analyze</span>
            </button>
            
            <button
              className="nav-btn chat-btn"
              onClick={() => window.location.href = '/stylist-chat'}
            >
              <span className="btn-icon">💬 </span>
              <span className="btn-text">Chat w/ ur stylist</span>
              <span className="btn-text-mobile">Chat</span>
            </button>
            
            <button
              className="nav-btn coins-btn"
              onClick={() => window.location.href = "/thrift"}
            >
              <span className="btn-icon">🪙 </span>
              <span className="btn-text">Get More Coins</span>
              <span className="btn-text-mobile">Get More</span>
            </button>
            
            {/* Coin Balance */}
            <div className="coin-balance">
              <span className="coin-icon">🪙 </span>
              <span className="coin-amount">{Math.max(0, coinBalance)} coins</span>
            </div>
          </div>

          {/* Mobile hamburger menu */}
          <div className="mobile-menu-toggle">
            <button 
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <h3>Menu</h3>
                <button 
                  className="mobile-menu-close"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="mobile-menu-items">
                <button
                  className="mobile-menu-item"
                  onClick={() => {
                    window.location.href = '/';
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-menu-icon">🏠</span>
                  <span className="mobile-menu-text">Home</span>
                </button>
                
                <button
                  className={`mobile-menu-item ${coinBalance < 10 ? 'disabled' : ''}`}
                  onClick={() => {
                    if (buildMode) {
                      setBuildMode(false);
                      setSelectedTopId(null);
                      setSelectedBottomId(null);
                      setGeneratedAvatarUrl(null);
                    } else {
                      if (coinBalance < 10) {
                        alert(`You need 10 coins to use AI Try-On. Current balance: ${coinBalance} coins`);
                        return;
                      }
                      setBuildMode(true);
                      setSelectedTopId(null);
                      setSelectedBottomId(null);
                      setGeneratedAvatarUrl(null);
                    }
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-menu-icon">{buildMode ? '🏠' : '✨'}</span>
                  <span className="mobile-menu-text">{buildMode ? 'Back to My Closet' : 'Build your own (10 coins)'}</span>
                </button>
                
                <button
                  className="mobile-menu-item"
                  onClick={() => {
                    analyzeWardrobe();
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-menu-icon">📊</span>
                  <span className="mobile-menu-text">Analyze Wardrobe</span>
                </button>
                
                <button
                  className="mobile-menu-item"
                  onClick={() => {
                    window.location.href = '/stylist-chat';
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-menu-icon">💬</span>
                  <span className="mobile-menu-text">Chat w/ ur stylist</span>
                </button>
                
                <button
                  className="mobile-menu-item"
                  onClick={() => {
                    window.location.href = "/thrift";
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="mobile-menu-icon">🪙</span>
                  <span className="mobile-menu-text">Get More Coins</span>
                </button>
              </div>
              
              <div className="mobile-menu-footer">
                <div className="mobile-coin-balance">
                  <span className="mobile-coin-icon">🪙</span>
                  <span className="mobile-coin-amount">{Math.max(0, coinBalance)} coins</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Animated star background, always behind content */}
      <div className="star-bg">{stars}</div>

      {/* Full Screen Loading State for Processing Uploads */}
      {processingUploads && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="spinner"></div>
            <div className="processing-text">
              Processing Your Wardrobe...
            </div>
            <div className="processing-subtext">
              Please wait while we process your uploaded items and update your closet.
            </div>
          </div>
        </div>
      )}
      
      {/* Main white card */}
      <div className="main-content">
        {/* Main Content Container */}
        <div className="content-container">
          {/* Closet Category Filter - Horizontal at top */}
          <div className={`category-filter ${buildMode ? 'build-mode' : ''}`}>
            {/* Build Status Popup - shows selection status (left side in build mode) */}
            {buildMode && (
              <div className="build-status-popup">
                <div className="selection-status">
                  <div className="status-line">
                    <span className="status-label">Selected Top:</span>
                    <span className="status-value">{selectedTopId ? '✓' : 'No top selected'}</span>
                  </div>
                  <div className="status-line">
                    <span className="status-label">Selected Bottom:</span>
                    <span className="status-value">{selectedBottomId ? '✓' : 'No bottom selected'}</span>
                  </div>
                  <div className="status-line">
                    <span className="status-label">Selected Shoes:</span>
                    <span className="status-value">{selectedShoesId ? '✓' : 'No shoes selected'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Categories (right side in build mode) */}
            <div className="categories-container">
              {closetCategories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`category-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {/* Try On button - at the end of categories */}
            {buildMode && (
              <button
                onClick={handleTryOn}
                disabled={!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10}
                className={`try-on-btn ${(!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10) ? 'disabled' : ''}`}
              >
                {loadingTryOn ? "Generating..." : "Try On"}
              </button>
            )}
          </div>
          
          {/* Content Area - Avatar on left, clothes on right */}
          <div className="content-area">
            {/* Avatar Section */}
            <div className="avatar-section">
              <UserAvatar
                generatedAvatarUrl={generatedAvatarUrl}
                avatarUrl={avatarUrl}
                username={username}
                uploading={uploading}
                handleAvatarChange={handleAvatarChange}
                fileInputRef={fileInputRef}
                setGeneratedAvatarUrl={setGeneratedAvatarUrl}
                handleFavorite={handleFavorite}
                handleMarkAsWorn={handleMarkAsWorn}
                handleMarkAsRecurring={handleMarkAsRecurring}
                buildMode={buildMode}
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
                  animation: 'moveText 15s linear infinite'
                }}>
                  No matter what you wear you are beautiful!
                </span>
              </div>
            </div>
            
            {/* Clothing Items Section */}
            <div className="clothing-section">
              {/* Categories Container - moved here for mobile */}
              <div className="mobile-categories-container">
                {closetCategories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`category-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                  >
                    {cat.label}
                  </button>
                ))}
                
                {/* Try On button - mobile build mode */}
                {buildMode && (
                  <button
                    onClick={handleTryOn}
                    disabled={!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10}
                    className={`try-on-btn ${(!selectedTopId || !selectedBottomId || loadingTryOn || coinBalance < 10) ? 'disabled' : ''}`}
                  >
                    {loadingTryOn ? "Generating..." : "Try On"}
                  </button>
                )}
              </div>
              
              <div className="section-title">
                <span className="item-count">({filteredItems.length} items)</span>
              </div>
              
              {/* Closet Grid: Scrollable container with 2x2 grid */}
              <div className="closet-grid">
                {filteredItems.length === 0 && <div className="no-items">No items in this category.</div>}
                {filteredItems.map(item => {
                  // Check if this is an outfit (has outfitClothingItems or is_favorite/is_recurring) or a clothing item
                  const isOutfit = item.outfitClothingItems || item.clothingItemIds || item.clothing_item_ids || item.item_ids || item.clothing_ids || item.items || item.is_favorite || item.is_recurring;
                  
                  return (
                    <div
                      key={item.id}
                      className={`closet-item ${buildMode ? 'build-mode' : ''} ${buildMode && ((selectedTopId && selectedTopId === item.id) || (selectedBottomId && selectedBottomId === item.id) || (selectedShoesId && selectedShoesId === item.id)) ? 'selected' : ''} ${flippedItems.has(item.id) ? 'flipped' : ''}`}
                      onClick={() => {
                        if (!buildMode) return;
                        
                        // Handle top selection/deselection
                        if ((item.category || item.tag)?.toLowerCase() === 'top') {
                          if (selectedTopId === item.id) {
                            // Deselect if already selected
                            setSelectedTopId(null);
                            showToast('Top deselected!', 'info');
                          } else {
                            // Select new top
                            setSelectedTopId(item.id);
                            showToast('Top selected!', 'success');
                          }
                        }
                        
                        // Handle bottom selection/deselection
                        if ((item.category || item.tag)?.toLowerCase() === 'bottom') {
                          if (selectedBottomId === item.id) {
                            // Deselect if already selected
                            setSelectedBottomId(null);
                            showToast('Bottom deselected!', 'info');
                          } else {
                            // Select new bottom
                            setSelectedBottomId(item.id);
                            showToast('Bottom selected!', 'success');
                          }
                        }
                        
                        // Handle shoes selection
                        if ((item.category || item.tag)?.toLowerCase() === 'shoes') {
                          if (selectedShoesId === item.id) {
                            // Deselect if already selected
                            setSelectedShoesId(null);
                            showToast('Shoes deselected!', 'info');
                          } else {
                            // Select new shoes
                            setSelectedShoesId(item.id);
                            showToast('Shoes selected!', 'success');
                          }
                        }
                      }}
                    >
                      <div className="card-inner">
                        <div className="card-front">
                          {isOutfit ? (
                            // Render outfit (generated outfit image)
                            <>
                              {(() => {
                                // Try multiple possible field names for image URL
                                const imageUrl = item.image_key || item.generated_image_url || item.generatedImageUrl || item.image_url || item.imageUrl || item.avatar_url || item.avatarUrl || item.outfit_image_url || item.outfitImageUrl || item.generated_avatar_url;
                                console.log('Outfit image URL:', imageUrl, 'for outfit:', item);
                                
                                // If no image URL found, try to get it from localStorage (for outfits created via chat)
                                if (!imageUrl) {
                                  const lastGeneratedOutfit = localStorage.getItem('lastGeneratedOutfit');
                                  if (lastGeneratedOutfit) {
                                    try {
                                      const parsedOutfit = JSON.parse(lastGeneratedOutfit);
                                      if (parsedOutfit.title === item.title) {
                                        console.log('Found matching outfit in localStorage:', parsedOutfit);
                                        return (
                                          <img
                                            src={parsedOutfit.avatarImage}
                                            alt="Generated Outfit"
                                            style={{ width: '100%', height: '85%', objectFit: "cover", borderRadius: 12, marginBottom: 8 }}
                                            onError={(e) => {
                                              console.log('Failed to load outfit image from localStorage:', parsedOutfit.avatarImage);
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                        );
                                      }
                                    } catch (error) {
                                      console.error('Error parsing lastGeneratedOutfit:', error);
                                    }
                                  }
                                }
                                
                                return imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt="Generated Outfit"
                                    style={{ width: '100%', height: '85%', objectFit: "cover", borderRadius: 12, marginBottom: 8 }}
                                    onError={(e) => {
                                      console.log('Failed to load outfit image:', imageUrl);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '100%',
                                    height: 200,
                                    background: '#f0f0f0',
                                    borderRadius: 12,
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#666',
                                    fontSize: 12
                                  }}>
                                    No Image
                                  </div>
                                );
                              })()}
                              
                              {/* Heart button positioned at top right */}
                              {!item.is_recurring && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item.id);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    background: item.is_favorite ? '#ff6b6b' : '#f0f0f0',
                                    color: item.is_favorite ? 'white' : '#666',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                  }}
                                  title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  {item.is_favorite ? '❤️' : '🤍'}
                                </button>
                              )}
                              
                              {/* Mark as Worn button for favorite outfits */}
                              {item.is_favorite && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markExistingOutfitAsWorn(item.id);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                  }}
                                  title="Mark as Worn"
                                >
                                  ✓
                                </button>
                              )}
                              
                              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                                {item.is_favorite ? "Favorite Outfit" : "✓ Recurring Outfit"}
                              </div>
                              <div style={{ color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}>
                                {item.is_favorite ? "Favorited" : "Recurring"}
                              </div>
                              
                              {/* Worn button positioned at top right */}
                              {item.is_recurring && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsWorn(item.id);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                  }}
                                  title="Remove from worn"
                                >
                                  ✓
                                </button>
                              )}
                            </>
                          ) : (
                            // Render clothing item
                            <>
                              {/* Button to move to unused or restore from unused */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (loadingItems.has(item.id)) return; // Prevent multiple clicks
                                  if (item.is_unused) {
                                    console.log('Plus button clicked for item:', item.id, item.label || item.title);
                                    restoreFromUnused(item.id);
                                  } else {
                                    console.log('X button clicked for item:', item.id, item.label || item.title);
                                    moveToUnused(item.id);
                                  }
                                }}
                                disabled={loadingItems.has(item.id)}
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  background: loadingItems.has(item.id) ? '#ccc' : (item.is_unused ? '#90EE90' : '#ffb3d9'), // Gray when loading
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: 24,
                                  height: 24,
                                  fontSize: 16,
                                  fontWeight: 'bold',
                                  cursor: loadingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10,
                                  opacity: loadingItems.has(item.id) ? 0.6 : 1
                                }}
                                title={loadingItems.has(item.id) ? "Processing..." : (item.is_unused ? "Move back to closet" : "Move to Unused")}
                              >
                                {loadingItems.has(item.id) ? (
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    border: '2px solid #fff',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                  }}></div>
                                ) : (
                                  item.is_unused ? '+' : '−'
                                )}
                              </button>
                              {/* AI-generated image */}
                              <img
                                src={item.generatedImageUrl}
                                alt={item.label || item.title}
                                style={{ width: '100%', height: '85%', objectFit: "cover", borderRadius: 12, marginBottom: 8 }}
                                onError={(e) => {
                                  console.log('Failed to load generated image for item:', item.id, item.generatedImageUrl);
                                  e.target.style.display = 'none';
                                }}
                              />
                              {/* Original image (optional) */}
                              {item.originalImageUrl && (
                                <img
                                  src={item.originalImageUrl}
                                  alt="Original"
                                  style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, marginBottom: 8, border: "1px solid #eee" }}
                                  onError={(e) => {
                                    console.log('Failed to load original image for item:', item.id, item.originalImageUrl);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFlippedItems(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(item.id)) {
                                      newSet.delete(item.id);
                                    } else {
                                      newSet.add(item.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  border: 'none',
                                  color: '#7c3aed',
                                  fontSize: 16,
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 24,
                                  height: 24,
                                  zIndex: 10,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                title={flippedItems.has(item.id) ? 'Show front' : 'View details'}
                              >
                                ℹ️
                              </button>
                            </>
                          )}
                        </div>
                        <div className="card-back">
                          <div className="description-content">
                            <h3>Item Details</h3>
                            <p>{item.description || 'No description available.'}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlippedItems(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(item.id);
                                  return newSet;
                                });
                              }}
                              className="flip-back-btn"
                            >
                              ← Back to Item
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Add (+) button overlay - positioned on top of closet grid */}
              <button
                onClick={() => window.location.href = "/uploads"}
                className="add-item-overlay-btn"
                title="Add more clothes"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && analysisData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ color: '#7c3aed', marginBottom: 24 }}>Wardrobe Analysis</h2>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#374151', marginBottom: 16 }}>Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>Total Items</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
                    {analysisData.analysis?.totalItems || 0}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>Never Worn</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                    {analysisData.analysis?.itemsWornZeroTimes || 0}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>Worn Once</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                    {analysisData.analysis?.itemsWornOnce || 0}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>Not Worn in 6 Months</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                    {analysisData.analysis?.itemsNotWornIn6Months || 0}
                  </div>
                </div>
              </div>
            </div>

            {analysisData.suggestedForDonation && analysisData.suggestedForDonation.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: '#374151', marginBottom: 16 }}>
                  Suggested for Donation ({analysisData.suggestedForDonation.length} items)
                </h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {analysisData.suggestedForDonation.map(item => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      marginBottom: 8
                    }}>
                      <img 
                        src={item.image_key} 
                        alt={item.label}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: '#6b7280' }}>Worn: {item.wear_count || 0} times</span>
                      <button 
                        onClick={() => moveToUnused(item.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        Move to Unused
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAnalysisModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
              
export default UserPage; 