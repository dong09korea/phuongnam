"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Car Icon (Using inline SVG data URI to bypass CORS/Network issues)
const carSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF5722" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
  <circle cx="7" cy="17" r="2"/>
  <path d="M9 17h6"/>
  <circle cx="17" cy="17" r="2"/>
</svg>
`);

const carIcon = new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${carSvg}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

// A component to recenter the map when coordinates change
function LocationUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 14, { animate: true, duration: 2 });
    }, [lat, lng, map]);
    return null;
}

interface LiveMapProps {
    latitude: number;
    longitude: number;
    vehicleName: string;
    speed: number | null;
}

export default function LiveMap({ latitude, longitude, vehicleName, speed }: LiveMapProps) {
    // Prevent SSR hydration errors with Leaflet
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full h-full bg-slate-900 animate-pulse"></div>;

    // Fixed route for MVP (HCMC to Vung Tau general path)
    const routeCoords: [number, number][] = [
        [10.7769, 106.7009], // HCMC Start
        [10.7850, 106.7450],
        [10.7950, 106.8200],
        [10.7500, 106.9000],
        [10.6000, 107.0000],
        [10.4500, 107.0500],
        [10.3459, 107.0843]  // Vung Tau End
    ];

    return (
        <MapContainer 
            center={[latitude, longitude]} 
            zoom={13} 
            scrollWheelZoom={false}
            className="w-full h-full relative z-0"
            zoomControl={false}
            attributionControl={false}
        >
            {/* Using a Dark Mode TileLayer for Premium Aesthetics */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {/* Route Line */}
            <Polyline 
                positions={routeCoords} 
                pathOptions={{ color: '#FF5722', weight: 4, opacity: 0.6, dashArray: '10, 10' }} 
            />

            <LocationUpdater lat={latitude} lng={longitude} />
            
            <Marker position={[latitude, longitude]} icon={carIcon}>
                <Popup>
                    <div className="font-bold">{vehicleName}</div>
                    <div className="text-sm">Speed: {speed ? `${Math.round(speed)} km/h` : 'Stopped'}</div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
