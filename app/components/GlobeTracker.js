'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './GlobeTracker.module.css';

export default function GlobeTracker({ visitedCountries = [], plannedCountries = [] }) {
  const globeContainerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [countries, setCountries] = useState({ features: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load GeoJSON data
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(worldData => {
        import('topojson-client').then(topojson => {
          const land = topojson.feature(worldData, worldData.objects.countries);
          setCountries(land);
        });
      });
  }, []);

  // Initialize globe
  useEffect(() => {
    if (!globeContainerRef.current || countries.features.length === 0) return;

    let cancelled = false;

    import('globe.gl').then(mod => {
      if (cancelled || !globeContainerRef.current) return;

      const GlobeConstructor = mod.default || mod;
      const container = globeContainerRef.current;
      
      // Clear any previous content
      container.innerHTML = '';
      
      const width = container.clientWidth;
      const height = container.clientHeight;

      const globe = new GlobeConstructor(container)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .polygonsData(countries.features)
        .polygonCapColor(feat => {
          const id = feat.id;
          if (visitedCountries.includes(id)) return 'rgba(232, 136, 33, 0.85)';
          if (plannedCountries.includes(id)) return 'rgba(191, 195, 201, 0.7)';
          return 'rgba(40, 55, 80, 0.6)';
        })
        .polygonSideColor(() => 'rgba(255, 255, 255, 0.05)')
        .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.15)')
        .polygonAltitude(feat => {
          const id = feat.id;
          if (visitedCountries.includes(id)) return 0.04;
          if (plannedCountries.includes(id)) return 0.02;
          return 0.01;
        })
        .polygonLabel(() => '')
        .onPolygonHover(polygon => {
          container.style.cursor = polygon ? 'pointer' : 'grab';
        })
        .polygonsTransitionDuration(400)
        .width(width)
        .height(height)
        .atmosphereColor('#1E6FD9')
        .atmosphereAltitude(0.2);

      // Camera controls — drag to rotate, scroll to zoom
      const controls = globe.controls();
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.minDistance = 150;
      controls.maxDistance = 500;
      controls.rotateSpeed = 0.8;
      controls.zoomSpeed = 0.8;

      // Pause auto-rotate while the user drags, resume after 3s of inactivity
      let resumeTimer = null;
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
        if (resumeTimer) clearTimeout(resumeTimer);
      });
      controls.addEventListener('end', () => {
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
          controls.autoRotate = true;
        }, 3000);
      });

      // Initial point of view
      globe.pointOfView({ lat: 20, lng: 10, altitude: 2.5 }, 1000);

      globeInstanceRef.current = globe;
      setIsLoaded(true);
    });

    return () => {
      cancelled = true;
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor && globeInstanceRef.current._destructor();
        globeInstanceRef.current = null;
      }
    };
  }, [countries]);

  // Update colors when visitedCountries changes
  useEffect(() => {
    if (!globeInstanceRef.current || countries.features.length === 0) return;

    globeInstanceRef.current
      .polygonCapColor(feat => {
        const id = feat.id;
        if (visitedCountries.includes(id)) return 'rgba(232, 136, 33, 0.85)';
        if (plannedCountries.includes(id)) return 'rgba(191, 195, 201, 0.7)';
        return 'rgba(40, 55, 80, 0.6)';
      })
      .polygonAltitude(feat => {
        const id = feat.id;
        if (visitedCountries.includes(id)) return 0.04;
        if (plannedCountries.includes(id)) return 0.02;
        return 0.01;
      });
  }, [visitedCountries, plannedCountries, countries]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (globeInstanceRef.current && globeContainerRef.current) {
        const w = globeContainerRef.current.clientWidth;
        const h = globeContainerRef.current.clientHeight;
        globeInstanceRef.current.width(w).height(h);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.wrapper}>
      {!isLoaded && (
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading your world...</p>
        </div>
      )}
      <div ref={globeContainerRef} className={styles.globe}></div>
    </div>
  );
}
