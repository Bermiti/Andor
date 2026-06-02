// Override Leaflet popup styling to match Andor design system
// Call initLeafletPopupStyles() once when component mounts

export function initLeafletPopupStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    /* Andor-styled Leaflet Popups */
    .leaflet-popup-content-wrapper {
      background: var(--bg-2) !important;
      border: 1px solid var(--b-1) !important;
      border-radius: var(--r-lg) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
      padding: 0 !important;
      color: var(--t-1);
    }

    .leaflet-popup-content {
      padding: var(--space-3) !important;
      margin: 0 !important;
      font-family: var(--font-body);
      font-size: 13px;
    }

    .leaflet-popup-tip-container {
      display: none;
    }

    .leaflet-popup-close-button {
      color: var(--t-2);
      font-size: 20px;
      padding: var(--space-2) var(--space-3);
      width: auto;
      height: auto;
      background: none;
      border: none;
      line-height: 1;
      top: var(--space-1) !important;
      right: var(--space-1) !important;
    }

    .leaflet-popup-close-button:hover {
      color: var(--gold);
    }

    /* Activity popup structure */
    .andor-popup-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 var(--space-2) 0;
      color: var(--t-1);
    }

    .andor-popup-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      margin-bottom: var(--space-2);
      flex-wrap: wrap;
    }

    .andor-popup-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--t-2);
    }

    .andor-popup-description {
      font-size: 12px;
      color: var(--t-2);
      line-height: 1.5;
      margin-bottom: var(--space-2);
    }

    .andor-popup-address {
      font-size: 11px;
      color: var(--t-3);
      margin-bottom: var(--space-2);
      padding: 8px;
      background: var(--bg-elevated);
      border-radius: var(--r-md);
    }

    .andor-popup-actions {
      display: flex;
      gap: 6px;
      margin-top: var(--space-2);
    }

    .andor-popup-action-btn {
      flex: 1;
      padding: 6px 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--b-1);
      border-radius: var(--r-md);
      color: var(--t-2);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms;
      text-decoration: none;
      display: inline-block;
    }

    .andor-popup-action-btn:hover {
      background: var(--gold-dim);
      border-color: var(--gold);
      color: var(--gold);
    }

    /* Light mode overrides */
    [data-theme="light"] .leaflet-popup-content-wrapper {
      background: #fff !important;
      border-color: rgba(0, 0, 0, 0.1) !important;
    }

    [data-theme="light"] .andor-popup-title {
      color: var(--text-primary);
    }

    [data-theme="light"] .andor-popup-address {
      background: rgba(0, 0, 0, 0.02);
    }

    [data-theme="light"] .andor-popup-action-btn {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.1);
      color: #666;
    }

    [data-theme="light"] .andor-popup-action-btn:hover {
      background: rgba(212, 168, 67, 0.1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .leaflet-popup-content {
        padding: var(--space-2) !important;
      }

      .andor-popup-actions {
        flex-direction: column;
      }

      .andor-popup-action-btn {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

// Helper to create styled popup content for activities
export function createActivityPopupContent(activity) {
  if (!activity) return '';

  return `
    <div>
      <div class="andor-popup-title">${activity.emoji || '📍'} ${activity.name || 'Activity'}</div>
      
      ${activity.type ? `<div style="font-size: 11px; color: var(--gold); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">${activity.type}</div>` : ''}

      <div class="andor-popup-meta">
        ${activity.duration ? `<span class="andor-popup-meta-item">⏱ ${activity.duration}</span>` : ''}
        ${activity.cost ? `<span class="andor-popup-meta-item">💰 ${activity.cost === 0 ? 'Grátis' : `€${activity.cost}`}</span>` : ''}
        ${activity.rating ? `<span class="andor-popup-meta-item">⭐ ${activity.rating}</span>` : ''}
      </div>

      ${activity.address ? `<div class="andor-popup-address">📍 ${activity.address}</div>` : ''}

      ${activity.description ? `<div class="andor-popup-description">${activity.description}</div>` : ''}

      <div class="andor-popup-actions">
        ${activity.coordinates ? `<a href="https://maps.google.com/?q=${activity.coordinates[0]},${activity.coordinates[1]}" target="_blank" rel="noopener noreferrer" class="andor-popup-action-btn">Mapa</a>` : ''}
        ${activity.bookingUrl ? `<a href="${activity.bookingUrl}" target="_blank" rel="noopener noreferrer" class="andor-popup-action-btn">Reservar</a>` : ''}
      </div>
    </div>
  `;
}
