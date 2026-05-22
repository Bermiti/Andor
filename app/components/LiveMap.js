'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './LiveMap.module.css';

export default function LiveMap({ stops = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const tileLayerRef = useRef(null);
  
  const [mapType, setMapType] = useState('map'); // 'map' or 'satellite'

  // Dynamic map type toggle
  const toggleMapType = async (type) => {
    if (!mapInstanceRef.current) return;
    setMapType(type);

    const L = await import('leaflet');
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (type === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }
      ).addTo(map);
    }
  };

  const [fadingStops, setFadingStops] = useState(stops);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setIsFading(true);
    const timer = setTimeout(() => {
      setFadingStops(stops);
      setIsFading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [stops]);

  const getPeriodColor = (timeStr) => {
    if (!timeStr) return '#3B82F6'; // Tarde (blue)
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (isNaN(hour)) return '#3B82F6';
    if (hour >= 5 && hour < 12) return '#F59E0B'; // Manhã (amber)
    if (hour >= 12 && hour < 18) return '#3B82F6'; // Tarde (blue)
    return '#8B5CF6'; // Noite (violet)
  };

  const getCategoryPhoto = (stop) => {
    const type = (stop.type || '').toLowerCase();
    const name = (stop.name || '').toLowerCase();
    
    if (type.includes('restaurant') || type.includes('food') || type.includes('dining') || type.includes('eat') || type.includes('dinner') || type.includes('lunch') || type.includes('meal') || name.includes('restaurant') || name.includes('cafe') || name.includes('dining') || type.includes('gourmet')) {
      return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=75';
    }
    if (type.includes('museum') || type.includes('culture') || type.includes('history') || type.includes('castle') || type.includes('temple') || type.includes('shrine') || type.includes('monument') || type.includes('palace') || type.includes('cathedral') || type.includes('church') || name.includes('museum') || name.includes('castle') || name.includes('temple') || name.includes('shrine')) {
      return 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=120&auto=format&fit=crop&q=75';
    }
    if (type.includes('nature') || type.includes('park') || type.includes('beach') || type.includes('mountain') || type.includes('garden') || type.includes('view') || type.includes('forest') || type.includes('lake') || type.includes('cliff') || name.includes('park') || name.includes('beach') || name.includes('mountain') || name.includes('garden') || name.includes('lake') || name.includes('sea')) {
      return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=120&auto=format&fit=crop&q=75';
    }
    if (type.includes('shopping') || type.includes('mall') || type.includes('market') || type.includes('store') || type.includes('shop') || name.includes('market') || name.includes('shopping') || name.includes('bazaar')) {
      return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=120&auto=format&fit=crop&q=75';
    }
    if (type.includes('cafe') || type.includes('coffee') || type.includes('breakfast') || type.includes('tea') || name.includes('coffee') || name.includes('cafe') || name.includes('bakery')) {
      return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&auto=format&fit=crop&q=75';
    }
    if (type.includes('entertainment') || type.includes('theater') || type.includes('cinema') || type.includes('show') || type.includes('theme park') || type.includes('concert') || type.includes('bar') || type.includes('club') || type.includes('nightlife') || name.includes('bar') || name.includes('club') || name.includes('pub') || name.includes('theater')) {
      return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=75';
    }
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=120&auto=format&fit=crop&q=75';
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      
      // Fix default Leaflet icon assets
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const validStops = fadingStops.filter(
        (stop) =>
          stop.coordinates &&
          typeof stop.coordinates.lat === 'number' &&
          typeof stop.coordinates.lng === 'number'
      );

      if (!mapInstanceRef.current) {
        const initialCenter = validStops.length > 0
          ? [validStops[0].coordinates.lat, validStops[0].coordinates.lng]
          : [38.7223, -9.1393];

        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 13,
          zoomControl: false,
        });

        // Add custom Zoom control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Tile selection based on state
        const initialUrl = mapType === 'satellite' 
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        
        const attribution = mapType === 'satellite'
          ? 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS'
          : '&copy; OpenStreetMap & CARTO';

        tileLayerRef.current = L.tileLayer(initialUrl, {
          attribution,
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clean old layers
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current = [];

      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (validStops.length === 0) return;

      const latlngs = [];
      const threshold = 0.0015; // Distance threshold for grouping (approx 150m)

      // Cluster calculation in JS
      const clusters = [];
      validStops.forEach((stop, originalIndex) => {
        let addedToCluster = false;
        for (let cluster of clusters) {
          const firstStop = cluster.stops[0];
          const distLat = Math.abs(firstStop.coordinates.lat - stop.coordinates.lat);
          const distLng = Math.abs(firstStop.coordinates.lng - stop.coordinates.lng);
          if (distLat < threshold && distLng < threshold) {
            cluster.stops.push({ ...stop, originalIndex });
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) {
          clusters.push({
            lat: stop.coordinates.lat,
            lng: stop.coordinates.lng,
            stops: [{ ...stop, originalIndex }]
          });
        }
        latlngs.push([stop.coordinates.lat, stop.coordinates.lng]);
      });

      // Render clustered markers
      clusters.forEach((cluster) => {
        const isCluster = cluster.stops.length > 1;
        const mainStop = cluster.stops[0];
        const markerColor = getPeriodColor(mainStop.time);
        
        // Custom Leaflet marker HTML
        const customIcon = L.divIcon({
          className: `${styles.leafletMarkerWrapper} ${isCluster ? styles.clusterMarker : ''}`,
          html: isCluster 
            ? `<div class="${styles.markerClusterInner}"><span>${cluster.stops.length}</span></div>`
            : `<div class="${styles.markerDotInner}" style="background-color: ${markerColor}; border-color: #ffffff;">${mainStop.originalIndex + 1}</div>`,
          iconSize: isCluster ? [34, 34] : [28, 28],
          iconAnchor: isCluster ? [17, 17] : [14, 14],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: customIcon }).addTo(map);

        // Rich interactive popup showing single stop or list of stops in cluster
        let popupContent = `<div class="${styles.mapPopup}">`;
        if (isCluster) {
          popupContent += `<h4 class="${styles.popupClusterTitle}">🏢 ${cluster.stops.length} Stops Here</h4>`;
          cluster.stops.forEach((s) => {
            popupContent += `
              <div class="${styles.clusterStopItem}">
                <span class="${styles.clusterStopNum}">${s.originalIndex + 1}</span>
                <div>
                  <strong>${s.name}</strong>
                  <span class="${styles.popupTime}">(${s.time})</span>
                </div>
              </div>
            `;
          });
        } else {
          const photoUrl = getCategoryPhoto(mainStop);
          popupContent += `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <img src="${photoUrl}" style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover;" alt="${mainStop.name}" />
              <div style="flex: 1; min-width: 140px;">
                <div class="${styles.popupTime}">${mainStop.time || ''}</div>
                <h4 class="${styles.popupName}">${mainStop.name}</h4>
                ${mainStop.estimatedCost ? `<div class="${styles.popupCost}">💰 ${mainStop.estimatedCost}</div>` : ''}
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mainStop.name)}" target="_blank" rel="noopener noreferrer" class="${styles.popupMapBtn}">Abrir no Google Maps ↗</a>
              </div>
            </div>
          `;
        }
        popupContent += `</div>`;

        marker.bindPopup(popupContent, {
          closeButton: false,
          offset: [0, -5],
        });

        markersRef.current.push(marker);
      });

      // Drawing Animated Polyline (using SVG dash array offset styling via className)
      if (latlngs.length > 1) {
        polylineRef.current = L.polyline(latlngs, {
          color: 'var(--ocean)',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
          className: styles.animatedPolyline,
          lineCap: 'round',
        }).addTo(map);
      }

      if (latlngs.length > 0) {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initMap();
  }, [fadingStops, mapType]);

  useEffect(() => {
    const handleFlyTo = (e) => {
      const { lat, lng } = e.detail;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
      }
    };
    window.addEventListener('andor-open-map', handleFlyTo);
    return () => {
      window.removeEventListener('andor-open-map', handleFlyTo);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`${styles.mapContainer} ${isFading ? styles.fading : ''}`}>
      {/* Satellite / Standard Map Control */}
      <div className={styles.mapToggleContainer}>
        <button
          className={`${styles.toggleBtn} ${mapType === 'map' ? styles.active : ''}`}
          onClick={() => toggleMapType('map')}
        >
          🗺️ Map
        </button>
        <button
          className={`${styles.toggleBtn} ${mapType === 'satellite' ? styles.active : ''}`}
          onClick={() => toggleMapType('satellite')}
        >
          🛰️ Satellite
        </button>
      </div>

      <div ref={mapContainerRef} className={styles.leafletMapElement} />
    </div>
  );
}
