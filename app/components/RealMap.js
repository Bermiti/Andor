'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom tactical icon
const tacticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function RealMap({ stops = [], center = [38.7223, -9.1393], zoom = 13 }) {
  // Extract coordinates from stops if available, otherwise just mock them around the center
  const validStops = stops.map((stop, i) => {
    return {
      ...stop,
      position: stop.coords || [
        center[0] + (Math.random() - 0.5) * 0.05,
        center[1] + (Math.random() - 0.5) * 0.05
      ]
    };
  });

  const positions = validStops.map(s => s.position);

  return (
    <div style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {validStops.map((stop, idx) => (
          <Marker key={idx} position={stop.position} icon={tacticalIcon}>
            <Popup>
              <strong>{stop.time}</strong><br />
              {stop.name}
            </Popup>
          </Marker>
        ))}
        {positions.length > 1 && (
          <Polyline positions={positions} color="#2563EB" weight={3} dashArray="5, 10" />
        )}
      </MapContainer>
    </div>
  );
}
