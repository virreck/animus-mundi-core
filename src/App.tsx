// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useEngine } from './ui/hooks/useEngine';
import { caterhamChurchyard } from './content/narrative/caterham_churchyard';
import { safehouse } from './content/narrative/safehouse'; // <-- IMPORTED
import { allGoetia } from './content/goetia';
import { allYokai } from './content/yokai';
import type { GameAction } from './engine/reducer';
import type { GameState } from './engine/state';

// ============================================================================ //
// 1. TYPES & CONSTANTS
// ============================================================================ //

interface NarrativeChoice {
  id: string;
  label: string;
  condition?: (state: GameState) => boolean;
  actions: GameAction[];
}

const theme = {
  bgDark: '#020202',          
  bgPanel: '#080a08',         
  borderTerminal: '#1f3d26',  
  textTerminal: '#4a7c59',    
  textBright: '#62f080',      
  textMuted: '#2a5233',       
  accentRed: '#a82c2c',
  accentGreen: '#4a7c59',     
  fontMono: '"Courier New", Courier, monospace', 
};

const MAP_NODES = [
  { id: 'caterham_churchyard', label: 'ST. LAWRENCE CHURCHYARD', x: 50, y: 80, connections: ['safehouse', 'caterham_asylum'] },
  { id: 'safehouse', label: 'OPERATIVE SAFEHOUSE', x: 50, y: 50, connections: ['caterham_churchyard', 'malleus_precinct', 'thames_nexus'] },
  { id: 'caterham_asylum', label: 'ABANDONED ASYLUM', x: 80, y: 65, connections: ['caterham_churchyard', 'malleus_precinct'] },
  { id: 'malleus_precinct', label: 'MALLEUS PRECINCT', x: 75, y: 25, connections: ['safehouse', 'caterham_asylum'] },
  { id: 'thames_nexus', label: 'LEY-LINE NEXUS', x: 20, y: 35, connections: ['safehouse'] }
];

// ============================================================================ //
// 2. PROCEDURAL SEAL GENERATOR
// ============================================================================ //

function generateSealMatrix() {
  const geometries = [
    { n: 5, s: 2, name: "PENTAGRAM" }, { n: 7, s: 2, name: "HEPTAGRAM_OBTUSE" },
    { n: 7, s: 3, name: "HEPTAGRAM_ACUTE" }, { n: 8, s: 3, name: "OCTAGRAM" },
    { n: 9, s: 2, name: "ENNEAGRAM_OBTUSE" }, { n: 9, s: 4, name: "ENNEAGRAM_ACUTE" }
  ];
  
  const config = geometries[Math.floor(Math.random() * geometries.length)];
  const isBound = Math.random() > 0.5; 
  const rotationOffset = Math.random() * Math.PI * 2; 
  
  const nodes = [];
  const centerX = 50; const centerY = 50; const radius = 42; 
  
  for (let i = 0; i < config.n; i++) {
    const angle = rotationOffset + (i * 2 * Math.PI) / config.n;
    nodes.push({ id: i, x: centerX + radius * Math.sin(angle), y: centerY - radius * Math.cos(angle) });
  }
  
  const sequence = [];
  let current = 0;
  for (let i = 0; i < config.n; i++) {
    sequence.push(current);
    current = (current + config.s) % config.n;
  }
  sequence.push(0); 
  
  if (isBound) {
    for (let i = 0; i < config.n; i++) {
      current = (current + 1) % config.n;
      sequence.push(current);
    }
  }
  
  const edgeCount = sequence.length - 1;
  const timeLimit = Math.ceil(edgeCount * 1.2); 
  const prefix = isBound ? "BOUND_" : "LESSER_";
  
  return { id: `${prefix}${config.name}_PROTOCOL`, timeLimit, nodes, sequence };
}

// ============================================================================ //
// 3. UI COMPONENTS: START SCREEN (WITH FULL-BODY MODAL)
// ============================================================================ //

const StartScreen = ({ onStart, onLoad }: { onStart: (name: string, portrait: string, agency: string) => void, onLoad: () => void }) => {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [portrait, setPortrait] = useState('/portraits/thaumaturge_m1.png'); 
  const [showConfirm, setShowConfirm] = useState(false);

  const savedData = localStorage.getItem('thaumaturgic_os_save_v1');
  let savedOperative = null;
  if (savedData) {
    try { savedOperative = JSON.parse(savedData).playerName; } catch (e) {}
  }

  const getFullBodyPath = (squarePath: string) => {
    const filename = squarePath.split('/').pop();
    return `/portraits/full_body/fb_${filename}`;
  };

  const handleInitiateClick = () => {
    if (!name.trim()) setName('UNKNOWN_OPERATIVE');
    if (!agency.trim()) setAgency('INDEPENDENT');
    setShowConfirm(true);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono }}>
      
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '800px', backgroundColor: theme.bgPanel, border: `2px solid ${theme.textBright}`, boxShadow: `0 0 40px rgba(98, 240, 128, 0.15)` }}>
            <div style={{ flex: '1', borderRight: `1px dashed ${theme.borderTerminal}`, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#030503' }}>
              <h2 style={{ margin: '0 0 20px 0', color: theme.textBright, letterSpacing: '4px', textTransform: 'uppercase' }}>{name}</h2>
              <img src={getFullBodyPath(portrait)} alt="Full Body Operative" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(74,124,89,0.3))' }} />
            </div>
            <div style={{ flex: '1', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: theme.accentRed, borderBottom: `1px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px', animation: 'blink 2s infinite' }}>&gt; CONFIRM DEPLOYMENT</h3>
              <div style={{ marginTop: '20px', lineHeight: '2' }}>
                <div><span style={{ color: theme.textMuted }}>DESIGNATION:</span> <span style={{ color: theme.textBright, fontWeight: 'bold' }}>{name.toUpperCase()}</span></div>
                <div><span style={{ color: theme.textMuted }}>AGENCY:</span> <span style={{ color: theme.textBright, fontWeight: 'bold' }}>{agency.toUpperCase()}</span></div>
                <div><span style={{ color: theme.textMuted }}>STARTING HUMANITY:</span> <span style={{ color: theme.textBright }}>100%</span></div>
                <div><span style={{ color: theme.textMuted }}>TETHER ALIGNMENT:</span> <span style={{ color: theme.textBright }}>STABLE</span></div>
              </div>
              <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button onClick={() => onStart(name, portrait, agency)} style={{ padding: '15px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '2px' }}>&gt; FINALIZE TETHER</button>
                <button onClick={() => setShowConfirm(false)} style={{ padding: '15px', backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = theme.textTerminal} onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}>&gt; REVISE PARAMETERS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '500px', border: `2px solid ${theme.textTerminal}`, padding: '40px', backgroundColor: theme.bgPanel, boxShadow: `0 0 20px rgba(74, 124, 89, 0.2)` }}>
        <h1 style={{ textAlign: 'center', borderBottom: `1px dashed ${theme.textTerminal}`, paddingBottom: '20px', letterSpacing: '4px', color: theme.textBright }}>THAUMATURGIC_OS v3.1</h1>
        
        {savedOperative && (
          <div style={{ marginTop: '30px', padding: '20px', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgDark, textAlign: 'center' }}>
            <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginBottom: '10px' }}>PREVIOUS SESSION DETECTED:</p>
            <button onClick={onLoad} style={{ width: '100%', padding: '15px', backgroundColor: theme.textTerminal, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px', animation: 'slowPulse 2.5s ease-in-out infinite' }}>&gt; RESUME: OP_{savedOperative.toUpperCase()}</button>
            <div style={{ marginTop: '20px', borderBottom: `1px dashed ${theme.borderTerminal}` }}></div>
            <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '20px' }}>OR INITIALIZE NEW INSTANCE BELOW:</p>
          </div>
        )}

        <div style={{ marginTop: savedOperative ? '20px' : '30px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>&gt; INPUT OPERATIVE DESIGNATION:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vergil" style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, marginBottom: '20px', outline: 'none' }} />

          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>&gt; INPUT AFFILIATED AGENCY:</label>
          <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. Independent Consultations" style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, marginBottom: '20px', outline: 'none' }} />

          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>&gt; SELECT OPERATIVE DOSSIER:</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[ { id: 'thaumaturge_m1', src: '/portraits/thaumaturge_m1.png' }, { id: 'thaumaturge_m2', src: '/portraits/thaumaturge_m2.png' }, { id: 'thaumaturge_f1', src: '/portraits/thaumaturge_f1.png' }, { id: 'thaumaturge_f2', src: '/portraits/thaumaturge_f2.png' } ].map(p => (
              <button key={p.id} onClick={() => setPortrait(p.src)} style={{ padding: '4px', cursor: 'pointer', backgroundColor: portrait === p.src ? theme.textTerminal : 'transparent', border: `2px solid ${portrait === p.src ? theme.textBright : theme.borderTerminal}`, transition: 'all 0.2s', borderRadius: '50%' }}>
                <img src={p.src} alt="Operative" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '50%', opacity: portrait === p.src ? 1 : 0.5, filter: portrait === p.src ? 'none' : 'grayscale(100%) sepia(20%) hue-rotate(80deg)' }} />
              </button>
            ))}
          </div>

          <button onClick={handleInitiateClick} style={{ width: '100%', padding: '15px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px' }}>
            INITIALIZE TETHER PROTOCOL
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================ //
// 4. UI COMPONENTS: STANDARD SEALING TERMINAL (LIEUTENANTS)
// ============================================================================ //

interface SealingTerminalProps {
  target: any;
  sealCost: Record<string, number>;
  onClose: () => void;
  dispatch: React.Dispatch<GameAction>;
  sealGoetia: (id: string) => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
}

const SealingTerminal = ({ target, sealCost, onClose, dispatch, sealGoetia, addToast }: SealingTerminalProps) => {
  const [matrix] = useState(() => generateSealMatrix());
  const [phase, setPhase] = useState<'AUTH' | 'WARDING' | 'COMPLETE'>('AUTH');
  const [nameInput, setNameInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(matrix.timeLimit); 
  const [path, setPath] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{x: number, y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [typedName, setTypedName] = useState(''); 
  const [showSealed, setShowSealed] = useState(false); 
  const [isCleanSeal, setIsCleanSeal] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'WARDING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (phase === 'WARDING' && timeLeft <= 0) {
      executeFinalSeal(false); 
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'COMPLETE') {
      const fullName = target.name.toUpperCase();
      let i = 0;
      const interval = setInterval(() => {
        setTypedName(fullName.substring(0, i + 1));
        i++;
        if (i >= fullName.length) { clearInterval(interval); setTimeout(() => setShowSealed(true), 1200); }
      }, 300); 
      return () => clearInterval(interval);
    }
  }, [phase, target.name]);

  useEffect(() => {
    if (phase === 'WARDING' && path.length === matrix.sequence.length) executeFinalSeal(true);
  }, [path.length, phase, matrix.sequence.length]);

  const getSVGCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  const startTracing = (e: React.PointerEvent) => {
    if (phase !== 'WARDING') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSVGCoords(e);
    if (!coords) return;
    setCurrentPointer({ x: coords.x, y: coords.y });
    setPath(() => {
      const firstId = matrix.sequence[0];
      const firstNode = matrix.nodes.find(n => n.id === firstId)!;
      const dx = coords.x - firstNode.x; const dy = coords.y - firstNode.y;
      return (Math.sqrt(dx * dx + dy * dy) < 20) ? [firstId] : [];
    });
  };

  const moveTracing = (e: React.PointerEvent) => {
    if (phase !== 'WARDING' || !currentPointer) return;
    const coords = getSVGCoords(e);
    if (coords) {
      setCurrentPointer({ x: coords.x, y: coords.y });
      setPath(prevPath => {
        const nextId = matrix.sequence[prevPath.length];
        if (nextId === undefined) return prevPath;
        const targetNode = matrix.nodes.find(n => n.id === nextId)!;
        const dx = coords.x - targetNode.x; const dy = coords.y - targetNode.y;
        if (Math.sqrt(dx * dx + dy * dy) < 15) return [...prevPath, targetNode.id];
        return prevPath;
      });
    }
  };

  const stopTracing = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setCurrentPointer(null);
    setPath(prevPath => (prevPath.length > 0 && prevPath.length < matrix.sequence.length) ? [] : prevPath);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().toUpperCase() === target.name.toUpperCase()) setPhase('WARDING');
    else { addToast("Signature mismatch.", "ALERT"); dispatch({ type: 'MODIFY_HUMANITY', payload: -2 }); }
  };

  const executeFinalSeal = (isClean: boolean) => {
    setIsCleanSeal(isClean);
    setPhase('COMPLETE'); 
    setCurrentPointer(null);
    (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) => dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } }));
    sealGoetia(target.id);
    if (isClean) {
      addToast(`SEALING SUCCESSFUL. Target ${target.name} bound to the brass vessel.`, 'SEAL');
    } else {
      addToast(`RITUAL FRACTURE. Global Entropy spiked by 15%.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 15 }); 
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ width: '500px', padding: '30px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.textTerminal}`, boxShadow: `0 0 30px rgba(74, 124, 89, 0.2)`, fontFamily: theme.fontMono, color: theme.textTerminal }}>
        {phase !== 'COMPLETE' && <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.textTerminal}`, paddingBottom: '5px', color: theme.textBright }}>&gt; ROOT_ACCESS // VESSEL_SEALING_PROTOCOL</h3>}
        {phase === 'AUTH' && (
          <form onSubmit={handleAuthSubmit}>
            <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>TARGET LOCKED. INPUT TRUE NAME SIGNATURE TO AUTHORIZE CATALYST BURN:</p>
            <input autoFocus type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="e.g. MURMUR" style={{ padding: '10px', width: '100%', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', textTransform: 'uppercase' }} />
            <button type="submit" style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: theme.textTerminal, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&gt; EXECUTE</button>
            <button type="button" onClick={onClose} style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </form>
        )}
        {phase === 'WARDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: theme.accentRed, fontWeight: 'bold', animation: 'blink 1s infinite' }}>! CONNECTION VOLATILE</span>
              <span style={{ color: timeLeft <= 5 ? theme.accentRed : theme.textBright }}>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <p style={{ fontSize: '0.85rem', alignSelf: 'flex-start', marginBottom: '20px', color: theme.textMuted }}>REQUESTING ALIGNMENT: <span style={{color: theme.textTerminal}}>[{matrix.id}]</span></p>
            <div style={{ position: 'relative', width: '300px', height: '300px', border: `1px solid ${theme.borderTerminal}`, backgroundColor: theme.bgDark, borderRadius: '50%', overflow: 'hidden' }}>
              <img src={`/seals/${target.id}.png`} alt="Target Seal" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '180px', height: '180px', opacity: 0.3, filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                <polygon points={matrix.sequence.map(id => `${matrix.nodes.find(n => n.id === id)!.x},${matrix.nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={theme.borderTerminal} strokeWidth="0.5" />
                <polyline points={path.map((nodeId) => `${matrix.nodes.find(n => n.id === nodeId)!.x},${matrix.nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke={theme.textBright} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {currentPointer && path.length > 0 && path.length < matrix.sequence.length && (
                  <line x1={matrix.nodes.find(n => n.id === path[path.length - 1])!.x} y1={matrix.nodes.find(n => n.id === path[path.length - 1])!.y} x2={currentPointer.x} y2={currentPointer.y} stroke={theme.textTerminal} strokeWidth="1" strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
                )}
                {matrix.nodes.map((node) => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === matrix.sequence[path.length] || (path.length === 0 && node.id === matrix.sequence[0]);
                  return (
                    <g key={node.id} style={{ pointerEvents: 'none' }}>
                      <circle cx={node.x} cy={node.y} r={isNext ? "3.5" : "2"} fill={isCompleted ? theme.textBright : theme.bgDark} stroke={isNext ? theme.textBright : theme.textTerminal} strokeWidth="0.5" />
                      {isNext && <circle cx={node.x} cy={node.y} r="5" fill="none" stroke={theme.textBright} strokeWidth="0.5" style={{ animation: 'blink 1s infinite' }} />}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
        {phase === 'COMPLETE' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src={`/seals/${target.id}.png`} alt="Goetian Seal" style={{ width: '200px', height: '200px', marginBottom: '20px', filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />
            <h2 style={{ color: theme.textBright, letterSpacing: '6px', minHeight: '35px', margin: '0' }}>{typedName}</h2>
            {showSealed && (
              <>
                <div style={{ color: theme.accentRed, fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '8px', marginTop: '10px', animation: 'slowPulse 2.5s ease-in-out infinite' }}>[SEALED]</div>
                {!isCleanSeal && <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginTop: '15px' }}>_CONTAINMENT FAILURE: GLOBAL ENTROPY SPIKED.</p>}
                <button onClick={onClose} style={{ marginTop: '30px', padding: '10px 20px', width: '100%', backgroundColor: theme.bgDark, color: theme.textTerminal, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono }}>&gt; ACKNOWLEDGE_CONTAINMENT</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================ //
// 5. UI COMPONENTS: HORSEMAN BANISHMENT TERMINAL (ENDGAME)
// ============================================================================ //

interface BanishmentTerminalProps {
  horseman: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH';
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onClose: () => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
}

const BanishmentTerminal = ({ horseman, state, dispatch, onClose, addToast }: BanishmentTerminalProps) => {
  const [phase, setPhase] = useState<'WARNING' | 'LEDGER' | 'RITUAL' | 'RESOLUTION'>('WARNING');
  const [authText, setAuthText] = useState('');
  
  const [matrices] = useState(() => [generateSealMatrix(), generateSealMatrix(), generateSealMatrix()]);
  const [currentMatrixIdx, setCurrentMatrixIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); 
  const [path, setPath] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{x: number, y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isVictory, setIsVictory] = useState(false);

  const lieutenants = allGoetia.filter(g => g.allegiance === horseman);
  const sealedCount = lieutenants.filter(g => state.sealedGoetia.includes(g.id)).length;
  const winProbability = Math.min(95, 5 + (sealedCount * 5)); 

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'RITUAL' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (phase === 'RITUAL' && timeLeft <= 0) {
      executeResolution(false); 
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'RITUAL' && path.length === matrices[currentMatrixIdx].sequence.length) {
      if (currentMatrixIdx < 2) {
        setCurrentMatrixIdx(prev => prev + 1);
        setPath([]);
        setCurrentPointer(null);
        addToast(`MATRIX ${currentMatrixIdx + 1} LOCKED. ADVANCING.`, 'SEAL');
      } else {
        const roll = Math.random() * 100;
        executeResolution(roll <= winProbability);
      }
    }
  }, [path.length, phase, currentMatrixIdx, matrices]);

  const executeResolution = (success: boolean) => {
    setIsVictory(success);
    setPhase('RESOLUTION');
    if (success) {
      addToast(`BANISHMENT SUCCESSFUL. The Rider falls.`, 'SEAL');
    } else {
      addToast(`RITUAL FRACTURE. TETHER SNAPPED. GLOBAL ENTROPY CRITICAL.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 40 }); 
    }
  };

  const getSVGCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
  };

  const startTracing = (e: React.PointerEvent) => {
    if (phase !== 'RITUAL') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSVGCoords(e);
    if (!coords) return;
    setCurrentPointer({ x: coords.x, y: coords.y });
    setPath(() => {
      const firstId = matrices[currentMatrixIdx].sequence[0];
      const firstNode = matrices[currentMatrixIdx].nodes.find(n => n.id === firstId)!;
      const dx = coords.x - firstNode.x; const dy = coords.y - firstNode.y;
      return (Math.sqrt(dx*dx + dy*dy) < 20) ? [firstId] : [];
    });
  };

  const moveTracing = (e: React.PointerEvent) => {
    if (phase !== 'RITUAL' || !currentPointer) return;
    const coords = getSVGCoords(e);
    if (coords) {
      setCurrentPointer({ x: coords.x, y: coords.y });
      setPath(prevPath => {
        const nextId = matrices[currentMatrixIdx].sequence[prevPath.length];
        if (nextId === undefined) return prevPath;
        const targetNode = matrices[currentMatrixIdx].nodes.find(n => n.id === nextId)!;
        const dx = coords.x - targetNode.x; const dy = coords.y - targetNode.y;
        if (Math.sqrt(dx*dx + dy*dy) < 15) return [...prevPath, targetNode.id];
        return prevPath;
      });
    }
  };

  const stopTracing = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setCurrentPointer(null);
    setPath(prev => (prev.length > 0 && prev.length < matrices[currentMatrixIdx].sequence.length) ? [] : prev);
  };

  const overrideTheme = { bg: '#0f0202', border: '#ff3333', text: '#ff6666', bright: '#ffb3b3' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ width: '600px', padding: '40px', backgroundColor: overrideTheme.bg, border: `2px solid ${overrideTheme.border}`, boxShadow: `0 0 50px rgba(255, 51, 51, 0.2)`, fontFamily: theme.fontMono, color: overrideTheme.text }}>
        
        {phase === 'WARNING' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: overrideTheme.bright, letterSpacing: '4px', animation: 'blink 1s infinite' }}>! CRITICAL OVERRIDE !</h2>
            <p style={{ lineHeight: '1.6', marginTop: '20px' }}>You are attempting to initiate a Class-Omega Banishment Protocol against a localized conceptual apex. This will stress your Tether to the breaking point.</p>
            <p style={{ marginTop: '20px', fontSize: '0.85rem' }}>TYPE <strong style={{color: overrideTheme.bright}}>INITIATE_GRAND_RITE_{horseman}</strong> TO AUTHORIZE:</p>
            <input type="text" value={authText} onChange={e => setAuthText(e.target.value.toUpperCase())} style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: 'black', color: overrideTheme.bright, border: `1px solid ${overrideTheme.border}`, outline: 'none', textAlign: 'center', letterSpacing: '2px' }} />
            <button onClick={() => { if (authText === `INITIATE_GRAND_RITE_${horseman}`) setPhase('LEDGER'); else addToast("AUTHORIZATION MISMATCH.", "ALERT"); }} style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: overrideTheme.border, color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px' }}>&gt; OVERRIDE SAFETIES</button>
            <button onClick={onClose} style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: 'transparent', color: overrideTheme.text, border: `1px solid ${overrideTheme.text}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </div>
        )}

        {phase === 'LEDGER' && (
          <div>
            <h2 style={{ color: overrideTheme.bright, borderBottom: `1px solid ${overrideTheme.border}`, paddingBottom: '10px' }}>&gt; TACTICAL CALCULUS</h2>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Assessing anchor severance for: <strong style={{color: 'white'}}>{horseman}</strong></p>
            <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '2' }}>
              {lieutenants.map(g => {
                const isSealed = state.sealedGoetia.includes(g.id);
                return (
                  <li key={g.id} style={{ color: isSealed ? '#555' : overrideTheme.text, textDecoration: isSealed ? 'line-through' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{g.name.toUpperCase()}</span><span>{isSealed ? '[ SEVERED ]' : '[ ACTIVE_ANCHOR ]'}</span>
                  </li>
                );
              })}
            </ul>
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'black', border: `1px dashed ${overrideTheme.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: overrideTheme.text }}>CALCULATED SUCCESS PROBABILITY</div>
              <div style={{ fontSize: '3rem', color: overrideTheme.bright, fontWeight: 'bold', textShadow: `0 0 10px ${overrideTheme.border}` }}>{winProbability}%</div>
            </div>
            <button onClick={() => setPhase('RITUAL')} style={{ width: '100%', padding: '15px', marginTop: '30px', backgroundColor: overrideTheme.bright, color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px' }}>&gt; COMMENCE TRIPLE-MATRIX</button>
          </div>
        )}

        {phase === 'RITUAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span style={{ color: overrideTheme.bright }}>PHASE: {currentMatrixIdx + 1}/3</span>
              <span style={{ color: timeLeft <= 15 ? overrideTheme.bright : overrideTheme.text, animation: timeLeft <= 15 ? 'blink 0.5s infinite' : 'none' }}>T-MINUS: {timeLeft}s</span>
            </div>
            <div style={{ position: 'relative', width: '350px', height: '350px', border: `2px solid ${overrideTheme.border}`, backgroundColor: 'black', borderRadius: '50%' }}>
               <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                  <polygon points={matrices[currentMatrixIdx].sequence.map(id => `${matrices[currentMatrixIdx].nodes.find(n => n.id === id)!.x},${matrices[currentMatrixIdx].nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={overrideTheme.border} strokeWidth="0.5" strokeDasharray="1 3" />
                  <polyline points={path.map((nodeId) => `${matrices[currentMatrixIdx].nodes.find(n => n.id === nodeId)!.x},${matrices[currentMatrixIdx].nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke={overrideTheme.bright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none', filter: `drop-shadow(0 0 3px ${overrideTheme.bright})` }} />
                  {currentPointer && path.length > 0 && path.length < matrices[currentMatrixIdx].sequence.length && (
                    <line x1={matrices[currentMatrixIdx].nodes.find(n => n.id === path[path.length - 1])!.x} y1={matrices[currentMatrixIdx].nodes.find(n => n.id === path[path.length - 1])!.y} x2={currentPointer.x} y2={currentPointer.y} stroke={overrideTheme.text} strokeWidth="1" strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
                  )}
                  {matrices[currentMatrixIdx].nodes.map((node) => {
                    const isCompleted = path.includes(node.id);
                    const isNext = node.id === matrices[currentMatrixIdx].sequence[path.length] || (path.length === 0 && node.id === matrices[currentMatrixIdx].sequence[0]);
                    return <g key={node.id} style={{ pointerEvents: 'none' }}><circle cx={node.x} cy={node.y} r={isNext ? "4" : "2"} fill={isCompleted ? overrideTheme.bright : 'black'} stroke={isNext ? overrideTheme.bright : overrideTheme.border} strokeWidth="0.5" /></g>;
                  })}
               </svg>
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '20px', color: overrideTheme.text, textAlign: 'center' }}>_MAINTAIN UNBROKEN LINE. FRACTURES WILL RESET CURRENT MATRIX.</p>
          </div>
        )}

        {phase === 'RESOLUTION' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {isVictory ? (
              <>
                <h1 style={{ color: 'white', letterSpacing: '8px', fontSize: '2.5rem', margin: '0 0 20px 0' }}>CONCEPT SEVERED</h1>
                <p style={{ color: overrideTheme.bright, lineHeight: '1.8' }}>The localized manifestation of {horseman} has collapsed inward. The oppressive weight lifts from the sector. The logic fog dissolves into mundane rain.</p>
                <button onClick={onClose} style={{ padding: '15px 30px', marginTop: '40px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>&gt; ACKNOWLEDGE VICTORY</button>
              </>
            ) : (
              <>
                <h1 style={{ color: overrideTheme.bright, letterSpacing: '8px', fontSize: '2.5rem', margin: '0 0 20px 0', animation: 'blink 0.5s infinite' }}>TETHER RUPTURE</h1>
                <p style={{ color: overrideTheme.text, lineHeight: '1.8' }}>The banishment failed. The residual energy backlashes through your OS, burning out wards and shattering local reality. The Horseman's grip tightens.</p>
                <button onClick={onClose} style={{ padding: '15px 30px', marginTop: '40px', backgroundColor: 'transparent', color: overrideTheme.border, border: `1px solid ${overrideTheme.border}`, cursor: 'pointer' }}>&gt; INITIATE EMERGENCY REBOOT</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================ //
// 6. MAIN APPLICATION COMPONENT
// ============================================================================ //

export default function App() {
  const { state, dispatch, draftContract, resetGame, identifyGoetia, sealGoetia, startInvestigation, loadGame, travelTo } = useEngine();
  const [currentTab, setCurrentTab] = useState<'CURRENT_NODE' | 'MAP' | 'CODEX' | 'KAGE_NO_SHO' | 'JOURNAL' | 'INVENTORY'>('CURRENT_NODE');
  const [selectedGoetiaId, setSelectedGoetiaId] = useState<string | null>(null);
  const [activeSealTarget, setActiveSealTarget] = useState<string | null>(null);
  const [activeBanishmentTarget, setActiveBanishmentTarget] = useState<'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH' | null>(null); // <-- NEW BANISHMENT TRACKER
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const injectNarrative = (text: string) => text ? text.replace(/\{playerName\}/g, state.playerName).replace(/\{agencyName\}/g, state.agencyName) : "";
  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    // Math.random() ensures unique IDs even when 5 actions fire in 1 millisecond
    const id = Date.now() + Math.random(); 
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Increased read time to 5.5 seconds
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5500);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  const formatNode = (nodeId: string) => nodeId.replace(/_/g, ' ').toUpperCase();

  // --- DYNAMIC NARRATIVE ROUTER ---
  const getCurrentNodeData = () => {
    if (state.currentNode === 'caterham_churchyard') return caterhamChurchyard;
    if (state.currentNode === 'safehouse') return safehouse; 
    
    return {
      title: MAP_NODES.find(n => n.id === state.currentNode)?.label || "UNKNOWN SECTOR",
      text: "You have entered a new sector. The Thaumaturgic OS is currently compiling localized esoteric data. Stand by for further environmental analysis...",
      choices: [{ id: 'scout', label: 'SCOUT THE PERIMETER (TIME PASSES)', actions: [{ type: 'ADVANCE_TIME', payload: 2 }] as GameAction[] }]
    };
  };

  const activeNodeData = getCurrentNodeData();
  const availableChoices = activeNodeData.choices as NarrativeChoice[];

  if (state.gameStage === 'START_SCREEN') return <StartScreen onStart={startInvestigation} onLoad={loadGame} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono }}>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } } 
        @keyframes slowPulse { 0%, 100% { opacity: 0.6; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); text-shadow: 0 0 15px ${theme.accentRed}; } }
        @keyframes slideInRight { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      
      {/* ================================================================== */}
      {/* 6.1 TOP BAR */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.borderTerminal}`, fontSize: '0.9rem', letterSpacing: '1px' }}>
        <span>ACTIVE_NODE: <strong style={{color: theme.accentRed}}>{formatNode(state.currentNode)}</strong></span>
        <span style={{ color: theme.textTerminal }}>AUTH_USER: <strong style={{ color: theme.textBright }}>{state.playerName.toUpperCase()}</strong> <span style={{ margin: '0 10px', color: theme.borderTerminal }}>//</span> AGENCY: <strong style={{ color: theme.textBright }}>{state.agencyName.toUpperCase()}</strong></span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* ================================================================== */}
        {/* 6.2 LEFT SIDEBAR (Meters & Navigation) */}
        {/* ================================================================== */}
        <div style={{ width: '220px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.borderTerminal}`, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
               <img src={state.playerPortrait} alt="Operative" style={{ width: '100px', height: '100px', objectFit: 'cover', objectPosition: 'top', borderRadius: '50%', border: `2px solid ${theme.textBright}`, boxShadow: `0 0 15px rgba(98, 240, 128, 0.2)` }} />
             </div>
             <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>OP_DESIGNATION</div>
             <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: theme.textBright }}>{state.playerName}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '20px', marginBottom: '20px' }}>
            <NavBtn active={currentTab === 'CURRENT_NODE'} onClick={() => setCurrentTab('CURRENT_NODE')}>ACTIVE_SECTOR</NavBtn>
            <NavBtn active={currentTab === 'MAP'} onClick={() => setCurrentTab('MAP')}>GEO_TRACKER</NavBtn>
            <NavBtn active={currentTab === 'KAGE_NO_SHO'} onClick={() => setCurrentTab('KAGE_NO_SHO')}>KAGE_NO_SHO</NavBtn>
            <NavBtn active={currentTab === 'CODEX'} onClick={() => setCurrentTab('CODEX')}>GOETIAN_CODEX</NavBtn>
            <NavBtn active={currentTab === 'INVENTORY'} onClick={() => setCurrentTab('INVENTORY')}>LOCAL_STORAGE</NavBtn>
            <NavBtn active={currentTab === 'JOURNAL'} onClick={() => setCurrentTab('JOURNAL')}>FIELD_LOG</NavBtn>
          </div>

          <div style={{ flexGrow: 1 }}></div>
          
          {/* THE METERS */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>GLOBAL ENTROPY</span>
            <div style={{ height: '8px', backgroundColor: theme.bgDark, border: `1px solid ${theme.borderTerminal}`, marginTop: '5px' }}>
              <div style={{ width: `${state.globalEntropy || 0}%`, height: '100%', backgroundColor: '#b8860b', transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '5px', color: theme.textMuted }}>{state.globalEntropy || 0}%</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>LOCAL SECTOR HEAT</span>
            <div style={{ height: '8px', backgroundColor: theme.bgDark, border: `1px solid ${theme.borderTerminal}`, marginTop: '5px' }}>
              <div style={{ width: `${state.sectorEntropy[state.currentNode] || 0}%`, height: '100%', backgroundColor: theme.accentRed, transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '5px', color: theme.textMuted }}>{state.sectorEntropy[state.currentNode] || 0}%</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>HUMANITY</span>
            <div style={{ fontSize: '1.5rem', color: state.humanity < 50 ? theme.accentRed : theme.textBright }}>{state.humanity} / 100</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '15px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>OBOLS (WEALTH)</span>
            <div style={{ fontSize: '1.5rem', color: '#ffb347' }}>{state.inventory["obols"] || 0}</div>
          </div>

          <button onClick={resetGame} style={{ padding: '10px', backgroundColor: '#3a0c0c', color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono }}>
            &gt; TERMINATE_SESSION
          </button>
        </div>

        {/* ================================================================== */}
        {/* 6.3 MAIN CONSOLE (Displays Map or Dual Panes) */}
        {/* ================================================================== */}
        <div style={{ flexGrow: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, display: 'flex', minHeight: '600px', boxShadow: `0 0 20px rgba(74, 124, 89, 0.05)`, borderRadius: '2px' }}>
            
            {/* --- MAP OVERRIDE (Takes full width) --- */}
            {currentTab === 'MAP' ? (
              <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', marginBottom: '20px' }}>
                  <h2 style={{ letterSpacing: '2px', color: theme.textBright, margin: 0 }}>&gt; ESOTERIC_GEO_TRACKER</h2>
                  <span style={{ color: theme.textMuted, fontSize: '0.8rem', animation: 'blink 2s infinite' }}>● LIVE TRACKING</span>
                </div>
                
                <div style={{ flexGrow: 1, backgroundColor: '#030503', border: `1px solid ${theme.borderTerminal}`, position: 'relative', overflow: 'hidden', backgroundImage: `linear-gradient(${theme.borderTerminal} 1px, transparent 1px), linear-gradient(90deg, ${theme.borderTerminal} 1px, transparent 1px)`, backgroundSize: '40px 40px', backgroundPosition: '-1px -1px' }}>
                  <svg viewBox="0 10 100 80" style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    {MAP_NODES.map(node => 
                      node.connections.map(targetId => {
                        const target = MAP_NODES.find(n => n.id === targetId);
                        if (!target) return null;
                        return <line key={`${node.id}-${target.id}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} stroke={theme.borderTerminal} strokeWidth="0.5" strokeDasharray="2 2" />;
                      })
                    )}
                    {MAP_NODES.map(node => {
                      const isCurrent = state.currentNode === node.id;
                      const isAdjacent = MAP_NODES.find(n => n.id === state.currentNode)?.connections.includes(node.id);
                      return (
                        <g 
                          key={node.id} 
                          onClick={() => {
                            if (isAdjacent) {
                              travelTo(node.id);
                              addToast(`Routing to ${node.label}... Time passes.`, 'ALERT');
                              setCurrentTab('CURRENT_NODE');
                            }
                          }}
                          style={{ cursor: isAdjacent ? 'pointer' : 'default', transition: 'all 0.3s' }}
                        >
                          {isCurrent && <circle cx={node.x} cy={node.y} r="6" fill="none" stroke={theme.textBright} strokeWidth="0.5" style={{ animation: 'slowPulse 2s infinite' }} />}
                          <circle cx={node.x} cy={node.y} r={isCurrent ? "2.5" : "2"} fill={isCurrent ? theme.textBright : isAdjacent ? theme.textTerminal : theme.bgDark} stroke={isAdjacent || isCurrent ? theme.textBright : theme.borderTerminal} strokeWidth="0.5" />
                          <text x={node.x} y={node.y - 4} fill={isCurrent ? theme.textBright : isAdjacent ? theme.textTerminal : theme.textMuted} fontSize="3" fontFamily={theme.fontMono} textAnchor="middle" letterSpacing="0.5" style={{ pointerEvents: 'none', textShadow: isCurrent ? `0 0 5px ${theme.bgDark}` : 'none' }}>
                            {node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: '15px', textAlign: 'center' }}>_CLICK ADJACENT SECTORS TO INITIATE TRAVEL PROTOCOL. TRAVEL ADVANCES TIME AND SECTOR HEAT.</p>
              </div>
            ) : (
              <>
                {/* ========================================================== */}
                {/* 6.3a DUAL PANE: LEFT SIDE (Info Display) */}
                {/* ========================================================== */}
                <div style={{ flex: 1, padding: '40px', borderRight: `1px dashed ${theme.borderTerminal}`, overflowY: 'auto', maxHeight: '75vh' }}>
                  
                  {currentTab === 'CURRENT_NODE' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: theme.textBright }}>
                        &gt; {injectNarrative(activeNodeData.title)}
                      </h2>
                      <p style={{ lineHeight: '1.8', fontSize: '1.05rem', marginTop: '20px', whiteSpace: 'pre-wrap' }}>
                        {injectNarrative(typeof activeNodeData.text === 'function' ? activeNodeData.text(state) : activeNodeData.text)}
                      </p>
                    </>
                  )}

                  {currentTab === 'CODEX' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', letterSpacing: '2px', color: theme.textBright }}>&gt; GOETIAN_CODEX</h2>
                      <p style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '20px' }}>Cross-reference field intel to identify commanding lieutenants.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {allGoetia.filter(goetia => goetia.requiredIntel?.some((tag: string) => state.intelLog.includes(tag)) || state.identifiedGoetia.includes(goetia.id) || state.sealedGoetia.includes(goetia.id)).map(goetia => {
                          const hasAllIntel = goetia.requiredIntel?.every((tag: string) => state.intelLog.includes(tag));
                          const isIdentified = state.identifiedGoetia.includes(goetia.id);
                          const isSealed = state.sealedGoetia.includes(goetia.id);
                          let indexLabel = `UNKNOWN ENTITY (#${goetia.id.substring(0,4).toUpperCase()})`;
                          if (isSealed) indexLabel = `[SEALED] ${goetia.name}`;
                          else if (isIdentified) indexLabel = goetia.name;
                          else if (hasAllIntel) indexLabel = `[!] TARGET DATA ACQUIRED`;
                          return (
                            <button key={goetia.id} onClick={() => setSelectedGoetiaId(goetia.id)} style={{ padding: '12px', backgroundColor: selectedGoetiaId === goetia.id ? theme.bgDark : 'transparent', color: hasAllIntel && !isIdentified ? theme.accentRed : theme.textBright, border: `1px solid ${selectedGoetiaId === goetia.id ? theme.textBright : theme.borderTerminal}`, textAlign: 'left', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px' }}>
                              {isSealed && <img src={`/seals/${goetia.id}.png`} alt="Goetian Seal" style={{ width: '28px', height: '28px', filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />}
                              <span>&gt; {indexLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {currentTab === 'KAGE_NO_SHO' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; KAGE_NO_SHO</h2>
                      <p style={{ fontSize: '0.9rem', color: theme.textMuted }}>Forge pacts through mutual exchange to bind spirits to your Tether.</p>
                      {allYokai.filter(y => y.utilityClass === 'Shikigami' || (y.unlockFlag && state.flags[y.unlockFlag])).map(yokai => {
                        const cost = yokai.draftCost;
                        const canAfford = (!cost.obols || (state.inventory["obols"] || 0) >= cost.obols) && (!cost.humanity || state.humanity >= cost.humanity) && (!cost.ink || state.ink >= cost.ink) && (!cost.tributeItemId || (state.inventory[cost.tributeItemId] || 0) >= 1);
                        const costDisplay = [cost.obols ? `${cost.obols} Obols` : '', cost.humanity ? `${cost.humanity} Humanity` : '', cost.ink ? `${cost.ink} Ink` : '', cost.tributeItemId ? `1x ${formatNode(cost.tributeItemId)}` : ''].filter(Boolean).join(' + ') || 'Free';
                        return (
                          <div key={yokai.id} style={{ border: `1px solid ${theme.borderTerminal}`, padding: '15px', marginTop: '20px', backgroundColor: theme.bgDark }}>
                            <h3 style={{ margin: '0 0 10px 0', color: theme.textBright }}>{yokai.nameEn}</h3>
                            <p style={{ fontSize: '0.9rem' }}>{yokai.gameUtility}</p>
                            <p style={{ fontWeight: 'bold', fontSize: '0.85rem', marginTop: '10px' }}>&gt; PACT REQ: <span style={{ color: theme.accentRed }}>{costDisplay}</span></p>
                            <button onClick={() => { if (canAfford) { draftContract(yokai.id, yokai.draftCost); addToast(`Forged pact: ${yokai.nameEn}`, 'ALERT'); } }} disabled={!canAfford} style={{ padding: '8px 15px', marginTop: '10px', width: '100%', backgroundColor: canAfford ? theme.textTerminal : '#111', color: canAfford ? 'black' : theme.textMuted, border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed', fontFamily: theme.fontMono, fontWeight: 'bold' }}>
                              {canAfford ? '> BIND TO TETHER' : '> UNMET DEMANDS'}
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {currentTab === 'INVENTORY' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; LOCAL_STORAGE</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                        <div onClick={() => setSelectedItemId('brass_vessel')} style={{ border: `1px solid ${selectedItemId === 'brass_vessel' ? theme.textBright : theme.borderTerminal}`, padding: '15px', textAlign: 'center', backgroundColor: theme.bgDark, cursor: 'pointer' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚱️</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 'bold', wordBreak: 'break-word', color: theme.textBright }}>BRASS_VESSEL</div>
                          <div style={{ marginTop: '5px', color: theme.textMuted, fontWeight: 'bold' }}>x ∞</div>
                        </div>
                        {(Object.entries(state.inventory) as [string, number][]).filter(([key]) => key !== 'obols').map(([key, amount]) => (
                          <div key={key} onClick={() => setSelectedItemId(key)} style={{ border: `1px solid ${selectedItemId === key ? theme.textBright : theme.borderTerminal}`, padding: '15px', textAlign: 'center', backgroundColor: theme.bgDark, cursor: 'pointer' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', wordBreak: 'break-word', color: theme.textBright }}>{formatNode(key)}</div>
                            <div style={{ marginTop: '5px', color: theme.textMuted, fontWeight: 'bold' }}>x {amount}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {currentTab === 'JOURNAL' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; CASE_FILES</h2>
                      <h3 style={{ fontSize: '0.9rem', color: theme.textTerminal, marginTop: '20px' }}>[ ACTIVE_LEADS ]</h3>
                      {state.activeLeads.filter(l => !l.resolved).length === 0 ? <p style={{color: theme.textMuted, fontSize: '0.85rem'}}>_NO ACTIVE LEADS.</p> : (
                        <ul style={{ listStyleType: 'none', paddingLeft: '0', lineHeight: '1.8', fontSize: '0.9rem' }}>
                          {state.activeLeads.filter(l => !l.resolved).map(lead => <li key={lead.id} style={{ marginBottom: '10px', color: theme.textBright }}><strong style={{color: theme.accentGreen}}>[!]</strong> {injectNarrative(lead.text).toUpperCase()}</li>)}
                        </ul>
                      )}
                      <h3 style={{ fontSize: '0.9rem', color: theme.textMuted, marginTop: '30px' }}>[ ARCHIVED_LEADS ]</h3>
                      {state.activeLeads.filter(l => l.resolved).length === 0 ? <p style={{color: theme.textMuted, fontSize: '0.85rem'}}>_NO ARCHIVED DATA.</p> : (
                        <ul style={{ listStyleType: 'none', paddingLeft: '0', lineHeight: '1.8', fontSize: '0.85rem' }}>
                          {state.activeLeads.filter(l => l.resolved).map(lead => <li key={lead.id} style={{ marginBottom: '10px', color: theme.textMuted, textDecoration: 'line-through' }}><strong>[X]</strong> {injectNarrative(lead.text).toUpperCase()}</li>)}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                {/* ========================================================== */}
                {/* 6.3b DUAL PANE: RIGHT SIDE (Action Execution) */}
                {/* ========================================================== */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxHeight: '75vh' }}>
                  
                  {currentTab === 'CURRENT_NODE' && (
                    <>
                      <h3 style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '15px' }}>[ AVAILABLE_ACTIONS ]</h3>
                      {(state.sectorEntropy[state.currentNode] || 0) >= 100 ? (
                        <div style={{ padding: '30px', backgroundColor: '#2a0808', border: `1px solid ${theme.accentRed}`, textAlign: 'center', animation: 'blink 2s infinite' }}>
                          <h3 style={{ color: theme.accentRed, letterSpacing: '4px', marginBottom: '15px' }}>! SECTOR COMPROMISED !</h3>
                          <p style={{ color: theme.textBright, fontSize: '0.9rem', lineHeight: '1.6' }}>
                            Logic fog density has reached critical mass. Malleus Inquisition squads are sweeping the perimeter. Further investigation is impossible. You must route to a new sector immediately.
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {availableChoices
                            .filter((choice: NarrativeChoice) => !choice.condition || choice.condition(state))
                            .map((choice: NarrativeChoice) => (
                              <button 
                                key={choice.id}
                                onClick={() => {
                                  choice.actions.forEach((action: GameAction) => {
                                    dispatch(action);
                                    if (action.type === 'GATHER_INTEL') addToast(`Log updated: ${formatNode(action.payload)}`, 'INTEL');
                                    else if (action.type === 'MODIFY_INVENTORY') addToast(`Received ${action.payload.amount > 0 ? '+' : ''}${action.payload.amount} ${formatNode(action.payload.itemId)}`, 'ITEM');
                                    else if (action.type === 'ADD_LEAD') addToast(`New Active Lead Added.`, 'ALERT');
                                    else if (action.type === 'ADVANCE_TIME') addToast(`Time advances. Local heat increases.`, 'ALERT');
                                    else if (action.type === 'MODIFY_SECTOR_ENTROPY') addToast(`Sector Heat modified by ${action.payload.amount}%.`, 'ALERT'); 
                                    else if (action.type === 'MODIFY_HUMANITY') addToast(`Humanity modified: ${action.payload > 0 ? '+' : ''}${action.payload}`, 'ALERT');
                                  });
                                }}
                                style={{ padding: '15px', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono, textAlign: 'left', fontSize: '1rem', transition: 'background-color 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#111'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.bgDark}
                              >
                                <span style={{ color: theme.textTerminal, marginRight: '10px' }}>$</span> {injectNarrative(choice.label)}
                              </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {currentTab === 'CODEX' && (
                    <>
                       {selectedGoetiaId ? (() => {
                         const target = allGoetia.find(g => g.id === selectedGoetiaId)!;
                         const hasAllIntel = target.requiredIntel?.every((tag: string) => state.intelLog.includes(tag));
                         const isIdentified = state.identifiedGoetia.includes(target.id);
                         const isSealed = state.sealedGoetia.includes(target.id);
                         const sealCost = target.sealCost || {};
                         const canAffordSeal = Object.keys(sealCost).length > 0 && (Object.entries(sealCost) as [string, number][]).every(([item, amount]) => (state.inventory[item] || 0) >= amount);

                         return (
                           <div>
                             <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', letterSpacing: '2px', color: theme.textBright }}>&gt; {isIdentified ? target.name.toUpperCase() : "TARGET_OBSCURED"}</h2>
                             {isIdentified ? <><p style={{ color: theme.textBright, fontWeight: 'bold', marginTop: '10px' }}>{target.title || "Classification Pending"} ({target.allegiance})</p><p style={{ lineHeight: '1.6' }}>{target.description || "No archival data available."}</p></> : <p style={{ lineHeight: '1.6', color: theme.textMuted }}>Identity hidden. Compile required intel to reveal the lieutenant's true nature.</p>}
                             
                             <div style={{ marginTop: '30px', padding: '15px', border: `1px dashed ${theme.borderTerminal}` }}>
                               <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: theme.textBright }}>&gt; REQUIRED_INTEL</h3>
                               <ul style={{ listStyleType: 'none', padding: 0 }}>
                                 {target.requiredIntel?.map((tag: string) => <li key={tag} style={{ color: state.intelLog.includes(tag) ? theme.textBright : theme.textMuted, marginBottom: '8px', fontSize: '0.85rem' }}>{state.intelLog.includes(tag) ? `[+] CONFIRMED: ${formatNode(tag)}` : `[-] MISSING_DATA_COMPONENT`}</li>) || <li style={{ color: theme.textMuted }}>_NO INTEL REQUIREMENTS DEFINED.</li>}
                               </ul>
                             </div>

                             {hasAllIntel && !isIdentified && (
                               <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                 <p style={{ color: theme.textBright, marginBottom: '15px' }}>_DATA SUFFICIENT. A PATTERN EMERGES.</p>
                                 <button onClick={() => { identifyGoetia(target.id); addToast(`Target Identity Confirmed: ${target.name}`, 'ALERT'); }} style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.textBright}`, cursor: 'pointer', fontFamily: theme.fontMono, letterSpacing: '2px' }}>&gt; IDENTIFY_ENTITY</button>
                               </div>
                             )}

                             {isIdentified && !isSealed && Object.keys(sealCost).length > 0 && (
                               <div style={{ marginTop: '30px', backgroundColor: theme.bgDark, padding: '20px', border: `1px solid ${theme.accentRed}` }}>
                                 <h3 style={{ marginTop: 0, color: theme.accentRed }}>&gt; REQUIRED_CATALYSTS</h3>
                                 <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.9rem' }}>
                                   {(Object.entries(sealCost) as [string, number][]).map(([item, amount]) => <li key={item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>{formatNode(item)} x{amount}</span><span style={{ color: (state.inventory[item] || 0) >= amount ? theme.textBright : theme.accentRed }}>(Have: {state.inventory[item] || 0})</span></li>)}
                                 </ul>
                                 <button onClick={() => setActiveSealTarget(target.id)} disabled={!canAffordSeal} style={{ padding: '10px', width: '100%', marginTop: '15px', backgroundColor: canAffordSeal ? '#3a0c0c' : '#111', color: canAffordSeal ? 'white' : theme.textMuted, border: 'none', cursor: canAffordSeal ? 'pointer' : 'not-allowed', fontFamily: theme.fontMono }}>{canAffordSeal ? "> INITIATE_SEALING_PROTOCOL" : "> INSUFFICIENT_MATERIALS"}</button>
                               </div>
                             )}

                             {isSealed && <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', color: theme.textBright, border: `1px solid ${theme.textBright}`, fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}><img src={`/seals/${target.id}.png`} alt="Goetian Seal" style={{ width: '120px', height: '120px', marginBottom: '20px', filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />[ TARGET_SEALED ]</div>}
                           
                             {/* --- THE BANISHMENT TRIGGER --- */}
                             {isSealed && target.allegiance && (
                               <button 
                                  onClick={() => setActiveBanishmentTarget(target.allegiance as 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH')} 
                                  style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: 'transparent', color: theme.accentRed, border: `1px dashed ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono, letterSpacing: '2px' }}
                               >
                                 &gt; INITIATE_{target.allegiance}_BANISHMENT
                               </button>
                             )}
                           </div>
                         );
                       })() : (
                         <div style={{ textAlign: 'center', marginTop: '100px' }}>
                           <p style={{ color: theme.textMuted }}>_AWAITING TARGET SELECTION.</p>
                         </div>
                       )}
                    </>
                  )}

                  {currentTab === 'INVENTORY' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; ITEM_ANALYSIS</h2>
                      {!selectedItemId ? <p style={{ color: theme.textMuted }}>_SELECT AN ITEM TO VIEW METADATA.</p> : selectedItemId === 'brass_vessel' ? (
                        <div style={{ marginTop: '20px' }}>
                          <h3 style={{ color: theme.textBright, fontSize: '1.2rem', marginBottom: '10px' }}>&gt; SOLOMONIC BRASS VESSEL</h3>
                          <p style={{ color: theme.textTerminal, lineHeight: '1.6' }}>An extradimensional containment unit inscribed with cryptographic wards. Used to securely isolate Goetian signatures.</p>
                          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: theme.bgDark, border: `1px solid ${theme.borderTerminal}`, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '10px' }}>CONTAINMENT CAPACITY STATUS</div>
                            <div style={{ fontSize: '2.5rem', color: theme.textBright, fontWeight: 'bold' }}>{state.sealedGoetia.length} <span style={{ fontSize: '1.5rem', color: theme.textMuted }}>/ 72</span></div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: '20px' }}>
                           <h3 style={{ color: theme.textBright, fontSize: '1.2rem', marginBottom: '10px', wordBreak: 'break-word' }}>&gt; {formatNode(selectedItemId)}</h3>
                           <p style={{ color: theme.textTerminal, lineHeight: '1.6' }}>Standard issue operative material or acquired local asset. Utilized in esoteric crafting, summoning, and environmental interaction.</p>
                           <div style={{ marginTop: '20px', padding: '15px', border: `1px dashed ${theme.borderTerminal}` }}><span style={{ color: theme.textMuted }}>CURRENT STOCK:</span> <strong style={{ color: theme.textBright, marginLeft: '10px' }}>{state.inventory[selectedItemId]}</strong></div>
                        </div>
                      )}
                    </>
                  )}

                  {currentTab === 'JOURNAL' && (
                    <>
                      <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; COMPILED_INTEL_DATABASE</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '0.9rem', color: theme.textTerminal, marginBottom: '15px' }}>[ DATA_FRAGMENTS ]</h3>
                          {state.intelLog.length === 0 ? <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>_NO INTEL ACQUIRED.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{state.intelLog.map((intel, idx) => <div key={idx} style={{ padding: '8px 12px', borderLeft: `2px solid ${theme.accentGreen}`, backgroundColor: theme.bgDark, color: theme.textBright, fontSize: '0.85rem' }}>&gt; {formatNode(intel)}</div>)}</div>}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '0.9rem', color: theme.textTerminal, marginBottom: '15px' }}>[ EVENT_REGISTRY ]</h3>
                          {Object.keys(state.flags).length === 0 ? <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>_NO SIGNIFICANT EVENTS RECORDED.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{Object.entries(state.flags).map(([flag, value]) => <div key={flag} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: theme.bgDark, border: `1px solid ${theme.borderTerminal}`, fontSize: '0.85rem' }}><span style={{ color: theme.textMuted }}>{formatNode(flag)}</span><span style={{ color: value ? theme.accentGreen : theme.accentRed, fontWeight: 'bold' }}>[{value ? 'TRUE' : 'FALSE'}]</span></div>)}</div>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* ================================================================== */}
      {/* 6.4 MODALS & TOAST OVERLAYS */}
      {/* ================================================================== */}
      {activeSealTarget && (() => {
        const target = allGoetia.find(g => g.id === activeSealTarget);
        if (!target) return null;
        return <SealingTerminal target={target} sealCost={target.sealCost || {}} onClose={() => setActiveSealTarget(null)} dispatch={dispatch} sealGoetia={sealGoetia} addToast={addToast} />;
      })()}

      {activeBanishmentTarget && (
        <BanishmentTerminal horseman={activeBanishmentTarget} state={state} dispatch={dispatch} onClose={() => setActiveBanishmentTarget(null)} addToast={addToast} />
      )}

      {/* --- TOAST NOTIFICATIONS OVERLAY --- */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            style={{ 
              pointerEvents: 'auto', // Allows clicking the dismiss button
              animation: 'slideInRight 0.3s ease-out forwards', 
              position: 'relative',
              backgroundColor: theme.bgPanel, 
              color: theme.textBright, 
              border: `1px solid ${theme.borderTerminal}`, 
              borderLeft: `4px solid ${toast.type === 'INTEL' ? theme.textTerminal : toast.type === 'ITEM' ? '#b8860b' : toast.type === 'SEAL' ? theme.textBright : theme.accentRed}`, 
              padding: '15px 30px 15px 20px', // Added right padding for the X button
              fontFamily: theme.fontMono, 
              fontSize: '0.9rem', 
              boxShadow: '0 4px 10px rgba(0,0,0,0.8)', 
              maxWidth: '350px' 
            }}
          >
            {/* MANUAL DISMISS BUTTON */}
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{ position: 'absolute', top: '5px', right: '5px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.8rem' }}
            >
              [X]
            </button>

            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: theme.textMuted, fontSize: '0.7rem', letterSpacing: '1px' }}>
              &gt; {toast.type === 'INTEL' ? 'SYS_UPDATE: INTEL' : toast.type === 'ITEM' ? 'SYS_UPDATE: STORAGE' : toast.type === 'SEAL' ? 'PROTOCOL_SUCCESS' : 'CRITICAL_ALERT'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return <button onClick={onClick} style={{ padding: '12px 15px', textAlign: 'left', backgroundColor: active ? theme.bgDark : 'transparent', color: active ? theme.textBright : theme.textMuted, border: 'none', borderLeft: active ? `4px solid ${theme.textBright}` : '4px solid transparent', cursor: 'pointer', fontFamily: theme.fontMono, letterSpacing: '1px', fontSize: '0.9rem', transition: 'all 0.2s', fontWeight: active ? 'bold' : 'normal' }}>&gt; {children}</button>;
}