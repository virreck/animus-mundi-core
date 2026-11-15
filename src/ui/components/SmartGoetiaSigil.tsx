// src/ui/components/SmartGoetiaSigil.tsx
// Goetia sigil image with fallbacks and reveal styling.
import { useState, useEffect, type CSSProperties as ReactCSSProperties } from 'react';
import { allGoetia } from '../../content/goetia';
import { SIGIL_REVEALED_FILTER } from '../theme';

export const SmartGoetiaSigil = ({
  goetia,
  isRevealed,
  size = 130,
  style
}: {
  goetia: typeof allGoetia[0];
  isRevealed: boolean;
  size?: number;
  style?: ReactCSSProperties;
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [goetia.id]);

  // Deterministic geometric seed from manifestId (1..72) for fallback vector sigils
  const seed = goetia.manifestId || 1;
  const spokes = 4 + (seed % 5); // 4 to 8 spokes
  const innerRadius = 16 + (seed % 14);
  const polygonSides = 3 + ((seed * 3) % 6); // 3 to 8 sides
  const rotDeg = (seed * 37) % 360;

  const polyPoints: string[] = [];
  for (let i = 0; i < polygonSides; i++) {
    const a = ((rotDeg + (i * 360) / polygonSides) * Math.PI) / 180;
    polyPoints.push(`${50 + 34 * Math.cos(a)},${50 + 34 * Math.sin(a)}`);
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        ...style
      }}
    >
      {!imgFailed ? (
        <img
          src={`/seals/${goetia.id}.png`}
          alt=""
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: isRevealed ? 1 : 0.42,
            filter: isRevealed ? SIGIL_REVEALED_FILTER : undefined,
            animation: isRevealed ? 'none' : 'sigilGlitch 1.5s infinite steps(2)',
            pointerEvents: 'none'
          }}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          style={{
            width: '100%',
            height: '100%',
            opacity: isRevealed ? 1 : 0.42,
            filter: isRevealed ? 'drop-shadow(0 0 6px rgba(98, 240, 128, 0.55))' : undefined,
            animation: isRevealed ? 'none' : 'sigilGlitchSvg 1.5s infinite steps(2)',
            pointerEvents: 'none'
          }}
        >
          <circle cx="50" cy="50" r="44" fill="none" stroke="#62f080" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="39" fill="none" stroke="#62f080" strokeWidth="0.8" strokeDasharray="3 2" />
          <polygon points={polyPoints.join(' ')} fill="none" stroke="#62f080" strokeWidth="1.6" />
          <circle cx="50" cy="50" r={innerRadius} fill="none" stroke="#62f080" strokeWidth="1.4" />
          {Array.from({ length: spokes }).map((_, i) => {
            const angle = ((rotDeg + (i * 360) / spokes) * Math.PI) / 180;
            const x2 = 50 + 36 * Math.cos(angle);
            const y2 = 50 + 36 * Math.sin(angle);
            const tx = 50 + 30 * Math.cos(angle + 0.18);
            const ty = 50 + 30 * Math.sin(angle + 0.18);
            return (
              <g key={i} stroke="#62f080" strokeWidth="1.5" fill="none">
                <line x1="50" y1="50" x2={x2} y2={y2} />
                <circle cx={x2} cy={y2} r="2.6" fill="#050706" stroke="#62f080" strokeWidth="1.4" />
                <line x1={x2} y1={y2} x2={tx} y2={ty} />
              </g>
            );
          })}
          <line x1="22" y1="50" x2="78" y2="50" stroke="#62f080" strokeWidth="1.3" />
          <line x1="50" y1="22" x2="50" y2="78" stroke="#62f080" strokeWidth="1.3" />
        </svg>
      )}
    </div>
  );
};
