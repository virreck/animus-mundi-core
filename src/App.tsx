// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useEngine } from './ui/hooks/useEngine';
import { allGoetia } from './content/goetia';
import { allYokai } from './content/yokai';
import type { GameAction } from './engine/reducer';
import type { GameState } from './engine/state';
import {
  PHENOMENON_CATALOG,
  ALTAR_RECIPES,
  generateSectorContract,
  type SectorContract,
  type SubGridNode
} from './engine/sectorGenerator';

// ============================================================================ //
// 1. TYPES, THEME & MACRO TOPOLOGY CONSTANTS
// ============================================================================ //
interface TerminalEntry {
  id: number;
  html: string;
  type: 'normal' | 'info' | 'system' | 'success' | 'warn' | 'error' | 'command';
}

type ViewportMode = 'FIELD_OPS' | 'CODEX' | 'KAGE_NO_SHO' | 'SAFEHOUSE_ALTAR';

const theme = {
  bgDark: '#050706',
  bgPanel: '#090d0a',
  borderTerminal: '#1f3d26',
  textTerminal: '#4a7c59',
  textBright: '#62f080',
  textMuted: '#2a5233',
  accentAmber: '#ffb800',
  accentRed: '#ff2a55',
  accentCyan: '#00f3ff',
  fontMono: '"JetBrains Mono", "Courier New", Courier, monospace',
};

const MACRO_SECTORS = [
  { id: 'caterham_churchyard', label: 'ST. LAWRENCE CRYPT', short: 'CRYPT-01', x: 0.24, y: 0.72, connections: ['safehouse', 'caterham_asylum'] },
  { id: 'safehouse', label: 'SYNDICATE SAFEHOUSE', short: 'SAFEHOUSE', x: 0.50, y: 0.50, connections: ['caterham_churchyard', 'caterham_asylum', 'malleus_precinct', 'thames_nexus'] },
  { id: 'caterham_asylum', label: 'CATERHAM ASYLUM', short: 'ASYLUM-GW', x: 0.78, y: 0.70, connections: ['caterham_churchyard', 'safehouse', 'malleus_precinct'] },
  { id: 'malleus_precinct', label: 'MALLEUS PRECINCT', short: 'PRECINCT', x: 0.76, y: 0.25, connections: ['safehouse', 'caterham_asylum'] },
  { id: 'thames_nexus', label: 'THAMES LEY-NEXUS', short: 'LEY-NEXUS', x: 0.22, y: 0.26, connections: ['safehouse'] }
];

// ============================================================================ //
// 2. PROCEDURAL WEB AUDIO API SYNTHESIZER
// ============================================================================ //
const ThaumaturgicAudio = {
  ctx: null as AudioContext | null,
  enabled: true,
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playTone(freq: number, type: OscillatorType = 'sine', duration = 0.08, vol = 0.06, slideTo: number | null = null) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch { /* ignore */ }
  },
  keyClick() { this.playTone(820 + Math.random() * 240, 'triangle', 0.025, 0.025); },
  scryPing() {
    this.playTone(1120, 'sine', 0.32, 0.08, 560);
    setTimeout(() => this.playTone(1490, 'sine', 0.22, 0.05), 110);
  },
  senseSweep() {
    [330, 440, 554, 659].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.07, 0.04), i * 50));
  },
  sealSuccess() {
    [440, 554.37, 659.25, 880].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.09), i * 65));
  },
  errorBuzz() { this.playTone(135, 'sawtooth', 0.24, 0.09, 80); }
};

// ============================================================================ //
// 3. PROCEDURAL SEAL GEOMETRY GENERATOR
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
  const nodes: { id: number; x: number; y: number }[] = [];
  const centerX = 50; const centerY = 50; const radius = 42;

  for (let i = 0; i < config.n; i++) {
    const angle = rotationOffset + (i * 2 * Math.PI) / config.n;
    nodes.push({ id: i, x: centerX + radius * Math.sin(angle), y: centerY - radius * Math.cos(angle) });
  }
  const sequence: number[] = [];
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
  const timeLimit = Math.ceil(edgeCount * 1.25);
  const prefix = isBound ? "BOUND_" : "LESSER_";
  return { id: `${prefix}${config.name}_PROTOCOL`, timeLimit, nodes, sequence };
}

// ============================================================================ //
// 4. BOOT & START SCREEN
// ============================================================================ //
const StartScreen = ({ onStart, onLoad }: { onStart: (name: string, portrait: string, agency: string) => void, onLoad: () => void }) => {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');

  const savedData = localStorage.getItem('thaumaturgic_os_save_v1');
  let savedOperative: string | null = null;
  if (savedData) {
    try { savedOperative = JSON.parse(savedData).playerName; } catch { /* ignore */ }
  }

  const handleInitiate = () => {
    ThaumaturgicAudio.scryPing();
    onStart(name.trim() || 'VERGIL', '/portraits/thaumaturge_m1.png', agency.trim() || 'DARKWIRE');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono }}>
      <div style={{ width: '540px', border: `1px solid ${theme.textBright}`, padding: '36px', backgroundColor: theme.bgPanel, boxShadow: `0 0 30px rgba(98, 240, 128, 0.12)` }}>
        <div style={{ fontSize: '0.72rem', color: theme.accentAmber, letterSpacing: '2px', marginBottom: '4px' }}>THAUMATURGIC OS // NET-OPS v4.09</div>
        <h1 style={{ margin: '0 0 12px 0', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '12px', letterSpacing: '3px', color: theme.textBright, fontSize: '1.5rem' }}>
          ANIMUS MUNDI: SEALS OF THE 4
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#a8ccaf', lineHeight: '1.5', marginBottom: '20px' }}>
          Infiltrate corrupted sector sub-grids, extract raw forensic anomalies, deduce the True Name of the Goetian Anchor in the Codex, synthesize catalysts at the Safehouse Altar, and bind the 72 Lieutenants before the Four Horsemen manifest.
        </p>

        {savedOperative && (
          <div style={{ marginBottom: '20px', padding: '14px', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgDark, textAlign: 'center' }}>
            <div style={{ color: theme.textMuted, fontSize: '0.72rem', marginBottom: '8px' }}>ACTIVE TETHER FOUND IN MEMORY:</div>
            <button onClick={() => { ThaumaturgicAudio.scryPing(); onLoad(); }} style={{ width: '100%', padding: '12px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px' }}>
              &gt; RESUME: OP_{savedOperative.toUpperCase()}
            </button>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', color: theme.textBright }}>&gt; OPERATIVE CALLSIGN:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VERGIL" style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, marginBottom: '14px', outline: 'none' }} />

          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', color: theme.textBright }}>&gt; NOCTURNAL SYNDICATE:</label>
          <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. DARKWIRE" style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, marginBottom: '20px', outline: 'none' }} />

          <button onClick={handleInitiate} style={{ width: '100%', padding: '14px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px' }}>
            INITIALIZE TETHER LINK //
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================ //
// 5. SEALING & BANISHMENT TERMINALS (WITH DEDUCTION VERIFICATION)
// ============================================================================ //
interface SealingTerminalProps {
  suspect: typeof allGoetia[0];
  actualAnchorId: string;
  sealCost: Record<string, number>;
  onClose: () => void;
  onSuccessSeal: (goetiaId: string) => void;
  dispatch: React.Dispatch<GameAction>;
  sealGoetia: (id: string) => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
  tetheredYokai: string[];
}

const SealingTerminal = ({ suspect, actualAnchorId, sealCost, onClose, onSuccessSeal, dispatch, sealGoetia, addToast, tetheredYokai }: SealingTerminalProps) => {
  const [matrix] = useState(() => generateSealMatrix());
  const [phase, setPhase] = useState<'AUTH' | 'WARDING' | 'COMPLETE' | 'MISIDENTIFIED'>('AUTH');
  const [nameInput, setNameInput] = useState('');

  const hasTimeBuff = tetheredYokai.includes('yokai_kamaitachi');
  const [timeLeft, setTimeLeft] = useState(matrix.timeLimit + (hasTimeBuff ? 5 : 0));

  const [path, setPath] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{x: number, y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          ThaumaturgicAudio.keyClick();
          return [...prevPath, targetNode.id];
        }
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
    if (nameInput.trim().toUpperCase() !== suspect.name.toUpperCase()) {
      ThaumaturgicAudio.errorBuzz();
      addToast("Vocalization mismatch! Type the exact True Name of your suspect.", "ALERT");
      dispatch({ type: 'MODIFY_HUMANITY', payload: -5 });
      return;
    }

    // Burn the catalysts on ritual commitment
    (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) =>
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } })
    );

    // Check if the player's deduction matches the actual Goetia haunting this sector!
    if (suspect.id !== actualAnchorId) {
      ThaumaturgicAudio.errorBuzz();
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 20 });
      dispatch({ type: 'MODIFY_HUMANITY', payload: -20 });
      setPhase('MISIDENTIFIED');
      addToast(`FALSE DEDUCTION! Entity rejected the seal of ${suspect.name}!`, 'ALERT');
      return;
    }

    ThaumaturgicAudio.scryPing();
    setPhase('WARDING');
  };

  const executeFinalSeal = (isClean: boolean) => {
    setIsCleanSeal(isClean);
    setPhase('COMPLETE');
    setCurrentPointer(null);
    sealGoetia(suspect.id);
    onSuccessSeal(suspect.id);
    if (isClean) {
      ThaumaturgicAudio.sealSuccess();
      addToast(`SEALING SUCCESSFUL. ${suspect.name} bound to Brass Vessel!`, 'SEAL');
    } else {
      ThaumaturgicAudio.errorBuzz();
      addToast(`RITUAL FRACTURE. Global Entropy spiked by 15%.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 15 });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ width: '480px', padding: '28px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, boxShadow: `0 0 30px rgba(98, 240, 128, 0.2)`, fontFamily: theme.fontMono, color: theme.textTerminal }}>
        <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '8px', color: theme.textBright }}>&gt; SOLOMONIC_VESSEL // SEALING_PROTOCOL</h3>

        {phase === 'AUTH' && (
          <form onSubmit={handleAuthSubmit}>
            <p style={{ fontSize: '0.8rem', marginBottom: '10px', lineHeight: '1.5' }}>
              HYPOTHESIS LOCKED: <strong style={{ color: theme.textBright }}>{suspect.name.toUpperCase()}</strong> ({suspect.rank} of {suspect.allegiance}).<br/>
              <span style={{ color: theme.accentAmber }}>WARNING: If this entity is NOT the true Anchor of the current Sector, your catalysts will burn and the backlash will spike Global Entropy (+20%).</span>
            </p>
            <input autoFocus type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder={`TYPE "${suspect.name.toUpperCase()}" TO COMMIT`} style={{ padding: '10px', width: '100%', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', textTransform: 'uppercase' }} />
            <button type="submit" style={{ marginTop: '12px', padding: '10px', width: '100%', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&gt; BURN CATALYSTS &amp; ENGAGE SEAL</button>
            <button type="button" onClick={onClose} style={{ marginTop: '8px', padding: '10px', width: '100%', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </form>
        )}

        {phase === 'MISIDENTIFIED' && (
          <div style={{ textAlign: 'center', padding: '15px 0' }}>
            <h2 style={{ color: theme.accentRed, letterSpacing: '3px', margin: '0 0 10px 0' }}>! FALSE TRUE-NAME BACKLASH !</h2>
            <p style={{ fontSize: '0.82rem', color: '#ffb3b3', lineHeight: '1.6' }}>
              You inscribed the seal of <strong>{suspect.name}</strong>, but the entity haunting this sector laughed through the static. Your catalysts vaporized in a violent backlash.<br/><br/>
              <strong>PENALTY:</strong> -20 Humanity | +20% Global Entropy.<br/>
              Extract more forensic logs in the field and re-verify the 3 Signs in your Codex!
            </p>
            <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: theme.fontMono }}>
              &gt; EMERGENCY DISCONNECT
            </button>
          </div>
        )}

        {phase === 'WARDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold' }}>TRUE NAME VERIFIED! TRACE SEAL:</span>
              <span style={{ color: timeLeft <= 5 ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <div style={{ position: 'relative', width: '280px', height: '280px', border: `1px solid ${theme.borderTerminal}`, backgroundColor: theme.bgDark, borderRadius: '50%', overflow: 'hidden' }}>
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                <polygon points={matrix.sequence.map(id => `${matrix.nodes.find(n => n.id === id)!.x},${matrix.nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={theme.borderTerminal} strokeWidth="0.6" />
                <polyline points={path.map((nodeId) => `${matrix.nodes.find(n => n.id === nodeId)!.x},${matrix.nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke={theme.textBright} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {currentPointer && path.length > 0 && path.length < matrix.sequence.length && (
                  <line x1={matrix.nodes.find(n => n.id === path[path.length - 1])!.x} y1={matrix.nodes.find(n => n.id === path[path.length - 1])!.y} x2={currentPointer.x} y2={currentPointer.y} stroke={theme.textTerminal} strokeWidth="1" strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
                )}
                {matrix.nodes.map((node) => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === matrix.sequence[path.length] || (path.length === 0 && node.id === matrix.sequence[0]);
                  return (
                    <g key={node.id} style={{ pointerEvents: 'none' }}>
                      <circle cx={node.x} cy={node.y} r={isNext ? "3.8" : "2.2"} fill={isCompleted ? theme.textBright : theme.bgDark} stroke={isNext ? theme.textBright : theme.textTerminal} strokeWidth="0.6" />
                      {isNext && <circle cx={node.x} cy={node.y} r="5.5" fill="none" stroke={theme.textBright} strokeWidth="0.5" style={{ animation: 'blink 1s infinite' }} />}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {phase === 'COMPLETE' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '15px 0' }}>
            <h2 style={{ color: theme.textBright, letterSpacing: '5px', margin: '0' }}>{suspect.name.toUpperCase()}</h2>
            <div style={{ color: theme.accentAmber, fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '4px', marginTop: '10px' }}>[SEALED IN BRASS VESSEL]</div>
            <p style={{ fontSize: '0.8rem', color: '#a8ccaf', marginTop: '10px' }}>
              +5% Banishment Probability toward <strong>{suspect.allegiance}</strong>. Bounty: +35 Obols awarded. A new Goetian Anchor has rotated into the sector.
            </p>
            {!isCleanSeal && <p style={{ color: theme.accentRed, fontSize: '0.78rem', marginTop: '8px' }}>! TIMER EXPIRED DURING TRACE: GLOBAL ENTROPY +15% !</p>}
            <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}>&gt; ACKNOWLEDGE &amp; DEPLOY NEW CONTRACT</button>
          </div>
        )}
      </div>
    </div>
  );
};

interface BanishmentTerminalProps {
  horseman: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH';
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onClose: () => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
  tetheredYokai: string[];
}

const BanishmentTerminal = ({ horseman, state, dispatch, onClose, addToast, tetheredYokai }: BanishmentTerminalProps) => {
  const [phase, setPhase] = useState<'LEDGER' | 'RITUAL' | 'RESOLUTION'>('LEDGER');
  const [matrices] = useState(() => [generateSealMatrix(), generateSealMatrix(), generateSealMatrix()]);
  const [currentMatrixIdx, setCurrentMatrixIdx] = useState(0);

  const hasTimeBuff = tetheredYokai.includes('yokai_kamaitachi');
  const [timeLeft, setTimeLeft] = useState(60 + (hasTimeBuff ? 15 : 0));

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
        ThaumaturgicAudio.scryPing();
        setCurrentMatrixIdx(prev => prev + 1);
        setPath([]);
        setCurrentPointer(null);
        addToast(`MATRIX ${currentMatrixIdx + 1}/3 LOCKED.`, 'SEAL');
      } else {
        const roll = Math.random() * 100;
        executeResolution(roll <= winProbability);
      }
    }
  }, [path.length, phase, currentMatrixIdx, matrices, winProbability]);

  const executeResolution = (success: boolean) => {
    setIsVictory(success);
    setPhase('RESOLUTION');
    if (success) {
      ThaumaturgicAudio.sealSuccess();
      dispatch({ type: 'SET_FLAG', payload: { flagId: `banished_${horseman.toLowerCase()}`, value: true } });
      addToast(`BANISHMENT SUCCESSFUL. ${horseman} severed from reality!`, 'SEAL');
    } else {
      ThaumaturgicAudio.errorBuzz();
      addToast(`RITUAL FRACTURE. GLOBAL ENTROPY +40%.`, 'ALERT');
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
        if (Math.sqrt(dx*dx + dy*dy) < 15) {
          ThaumaturgicAudio.keyClick();
          return [...prevPath, targetNode.id];
        }
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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ width: '560px', padding: '32px', backgroundColor: overrideTheme.bg, border: `2px solid ${overrideTheme.border}`, boxShadow: `0 0 50px rgba(255, 51, 51, 0.2)`, fontFamily: theme.fontMono, color: overrideTheme.text }}>
        {phase === 'LEDGER' && (
          <div>
            <h3 style={{ color: overrideTheme.bright, borderBottom: `1px solid ${overrideTheme.border}`, paddingBottom: '8px', marginTop: 0 }}>&gt; GRAND RITE OF BANISHMENT // {horseman}</h3>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Each sealed Goetia Lieutenant of {horseman} adds +5% to your Grand Rite stabilization roll (5% Base + {sealedCount} × 5%).</p>
            <div style={{ maxHeight: '170px', overflowY: 'auto', fontSize: '0.76rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', backgroundColor: 'black', padding: '10px', border: `1px solid ${overrideTheme.border}` }}>
              {lieutenants.map(g => {
                const isSealed = state.sealedGoetia.includes(g.id);
                return (
                  <div key={g.id} style={{ color: isSealed ? '#62f080' : overrideTheme.text }}>
                    #{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()} {isSealed ? '[SEALED]' : '[ACTIVE]'}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'black', border: `1px dashed ${overrideTheme.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: overrideTheme.text }}>CALCULATED BANISHMENT PROBABILITY</div>
              <div style={{ fontSize: '2.2rem', color: overrideTheme.bright, fontWeight: 'bold' }}>{winProbability}%</div>
            </div>
            <button onClick={() => setPhase('RITUAL')} style={{ width: '100%', padding: '14px', marginTop: '16px', backgroundColor: overrideTheme.bright, color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px' }}>&gt; COMMENCE TRIPLE-MATRIX ENDURANCE RITE</button>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', marginTop: '8px', backgroundColor: 'transparent', color: overrideTheme.text, border: `1px solid ${overrideTheme.text}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </div>
        )}
        {phase === 'RITUAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', fontWeight: 'bold' }}>
              <span style={{ color: overrideTheme.bright }}>MATRIX: {currentMatrixIdx + 1}/3</span>
              <span style={{ color: overrideTheme.bright }}>T-MINUS: {timeLeft}s</span>
            </div>
            <div style={{ position: 'relative', width: '310px', height: '310px', border: `2px solid ${overrideTheme.border}`, backgroundColor: 'black', borderRadius: '50%' }}>
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                <polygon points={matrices[currentMatrixIdx].sequence.map(id => `${matrices[currentMatrixIdx].nodes.find(n => n.id === id)!.x},${matrices[currentMatrixIdx].nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={overrideTheme.border} strokeWidth="0.6" strokeDasharray="1 3" />
                <polyline points={path.map((nodeId) => `${matrices[currentMatrixIdx].nodes.find(n => n.id === nodeId)!.x},${matrices[currentMatrixIdx].nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke={overrideTheme.bright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {matrices[currentMatrixIdx].nodes.map((node) => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === matrices[currentMatrixIdx].sequence[path.length] || (path.length === 0 && node.id === matrices[currentMatrixIdx].sequence[0]);
                  return <g key={node.id} style={{ pointerEvents: 'none' }}><circle cx={node.x} cy={node.y} r={isNext ? "4" : "2"} fill={isCompleted ? overrideTheme.bright : 'black'} stroke={isNext ? overrideTheme.bright : overrideTheme.border} strokeWidth="0.6" /></g>;
                })}
              </svg>
            </div>
          </div>
        )}
        {phase === 'RESOLUTION' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h1 style={{ color: isVictory ? 'white' : overrideTheme.bright, letterSpacing: '6px', fontSize: '2rem', margin: '0 0 15px 0' }}>
              {isVictory ? 'HORSEMAN BANISHED' : 'TETHER RUPTURE'}
            </h1>
            <p style={{ color: overrideTheme.text, lineHeight: '1.6', fontSize: '0.9rem' }}>
              {isVictory
                ? `The conceptual apex of ${horseman} has been permanently severed from mundane reality.`
                : `The Grand Rite fractured (${winProbability}% roll failed or timed out). Global Entropy spiked by +40%. Seal more Lieutenants before retrying!`}
            </p>
            <button onClick={onClose} style={{ padding: '12px 24px', marginTop: '25px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>&gt; RETURN TO OS</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================ //
// 6. MAIN 4-VIEWPORT OS COMPONENT
// ============================================================================ //
export default function App() {
  const { state, dispatch, draftContract, resetGame, sealGoetia, startInvestigation, loadGame, travelTo } = useEngine();

  // Viewport & Map Layer State
  const [viewport, setViewport] = useState<ViewportMode>('FIELD_OPS');
  const [mapViewMode, setMapViewMode] = useState<'SUB_GRID' | 'GEO_TRACKER'>('SUB_GRID');
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Procedural Sector Contracts Dictionary (Keyed by Sector ID)
  const [contracts, setContracts] = useState<Record<string, SectorContract>>({});

  // Codex Deduction State (Manual Phenomenon Toggles & Selected Suspect)
  const [deducedSigns, setDeducedSigns] = useState<string[]>([]);
  const [codexHorsemanFilter, setCodexHorsemanFilter] = useState<'ALL' | 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH'>('ALL');
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('01_bael');

  // Sealing & Banishment Modals
  const [activeSealSuspectId, setActiveSealSuspectId] = useState<string | null>(null);
  const [activeBanishmentTarget, setActiveBanishmentTarget] = useState<'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH' | null>(null);

  // CLI & Toasts
  const [terminalLines, setTerminalLines] = useState<TerminalEntry[]>([]);
  const [cliInput, setCliInput] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  // Canvas Refs
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const visualFxRef = useRef<{
    sonarRings: { x: number; y: number; r: number; alpha: number }[];
    angle: number;
    wavePhase: number;
  }>({ sonarRings: [], angle: 0, wavePhase: 0 });

  const formatLabel = (str: string) => str.replace(/_/g, ' ').toUpperCase();

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const appendLog = (html: string, type: TerminalEntry['type'] = 'normal') => {
    setTerminalLines(prev => [...prev, { id: Date.now() + Math.random(), html, type }]);
  };

  // Initialize starting kit & procedural sector contracts when investigation begins
  useEffect(() => {
    if (state.gameStage === 'ACTIVE' && Object.keys(contracts).length === 0) {
      const initialContracts: Record<string, SectorContract> = {};
      MACRO_SECTORS.filter(s => s.id !== 'safehouse').forEach(sec => {
        initialContracts[sec.id] = generateSectorContract(sec.id, sec.label, state.sealedGoetia);
      });
      setContracts(initialContracts);

      // Give new operatives starter salvage & Obols so the loop is immediately tactile
      if (Object.keys(state.inventory).length === 0) {
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 45 } });
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 2 } });
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'cursed_earth', amount: 2 } });
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'alchemical_distillate', amount: 2 } });
        dispatch({ type: 'SET_FLAG', payload: { flagId: 'kitsune_mask_found', value: true } });
        dispatch({ type: 'SET_FLAG', payload: { flagId: 'tengu_feather_found', value: true } });
      }

      appendLog(
        `<div style="border-left:2px solid #62f080;padding-left:10px;margin:4px 0;">` +
        `<div style="color:#62f080;font-weight:bold;">// THAUMATURGIC OS v4.09 ONLINE — OPERATION DIRECTIVE</div>` +
        `<div style="color:#a8ccaf;font-size:0.78rem;line-height:1.5;">` +
        `1. <strong>[F1] FIELD_OPS:</strong> Click room nodes on the Sub-Grid map. Use <code>PROBE</code> to detect ambushes, <code>BREACH</code> to enter rooms, and <code>EXTRACT</code> to gather raw forensic logs &amp; salvage.<br/>` +
        `2. <strong>[F2] GOETIAN_CODEX:</strong> Read your extracted forensic logs and manually toggle the matching Phenomenon filters to deduce which of the 72 Goetia is anchoring this sector.<br/>` +
        `3. <strong>[F3] KAGE_NO_SHO:</strong> Bind up to 2 Yokai intermediaries and trigger their active field powers.<br/>` +
        `4. <strong>[F4] SAFEHOUSE_ALTAR:</strong> Transmute raw salvage (Scrap Metal, Cursed Earth, Distillate) into the exact catalysts required to seal your deduced Goetia.` +
        `</div></div>`,
        'info'
      );
    }
  }, [state.gameStage, contracts, state.sealedGoetia, state.inventory, dispatch]);

  // Auto-scroll CLI
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Keyboard shortcuts F1 - F4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); setViewport('FIELD_OPS'); }
      if (e.key === 'F2') { e.preventDefault(); setViewport('CODEX'); }
      if (e.key === 'F3') { e.preventDefault(); setViewport('KAGE_NO_SHO'); }
      if (e.key === 'F4') { e.preventDefault(); setViewport('SAFEHOUSE_ALTAR'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentContract = contracts[state.currentNode];
  const currentSubNode = currentContract?.subNodes.find(n => n.id === currentContract.activeSubNodeId);
  const selectedSubNode = currentContract?.subNodes.find(n => n.id === currentContract.selectedSubNodeId);

  // --- SUB-GRID FIELD ACTIONS (PROBE, BREACH, EXTRACT, WARD) ---
  const handleProbeSubNode = (targetNode?: SubGridNode) => {
    if (!currentContract || !currentSubNode) return;
    const node = targetNode || selectedSubNode;
    if (!node) return;

    if (node.status !== 'LOCKED') {
      appendLog(`[i] Room <strong>${node.label}</strong> is already ${node.status}.`, 'system');
      return;
    }
    if (!currentSubNode.connections.includes(node.id)) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Cannot probe <strong>${node.label}</strong>—not adjacent to your current room (${currentSubNode.label}).`, 'error');
      return;
    }

    // Sensor / Bound Yokai discount: if any Yokai is bound, Probing costs 2 Humanity instead of 5
    const humCost = state.tetheredYokai.length > 0 ? 2 : 5;
    if (state.humanity <= humCost) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Insufficient Tether Stability (Humanity) to cast Auspex Probe.`, 'error');
      return;
    }

    ThaumaturgicAudio.scryPing();
    dispatch({ type: 'MODIFY_HUMANITY', payload: -humCost });
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 1.0 });

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === node.id ? { ...n, status: 'PROBED' as const } : n
    );
    setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, subNodes: updatedNodes } }));

    const sigDesc =
      node.nodeType === 'ANOMALY' ? '<span style="color:#62f080;">[ESOTERIC ANOMALY + SALVAGE]</span>' :
      node.nodeType === 'SHRINE' ? '<span style="color:#00f3ff;">[DORMANT KAMI SHRINE]</span>' :
      node.nodeType === 'AMBUSH' ? '<span style="color:#ff2a55;">[WARNING: MALLEUS INQUISITION HOUND PATROL!]</span>' :
      node.nodeType === 'ANCHOR' ? '<span style="color:#ffb800;">[GOETIAN CONDUIT ANCHOR]</span>' : '[MUNDANE ROOM]';

    appendLog(`[📡 AUSPEX PROBE] <strong>${node.label}</strong> (-${humCost} Humanity): Detected ${sigDesc}`, 'info');
  };

  const handleBreachSubNode = (targetNode?: SubGridNode) => {
    if (!currentContract || !currentSubNode) return;
    const node = targetNode || selectedSubNode;
    if (!node) return;

    const currentHeat = state.sectorEntropy[state.currentNode] || 0;
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] SECTOR LOCKDOWN (100% HEAT). Burn Obols to Ward or retreat to Safehouse!`, 'error');
      return;
    }

    if (node.id === currentSubNode.id) {
      appendLog(`[i] Already positioned inside <strong>${node.label}</strong>.`, 'system');
      return;
    }
    if (!currentSubNode.connections.includes(node.id)) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] <strong>${node.label}</strong> is not connected to ${currentSubNode.label}. Move through adjacent rooms.`, 'error');
      return;
    }

    ThaumaturgicAudio.senseSweep();
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 8, alpha: 1.0 });

    const wasLocked = node.status === 'LOCKED' || node.status === 'PROBED';
    let heatGain = wasLocked ? node.wardLevel * 8 : 2;

    // Ambush penalty if breaching an Ambush node!
    if (wasLocked && node.nodeType === 'AMBUSH') {
      heatGain += 18;
      dispatch({ type: 'MODIFY_HUMANITY', payload: -12 });
      appendLog(`[!] INQUISITION AMBUSH in <strong>${node.label}</strong>! Hounds lashed your tether (-12 Humanity, +${heatGain}% Heat)!`, 'error');
      addToast(`Inquisition Ambush! -12 Humanity`, 'ALERT');
    } else {
      appendLog(`[⚡ BREACH] Moved into <strong>${node.label}</strong> (+${heatGain}% Local Heat).`, 'info');
    }

    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: heatGain } });

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === node.id && (n.status === 'LOCKED' || n.status === 'PROBED') ? { ...n, status: 'BREACHED' as const } : n
    );

    setContracts(prev => ({
      ...prev,
      [currentContract.sectorId]: {
        ...currentContract,
        activeSubNodeId: node.id,
        selectedSubNodeId: node.id,
        subNodes: updatedNodes
      }
    }));
  };

  const handleExtractSubNode = () => {
    if (!currentContract || !currentSubNode) return;
    if (currentSubNode.status === 'EXTRACTED') {
      appendLog(`[i] <strong>${currentSubNode.label}</strong> has already been swept clean.`, 'system');
      return;
    }

    ThaumaturgicAudio.sealSuccess();
    const updatedLogs = [...currentContract.discoveredLogs];

    // 1. Forensic Phenomenon Report (Raw observation without spoiling the tag!)
    if (currentSubNode.forensicText) {
      const logEntry = {
        id: `${currentSubNode.id}_log`,
        nodeLabel: currentSubNode.label,
        text: currentSubNode.forensicText
      };
      updatedLogs.push(logEntry);
      appendLog(
        `<div style="background:rgba(98,240,128,0.07);border-left:3px solid #62f080;padding:8px 10px;margin:4px 0;">` +
        `<div style="color:#62f080;font-weight:bold;">[🔍 FORENSIC ANOMALY RECORDED AT ${currentSubNode.label}]</div>` +
        `<div style="color:#ffffff;margin-top:4px;">"${currentSubNode.forensicText}"</div>` +
        `<div style="color:#ffb800;font-size:0.72rem;margin-top:4px;">-&gt; Open <strong>[F2] GOETIAN_CODEX</strong> to cross-reference this phenomenon!</div>` +
        `</div>`,
        'success'
      );
      addToast(`Forensic Log Recorded! Check [F2] Codex.`, 'INTEL');
    }

    // 2. Kami Shrine Discovery (Unlocks Yokai in Kage-no-Sho)
    if (currentSubNode.nodeType === 'SHRINE' && currentSubNode.shrineYokaiId) {
      const yokai = allYokai.find(y => y.id === currentSubNode.shrineYokaiId);
      if (yokai && yokai.unlockFlag) {
        dispatch({ type: 'SET_FLAG', payload: { flagId: yokai.unlockFlag, value: true } });
        appendLog(`[⛩️ KAMI SHRINE AWAKENED] Discovered spirit relic for <strong style="color:#00f3ff;">${yokai.nameEn}</strong>! Available for binding in <strong>[F3] KAGE_NO_SHO</strong>.`, 'success');
        addToast(`Yokai Discovered: ${yokai.nameEn}`, 'SEAL');
      }
    }

    // 3. Raw Salvage & Obols Drop
    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      dispatch({ type: 'ADVANCE_TIME', payload: 2 });
      appendLog(`[📦 SALVAGE HARVESTED] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>. (Time +2 hrs)`, 'info');
    }

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === currentSubNode.id ? { ...n, status: 'EXTRACTED' as const } : n
    );

    setContracts(prev => ({
      ...prev,
      [currentContract.sectorId]: {
        ...currentContract,
        subNodes: updatedNodes,
        discoveredLogs: updatedLogs
      }
    }));
  };

  // Active Yokai Field Invocation
  const handleInvokeYokaiPower = (yokaiId: string) => {
    ThaumaturgicAudio.scryPing();
    if (yokaiId === 'yokai_kitsune' || yokaiId === 'yokai_noppera') {
      if ((state.inventory.obols || 0) < 10) {
        addToast(`Requires 10 Obols as tribute.`, 'ALERT');
        return;
      }
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -25 } });
      appendLog(`[👹 YOKAI INVOCATION] Illusory shroud deployed (-10 Obols). Local Sector Heat reduced by -25%!`, 'success');
      addToast(`Sector Heat -25%`, 'SEAL');
    } else {
      // Reveal all nodes on current sub-grid for 8 Humanity
      if (!currentContract) return;
      if (state.humanity <= 10) {
        addToast(`Requires 10 Humanity to invoke Astral Sight.`, 'ALERT');
        return;
      }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -8 });
      const revealedNodes = currentContract.subNodes.map(n =>
        n.status === 'LOCKED' ? { ...n, status: 'PROBED' as const } : n
      );
      setContracts(prev => ({
        ...prev,
        [currentContract.sectorId]: { ...currentContract, subNodes: revealedNodes }
      }));
      appendLog(`[👹 YOKAI INVOCATION] Astral Sight swept the entire sector (-8 Humanity). All room signatures revealed!`, 'success');
      addToast(`All Sub-Grid Nodes Revealed!`, 'INTEL');
    }
  };

  // --- CANVAS RENDERING LOOP (SUB-GRID OR MACRO GEO-TRACKER) ---
  useEffect(() => {
    if (state.gameStage !== 'ACTIVE' || viewport !== 'FIELD_OPS') return;
    let animId: number;

    const renderLoop = () => {
      const fx = visualFxRef.current;
      fx.angle += 0.025;
      const currentHeat = state.sectorEntropy[state.currentNode] || 0;
      fx.wavePhase += 0.14 + (currentHeat / 220);

      const canvas = mapCanvasRef.current;
      if (canvas) {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
          canvas.width = Math.floor(rect.width);
          canvas.height = Math.floor(rect.height);
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Tactical Grid
          ctx.strokeStyle = 'rgba(74, 124, 89, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
          for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

          // Expanding Sonar Rings
          for (let i = fx.sonarRings.length - 1; i >= 0; i--) {
            const sr = fx.sonarRings[i];
            sr.r += 4;
            sr.alpha -= 0.02;
            if (sr.alpha <= 0) { fx.sonarRings.splice(i, 1); continue; }
            ctx.beginPath();
            ctx.arc(sr.x * w, sr.y * h, sr.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(98, 240, 128, ${sr.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (mapViewMode === 'SUB_GRID' && currentContract) {
            // DRAW LOCAL SECTOR SUB-GRID (6 ROOMS)
            currentContract.subNodes.forEach(node => {
              node.connections.forEach(tid => {
                const target = currentContract.subNodes.find(n => n.id === tid);
                if (!target) return;
                ctx.beginPath();
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.strokeStyle = node.status !== 'LOCKED' && target.status !== 'LOCKED' ? 'rgba(98, 240, 128, 0.4)' : 'rgba(74, 124, 89, 0.22)';
                ctx.lineWidth = 1.6;
                ctx.stroke();
              });
            });

            currentContract.subNodes.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === currentContract.activeSubNodeId;
              const isSelected = node.id === currentContract.selectedSubNodeId;

              let color = '#ff2a55'; // LOCKED
              if (node.status === 'PROBED') {
                color = node.nodeType === 'AMBUSH' ? '#ff2a55' : node.nodeType === 'SHRINE' ? '#00f3ff' : '#ffb800';
              } else if (node.status === 'BREACHED') {
                color = '#ffb800';
              } else if (node.status === 'EXTRACTED') {
                color = '#62f080';
              }

              // Rotating Hex Shield
              ctx.save();
              ctx.translate(nx, ny);
              ctx.rotate(isCurrent ? fx.angle : -fx.angle * 0.5);
              ctx.beginPath();
              const r = isCurrent ? 20 : 15;
              for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
                else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
              }
              ctx.closePath();
              ctx.strokeStyle = isSelected ? '#ffffff' : color;
              ctx.lineWidth = isSelected ? 2.2 : 1.4;
              ctx.stroke();
              ctx.restore();

              // Core Dot
              ctx.beginPath();
              ctx.arc(nx, ny, 5, 0, Math.PI * 2);
              ctx.fillStyle = isCurrent ? '#62f080' : '#050706';
              ctx.fill();
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.stroke();

              // Room Label & Status
              ctx.font = 'bold 10px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = isSelected ? '#ffffff' : '#a8ccaf';
              ctx.fillText(node.label, nx, ny + 29);

              let subBadge = `[${node.status}]`;
              if (node.status === 'PROBED') {
                subBadge = node.nodeType === 'AMBUSH' ? '[! AMBUSH !]' : node.nodeType === 'SHRINE' ? '[SHRINE]' : node.nodeType === 'ANCHOR' ? '[ANCHOR]' : '[ANOMALY]';
              }
              ctx.font = '9px "Courier New", monospace';
              ctx.fillStyle = color;
              ctx.fillText(subBadge, nx, ny + 40);
            });
          } else {
            // DRAW MACRO GEO-TRACKER (5 SECTORS)
            MACRO_SECTORS.forEach(node => {
              node.connections.forEach(tid => {
                const target = MACRO_SECTORS.find(n => n.id === tid);
                if (!target) return;
                ctx.beginPath();
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.strokeStyle = 'rgba(74, 124, 89, 0.35)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });
            });

            MACRO_SECTORS.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === state.currentNode;
              const heat = state.sectorEntropy[node.id] || 0;
              const color = heat >= 75 ? '#ff2a55' : heat >= 35 ? '#ffb800' : '#62f080';

              ctx.beginPath();
              ctx.arc(nx, ny, isCurrent ? 14 : 10, 0, Math.PI * 2);
              ctx.fillStyle = '#050706';
              ctx.fill();
              ctx.strokeStyle = isCurrent ? '#ffffff' : color;
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.font = 'bold 10px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = isCurrent ? '#62f080' : '#a8ccaf';
              ctx.fillText(node.label, nx, ny + 26);
              ctx.font = '9px "Courier New", monospace';
              ctx.fillStyle = color;
              ctx.fillText(node.id === 'safehouse' ? '[SAFE ZONE]' : `HEAT: ${heat}%`, nx, ny + 37);
            });
          }
        }
      }

      // Render Waveform
      const waveCanvas = waveformCanvasRef.current;
      if (waveCanvas) {
        const ctx = waveCanvas.getContext('2d');
        if (ctx) {
          const w = waveCanvas.width;
          const h = waveCanvas.height;
          ctx.clearRect(0, 0, w, h);
          const amp = Math.min(h / 2 - 2, 3 + (currentHeat / 10));
          ctx.beginPath();
          ctx.strokeStyle = currentHeat >= 75 ? '#ff2a55' : currentHeat >= 35 ? '#ffb800' : '#62f080';
          ctx.lineWidth = 1.5;
          for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * 0.22 + fx.wavePhase) * amp * Math.sin(x * 0.05);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [state.gameStage, viewport, mapViewMode, currentContract, state.currentNode, state.sectorEntropy]);

  // Handle Canvas Clicks (Sub-Grid Room Selection or Macro Sector Travel)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (mapViewMode === 'SUB_GRID' && currentContract) {
      for (const node of currentContract.subNodes) {
        const nx = node.x * canvas.width;
        const ny = node.y * canvas.height;
        if (Math.hypot(mx - nx, my - ny) <= 28) {
          ThaumaturgicAudio.keyClick();
          setContracts(prev => ({
            ...prev,
            [currentContract.sectorId]: { ...currentContract, selectedSubNodeId: node.id }
          }));
          visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 0.9 });
          break;
        }
      }
    } else {
      for (const sec of MACRO_SECTORS) {
        const nx = sec.x * canvas.width;
        const ny = sec.y * canvas.height;
        if (Math.hypot(mx - nx, my - ny) <= 28) {
          ThaumaturgicAudio.scryPing();
          if (sec.id === 'safehouse') {
            travelTo('safehouse');
            setViewport('SAFEHOUSE_ALTAR');
          } else {
            travelTo(sec.id);
            setMapViewMode('SUB_GRID');
            appendLog(`[*] ROUTED TETHER TO SECTOR: <strong style="color:#62f080;">${sec.label}</strong>.`, 'info');
          }
          break;
        }
      }
    }
  };

  if (state.gameStage === 'START_SCREEN') {
    return <StartScreen onStart={startInvestigation} onLoad={loadGame} />;
  }

  const currentHeat = state.sectorEntropy[state.currentNode] || 0;
  const countByHorseman = (h: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH') =>
    allGoetia.filter(g => g.allegiance === h && state.sealedGoetia.includes(g.id)).length;

  // All Forensic Logs collected across all active sector contracts
  const allCollectedLogs = Object.values(contracts).flatMap(c =>
    c.discoveredLogs.map(l => ({ ...l, sectorLabel: c.sectorLabel }))
  );

  // Filtered Goetia in [F2] CODEX based on manual Phenomenon toggles & Horseman filter
  const filteredCodexGoetia = allGoetia.filter(g => {
    if (codexHorsemanFilter !== 'ALL' && g.allegiance !== codexHorsemanFilter) return false;
    if (deducedSigns.length === 0) return true;
    return deducedSigns.every(tag => g.requiredIntel.includes(tag));
  });

  const selectedSuspect = allGoetia.find(g => g.id === selectedSuspectId) || allGoetia[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, overflow: 'hidden', userSelect: 'none' }}>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes slideInRight { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .crt-scanlines {
          pointer-events: none; position: fixed; inset: 0; z-index: 50;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), radial-gradient(circle at center, transparent 65%, rgba(0, 5, 2, 0.6) 100%);
          background-size: 100% 3px, 100% 100%;
        }
        .macro-chip {
          background: rgba(98, 240, 128, 0.07); border: 1px solid #1f3d26; color: #62f080;
          padding: 5px 11px; font-family: inherit; font-size: 0.73rem; cursor: pointer; white-space: nowrap; transition: all 0.15s;
        }
        .macro-chip:hover:not(:disabled) { background: rgba(98, 240, 128, 0.2); border-color: #62f080; }
        .macro-chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .macro-chip-amber { background: rgba(255, 184, 0, 0.09); border-color: rgba(255, 184, 0, 0.45); color: #ffb800; }
        .macro-chip-danger { background: rgba(255, 42, 85, 0.12); border-color: rgba(255, 42, 85, 0.5); color: #ff2a55; }
        .viewport-tab {
          padding: 6px 14px; font-family: inherit; font-size: 0.76rem; font-weight: bold; letter-spacing: 1px;
          cursor: pointer; border: 1px solid #1f3d26; background: #060907; color: #4a7c59; transition: all 0.15s;
        }
        .viewport-tab.active {
          background: #62f080; color: #000000; border-color: #62f080; box-shadow: 0 0 12px rgba(98, 240, 128, 0.35);
        }
      `}</style>

      <div className="crt-scanlines" />

      {/* ================================================================== */}
      {/* TOP TACTICAL BAR: 4-VIEWPORT SWITCHER & APOCALYPSE TELEMETRY       */}
      {/* ================================================================== */}
      <header style={{ height: '48px', flexShrink: 0, backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', zIndex: 20 }}>
        {/* 4 Dedicated OS Viewport Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className={`viewport-tab ${viewport === 'FIELD_OPS' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('FIELD_OPS'); }}>
            [F1] FIELD_OPS
          </button>
          <button className={`viewport-tab ${viewport === 'CODEX' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('CODEX'); }}>
            [F2] GOETIAN_CODEX ({allCollectedLogs.length} LOGS)
          </button>
          <button className={`viewport-tab ${viewport === 'KAGE_NO_SHO' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('KAGE_NO_SHO'); }}>
            [F3] KAGE_NO_SHO ({state.tetheredYokai.length}/2)
          </button>
          <button className={`viewport-tab ${viewport === 'SAFEHOUSE_ALTAR' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('SAFEHOUSE_ALTAR'); }}>
            [F4] SAFEHOUSE_ALTAR
          </button>
        </div>

        {/* Right Telemetry: 4 Horsemen Progress, Humanity, Obols */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => {
            const isBanished = state.flags[`banished_${h.toLowerCase()}`];
            return (
              <button
                key={h}
                onClick={() => setActiveBanishmentTarget(h)}
                style={{ backgroundColor: isBanished ? '#132a19' : '#090d0a', border: `1px solid ${isBanished ? theme.textBright : theme.borderTerminal}`, color: isBanished ? theme.textBright : '#a8ccaf', padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: theme.fontMono }}
              >
                {h.slice(0, 3)}: <strong>{isBanished ? 'SEVERED' : `${countByHorseman(h)}/18`}</strong>
              </button>
            );
          })}

          <span style={{ padding: '4px 8px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: state.humanity < 40 ? theme.accentRed : theme.textBright }}>
            HUM: <strong>{state.humanity}%</strong>
          </span>

          <span style={{ padding: '4px 8px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentAmber, fontWeight: 'bold' }}>
            OBOLS: {state.inventory.obols || 0}
          </span>

          <button onClick={() => { ThaumaturgicAudio.enabled = !audioEnabled; setAudioEnabled(!audioEnabled); }} style={{ padding: '4px 8px', backgroundColor: 'transparent', border: `1px solid ${theme.borderTerminal}`, color: theme.textTerminal, cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.7rem' }}>
            {audioEnabled ? '🔊' : '🔇'}
          </button>

          <button onClick={resetGame} style={{ padding: '4px 8px', backgroundColor: '#2a0808', border: `1px solid ${theme.accentRed}`, color: theme.accentRed, cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.7rem' }}>
            RESET
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* VIEWPORT 1: [F1] FIELD_OPS (NIGHTFALL DUAL-PANE INFILTRATION)      */}
      {/* ================================================================== */}
      {viewport === 'FIELD_OPS' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '8px', padding: '8px' }}>

          {/* LEFT PANE: HEAT TELEMETRY, SUB-GRID / GEO-TRACKER MAP, YOKAI BAR */}
          <section style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>

            {/* 1. Heat & Entropy Waveform Bar */}
            <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '6px' }}>
                <span style={{ color: theme.textBright, fontWeight: 'bold' }}>
                  SECTOR: {currentContract?.sectorLabel || formatLabel(state.currentNode)} // ROOM: {currentSubNode?.label || 'SAFEHOUSE'}
                </span>
                <span style={{ color: currentHeat >= 75 ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>
                  LOCAL HEAT: {currentHeat}% | GLOBAL ENTROPY: {state.globalEntropy}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '10px', backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, padding: '1px' }}>
                  <div style={{ width: `${currentHeat}%`, height: '100%', backgroundColor: currentHeat >= 75 ? theme.accentRed : currentHeat >= 35 ? theme.accentAmber : theme.textBright, transition: 'width 0.25s' }} />
                </div>
                <canvas ref={waveformCanvasRef} width={96} height={22} style={{ backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, flexShrink: 0 }} />
              </div>
            </div>

            {/* 2. Interactive Sub-Grid / Geo-Tracker Canvas */}
            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, fontSize: '0.72rem' }}>
                <div style={{ backgroundColor: 'rgba(5,7,6,0.85)', padding: '4px 8px', border: `1px solid ${theme.borderTerminal}` }}>
                  <span style={{ color: theme.textMuted }}>VIEW: </span>
                  <strong style={{ color: theme.textBright }}>{mapViewMode === 'SUB_GRID' ? 'LOCAL 6-NODE SUB-GRID' : 'REGIONAL GEO-TRACKER'}</strong>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setMapViewMode('SUB_GRID')} className={`macro-chip ${mapViewMode === 'SUB_GRID' ? 'macro-chip-amber' : ''}`}>LOCAL SUB-GRID</button>
                  <button onClick={() => setMapViewMode('GEO_TRACKER')} className={`macro-chip ${mapViewMode === 'GEO_TRACKER' ? 'macro-chip-amber' : ''}`}>SECTOR MAP (TRAVEL)</button>
                </div>
              </div>

              <canvas ref={mapCanvasRef} onClick={handleCanvasClick} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />

              {/* Bottom Map Action Bar for Selected Room Node */}
              {mapViewMode === 'SUB_GRID' && selectedSubNode && (
                <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(5,7,6,0.92)', border: `1px solid ${theme.borderTerminal}`, padding: '8px 12px', zIndex: 10, fontSize: '0.74rem' }}>
                  <div>
                    <span style={{ color: theme.textMuted }}>TARGET ROOM: </span>
                    <strong style={{ color: theme.textBright }}>{selectedSubNode.label}</strong>
                    <span style={{ marginLeft: '8px', color: theme.accentAmber }}>[{selectedSubNode.status}]</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleProbeSubNode(selectedSubNode)}
                      disabled={selectedSubNode.status !== 'LOCKED'}
                      className="macro-chip"
                      title="Scan adjacent room for Ambushes or Anomalies before entering"
                    >
                      1. PROBE (-{state.tetheredYokai.length > 0 ? 2 : 5} HUM)
                    </button>
                    <button
                      onClick={() => handleBreachSubNode(selectedSubNode)}
                      disabled={selectedSubNode.id === currentSubNode?.id}
                      className="macro-chip macro-chip-amber"
                      title="Breach room ward and move operative inside"
                    >
                      2. BREACH &amp; ENTER
                    </button>
                    <button
                      onClick={handleExtractSubNode}
                      disabled={selectedSubNode.id !== currentSubNode?.id || currentSubNode?.status === 'EXTRACTED'}
                      className="macro-chip macro-chip-danger"
                      title="Extract forensic anomaly log & harvest raw salvage"
                    >
                      3. EXTRACT SIGN / LOOT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Active Yokai & Salvage Summary Strip */}
            <div style={{ height: '105px', flexShrink: 0, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '10px', display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.74rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.textBright, fontWeight: 'bold', marginBottom: '6px' }}>ACTIVE SHIKIGAMI TETHER ({state.tetheredYokai.length}/2)</div>
                {state.tetheredYokai.length === 0 ? (
                  <div style={{ color: theme.textMuted }}>No Yokai bound. Open <strong style={{ color: theme.textBright }}>[F3] KAGE_NO_SHO</strong> to bind spirits.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {state.tetheredYokai.map(yid => {
                      const y = allYokai.find(item => item.id === yid);
                      return (
                        <div key={yid} style={{ flex: 1, padding: '6px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: theme.textBright, fontWeight: 'bold' }}>{y?.nameEn}</span>
                          <button onClick={() => handleInvokeYokaiPower(yid)} className="macro-chip macro-chip-amber">INVOKE</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ width: '250px', borderLeft: `1px dashed ${theme.borderTerminal}`, paddingLeft: '12px' }}>
                <div style={{ color: theme.accentAmber, fontWeight: 'bold', marginBottom: '4px' }}>RAW SALVAGE IN STORAGE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scrap Metal:</span> <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cursed Earth:</span> <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Alch. Distillate:</span> <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></div>
              </div>
            </div>

          </section>

          {/* RIGHT PANE: FIELD FORENSIC CLI & DIRECTIVE CONTROLS */}
          <section style={{ width: '50%', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, overflow: 'hidden' }}>
            <div style={{ height: '32px', backgroundColor: '#040805', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', flexShrink: 0 }}>
              <span><strong style={{ color: theme.textBright }}>● FIELD TELEMETRY</strong> // {currentContract?.sectorLabel} ({currentContract?.discoveredLogs.length || 0} Forensic Logs Extracted)</span>
              <span style={{ color: theme.accentAmber }}>VESSEL: {state.sealedGoetia.length}/72 SEALED</span>
            </div>

            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', fontSize: '0.81rem', lineHeight: '1.55', backgroundColor: '#030504', userSelect: 'text' }}>
              {terminalLines.map(line => {
                const colorMap = { normal: '#a8ccaf', info: '#62f080', system: '#4a7c59', success: '#62f080', warn: '#ffb800', error: '#ff2a55', command: '#ffffff' };
                return <div key={line.id} style={{ color: colorMap[line.type], marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: line.html }} />;
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* Tactical Field Macro Bar */}
            <div style={{ backgroundColor: '#050906', borderTop: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => handleProbeSubNode()} className="macro-chip">📡 Probe Target Room</button>
              <button onClick={() => handleBreachSubNode()} className="macro-chip macro-chip-amber">⚡ Breach Target Room</button>
              <button onClick={handleExtractSubNode} className="macro-chip macro-chip-danger">🔍 Extract Forensic Sign</button>
              <button onClick={() => setViewport('CODEX')} className="macro-chip">📖 Open Codex ([F2])</button>
              <button onClick={() => setViewport('SAFEHOUSE_ALTAR')} className="macro-chip">⚗️ Craft Catalysts ([F4])</button>
            </div>

            {/* CLI Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                const cmd = cliInput.trim().toLowerCase();
                if (!cmd) return;
                setCliInput('');
                appendLog(`<span style="color:#62f080;">root@operative:~#</span> ${cmd}`, 'command');
                if (cmd === 'probe') handleProbeSubNode();
                else if (cmd === 'breach') handleBreachSubNode();
                else if (cmd === 'extract') handleExtractSubNode();
                else if (cmd === 'codex') setViewport('CODEX');
                else if (cmd === 'kage') setViewport('KAGE_NO_SHO');
                else if (cmd === 'altar' || cmd === 'safehouse') setViewport('SAFEHOUSE_ALTAR');
                else if (cmd === 'clear') setTerminalLines([]);
                else appendLog(`Commands: <code>probe</code>, <code>breach</code>, <code>extract</code>, <code>codex</code>, <code>kage</code>, <code>altar</code>, <code>clear</code>.`, 'system');
              }}
              style={{ height: '40px', backgroundColor: '#000', borderTop: `1px solid ${theme.borderTerminal}`, padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>root@os:~#</span>
              <input value={cliInput} onChange={e => setCliInput(e.target.value)} placeholder="Type probe, breach, extract, codex, kage, altar..." style={{ flex: 1, backgroundColor: 'transparent', color: theme.textBright, border: 'none', outline: 'none', fontFamily: theme.fontMono, fontSize: '0.8rem' }} />
              <button type="submit" className="macro-chip">EXEC</button>
            </form>
          </section>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 2: [F2] GOETIAN_CODEX (DEDICATED DEDUCTION MATRIX)        */}
      {/* ================================================================== */}
      {viewport === 'CODEX' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '10px', padding: '10px' }}>

          {/* LEFT COLUMN (34%): EXTRACTED FORENSIC LOGS & PHENOMENON CHECKLIST */}
          <section style={{ width: '34%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            {/* Extracted Field Logs */}
            <div style={{ height: '42%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>1. EXTRACTED FIELD FORENSIC LOGS</span>
                <span style={{ color: theme.accentAmber }}>{currentContract?.sectorLabel}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.76rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!currentContract || currentContract.discoveredLogs.length === 0) ? (
                  <div style={{ color: theme.textMuted, fontStyle: 'italic' }}>
                    No forensic logs extracted in {currentContract?.sectorLabel || 'this sector'} yet. Return to [F1] FIELD_OPS, breach anomalous rooms, and click EXTRACT SIGN.
                  </div>
                ) : (
                  currentContract.discoveredLogs.map((log, i) => (
                    <div key={log.id} style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.textBright}` }}>
                      <div style={{ color: theme.accentAmber, fontWeight: 'bold', fontSize: '0.7rem' }}>CLUE #{i + 1} // {log.nodeLabel}</div>
                      <div style={{ color: '#ffffff', marginTop: '3px' }}>"{log.text}"</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Phenomenon Deduction Toggles */}
            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
                <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem' }}>2. DEDUCE PHENOMENA ({deducedSigns.length}/3)</span>
                {deducedSigns.length > 0 && (
                  <button onClick={() => setDeducedSigns([])} className="macro-chip macro-chip-danger" style={{ padding: '2px 8px' }}>CLEAR FILTERS</button>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#a8ccaf', margin: '0 0 8px 0' }}>
                Read the forensic logs above and toggle the matching esoteric phenomena below to filter the 72 Goetia suspects:
              </p>
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {PHENOMENON_CATALOG.map(phenom => {
                  const isChecked = deducedSigns.includes(phenom.tag);
                  return (
                    <button
                      key={phenom.tag}
                      onClick={() => {
                        ThaumaturgicAudio.keyClick();
                        setDeducedSigns(prev =>
                          prev.includes(phenom.tag) ? prev.filter(t => t !== phenom.tag) : [...prev, phenom.tag]
                        );
                      }}
                      style={{
                        padding: '6px 8px',
                        textAlign: 'left',
                        backgroundColor: isChecked ? 'rgba(98, 240, 128, 0.2)' : '#030504',
                        border: `1px solid ${isChecked ? theme.textBright : theme.borderTerminal}`,
                        color: isChecked ? theme.textBright : '#a8ccaf',
                        cursor: 'pointer',
                        fontFamily: theme.fontMono,
                        fontSize: '0.7rem'
                      }}
                    >
                      {isChecked ? '[X] ' : '[ ] '} {phenom.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CENTER COLUMN (34%): MATCHING SUSPECT LIST (72 GOETIA) */}
          <section style={{ width: '34%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem' }}>3. MATCHING GOETIA ({filteredCodexGoetia.length}/72)</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => setCodexHorsemanFilter(h)}
                    className={`macro-chip ${codexHorsemanFilter === h ? 'macro-chip-amber' : ''}`}
                    style={{ padding: '2px 6px', fontSize: '0.66rem' }}
                  >
                    {h === 'ALL' ? 'ALL' : h.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredCodexGoetia.map(g => {
                const isSealed = state.sealedGoetia.includes(g.id);
                const isSelected = g.id === selectedSuspectId;
                return (
                  <button
                    key={g.id}
                    onClick={() => { ThaumaturgicAudio.keyClick(); setSelectedSuspectId(g.id); }}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      backgroundColor: isSelected ? '#112217' : '#030504',
                      border: `1px solid ${isSelected ? theme.textBright : theme.borderTerminal}`,
                      color: isSealed ? theme.textMuted : theme.textBright,
                      cursor: 'pointer',
                      fontFamily: theme.fontMono,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>#{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()}</strong>
                      <div style={{ fontSize: '0.68rem', color: '#a8ccaf' }}>{g.rank} of {g.allegiance} — {g.title}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: isSealed ? theme.textBright : theme.accentAmber }}>
                      {isSealed ? '[SEALED]' : '[INSPECT]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* RIGHT COLUMN (32%): SUSPECT DOSSIER & SEALING COMMITMENT */}
          <section style={{ width: '32%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: theme.accentAmber, letterSpacing: '1px' }}>
                ARS GOETIA DOSSIER // #{selectedSuspect.manifestId.toString().padStart(2, '0')} ({selectedSuspect.allegiance})
              </div>
              <h2 style={{ margin: '4px 0 4px 0', color: theme.textBright, letterSpacing: '2px' }}>
                {selectedSuspect.name.toUpperCase()}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 'bold', marginBottom: '12px' }}>
                {selectedSuspect.rank} — "{selectedSuspect.title}"
              </div>
              <p style={{ fontSize: '0.8rem', color: '#a8ccaf', lineHeight: '1.6', padding: '10px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}` }}>
                {selectedSuspect.description}
              </p>

              {/* Known Signs of this Goetia */}
              <div style={{ marginTop: '16px', padding: '12px', border: `1px dashed ${theme.borderTerminal}`, backgroundColor: '#030504' }}>
                <div style={{ fontSize: '0.76rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '8px' }}>
                  KNOWN MANIFESTATION SIGNS:
                </div>
                {selectedSuspect.requiredIntel.map(tag => {
                  const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
                  const isToggled = deducedSigns.includes(tag);
                  return (
                    <div key={tag} style={{ fontSize: '0.76rem', marginBottom: '6px', color: isToggled ? theme.textBright : '#a8ccaf' }}>
                      {isToggled ? '✓ ' : '• '} <strong>{def?.label || formatLabel(tag)}</strong>
                    </div>
                  );
                })}
              </div>

              {/* Required Binding Catalysts */}
              <div style={{ marginTop: '16px', padding: '12px', border: `1px solid ${theme.accentRed}`, backgroundColor: '#030504' }}>
                <div style={{ fontSize: '0.76rem', color: theme.accentRed, fontWeight: 'bold', marginBottom: '8px' }}>
                  REQUIRED BINDING CATALYSTS:
                </div>
                {Object.entries(selectedSuspect.sealCost || {}).map(([item, amt]) => {
                  const have = state.inventory[item] || 0;
                  return (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                      <span style={{ color: '#ffffff' }}>{formatLabel(item)} x{amt}</span>
                      <span style={{ color: have >= amt ? theme.textBright : theme.accentRed, fontWeight: 'bold' }}>
                        (In Storage: {have}/{amt})
                      </span>
                    </div>
                  );
                })}
                <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: '6px' }}>
                  Missing catalysts? Synthesize them from raw salvage in <strong>[F4] SAFEHOUSE_ALTAR</strong>.
                </div>
              </div>
            </div>

            {/* Initiate Sealing Trigger */}
            {state.sealedGoetia.includes(selectedSuspect.id) ? (
              <div style={{ padding: '14px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold', letterSpacing: '2px' }}>
                [ ENTITY ALREADY SEALED IN VESSEL ]
              </div>
            ) : (
              <div>
                {(() => {
                  const sealCost = selectedSuspect.sealCost || {};
                  const canAfford = Object.entries(sealCost).every(([item, amt]) => (state.inventory[item] || 0) >= amt);
                  return (
                    <button
                      onClick={() => setActiveSealSuspectId(selectedSuspect.id)}
                      disabled={!canAfford}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: canAfford ? theme.accentRed : '#1a1a1a',
                        color: canAfford ? 'white' : theme.textMuted,
                        border: 'none',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        fontFamily: theme.fontMono,
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        fontSize: '0.82rem'
                      }}
                    >
                      {canAfford
                        ? `> ENGAGE SEALING RITE: ${selectedSuspect.name.toUpperCase()}`
                        : `> SYNTHESIZE CATALYSTS IN [F4] ALTAR FIRST`}
                    </button>
                  );
                })()}
              </div>
            )}
          </section>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 3: [F3] KAGE_NO_SHO (SPIRIT COMPENDIUM & TETHER SLOTS)    */}
      {/* ================================================================== */}
      {viewport === 'KAGE_NO_SHO' && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px' }}>
          {/* Top Bar: Active Rule-of-Two Tether Slots */}
          <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.9rem' }}>KAGE-NO-SHO // THE BOOK OF SHADOWS (RULE OF TWO)</div>
              <div style={{ color: '#a8ccaf', fontSize: '0.76rem', marginTop: '3px' }}>
                You may bind up to 2 Yokai intermediaries simultaneously. Discover new Yokai by extracting Dormant Kami Shrines in the field, or purchase Esoteric Ink below.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.accentCyan, fontSize: '0.82rem', fontWeight: 'bold' }}>ESOTERIC INK: {state.ink || 0}</span>
              <button
                onClick={() => {
                  if ((state.inventory.obols || 0) >= 10) {
                    ThaumaturgicAudio.keyClick();
                    dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } });
                    dispatch({ type: 'LOAD_GAME', payload: { ...state, inventory: { ...state.inventory, obols: (state.inventory.obols || 0) - 10 }, ink: (state.ink || 0) + 1 } });
                    addToast(`Purchased +1 Esoteric Ink`, 'ITEM');
                  } else {
                    addToast(`Requires 10 Obols to distill Esoteric Ink.`, 'ALERT');
                  }
                }}
                className="macro-chip macro-chip-amber"
              >
                + DISTILL ESOTERIC INK (-10 OBOLS)
              </button>
            </div>
          </div>

          {/* Grid of All 8 Tactical Yokai */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {allYokai.map(yokai => {
              const isBound = state.tetheredYokai.includes(yokai.id);
              const cost = yokai.draftCost;
              const canAfford = (!cost.obols || (state.inventory.obols || 0) >= cost.obols) && (!cost.humanity || state.humanity > cost.humanity) && (!cost.ink || (state.ink || 0) >= cost.ink);
              const costStr = [cost.obols ? `${cost.obols} Obols` : '', cost.humanity ? `${cost.humanity} Humanity` : '', cost.ink ? `${cost.ink} Ink` : ''].filter(Boolean).join(' + ');

              return (
                <div key={yokai.id} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBound ? theme.textBright : theme.borderTerminal}`, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: theme.accentAmber, letterSpacing: '1px' }}>{yokai.utilityClass.toUpperCase()}</span>
                      {isBound && <span style={{ fontSize: '0.68rem', backgroundColor: theme.textBright, color: 'black', padding: '1px 6px', fontWeight: 'bold' }}>BOUND</span>}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', color: theme.textBright, fontSize: '0.95rem' }}>{yokai.nameEn}</h3>
                    <p style={{ fontSize: '0.76rem', color: '#ffffff', lineHeight: '1.5' }}>{yokai.gameUtility}</p>
                    <p style={{ fontSize: '0.7rem', color: theme.textMuted, fontStyle: 'italic', marginTop: '8px' }}>"{yokai.costDescription}"</p>
                  </div>

                  <div style={{ marginTop: '12px', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.74rem', color: theme.accentRed, fontWeight: 'bold', marginBottom: '8px' }}>
                      PACT COST: {costStr}
                    </div>
                    <button
                      onClick={() => {
                        if (isBound) return;
                        ThaumaturgicAudio.sealSuccess();
                        draftContract(yokai.id, yokai.draftCost);
                        addToast(`Bound ${yokai.nameEn} to Tether!`, 'SEAL');
                      }}
                      disabled={isBound || !canAfford}
                      className="macro-chip"
                      style={{ width: '100%', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}
                    >
                      {isBound ? 'ACTIVE ON TETHER' : canAfford ? '> FORGE PACT & BIND' : '> INSUFFICIENT TRIBUTE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 4: [F4] SAFEHOUSE_ALTAR (SYNTHESIS, RECOVERY & WARDING)   */}
      {/* ================================================================== */}
      {viewport === 'SAFEHOUSE_ALTAR' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '10px', padding: '12px' }}>

          {/* LEFT PANE (62%): ALTAR OF ALCHEMICAL SYNTHESIS */}
          <section style={{ width: '62%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px', marginBottom: '10px' }}>
              <div>
                <h2 style={{ margin: 0, color: theme.textBright, fontSize: '1rem', letterSpacing: '2px' }}>&gt; ALTAR OF ALCHEMICAL SYNTHESIS</h2>
                <div style={{ fontSize: '0.74rem', color: '#a8ccaf', marginTop: '2px' }}>
                  Transmute raw field salvage into refined Solomonic catalysts required to seal your deduced Goetia.
                  {state.tetheredYokai.includes('yokai_kameosa') && <span style={{ color: theme.accentAmber }}> [KAMEOSA ACTIVE: 0 Obol Cost, -2 Humanity per craft!]</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', backgroundColor: '#030504', padding: '6px 10px', border: `1px solid ${theme.borderTerminal}` }}>
                <span>Metal: <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></span>
                <span>Earth: <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></span>
                <span>Distillate: <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ALTAR_RECIPES.map(recipe => {
                const isKameosa = state.tetheredYokai.includes('yokai_kameosa');
                const effObolCost = isKameosa ? 0 : recipe.obolCost;
                const haveRaw = state.inventory[recipe.rawMaterialId] || 0;
                const haveObols = state.inventory.obols || 0;
                const canCraft = haveRaw >= recipe.rawAmount && haveObols >= effObolCost && (!isKameosa || state.humanity > 2);
                const ownedOutput = state.inventory[recipe.outputId] || 0;

                return (
                  <div key={recipe.outputId} style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: theme.textBright, fontSize: '0.82rem' }}>{recipe.label.toUpperCase()}</strong>
                        <span style={{ color: theme.accentAmber, fontSize: '0.72rem' }}>OWNED: x{ownedOutput}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a8ccaf', margin: '4px 0 8px 0' }}>{recipe.desc}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: theme.textMuted }}>
                        Req: {recipe.rawAmount}x {formatLabel(recipe.rawMaterialId)} + {isKameosa ? '2 HUM' : `${effObolCost} Obols`}
                      </span>
                      <button
                        onClick={() => {
                          ThaumaturgicAudio.scryPing();
                          dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: recipe.rawMaterialId, amount: -recipe.rawAmount } });
                          if (isKameosa) dispatch({ type: 'MODIFY_HUMANITY', payload: -2 });
                          else dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -effObolCost } });
                          dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: recipe.outputId, amount: 1 } });
                          addToast(`Synthesized +1 ${recipe.label}`, 'ITEM');
                        }}
                        disabled={!canCraft}
                        className="macro-chip macro-chip-amber"
                      >
                        SYNTHESIZE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT PANE (38%): TETHER RECOVERY & REMOTE SECTOR WARDING */}
          <section style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Hearth Recovery */}
            <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: theme.textBright, fontSize: '0.9rem' }}>&gt; SAFEHOUSE HEARTH // TETHER ALIGNMENT</h3>
              <p style={{ fontSize: '0.76rem', color: '#a8ccaf', lineHeight: '1.5' }}>
                Rest inside the brass-warded safehouse to restore +30 Humanity. Resting advances time (+4% Heat across active sectors).
              </p>
              <button
                onClick={() => {
                  ThaumaturgicAudio.sealSuccess();
                  dispatch({ type: 'MODIFY_HUMANITY', payload: 30 });
                  dispatch({ type: 'ADVANCE_TIME', payload: 4 });
                  addToast(`Tether Restored (+30 Humanity). Time advanced.`, 'SEAL');
                }}
                disabled={state.humanity >= 100}
                className="macro-chip"
                style={{ width: '100%', padding: '10px', marginTop: '8px', fontWeight: 'bold' }}
              >
                &gt; REST &amp; REALIGN TETHER (+30 HUMANITY)
              </button>
            </div>

            {/* Remote Sector Heat Suppression */}
            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 8px 0', color: theme.textBright, fontSize: '0.9rem' }}>&gt; REMOTE SECTOR WARDING // HEAT TRIAGE</h3>
              <p style={{ fontSize: '0.75rem', color: '#a8ccaf', marginBottom: '12px' }}>
                Burn 20 Obols to jam Malleus Inquisition direction-finders in a hot sector (-30% Local Heat).
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MACRO_SECTORS.filter(s => s.id !== 'safehouse').map(sec => {
                  const heat = state.sectorEntropy[sec.id] || 0;
                  return (
                    <div key={sec.id} style={{ padding: '10px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: theme.textBright, fontSize: '0.78rem' }}>{sec.label}</strong>
                        <div style={{ fontSize: '0.72rem', color: heat >= 75 ? theme.accentRed : theme.accentAmber }}>HEAT: {heat}%</div>
                      </div>
                      <button
                        onClick={() => {
                          ThaumaturgicAudio.scryPing();
                          dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -20 } });
                          dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: sec.id, amount: -30 } });
                          addToast(`Suppressed -30% Heat in ${sec.label}`, 'SEAL');
                        }}
                        disabled={heat === 0 || (state.inventory.obols || 0) < 20}
                        className="macro-chip macro-chip-danger"
                      >
                        WARD (-20 OBOLS)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ================================================================== */}
      {/* SEALING & BANISHMENT MODALS + TOASTS                               */}
      {/* ================================================================== */}
      {activeSealSuspectId && (() => {
        const suspect = allGoetia.find(g => g.id === activeSealSuspectId);
        if (!suspect) return null;
        const actualAnchorId = currentContract?.targetGoetiaId || suspect.id;
        return (
          <SealingTerminal
            suspect={suspect}
            actualAnchorId={actualAnchorId}
            sealCost={suspect.sealCost || {}}
            onClose={() => setActiveSealSuspectId(null)}
            onSuccessSeal={(sealedId) => {
              // Award Obol bounty & rotate a fresh Goetia contract into the sector!
              dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 35 } });
              dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -40 } });
              setDeducedSigns([]);
              if (currentContract) {
                const nextContract = generateSectorContract(
                  currentContract.sectorId,
                  currentContract.sectorLabel,
                  [...state.sealedGoetia, sealedId]
                );
                setContracts(prev => ({ ...prev, [currentContract.sectorId]: nextContract }));
              }
            }}
            dispatch={dispatch}
            sealGoetia={sealGoetia}
            addToast={addToast}
            tetheredYokai={state.tetheredYokai}
          />
        );
      })()}

      {activeBanishmentTarget && (
        <BanishmentTerminal
          horseman={activeBanishmentTarget}
          state={state}
          dispatch={dispatch}
          onClose={() => setActiveBanishmentTarget(null)}
          addToast={addToast}
          tetheredYokai={state.tetheredYokai}
        />
      )}

      <div style={{ position: 'fixed', bottom: '50px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              animation: 'slideInRight 0.25s ease-out forwards',
              backgroundColor: theme.bgPanel,
              color: theme.textBright,
              border: `1px solid ${theme.borderTerminal}`,
              borderLeft: `4px solid ${toast.type === 'INTEL' ? theme.textBright : toast.type === 'ITEM' ? theme.accentAmber : theme.accentRed}`,
              padding: '10px 16px',
              fontFamily: theme.fontMono,
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.85)',
              maxWidth: '320px'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}