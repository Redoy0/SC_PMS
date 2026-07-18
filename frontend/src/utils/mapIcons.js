import L from 'leaflet';

/**
 * Creates a modern delivery agent/bike icon for map markers
 * @param {number} size - Icon size (default: 48)
 * @returns {L.DivIcon} Leaflet div icon
 */
export function createAgentIcon(size = 48) {
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      border: 3px solid white;
      position: relative;
      animation: pulse-marker 2s infinite;
    ">
      <svg width="${size * 0.58}" height="${size * 0.58}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <circle cx="5.5" cy="17.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
        <path d="M5.5 17.5h-2v-7l5-5h9l3 3"/>
        <path d="M12 17.5V7"/>
        <path d="M8 7h8"/>
      </svg>
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: ${size * 0.25}px;
        height: ${size * 0.25}px;
        background: #10B981;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>
    </div>
    <style>
      @keyframes pulse-marker {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    </style>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}
