import "./ThriftPage.css";
import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from'@react-google-maps/api';
import pinkStarMarker from "./assets/pink-star-marker.png"

const libraries = ["places"];

const ThriftMap = ({ coords, places, onMapLoad, setSelectedPlace, pinkStarMarker }) => {  // passing as props 
    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
            {coords && typeof coords.lat === "number" && typeof coords.lng === "number" && (
                 <GoogleMap
                    center={coords}
                    zoom={14}
                    mapContainerClassName="map-container"  // mapContainerClassName is the class name of the div that contains the map w/in api
                    onLoad={onMapLoad}  // loads places array into state
                >
                    {renderMarkers(places, setSelectedPlace, pinkStarMarker)}
                </GoogleMap>
              )}
        </LoadScript>
    )
}

const renderMarkers = (places, setSelectedPlace, pinkStarMarker) => {
    if(!Array.isArray(places)) return null;
    return places.map(place => {
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

const ThriftPage = () => {
    const [coords, setCoords] = useState(null);
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [placeDetails, setPlaceDetails] = useState(null);

    
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

    const onMapLoad = (map) => {
        const service = new window.google.maps.places.PlacesService(map);
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

    // const onPlaceClick = (place) => {

    // }
    
    return (
        <div className="map-info-container-wrapper">
            <div className="map-container">
                <ThriftMap 
                    coords={coords}
                    places={places}
                    onMapLoad={onMapLoad}
                    setSelectedPlace={setSelectedPlace}
                    pinkStarMarker={pinkStarMarker}
                />
            </div>
        </div>
    );
};

export default ThriftPage;