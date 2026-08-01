'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './LiveMap.module.css';
import { getZoomForType } from '../lib/geocoding';

export default function LiveMap({ stops = [], destination = {}, currency = '€' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const tileLayerRef = useRef(null);
  
  const [mapType, setMapType] = useState('map'); // 'map' or 'satellite'

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const parseCoordinates = (value) => {
    if (Array.isArray(value) && value.length >= 2) {
      const lat = Number(value[0]);
      const lng = Number(value[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    if (value && typeof value === 'object') {
      const lat = Number(value.lat ?? value.latitude);
      const lng = Number(value.lng ?? value.lon ?? value.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    return null;
  };

  const formatCost = (value) => {
    if (value === undefined || value === null || value === '') return 'Não indicado';
    if (typeof value === 'string') {
      if (/free|gr[aá]tis/i.test(value)) return 'Grátis';
      if (/[€$£¥]|JPY|USD|GBP|EUR|IDR|MAD/i.test(value)) return value;
    }
    return `${currency}${value}`;
  };

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

  const getMarkerColor = (stop) => {
    const type = (stop.type || stop.category || '').toLowerCase();
    if (type.includes('meal') || type.includes('restaurant') || type.includes('food') || type.includes('dining') || type.includes('breakfast') || type.includes('lunch') || type.includes('dinner')) {
      return '#F97316'; // Meal (orange)
    }
    if (type.includes('hotel') || type.includes('accommodation') || type.includes('stay') || type.includes('hostel')) {
      return '#22C55E'; // Hotel (green)
    }
    if (type.includes('transport') || type.includes('flight') || type.includes('train') || type.includes('bus') || type.includes('car') || type.includes('transfer')) {
      return '#6B7280'; // Transport (grey)
    }
    return '#3B82F6'; // Activity (blue)
  };

  const getTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('meal') || t.includes('restaurant') || t.includes('food') || t.includes('dining')) return 'Restaurante';
    if (t.includes('hotel') || t.includes('stay') || t.includes('accommodation')) return 'Hospedagem';
    if (t.includes('transport') || t.includes('flight') || t.includes('move')) return 'Transporte';
    return 'Atividade';
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
    let cancelled = false;

    const initMap = async () => {
      const L = await import('leaflet');
      if (cancelled || !mapContainerRef.current) return;
      
      // Fix default Leaflet icon assets
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const validateAndFixCoordinates = (inputStops) => {
        return inputStops
          .map((stop) => {
            const coordinates = parseCoordinates(stop.coordinates);
            return coordinates ? { ...stop, coordinates } : null;
          })
          .filter((stop) => {
            if (!stop?.coordinates) return false;
            const { lat, lng } = stop.coordinates;
            if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return false;
            return true;
          });
      };

      const validStops = validateAndFixCoordinates(fadingStops);

      if (!mapInstanceRef.current) {
        if (mapContainerRef.current._leaflet_id) {
          delete mapContainerRef.current._leaflet_id;
        }
        const destinationCoords = parseCoordinates(destination?.coordinates);
        const initialCenter = validStops.length > 0
          ? [validStops[0].coordinates.lat, validStops[0].coordinates.lng]
          : destinationCoords ? [destinationCoords.lat, destinationCoords.lng] : [38.7223, -9.1393];

        const initialZoom = destination?.zoom || (destination?.type ? getZoomForType(destination.type) : 13);

        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
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
        const markerColor = getMarkerColor(mainStop);
        
        // Custom Leaflet marker HTML
        const customIcon = L.divIcon({
          className: `${styles.leafletMarkerWrapper} ${isCluster ? styles.clusterMarker : ''}`,
          html: isCluster 
            ? `<div class="${styles.markerClusterInner}"><span>${cluster.stops.length}</span></div>`
            : `<div class="${styles.markerDotInner}" style="background-color: ${markerColor}; border-color: #ffffff;">${mainStop.originalIndex + 1}</div>`,
          iconSize: isCluster ? [40, 40] : [36, 36],
          iconAnchor: isCluster ? [20, 20] : [18, 18],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: customIcon }).addTo(map);

        // Rich interactive popup showing single stop or list of stops in cluster
        let popupContent = `<div class="${styles.mapPopup}">`;
        if (isCluster) {
          popupContent += `<h4 class="${styles.popupClusterTitle}">${cluster.stops.length} locais neste ponto</h4>`;
          cluster.stops.forEach((s) => {
            popupContent += `
              <div class="${styles.clusterStopItem}">
                <span class="${styles.clusterStopNum}">${s.originalIndex + 1}</span>
                <div>
                  <strong>${escapeHtml(s.name)}</strong>
                  ${s.time ? `<span class="${styles.popupTime}">(${escapeHtml(s.time)})</span>` : ''}
                </div>
              </div>
            `;
          });
        } else {
          const photoUrl = getCategoryPhoto(mainStop);
          const badgeText = getTypeBadge(mainStop.type);
          popupContent += `
            <img src="${photoUrl}" width="260" height="100" loading="lazy" decoding="async" class="${styles.popupPhoto}" alt="${escapeHtml(mainStop.name)}" />
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 700; background-color: ${markerColor}; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${badgeText}</span>
              <span class="${styles.popupTime}" style="margin-bottom: 0;">${escapeHtml(mainStop.time || mainStop.period || '')}</span>
            </div>
            <h4 class="${styles.popupName}">${escapeHtml(mainStop.name)}</h4>
            <div class="${styles.popupMetaRow}">
              ${mainStop.duration ? `<span>${escapeHtml(mainStop.duration)}</span>` : ''}
              ${mainStop.cost !== undefined || mainStop.estimatedCost !== undefined
                ? `<span>Custo estimado: ${escapeHtml(formatCost(mainStop.cost ?? mainStop.estimatedCost))}</span>`
                : '<span>Custo não indicado</span>'}
            </div>
            ${mainStop.transportFromPrevious?.duration ? `<div class="${styles.popupType}">Como chegar: ${escapeHtml(mainStop.transportFromPrevious.duration)}</div>` : ''}
            <div class="popupSource" style="font-size: 10px; margin-top: 4px; margin-bottom: 4px; color: #aaa;">
              ${mainStop.coordinateSource === 'nominatim'
                ? 'Localização verificada · detalhes estimados'
                : mainStop.coordinateSource === 'curated'
                  ? 'Localização de referência · detalhes estimados'
                  : 'Localização e detalhes estimados'}
            </div>
            <div class="${styles.popupActions}">
              <a href="#activity-${mainStop.originalIndex}" class="${styles.popupMapBtn}">Ver detalhes</a>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mainStop.name)}" target="_blank" rel="noopener noreferrer" class="${styles.popupMapBtn}">Directions</a>
            </div>
          `;
        }
        popupContent += `</div>`;

        marker.bindPopup(popupContent, {
          closeButton: true,
          autoPan: true,
          maxWidth: 260,
          className: styles.brandedPopup,
          offset: [0, -5],
        });

        markersRef.current.push(marker);
      });

      // Drawing Animated Polyline (using SVG dash array offset styling via className)
      if (latlngs.length > 1) {
        polylineRef.current = L.polyline(latlngs, {
          color: '#D4A843',
          weight: 2,
          opacity: 0.5,
          dashArray: '6, 8',
          className: styles.animatedPolyline,
          lineCap: 'round',
        }).addTo(map);
      }

      if (latlngs.length > 0) {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true, duration: 1.2 });
      } else {
        const destinationCoords = parseCoordinates(destination?.coordinates);
        if (destinationCoords) {
          map.setView([destinationCoords.lat, destinationCoords.lng], 12);
        }
      }
    };

    initMap().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fadingStops, mapType, currency, destination]);

  useEffect(() => {
    const handleFlyTo = (e) => {
      const coordinates = parseCoordinates(e.detail?.coordinates ?? e.detail);
      const lat = Number(coordinates?.lat);
      const lng = Number(coordinates?.lng);
      if (mapInstanceRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
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
    <div className={`${styles.mapContainer} ${isFading ? styles.fading : ''}`} data-testid="live-map">
      {/* Satellite / Standard Map Control */}
      <div className={styles.mapToggleContainer}>
        <button
          className={`${styles.toggleBtn} ${mapType === 'map' ? styles.active : ''}`}
          onClick={() => toggleMapType('map')}
          aria-label="Ver mapa padrão"
        >
          Mapa
        </button>
        <button
          className={`${styles.toggleBtn} ${mapType === 'satellite' ? styles.active : ''}`}
          onClick={() => toggleMapType('satellite')}
          aria-label="Ver mapa satélite"
        >
          Satélite
        </button>
      </div>

      <div ref={mapContainerRef} className={styles.leafletMapElement} data-testid="leaflet-map-surface" />
    </div>
  );
}
