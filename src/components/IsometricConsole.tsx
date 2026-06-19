import React, { useState } from 'react';

// ============================================================================ //
// 1. TYPES & DATA STRUCTURES FOR THE GRID
// ============================================================================ //

interface Cell {
  x: number;
  y: number;
  type: 'FLOOR' | 'WALL' | 'CHAOTIC_RIFT' | 'SACRED_GROUND';
  hasAnomaly: boolean;
  anomalyType?: string;
}

interface Entity {
  id: string;
  type: 'OPERATIVE' | 'GOETIA_LIEUTENANT' | 'INQUISITION_HOUND';
  x: number;
  y: number;
  marker: string;
}

const THEME = {
  bgDark: '#020202',
  bgPanel: '#080a08',
  borderTerminal: '#1f3d26',
  textTerminal: '#4a7c59',
  textBright: '#62f080',
  textMuted: '#2a5233',
  accentRed: '#a82c2c',
  fontMono: '"Courier New", Courier, monospace',
};

// ============================================================================ //
// 2. MOCK TACTICAL SETUP (e.g. ST. LAWRENCE CHURCHYARD CRUST)
// ============================================================================ //

const GRID_SIZE = 8;
const initialGrid: Cell[][] = Array.from({ length: GRID_SIZE }, (_, x) =>
  Array.from({ length: GRID_SIZE }, (_, y) => {
    // Inject a couple walls and anomalous rifts for texture
    let type: Cell['type'] = 'FLOOR';
    if ((x === 2 && y === 3) || (x === 5 && y === 2)) type = 'WALL';
    else if (x === 6 && y === 6) type = 'CHAOTIC_RIFT';
    else if (x === 1 && y === 1) type = 'SACRED_GROUND';

    return {
      x,
      y,
      type,
      hasAnomaly: x === 3 && y === 4,
      anomalyType: x === 3 && y === 4 ? 'weapon_decay' : undefined,
    };
  })
);

const initialEntities: Entity[] = [
  { id: 'player', type: 'OPERATIVE', x: 0, y: 0, marker: 'Ω' },
  { id: 'goetia', type: 'GOETIA_LIEUTENANT', x: 4, y: 5, marker: 'Ψ' },
  { id: 'hound', type: 'INQUISITION_HOUND', x: 6, y: 2, marker: '☠' },
];

export default function IsometricConsole() {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [intelLog, setIntelLog] = useState<string[]>(['[SYS] GEOMETRY_ONLINE']);

  // Isometric Projection Geometry Constants
  const tileWidth = 64;
  const tileHeight = 32;
  const mapOffsetX = 260; // Centers the grid inside the viewport frame
  const mapOffsetY = 60;

  const handleTileClick = (cell: Cell) => {
    setSelectedCell({ x: cell.x, y: cell.y });
    
    // Move player smoothly to clicked floor tile if adjacent (Simple Action Loop Mock)
    const player = entities.find(e => e.id === 'player')!;
    const distX = Math.abs(player.x - cell.x);
    const distY = Math.abs(player.y - cell.y);
    
    if (cell.type !== 'WALL' && (distX <= 1 && distY <= 1) && (distX !== 0 || distY !== 0)) {
      setEntities(prev => prev.map(e => e.id === 'player' ? { ...e, x: cell.x, y: cell.y } : e));
      let logMsg = `> ROUTED_TETHER TO: [X:${cell.x}, Y:${cell.y}]`;
      if (cell.hasAnomaly) {
        logMsg += ` | ALERT: Extracted Sign [${cell.anomalyType?.toUpperCase()}]`;
      }
      setIntelLog(prev => [logMsg, ...prev]);
    }
  };

  return (
    <div style={{ display: 'flex', width: '1000px', height: '520px', backgroundColor: THEME.bgPanel, border: `2px solid ${THEME.borderTerminal}`, fontFamily: THEME.fontMono, color: THEME.textTerminal, borderRadius: '2px', overflow: 'hidden' }}>
      
      {/* LEFT PANE: DYNAMIC ISOMETRIC VIEWPORT FEED */}
      <div style={{ flex: '1 1 60%', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: `1px dashed ${THEME.borderTerminal}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${THEME.borderTerminal}`, paddingBottom: '5px', marginBottom: '15px' }}>
          <span style={{ color: THEME.textBright }}>&gt; SENSORY_FEED // PORT_0_GRID</span>
          <span style={{ color: THEME.accentRed, animation: 'blink 2s infinite' }}>● LIVE_TETHER</span>
        </div>

        {/* INTERACTIVE SVG GRID CONTROLLER */}
        <div style={{ flexGrow: 1, backgroundColor: THEME.bgDark, border: `1px solid ${THEME.borderTerminal}`, position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height="100%" style={{ cursor: 'crosshair' }}>
            
            {/* LAYER 0: ENVIRONMENT TILES */}
            {initialGrid.flatMap(row =>
              row.map(cell => {
                // Cartesian (X, Y) to Isometric Projection formula
                const isoX = (cell.x - cell.y) * (tileWidth / 2) + mapOffsetX;
                const isoY = (cell.x + cell.y) * (tileHeight / 2) + mapOffsetY;

                // Diamond shape vertex points
                const points = `
                  ${isoX},${isoY} 
                  ${isoX + tileWidth / 2},${isoY + tileHeight / 2} 
                  ${isoX},${isoY + tileHeight} 
                  ${isoX - tileWidth / 2},${isoY + tileHeight / 2}
                `;

                // Render styles based on tile conditions
                let strokeColor = THEME.borderTerminal;
                let fillColor = 'transparent';
                if (cell.type === 'WALL') fillColor = '#1c1c1c';
                if (cell.type === 'CHAOTIC_RIFT') fillColor = '#240a0a';
                if (cell.type === 'SACRED_GROUND') fillColor = '#0f2413';
                if (cell.hasAnomaly) strokeColor = THEME.textBright;

                const isSelected = selectedCell?.x === cell.x && selectedCell?.y === cell.y;

                return (
                  <polygon
                    key={`tile-${cell.x}-${cell.y}`}
                    points={points}
                    fill={fillColor}
                    stroke={isSelected ? THEME.textBright : strokeColor}
                    strokeWidth={isSelected ? '1.5' : '0.5'}
                    style={{ transition: 'all 0.1s' }}
                    onClick={() => handleTileClick(cell)}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.fill = '#0a140c'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.fill = fillColor; }}
                  />
                );
              })
            )}

            {/* LAYER 1: ENTITIES & CHARACTERS */}
            {entities.map(ent => {
              const isoX = (ent.x - ent.y) * (tileWidth / 2) + mapOffsetX;
              const isoY = (ent.x + ent.y) * (tileHeight / 2) + mapOffsetY;

              // Center offset constants for labels
              const textX = isoX;
              const textY = isoY + (tileHeight / 2) + 4;

              let markerColor = THEME.textBright;
              if (ent.type === 'GOETIA_LIEUTENANT') markerColor = THEME.accentRed;
              if (ent.type === 'INQUISITION_HOUND') markerColor = '#d9a711';

              return (
                <g key={ent.id} style={{ pointerEvents: 'none' }}>
                  {/* Neon node base aura */}
                  <ellipse cx={isoX} cy={isoY + (tileHeight / 2)} rx="8" ry="4" fill="black" stroke={markerColor} strokeWidth="1" />
                  {/* Monospace character avatar representational layer */}
                  <text x={textX} y={textY - 4} fill={markerColor} textAnchor="middle" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {ent.marker}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ fontSize: '0.75rem', color: THEME.textMuted, marginTop: '10px' }}>
          _CLICK ADJACENT TILES TO UPDATE VECTOR POSITIONING. [Ω] OPERATIVE | [Ψ] GOETIA | [☠] INQUISITION
        </div>
      </div>

      {/* RIGHT PANE: INTEGRATED TELEMETRY DIAGNOSTICS & LOGS */}
      <div style={{ flex: '1 1 40%', padding: '20px', display: 'flex', flexDirection: 'column', backgroundColor: '#030503' }}>
        <h3 style={{ margin: '0 0 10px 0', borderBottom: `1px solid ${THEME.borderTerminal}`, paddingBottom: '5px', color: THEME.textBright }}>
          &gt; COGNITIVE_LOGS
        </h3>

        {/* LOG TERMINAL REGISTER */}
        <div style={{ flexGrow: 1, backgroundColor: THEME.bgDark, border: `1px solid ${THEME.borderTerminal}`, padding: '10px', fontSize: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {intelLog.map((log, index) => (
            <div key={index} style={{ color: log.includes('ALERT') ? THEME.accentRed : THEME.textTerminal }}>
              {log}
            </div>
          ))}
        </div>

        {/* STATE MATRIX SELECTION METADATA */}
        <div style={{ marginTop: '15px', padding: '10px', border: `1px dashed ${THEME.borderTerminal}`, backgroundColor: THEME.bgPanel }}>
          <span style={{ fontSize: '0.75rem', color: THEME.textMuted }}>SELECTED_MATRIX_DATA:</span>
          {selectedCell ? (
            <div style={{ fontSize: '0.9rem', marginTop: '5px', color: THEME.textBright }}>
              COORD: [X: {selectedCell.x}, Y: {selectedCell.y}] <br />
              SURFACE: {initialGrid[selectedCell.x][selectedCell.y].type} <br />
              SIGNATURES: {initialGrid[selectedCell.x][selectedCell.y].hasAnomaly ? 'ANOMALY DETECTED' : 'CLEAN'}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', marginTop: '5px', color: THEME.textMuted }}>AWAITING INPUT...</div>
          )}
        </div>
      </div>
    </div>
  );
}