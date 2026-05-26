'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './DestinationGallery.module.css';

const defaultImages = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop'
];

const galleryDatabase = {
  'lisbon': [
    'https://images.unsplash.com/photo-1509840841025-9088ba78a826?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527838832700-50592524df7e?q=80&w=800&auto=format&fit=crop'
  ],
  'barcelona': [
    'https://images.unsplash.com/photo-1583422409516-2895a77efedd?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523531294919-4bea7c65e894?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579282240050-352db0a14c21?q=80&w=800&auto=format&fit=crop'
  ],
  'paris': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508050913630-b993ec18993e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1431274172761-fca41d930114?q=80&w=800&auto=format&fit=crop'
  ],
  'tokyo': [
    'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518826778787-43d3729364fc?q=80&w=800&auto=format&fit=crop'
  ],
  'swiss': [
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop'
  ],
  'azores': [
    'https://images.unsplash.com/photo-1582885938164-1af58ee6effa?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535262412227-85541e910204?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522885147691-06d859633fb8?q=80&w=800&auto=format&fit=crop'
  ],
  'bali': [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501179691627-eeab196f74c5?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop'
  ],
  'new york': [
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492666673288-3c4b4576ad9a?q=80&w=800&auto=format&fit=crop'
  ]
};

export default function DestinationGallery({ destination = '' }) {
  const [photos, setPhotos] = useState(defaultImages);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const key = destination.toLowerCase();
    let matchedPhotos = null;

    for (const [k, v] of Object.entries(galleryDatabase)) {
      if (key.includes(k)) {
        matchedPhotos = v;
        break;
      }
    }

    if (matchedPhotos) {
      setPhotos(matchedPhotos);
    } else {
      setPhotos(defaultImages);
    }
  }, [destination]);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  const handleNext = () => {
    setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  return (
    <div className={styles.gallerySection}>
      <h3 className={styles.galleryTitle}>📸 Visual Gallery</h3>
      <p className={styles.gallerySubtitle}>Click on any photo to open the fullscreen gallery view.</p>
      
      <div className={styles.grid}>
        {photos.map((url, index) => (
          <div 
            key={index} 
            className={styles.photoCard} 
            onClick={() => setLightboxIndex(index)}
          >
            <Image 
              src={url} 
              alt={`${destination} view ${index + 1}`} 
              width={600}
              height={420}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={75}
              className={styles.image}
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.overlay}>
              <span className={styles.zoomIcon}>🔍 View Full</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
          <button 
            className={styles.closeBtn} 
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            aria-label="Close lightbox"
          >
            ✕
          </button>
          
          <button 
            className={styles.navBtn} 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            style={{ left: 'var(--space-6)' }}
            aria-label="Previous image"
          >
            ‹
          </button>
          
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <Image 
              src={photos[lightboxIndex]} 
              alt={`${destination} detailed view ${lightboxIndex + 1}`} 
              width={1200}
              height={800}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
              quality={90}
              className={styles.lightboxImage}
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.caption}>
              {destination} — Photo {lightboxIndex + 1} of {photos.length}
            </div>
          </div>

          <button 
            className={styles.navBtn} 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={{ right: 'var(--space-6)' }}
            aria-label="Next image"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
