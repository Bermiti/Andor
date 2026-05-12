// Andor Logo — Caravel-shaped "A" with sail and hull
// Used across Navbar, Footer, and anywhere the brand mark appears.

export default function AndorLogo({ size = 40 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main "A" shape — hull-inspired */}
      <path d="M20 3L7 33H13L20 17L27 33H33L20 3Z" fill="#1E6FD9"/>
      {/* Cross-bar — hull deck line */}
      <path d="M12 27H28" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      {/* Mast — golden accent */}
      <path d="M20 3V17" stroke="#D4A853" strokeWidth="2" strokeLinecap="round"/>
      {/* Sail — triangular lateen sail off the mast */}
      <path d="M20 5L28 16L20 14Z" fill="#D4A853" opacity="0.35"/>
      {/* Wave — under the hull */}
      <path d="M9 35C9 35 14 32 20 32C26 32 31 35 31 35" stroke="#1E6FD9" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}
