import "./ThriftPage.css";
import { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, Marker } from'@react-google-maps/api';
import pinkStarMarker from "./assets/pink-star-marker.png";
import goldStarMarker from "./assets/gold-star-marker.png";
import coinRemoda from "./assets/coin-re-moda.png";
import logo from "./assets/logo.png";
import axios from "axios";
import API_BASE_URL from './config.js';


// Google Maps libraries to load (Places API is needed for place search)
const libraries = ["places"];

// ThriftMap component renders the Google Map and its markers
// Receives coordinates, places, and callbacks as props
const ThriftMap = ({ coords, places, onMapLoad, handleSidebarClick, pinkStarMarker, goldStarMarker, selectedPlace }) => {  // passing as props 
    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
            {/* Only render the map if coordinates are available */}
            {coords && typeof coords.lat === "number" && typeof coords.lng === "number" && (
                 <GoogleMap
                    center={coords}
                    zoom={14}
                    mapContainerClassName="map-container"  // mapContainerClassName is the class name of the div that contains the map w/in api
                    onLoad={onMapLoad}  // loads places array into state
                >
                    {/* Render custom markers for each place */}
                    {renderMarkers(places, handleSidebarClick, pinkStarMarker, goldStarMarker, selectedPlace, coords)}
                </GoogleMap>
              )}
        </LoadScript>
    )
}

// Helper function to render a Marker for each place
// Uses a custom icon and sets up click handler
const renderMarkers = (places, handleSidebarClick, pinkStarMarker, goldStarMarker, selectedPlace, coords) => {
    const allMarkers = [];
    if (coords) {
        allMarkers.push(
            <Marker
                key="user-location"
                position={coords}
            />
        )
    }
    if(Array.isArray(places)) {
        places.forEach(place => {
            // Extract latitude and longitude from Google Maps LatLng object or plain object
            const pos = place.geometry?.location;
            let lat, lng;
            if (pos) {
                lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
                lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
            }
            if(typeof lat !== "number" || typeof lng !== "number") {
                console.log("Invalid lat or lng", place.name, pos);
                return null;
            }
            const isSelected = selectedPlace && selectedPlace.place_id === place.place_id;  // check if this place is selected
            const markerIcon = isSelected ? goldStarMarker : pinkStarMarker;
            allMarkers.push(
                <Marker
                    key={place.place_id}
                    position={{ lat, lng }}
                    icon={{
                        url: markerIcon,
                        scaledSize: new window.google.maps.Size(30,30)
                    }}
                    onClick={() => handleSidebarClick(place)}
                />
            )
        });
    }
    return allMarkers;
}

const DetailedView = ({ place, onBack, routeDuration, routeDistance}) => {
    if(!place) return <div>Loading...</div>;

    // helper to render contact info
    const renderContactInfo = () => {
        const hasPhone = place.formatted_phone_number;
        const hasWebsite = place.website;

        if (!hasPhone && !hasWebsite) {
            return (
                <div className="detailed-contact-info no-contact"> 
                    <p>No contact information available</p>
                </div>
            );
        }
        if (hasPhone && !hasWebsite) {
            return (
                <div className="detailed-contact-info phone-only">
                    <a href={`tel:${place.formatted_phone_number}`}>{place.formatted_phone_number}</a>
                </div>
            );
        }
        if (!hasPhone && hasWebsite) {
            return (
                <div className="detailed-contact-info website-only">
                    <a href={place.website} target="_blank" rel="noopener noreferrer">{place.website}</a>
                </div>
            );
        }
        // if both available
        return (
            <div className="detailed-contact-info">
                <a href={`tel:${place.formatted_phone_number}`}>{place.formatted_phone_number}</a>
                    <br />
                <a href={place.website} target="_blank" rel="noopener noreferrer">{place.website}</a>
            </div>
        )
    }

    return (
        <div className="detailed-view">
            <button className="back-button" onClick={onBack}>← Back to List</button>
            <h4 className="detailed-view-title">{place.name}</h4>
            <p className="detailed-view-text">Address:</p>
            <div className="detailed-address-text">
                <p>{place.formatted_address}</p>
            </div>
            {routeDuration && routeDistance &&(
                <div className="travel-info">
                    <p>🚗 Travel time: {routeDuration}</p>
                    <p>🚗 Travel distance: {routeDistance}</p>
                </div>
            )}
            <p className="detailed-view-text">Contact:</p>
            {renderContactInfo()}
            <p className="detailed-view-text">Hours:</p>
            <div className="detailed-hours-text">
                {place.opening_hours?.weekday_text?.map((day, index) => (
                    <p key={index}>{day}</p>
                ))}
            </div>
            <p className="detailed-view-text">Rating:</p>
            <p className="rating-text">{place.rating} stars from {place.user_ratings_total} reviews</p>
            <p className="detailed-view-text">Photos:</p>
            <div className="photo-gallery">
                {place.photos?.map((photo, index) => (
                    <img key={index} src={photo.getUrl({maxWidth: 300})} alt={`${place.name} photo`} />
                ))}
            </div>
        </div>
    )
}

// Main page component for the thrift store map and sidebar
const ThriftPage = () => {
    const [coords, setCoords] = useState(null);  // State for user's coordinates (from browser geolocation)
    const [places, setPlaces] = useState([]);  // State for array of nearby thrift store places
    const [selectedPlace, setSelectedPlace] = useState(null);  // State for the currently selected place (for details or highlighting)
    const [detailedView, setDetailedView] = useState(false);  // State for showing list or detailed view
    const [detailedPlace, setDetailedPlace] = useState(null);  // State for detailed info about a place (COMING BACK TO THIS)
    const [isLoading, setIsLoading] = useState(false);  // State for loading state (reusable)
    const [mapRef, setMapRef] = useState(null);  // State to store a reference to the Google Map instance
    const [directionsRenderer, setDirectionsRenderer] = useState(null);  // State to store a reference to the DirectionsRenderer instance (dont have to render it every time)
    const [routeDuration, setRouteDuration] = useState(null);  // State to store the travel duration
    const [routeDistance, setRouteDistance] = useState(null);  // Stores travel distance in miles
    const refScrollUp = useRef(null);  // Ref for scroll to top functionality
    // State for unused items and selection
    const [unusedItems, setUnusedItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectedThriftStore, setSelectedThriftStore] = useState('');
    const [loadingItems, setLoadingItems] = useState(false);
    const [userCoins, setUserCoins] = useState(0); // Add state for user coins
    const carouselRef = useRef(null);

    // Fetch user's coin balance - using the same approach as UserPage
    const fetchUserCoins = async () => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        console.log('🔍 Fetching user coins, token present:', !!token);
        try {
            // Use the same endpoint as UserPage
            const coinResponse = await axios.get(`${API_BASE_URL}/users/me/coins`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('🔍 Coin response:', coinResponse.data);
            
            if (coinResponse.data && coinResponse.data.success) {
                const balance = coinResponse.data.data.coin_balance;
                console.log('✅ Setting user coins to:', balance);
                setUserCoins(Math.max(0, balance)); // Ensure non-negative
            } else {
                console.log('❌ Backend response not successful, defaulting to 0');
                setUserCoins(0);
            }
        } catch (error) {
            console.error('❌ Error fetching user coins:', error);
            console.error('❌ Error response:', error.response?.data);
            // Set a default value if API fails
            setUserCoins(0);
        }
    };

    // Fetch unused items from backend
    const fetchUnusedItems = async () => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_BASE_URL}/clothing-items`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.success) {
                const allItems = response.data.data || [];
                console.log('All items from backend:', allItems);
                
                // Debug: Log each item to see the structure
                allItems.forEach((item, index) => {
                    console.log(`Item ${index}:`, {
                        id: item.id,
                        label: item.label,
                        category: item.category,
                        status: item.status,
                        is_unused: item.is_unused,
                        isUnused: item.isUnused,
                        unused: item.unused,
                        generatedImageUrl: item.generatedImageUrl,
                        image_url: item.image_url,
                        image: item.image,
                        allFields: Object.keys(item)
                    });
                });
                
                // Try multiple possible field names for unused items
                const unusedItems = allItems.filter(item => 
                    item.category === 'unused' || 
                    item.status === 'unused' ||
                    item.is_unused === true ||
                    item.isUnused === true ||
                    item.unused === true ||
                    item.category === 'Unused' ||
                    item.status === 'Unused'
                );
                
                console.log('Filtered unused items:', unusedItems);
                setUnusedItems(unusedItems);
            } else {
                console.log('No unused items found');
                setUnusedItems([]);
            }
        } catch (error) {
            console.error('Error fetching unused items:', error);
            setUnusedItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    // On mount, get user's current location using browser geolocation and fetch unused items
    useEffect(() => {
        console.log('🔍 ThriftPage useEffect running');
        console.log('🔍 Checking Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
        console.log('🔍 Checking geolocation support:', navigator.geolocation ? 'Supported' : 'Not supported');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ Location obtained:', position.coords.latitude, position.coords.longitude);
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.error("❌ Error getting location:", error);
                console.error("❌ Error code:", error.code);
                console.error("❌ Error message:", error.message);
                
                // Set default coordinates (San Francisco) if geolocation fails
                console.log('🔄 Setting default coordinates (San Francisco)');
                setCoords({
                    lat: 37.7749,
                    lng: -122.4194
                });
            }
        );
        
        // Fetch unused items
        fetchUnusedItems();
        // Fetch user coins
        console.log('🔍 Calling fetchUserCoins');
        fetchUserCoins();
    }, []);

    // Called when the Google Map is loaded
    // Sets the map reference and fetches nearby thrift stores using Places API
    const onMapLoad = (map) => {
        setMapRef(map); // Save map instance for later use (e.g., panning)
        // Create a PlacesService instance attached to the map
        const service = new window.google.maps.places.PlacesService(map);
        // Search for nearby thrift stores within 5km radius
        service.nearbySearch({  // outputs array of places
            location: coords,  
            radius: 5000,  // in meters
            keyword: "thrift store"
        }, (results, status) => {
            console.log("Nearby search results:", results, status);
            if (results && results.length > 0) {
                results.forEach(place => {
                    console.log(place.name, place.geometry?.location);
                })
            } else {
                console.log("No results found.");
            }
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                setPlaces(results);  // stores array of places in state
            }
        });
    }

    const fetchPlaceBasicDetails = (places) => {  // helper function to fetch place details (rn just name & address)
        if(!Array.isArray(places)) return null;
        return places.map(place => (
            <li
                key={place.place_id}
                className="thrift-list-item"
                onClick={() => handleSidebarClick(place)}
            >
                <strong>{place.name}</strong>
                <br />
                <span>{place.vicinity || place.formatted_address}</span>
            </li>
        ))
    }

    const fetchPlaceDetails = (place) => {
        if(!place) return null;
        setIsLoading(true);
        const service = new window.google.maps.places.PlacesService(mapRef);
        service.getDetails({
            placeId: place.place_id,
            fields: ["name", "formatted_address", "formatted_phone_number", "website", "opening_hours", "photos", "rating", "user_ratings_total"]
        }, (results, status) => {
            setIsLoading(false);
            if(status == window.google.maps.places.PlacesServiceStatus.OK && results) {
                setDetailedPlace(results);
            } else {
                console.error("Error fetching place details", status);
            }
        })
    }

    // When a sidebar item is clicked, select the place and center the map on it
    const handleSidebarClick = (place) => {
        setSelectedPlace(place);
        setDetailedView(true);
        fetchPlaceDetails(place);
        if (mapRef && coords && place.geometry && place.geometry.location) {
            const pos = place.geometry.location;
            const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
            mapRef.panTo({ lat, lng }); // Center the map on the selected place
            showDirections(coords, {lat, lng});
        }
    };

    const showDirections = (origin, destination) => {
        if (!mapRef) return;
        let renderer = directionsRenderer;
        if (!renderer) {
            renderer = new window.google.maps.DirectionsRenderer({
                suppressMarkers: true
            });
            renderer.setMap(mapRef);
            setDirectionsRenderer(renderer);
        } else {
            renderer.setMap(mapRef);
        }
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === "OK" && result) {
                renderer.setDirections(result);
                
                // Extract duration from the directions response
                const duration = result.routes[0]?.legs[0]?.duration;
                const distance = result.routes[0]?.legs[0]?.distance;
                if (duration && distance) {
                    console.log('Travel duration:', duration.text);
                    setRouteDuration(duration.text);
                    setRouteDistance(distance.text);
                }
            } else {
                console.error("Directions request failed:", status);
                setRouteDuration(null);
                setRouteDistance(null);
            }
        })
    }

    const clearDirections = () => {
        setDetailedView(false);
        setSelectedPlace(null);
        setRouteDuration(null);  // Clear the duration when directions are cleared
        setRouteDistance(null);
        if (directionsRenderer) {
            directionsRenderer.set('directions', null);
        }
    }

    const handleBackToCloset = () => {
        window.location.href = "/user";
    }

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Show confirmation modal
    const showConfirmation = (action, item) => {
        console.log('🔔 showConfirmation called with action:', action, 'item:', item);
        setConfirmAction(action);
        setSelectedItem(item);
        setShowConfirmModal(true);
    };

    // Handle confirmation
    const handleConfirm = async () => {
        if (confirmAction === 'donate-multiple') {
            await donateSelectedItems();
        } else if (selectedItem) {
            if (confirmAction === 'restore') {
                await restoreToCloset(selectedItem.id);
            } else if (confirmAction === 'donate') {
                await donateToThriftStore(selectedItem.id);
            }
        }

        setShowConfirmModal(false);
        setConfirmAction(null);
        setSelectedItem(null);
        setSelectedThriftStore('');
    };

    // Cancel confirmation
    const handleCancel = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setSelectedItem(null);
        setSelectedThriftStore(''); // Reset thrift store selection
    };

    // Handle item selection
    const handleItemSelect = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Handle thrift store selection
    const handleThriftStoreSelect = (storeName) => {
        setSelectedThriftStore(storeName);
    };

    // Select all items for donation
    const selectAllItems = () => {
        const allItemIds = unusedItems.map(item => item.id);
        setSelectedItems(new Set(allItemIds));
    };

    // Restore item back to closet
    const restoreToCloset = async (itemId) => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        try {
            const response = await axios.patch(`${API_BASE_URL}/clothing-items/${itemId}/restore`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.success) {
                console.log('Item restored to closet successfully');
                // Remove the item from the unused items list with smooth transition
                setUnusedItems(prevItems => prevItems.filter(item => item.id !== itemId));
            } else {
                console.error('Failed to restore item to closet');
            }
        } catch (error) {
            console.error('Error restoring item to closet:', error);
        }
    };

    // Donate individual item to thrift store
    const donateToThriftStore = async (itemId) => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        try {
            const response = await axios.delete(`${API_BASE_URL}/clothing-items/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.success) {
                console.log('Item donated to thrift store successfully');
                // Remove the item from the unused items list with smooth transition
                setUnusedItems(prevItems => prevItems.filter(item => item.id !== itemId));
                // Remove from selected items
                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(itemId);
                    return newSet;
                });
            } else {
                console.error('Failed to donate item to thrift store');
            }
        } catch (error) {
            console.error('Error donating item to thrift store:', error);
        }
    };

    // Donate multiple selected items
    const donateSelectedItems = async () => {
        console.log('🎯 donateSelectedItems called');
        console.log('🎯 selectedItems:', selectedItems);
        console.log('🎯 selectedThriftStore:', selectedThriftStore);
        
        if (selectedItems.size === 0 || !selectedThriftStore) {
            console.log('❌ Cannot donate: no items selected or no thrift store selected');
            return;
        }
        
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        console.log('🎯 Token present:', !!token);
        
        try {
            // Donate all selected items using DELETE requests
            const itemIds = Array.from(selectedItems);
            console.log('🎯 Donating items:', itemIds);
            
            let successCount = 0;
            let errorCount = 0;
            
            // Delete each item individually
            for (const itemId of itemIds) {
                try {
                    console.log('🎯 Deleting item:', itemId);
                    const response = await axios.delete(`${API_BASE_URL}/clothing-items/${itemId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (response.data && response.data.success) {
                        console.log('✅ Item deleted successfully:', itemId);
                        successCount++;
                    } else {
                        console.error('❌ Failed to delete item:', itemId, response.data);
                        errorCount++;
                    }
                } catch (error) {
                    console.error('❌ Error deleting item:', itemId, error);
                    errorCount++;
                }
            }
            
            console.log(`🎯 Donation complete: ${successCount} successful, ${errorCount} failed`);
            
            if (successCount > 0) {
                // Remove successfully donated items from the list
                setUnusedItems(prevItems => prevItems.filter(item => !selectedItems.has(item.id)));
                // Clear selected items
                setSelectedItems(new Set());
                setSelectedThriftStore('');
                // You could also add coins here
                // addCoins(successCount * 5); // 5 coins per item
            }
        } catch (error) {
            console.error('❌ Error in donation process:', error);
        }
    };

    const handleDonate = async () => {
        if (unusedItems.length === 0) return;
        
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        try {
            // Donate all unused items
            const itemIds = unusedItems.map(item => item.id);
            const response = await axios.post(`${API_BASE_URL}/clothing-items/donate`, {
                item_ids: itemIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.success) {
                console.log('Items donated successfully');
                setUnusedItems([]);
                // You could also add coins here
                // addCoins(unusedItems.length * 5); // 5 coins per item
            } else {
                console.error('Failed to donate items');
            }
        } catch (error) {
            console.error('Error donating items:', error);
        }
    };

    const handleScrollUp = () => {
        refScrollUp.current.scrollIntoView({ behavior: "smooth" })
    }
    
    return (
        <>
        {/* Confirmation Modal */}
        {showConfirmModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>
                            {confirmAction === 'restore' ? 'Move Back to Closet' : 
                             confirmAction === 'donate' ? 'Donate to Thrift Store' :
                             'Donate Selected Items'}
                        </h3>
                    </div>
                    <div className="modal-body">
                        {confirmAction === 'donate-multiple' ? (
                            <>
                                <p>Select which thrift store you are donating to:</p>
                                <select 
                                    value={selectedThriftStore}
                                    onChange={(e) => handleThriftStoreSelect(e.target.value)}
                                    className="thrift-store-select"
                                >
                                    <option value="">Select a thrift store...</option>
                                    {places.map(place => (
                                        <option key={place.place_id} value={place.name}>
                                            {place.name}
                                        </option>
                                    ))}
                                </select>
                                {selectedThriftStore && (
                                    <>
                                        <p className="donation-confirmation">
                                            Are you sure you want to donate {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} to {selectedThriftStore}?
                                        </p>
                                        <p className="modal-warning">
                                            This action cannot be undone.
                                        </p>
                                        <p className="coin-notification">
                                            Your coins will be added to your account after the donation is processed and verified.
                                        </p>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <p>
                                    {confirmAction === 'restore' 
                                        ? `Are you sure you want to move "${selectedItem?.label || selectedItem?.name}" back to your closet?`
                                        : `Are you sure you want to donate "${selectedItem?.label || selectedItem?.name}" to the thrift store?`
                                    }
                                </p>
                                <p className="modal-warning">
                                    {confirmAction === 'donate' ? 'This action cannot be undone.' : ''}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="modal-actions">
                        <button 
                            className="modal-btn cancel-btn"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button 
                            className={`modal-btn ${confirmAction === 'restore' ? 'restore-btn' : 'donate-btn'}`}
                            onClick={handleConfirm}
                            disabled={confirmAction === 'donate-multiple' && (!selectedThriftStore || selectedItems.size === 0)}
                        >
                            {confirmAction === 'restore' ? 'Move Back' : 'Donate'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        <div className="thrift-page-container">  {/* Main container for the thrift page */}
            <div ref={refScrollUp}></div>
            <div className="thrift-page-header">
                <img 
                    className="logo" 
                    src={logo} 
                    alt="logo" 
                    onClick={() => {
                        console.log('🏠 Logo clicked, navigating to main page');
                        window.location.href = '/';
                    }}
                    style={{ cursor: 'pointer' }}
                />
                <button className="back-to-closet-btn" onClick={handleBackToCloset}>← Back to Closet</button>
            </div>
            <div className="map-info-container-wrapper">  {/* Wrapper for sidebar and map, side by side */}
                <div className="sidebar-container">  {/* Sidebar listing nearby thrift stores */}
                    <h3>Nearby Thrift Stores</h3>
                        {detailedView ? (
                            <DetailedView place={detailedPlace} onBack={() => clearDirections()} routeDuration={routeDuration} routeDistance={routeDistance} />
                        ) : (
                        <ul className="thrift-store-list">
                            {fetchPlaceBasicDetails(places)}
                        </ul>)}
                </div>
                <div className="map-container">   {/* Google Map display */}
                    <ThriftMap 
                        coords={coords}
                        places={places}
                        onMapLoad={onMapLoad}
                        handleSidebarClick={handleSidebarClick}
                        pinkStarMarker={pinkStarMarker}
                        goldStarMarker={goldStarMarker}
                        selectedPlace={selectedPlace}
                    />
                </div>
            </div>
            <div className="unused-items-container">  {/* Placeholder for user's items to donate */}
                <div className="unused-items-header">
                    <h3>Select Unused Items in your closet to donate</h3>
                    <div className="unused-header-right">
                        <h4><img src={coinRemoda} alt="coin" />: {userCoins}</h4>
                        
                        <button className="back-to-top-btn" onClick={handleScrollUp}>Back to Top</button>
                    </div>
                </div>
                <div className="unused-items-list">
                    {loadingItems ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading your unused items...</p>
                        </div>
                    ) : unusedItems.length === 0 ? (
                        <div className="empty-state">
                            <p>No unused items to donate!</p>
                            <p>Move items to "Unused" in your closet to see them here.</p>
                        </div>
                    ) : unusedItems.length > 7 ? (
                        // Carousel view for more than 7 items
                        <div className="carousel-container" ref={carouselRef}>
                            <div className="carousel-track">
                                {unusedItems.map(item => (
                                    <div 
                                        key={item.id} 
                                        className={`carousel-item ${selectedItems.has(item.id) ? 'selected' : ''}`}
                                        onClick={() => handleItemSelect(item.id)}
                                    >
                                        <div className="item-buttons">
                                            <button 
                                                className="restore-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    showConfirmation('restore', item);
                                                }}
                                                title="Move back to closet"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <img 
                                            src={item.generatedImageUrl || item.image_url || item.image} 
                                            alt={item.label || item.name || 'Clothing item'} 
                                            onError={(e) => {
                                                console.log('Image failed to load for item:', item.id, 'URL:', e.target.src);
                                                e.target.style.display = 'none';
                                                // Show a placeholder or fallback
                                                const parent = e.target.parentElement;
                                                if (parent) {
                                                    const placeholder = document.createElement('div');
                                                    placeholder.style.cssText = `
                                                        width: 100%;
                                                        height: 280px;
                                                        background: #f3f4f6;
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        color: #6b7280;
                                                        font-size: 14px;
                                                        border-radius: 12px 12px 0 0;
                                                    `;
                                                    placeholder.textContent = 'Image not available';
                                                    parent.insertBefore(placeholder, e.target);
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Grid view for 7 or fewer items
                        <div className="grid-container">
                            {unusedItems.map(item => (
                                <div 
                                    key={item.id} 
                                    className={`grid-item ${selectedItems.has(item.id) ? 'selected' : ''}`}
                                    onClick={() => handleItemSelect(item.id)}
                                >
                                    <div className="item-buttons">
                                        <button 
                                            className="restore-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                showConfirmation('restore', item);
                                            }}
                                            title="Move back to closet"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <img 
                                        src={item.generatedImageUrl || item.image_url || item.image} 
                                        alt={item.label || item.name || 'Clothing item'} 
                                        onError={(e) => {
                                            console.log('Image failed to load for item:', item.id, 'URL:', e.target.src);
                                            e.target.style.display = 'none';
                                            // Show a placeholder or fallback
                                            const parent = e.target.parentElement;
                                            if (parent) {
                                                const placeholder = document.createElement('div');
                                                placeholder.style.cssText = `
                                                    width: 100%;
                                                    height: 280px;
                                                    background: #f3f4f6;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    color: #6b7280;
                                                    font-size: 14px;
                                                    border-radius: 12px 12px 0 0;
                                                `;
                                                placeholder.textContent = 'Image not available';
                                                parent.insertBefore(placeholder, e.target);
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {unusedItems.length > 0 &&(
                <div className="unused-items-footer">
                    <button 
                        className={`donate-btn ${selectedItems.size > 0 ? 'donate-btn-active' : ''}`}
                        onClick={() => {
                            if (selectedItems.size > 0) {
                                showConfirmation('donate-multiple', null);
                            }
                        }}
                        disabled={selectedItems.size === 0}
                    >
                        Donate {selectedItems.size > 0 ? `(${selectedItems.size} selected)` : ''}
                    </button>
                    {selectedItems.size > 0 && (
                        <button 
                            className="donate-all-btn"
                            onClick={selectAllItems}
                            title="Select all items for donation"
                        >
                            Select All! ({unusedItems.length} items)
                        </button>
                    )}
                </div>)}
            </div>
        </div>
    </>
    );
};

export default ThriftPage;