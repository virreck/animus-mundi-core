// src/ui/components/HorsemanSigilSvg.tsx
// Vector sigils for the four Horsemen.

export const HorsemanSigilSvg = ({ horseman, color, size = 64 }: { horseman: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH'; color: string; size?: number }) => (
  <svg viewBox="0 0 100 100" role="img" aria-label={`Sigil of ${horseman}`} style={{ width: size, height: size, flexShrink: 0, filter: `drop-shadow(0 0 6px ${color})` }}>
    <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
    <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
    {horseman === 'CONQUEST' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        <polygon points="28,42 36,24 50,35 64,24 72,42" />
        <path d="M 24,68 Q 50,42 76,68" />
        <line x1="24" y1="68" x2="76" y2="68" strokeWidth="1" />
        <line x1="50" y1="82" x2="50" y2="20" />
        <polyline points="44,28 50,18 56,28" />
      </g>
    )}
    {horseman === 'WAR' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        <polygon points="50,14 62,38 86,50 62,62 50,86 38,62 14,50 38,38" strokeWidth="1.2" />
        <line x1="50" y1="12" x2="50" y2="88" strokeWidth="3" />
        <line x1="32" y1="32" x2="68" y2="32" strokeWidth="2.8" />
        <line x1="25" y1="25" x2="75" y2="75" strokeWidth="1.4" />
        <line x1="75" y1="25" x2="25" y2="75" strokeWidth="1.4" />
      </g>
    )}
    {horseman === 'FAMINE' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        <line x1="50" y1="18" x2="50" y2="82" />
        <line x1="36" y1="82" x2="64" y2="82" />
        <line x1="22" y1="38" x2="78" y2="38" />
        <polyline points="22,38 15,58 29,58 22,38" />
        <polyline points="78,38 71,58 85,58 78,38" />
        <polygon points="50,24 57,38 43,38" />
      </g>
    )}
    {horseman === 'DEATH' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        <polygon points="34,24 66,24 34,76 66,76" />
        <path d="M 24,80 L 68,20 Q 86,26 78,48 Q 66,34 58,34" />
        <circle cx="50" cy="50" r="6" />
      </g>
    )}
  </svg>
);
