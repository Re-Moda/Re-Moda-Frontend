import "./ThriftPage.css";
import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from'@react-google-maps/api';
import pinkStarMarker from "./assets/pink-star-marker.png"

// Google Maps libraries to load (Places API is needed for place search)
const libraries = ["places"];

// ThriftMap component renders the Google Map and its markers
// Receives coordinates, places, and callbacks as props
const ThriftMap = ({ coords, places, onMapLoad, setSelectedPlace, pinkStarMarker }) => {  // passing as props 
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
                    {renderMarkers(places, setSelectedPlace, pinkStarMarker)}
                </GoogleMap>
              )}
        </LoadScript>
    )
}

// Helper function to render a Marker for each place
// Uses a custom icon and sets up click handler
const renderMarkers = (places, setSelectedPlace, pinkStarMarker) => {
    if(!Array.isArray(places)) return null;
    return places.map(place => {
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
        return(
            <Marker
                key={place.place_id}
                position={{ lat, lng }}
                icon={{
                    url: pinkStarMarker,
                    scaledSize: new window.google.maps.Size(30,30)
                }}
                onClick={() => setSelectedPlace(place)}
            />
        )
    })
}

// Main page component for the thrift store map and sidebar
const ThriftPage = () => {
    const [coords, setCoords] = useState(null);  // State for user's coordinates (from browser geolocation)
    const [places, setPlaces] = useState([]);  // State for array of nearby thrift store places
    const [selectedPlace, setSelectedPlace] = useState(null);  // State for the currently selected place (for details or highlighting)
    const [placeDetails, setPlaceDetails] = useState(null);  // State for detailed info about a place (COMING BACK TO THIS)
    const [mapRef, setMapRef] = useState(null);  // State to store a reference to the Google Map instance

    // On mount, get user's current location using browser geolocation
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                console.log(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Error getting location.", error);
            }
        );
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

    // When a sidebar item is clicked, select the place and center the map on it
    const handleSidebarClick = (place) => {
        setSelectedPlace(place);
        if (mapRef && place.geometry && place.geometry.location) {
            const pos = place.geometry.location;
            const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
            mapRef.panTo({ lat, lng }); // Center the map on the selected place
        }
    };
    
    return (
        <>
        
        <div className="thrift-page-container">  {/* Main container for the thrift page */}
            <div className="map-info-container-wrapper">  {/* Wrapper for sidebar and map, side by side */}
                <div className="sidebar-container">  {/* Sidebar listing nearby thrift stores */}
                    <h3>Nearby Thrift Stores</h3>
                    <ul className="thrift-store-list">
                        {places.map(place => (
                            <li
                                key={place.place_id}
                                className="thrift-list-item"
                                onClick={() => handleSidebarClick(place)}
                            >
                                <strong>{place.name}</strong>
                                <br />
                                <span>{place.vicinity || place.formatted_address}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="map-container">   {/* Google Map display */}
                    <ThriftMap 
                        coords={coords}
                        places={places}
                        onMapLoad={onMapLoad}
                        setSelectedPlace={setSelectedPlace}
                        pinkStarMarker={pinkStarMarker}
                    />
                </div>
            </div>
            <div className="unused-items-container">  {/* Placeholder for user's items to donate */}
                <h3>Items to Donate!</h3>
            </div>
        </div>
    </>
    );
};

export default ThriftPage;