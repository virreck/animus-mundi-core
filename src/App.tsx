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
// 1. TYPES, THEME & 16-SECTOR CAMPAIGN TOPOLOGY
// ============================================================================ //
interface TerminalEntry {
  id: number;
  html: string;
  type: 'normal' | 'info' | 'system' | 'success' | 'warn' | 'error' | 'command';
}

type ViewportMode = 'FIELD_OPS' | 'CODEX' | 'KAGE_NO_SHO' | 'SAFEHOUSE_ALTAR' | 'HORSEMEN' | 'DOSSIER' | 'MANUAL';
type FontScale = 'SM' | 'MD' | 'LG';

const FONT_ZOOM_MAP: Record<FontScale, number> = {
  SM: 1,
  MD: 1.12,
  LG: 1.24
};

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

export interface MacroSectorDef {
  id: string;
  label: string;
  short: string;
  region: string;
  tier: number;
  x: number;
  y: number;
  connections: string[];
  unlockedByDefault?: boolean;
}

const MACRO_SECTORS: MacroSectorDef[] = [
  { id: 'safehouse', label: 'SAFEHOUSE / ALTAR HUB', short: 'SAFEHOUSE', region: 'CATERHAM HUB', tier: 0, x: 0.50, y: 0.52, connections: ['caterham_churchyard', 'caterham_asylum', 'chaldon_quarry', 'croydon_relay'], unlockedByDefault: true },
  { id: 'caterham_churchyard', label: 'ST. LAWRENCE CRYPT', short: 'CRYPT-01', region: 'SURREY HILLS', tier: 1, x: 0.34, y: 0.72, connections: ['safehouse', 'chaldon_quarry', 'waddon_marsh'], unlockedByDefault: true },
  { id: 'caterham_asylum', label: 'CATERHAM ASYLUM', short: 'ASYLUM-GW', region: 'SURREY HILLS', tier: 1, x: 0.66, y: 0.72, connections: ['safehouse', 'croydon_relay', 'malleus_precinct'], unlockedByDefault: true },
  { id: 'chaldon_quarry', label: 'CHALDON FIRE-QUARRIES', short: 'QUARRY-02', region: 'WEALD FRINGE', tier: 1, x: 0.18, y: 0.62, connections: ['safehouse', 'caterham_churchyard', 'waddon_marsh', 'thames_nexus'], unlockedByDefault: true },
  { id: 'croydon_relay', label: 'CROYDON TELECOM SPIRE', short: 'SPIRE-04', region: 'SOUTH LONDON', tier: 2, x: 0.72, y: 0.50, connections: ['safehouse', 'caterham_asylum', 'malleus_precinct', 'woolwich_arsenal'] },
  { id: 'waddon_marsh', label: 'WADDON GASWORKS MARSH', short: 'MARSH-05', region: 'SOUTH LONDON', tier: 2, x: 0.28, y: 0.44, connections: ['caterham_churchyard', 'chaldon_quarry', 'thames_nexus', 'brixton_morgue'] },
  { id: 'malleus_precinct', label: 'MALLEUS INQUISITION HQ', short: 'PRECINCT', region: 'SOUTH LONDON', tier: 2, x: 0.84, y: 0.60, connections: ['caterham_asylum', 'croydon_relay', 'woolwich_arsenal', 'greenwich_observatory'] },
  { id: 'brixton_morgue', label: 'BRIXTON OSSUARY MORGUE', short: 'MORGUE-07', region: 'INNER SOUTH', tier: 2, x: 0.42, y: 0.34, connections: ['waddon_marsh', 'lambeth_sanctum', 'blackfriars_vault'] },
  { id: 'thames_nexus', label: 'THAMES BARRAGE NEXUS', short: 'LEY-NEXUS', region: 'THAMES ESTUARY', tier: 3, x: 0.14, y: 0.36, connections: ['chaldon_quarry', 'waddon_marsh', 'battersea_forge', 'highgate_catacombs'] },
  { id: 'woolwich_arsenal', label: 'WOOLWICH ROYAL ARSENAL', short: 'ARSENAL', region: 'DOCKLANDS', tier: 3, x: 0.86, y: 0.36, connections: ['croydon_relay', 'malleus_precinct', 'greenwich_observatory', 'whitechapel_abattoir'] },
  { id: 'greenwich_observatory', label: 'MERIDIAN ASTROLABE', short: 'MERIDIAN', region: 'GREENWICH', tier: 3, x: 0.74, y: 0.24, connections: ['malleus_precinct', 'woolwich_arsenal', 'whitechapel_abattoir', 'st_pauls_whisper'] },
  { id: 'lambeth_sanctum', label: 'LAMBETH PALACE CRYPT', short: 'LAMBETH', region: 'WESTMINSTER', tier: 3, x: 0.54, y: 0.28, connections: ['brixton_morgue', 'battersea_forge', 'blackfriars_vault', 'st_pauls_whisper'] },
  { id: 'battersea_forge', label: 'BATTERSEA COIL FORGE', short: 'COIL-FORGE', region: 'NINE ELMS', tier: 3, x: 0.28, y: 0.22, connections: ['thames_nexus', 'lambeth_sanctum', 'highgate_catacombs'] },
  { id: 'blackfriars_vault', label: 'BLACKFRIARS MITHRAEUM', short: 'MITHRAEUM', region: 'CITY OF LONDON', tier: 4, x: 0.46, y: 0.14, connections: ['brixton_morgue', 'lambeth_sanctum', 'st_pauls_whisper', 'highgate_catacombs'] },
  { id: 'whitechapel_abattoir', label: 'WHITECHAPEL ABATTOIR', short: 'ABATTOIR', region: 'EAST END', tier: 4, x: 0.84, y: 0.14, connections: ['woolwich_arsenal', 'greenwich_observatory', 'st_pauls_whisper'] },
  { id: 'highgate_catacombs', label: 'HIGHGATE NECROPOLIS', short: 'HIGHGATE', region: 'NORTHGATE', tier: 4, x: 0.16, y: 0.12, connections: ['thames_nexus', 'battersea_forge', 'blackfriars_vault'] },
  { id: 'st_pauls_whisper', label: 'ST. PAULS OMEGA DOME', short: 'OMEGA-DOME', region: 'LUDGATE HILL', tier: 4, x: 0.64, y: 0.12, connections: ['greenwich_observatory', 'lambeth_sanctum', 'blackfriars_vault', 'whitechapel_abattoir'] }
];

const HORSEMAN_LORE: Record<'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH', {
  riderTitle: string;
  sealName: string;
  color: string;
  domain: string;
  omenDesc: string;
}> = {
  CONQUEST: {
    riderTitle: 'THE WHITE RIDER // CROWN & BOW OF SUBJUGATION',
    sealName: 'FIRST SEAL (REV 6:2)',
    color: '#00f3ff',
    domain: 'Solar Kings, Astral Princes, Mind Fog & False Sovereignty',
    omenDesc: 'Channels the Solar Kings and Aerial Princes of the Lemegeton to overwrite human free will, blind surveillance grids, and crown false prophets.'
  },
  WAR: {
    riderTitle: 'THE RED RIDER // GREAT SWORD OF SLAUGHTER',
    sealName: 'SECOND SEAL (REV 6:4)',
    color: '#ff2a55',
    domain: 'Martial Marquises, Ferrous Oxidation, Pyroclastic Ruin & Frenzy',
    omenDesc: 'Harnesses the Martial Marquises and Earls of the Ars Goetia to corrode steel, ignite spontaneous firestorms, and drive precincts into blood frenzy.'
  },
  FAMINE: {
    riderTitle: 'THE BLACK RIDER // SCALES OF SCARCITY',
    sealName: 'THIRD SEAL (REV 6:5)',
    color: '#ffb800',
    domain: 'Mercurial Presidents, Pathogenic Blight, Transmutation & Usury',
    omenDesc: 'Commands the Presidents of the Goetia to rot organic provisions, transmute bullion into leaden dross, and choke ventilation shafts with spores.'
  },
  DEATH: {
    riderTitle: 'THE PALE RIDER // SCYTHE OF THE OSSUARY TETHER',
    sealName: 'FOURTH SEAL (REV 6:8)',
    color: '#62f080',
    domain: 'Necromantic Dukes, Tissue Stasis, Exhumation & Spectral Trumpets',
    omenDesc: 'Anchors through Necromantic Dukes and Knights of the Goetia to harvest morgues, lock living tissue in cryo-stasis, and bridge Hades into reality.'
  }
};

// Custom Vector Sigils for the 4 Horsemen
const HorsemanSigilSvg = ({ horseman, color, size = 64 }: { horseman: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH'; color: string; size?: number }) => (
  <svg viewBox="0 0 100 100" style={{ width: size, height: size, flexShrink: 0, filter: `drop-shadow(0 0 6px ${color})` }}>
    <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
    <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
    {horseman === 'CONQUEST' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        {/* Crown + Drawn Bow & Arrow */}
        <polygon points="28,42 36,24 50,35 64,24 72,42" />
        <path d="M 24,68 Q 50,42 76,68" />
        <line x1="24" y1="68" x2="76" y2="68" strokeWidth="1" />
        <line x1="50" y1="82" x2="50" y2="20" />
        <polyline points="44,28 50,18 56,28" />
      </g>
    )}
    {horseman === 'WAR' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        {/* Crossed Greatsword & Flaming Octagram */}
        <polygon points="50,14 62,38 86,50 62,62 50,86 38,62 14,50 38,38" strokeWidth="1.2" />
        <line x1="50" y1="12" x2="50" y2="88" strokeWidth="3" />
        <line x1="32" y1="32" x2="68" y2="32" strokeWidth="2.8" />
        <line x1="25" y1="25" x2="75" y2="75" strokeWidth="1.4" />
        <line x1="75" y1="25" x2="25" y2="75" strokeWidth="1.4" />
      </g>
    )}
    {horseman === 'FAMINE' && (
      <g stroke={color} strokeWidth="2.2" fill="none">
        {/* Alchemical Balance Scales */}
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
        {/* Scythe & Necrotic Hourglass */}
        <polygon points="34,24 66,24 34,76 66,76" />
        <path d="M 24,80 L 68,20 Q 86,26 78,48 Q 66,34 58,34" />
        <circle cx="50" cy="50" r="6" />
      </g>
    )}
  </svg>
);

const YOKAI_INVOCATIONS: Record<string, { label: string; maxCharges: number; desc: string }> = {
  yokai_kitsune: { label: 'FOXFIRE SHROUD', maxCharges: 2, desc: 'Vent -30% Inquisition Heat.' },
  yokai_tengu: { label: 'GALE SWEEP', maxCharges: 2, desc: 'Spend 5 HUM to reveal all room nodes in sector.' },
  yokai_baku: { label: 'DEVOUR NIGHTMARE', maxCharges: 2, desc: 'Convert -15% Inquisition Heat into +20 Humanity.' },
  yokai_zashiki: { label: 'FORTUNE BOON', maxCharges: 1, desc: 'Single-use: Gain +35 Obols & +1 Scrap Metal (Consumes Pact).' },
  yokai_kameosa: { label: 'FERMENT MATTER', maxCharges: 3, desc: 'Spend 8 HUM to generate +1 Metal, +1 Earth, +1 Distillate.' },
  yokai_kamaitachi: { label: 'WIND SICKLE', maxCharges: 2, desc: 'Breach selected room with 0% Heat & disarm Ambush/Hazards.' },
  yokai_amabie: { label: 'PROPHETIC WARD', maxCharges: 1, desc: 'Single-use: Spend 10 Obols to purge -2.50% Global Entropy.' },
  yokai_noppera: { label: 'FACELESS DECOY', maxCharges: 2, desc: 'Disarm sector Ambush nodes & reduce Inquisition Heat by -15%.' }
};

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

const getFullBodyPath = (squarePath: string) => {
  const filename = (squarePath || '/portraits/thaumaturge_m1.png').split('/').pop();
  return `/portraits/full_body/fb_${filename}`;
};

// ============================================================================ //
// 4. INTERACTIVE FIELD MANUAL & DEMONOLOGY GRIMOIRE MODAL
// ============================================================================ //
const ManualViewport = ({ fontScale }: { fontScale: FontScale }) => {
  const [tab, setTab] = useState<'LORE' | 'LOOP' | 'CLI' | 'INQUISITION'>('LORE');

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    fontFamily: theme.fontMono,
    fontSize: '0.76rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
    cursor: 'pointer',
    border: `1px solid ${active ? theme.textBright : theme.borderTerminal}`,
    backgroundColor: active ? theme.textBright : '#060907',
    color: active ? '#000000' : '#4a7c59',
    transition: 'all 0.15s'
  });

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '12px', padding: '14px', zoom: FONT_ZOOM_MAP[fontScale] }}>
      <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: theme.accentAmber, letterSpacing: '2px' }}>SYNDICATE FIELD CODEX // THAUMATURGIC OS v4.09</div>
          <h2 style={{ margin: '2px 0 0 0', color: theme.textBright, letterSpacing: '2px', fontSize: '1.2rem' }}>OPERATIVE MANUAL &amp; SOLOMONIC GRIMOIRE</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('LORE'); }} style={subTabStyle(tab === 'LORE')}>1. SOLOMONIC DEMONOLOGY</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('LOOP'); }} style={subTabStyle(tab === 'LOOP')}>2. INVESTIGATION &amp; CASCADES</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('CLI'); }} style={subTabStyle(tab === 'CLI')}>3. TERMINAL CLI COMMANDS</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('INQUISITION'); }} style={subTabStyle(tab === 'INQUISITION')}>4. MALLEUS INQUISITION &amp; HEAT</button>
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '24px', overflowY: 'auto', fontSize: '0.86rem', lineHeight: '1.7', color: '#a8ccaf' }}>
        {tab === 'LORE' && (
          <div style={{ maxWidth: '920px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0, letterSpacing: '1px' }}>THE ESCHATON &amp; THE 72 SPIRITS OF SOLOMON</h3>
            <p>
              According to the 17th-century <em>Lemegeton Clavicula Salomonis</em> (The Lesser Key of Solomon), King Solomon bound <strong>72 Goetic spirits</strong>—Kings, Dukes, Princes, Marquises, Presidents, Earls, and Knights—into a single <strong>Brass Vessel</strong> using their geometric seals and planetary catalysts.
            </p>
            <p>
              In the modern era, the <strong>Four Horsemen of the Apocalypse</strong> (Conquest, War, Famine, and Death) are attempting to bleed through into mundane geography across Surrey and Greater London. Because the Horsemen are vast conceptual entities, they cannot manifest directly. Instead, each Horseman uses <strong>18 Goetian Lieutenants</strong> as physical anchors to tear open local reality.
            </p>
            <h4 style={{ color: theme.accentAmber, marginTop: '20px' }}>PLANETARY METALS &amp; ALCHEMICAL BINDING</h4>
            <p>
              In authentic Solomonic magic, each demonic rank corresponds to a classical planet and metal: <strong>Kings</strong> (Sun / Gold Leaf), <strong>Marquises</strong> (Moon / Silver Shavings), <strong>Dukes</strong> (Venus / Copper Wire), <strong>Presidents</strong> (Mercury / Quicksilver Drops), <strong>Princes</strong> (Jupiter / Sacred Sand), <strong>Earls</strong> (Mars / Cold Iron Filings), and <strong>Knights</strong> (Saturn / Lead Weights). You must synthesize the target demon's exact planetary catalysts at your <strong>[F4] SAFEHOUSE / ALTAR</strong> before compelling it into the Brass Vessel.
            </p>
          </div>
        )}

        {tab === 'LOOP' && (
          <div style={{ maxWidth: '920px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0, letterSpacing: '1px' }}>THE DEDUCTION LOOP &amp; HIERARCHICAL CASCADES</h3>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong style={{ color: theme.textBright }}>INFILTRATE via CLI ([F1] FIELD_OPS):</strong> You begin each sector at the <em>Perimeter Tether</em> with Room 1 locked. Use CLI commands (<code>probe 1</code>, <code>breach 1</code>, <code>extract</code>) to move through the 6-room sub-grid and extract <strong>3 Forensic Clues</strong>.</li>
              <li><strong style={{ color: theme.textBright }}>COUNTER ROOM HAZARDS:</strong> Some rooms are afflicted with <em>Aethyric Static</em>, <em>Inquisition Wiretaps</em>, or <em>Miasma Fog</em>. You must type <code>degauss</code>, <code>bypass</code>, or <code>purify</code> in the terminal before you can safely run <code>extract</code>.</li>
              <li><strong style={{ color: theme.textBright }}>DEDUCE IN [F2] CODEX:</strong> Read your extracted forensic reports and check off the matching 3 Phenomena in the Codex to isolate the exact Goetia anchoring the sector.</li>
              <li><strong style={{ color: theme.accentAmber }}>RESONANCE CASCADES (FAST-TRACKING THE 72):</strong> Whenever you seal a high-ranking <strong>King, Prince, or Duke</strong>, the shockwave triggers a <em>Solomonic Resonance Cascade</em> that automatically severs and binds <strong>1 to 2 lesser demons</strong> of the same Horseman's court into your Brass Vessel!</li>
            </ol>
          </div>
        )}

        {tab === 'CLI' && (
          <div style={{ maxWidth: '920px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0, letterSpacing: '1px' }}>TERMINAL DIRECTIVES (TTY1 CONSOLE SYNTAX)</h3>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '16px', display: 'grid', gridTemplateColumns: '200px 1fr', rowGap: '10px' }}>
              <strong style={{ color: theme.accentAmber }}>probe [1-6]</strong><span>Scans a room node for Ambushes, Shrines, &amp; Hazards (-5 HUM, or -2 HUM with Yokai).</span>
              <strong style={{ color: theme.accentAmber }}>breach [1-6]</strong><span>Shatters the room's ward and moves your operative inside (+Inquisition Heat).</span>
              <strong style={{ color: theme.accentAmber }}>move [1-6]</strong><span>Moves between already-breached adjacent rooms.</span>
              <strong style={{ color: theme.accentAmber }}>extract</strong><span>Extracts the forensic phenomenon log, Kami Shrine relic, &amp; salvage from your current room.</span>
              <strong style={{ color: theme.accentCyan }}>degauss</strong><span>Neutralizes <code>AETHYRIC_STATIC</code> in the current room so you can extract clues.</span>
              <strong style={{ color: theme.accentCyan }}>bypass</strong><span>Spoofs <code>INQUISITION_WIRE</code> tripwires in the current room (-10% Heat).</span>
              <strong style={{ color: theme.accentCyan }}>purify</strong><span>Burns away <code>MIASMA_FOG</code> bio-hazards in the current room.</span>
              <strong style={{ color: theme.accentRed }}>spoof</strong><span>Spends 15 Obols to broadcast false telemetry to Malleus vans (-25% Sector Heat).</span>
              <strong style={{ color: theme.accentRed }}>bribe</strong><span>Spends 25 Obols to pay off corrupt Malleus Watch constables (-45% Sector Heat; lifts 100% Lockdowns).</span>
            </div>
          </div>
        )}

        {tab === 'INQUISITION' && (
          <div style={{ maxWidth: '920px' }}>
            <h3 style={{ color: theme.accentRed, marginTop: 0, letterSpacing: '1px' }}>THE ORDO MALLEUS &amp; INQUISITION HEAT</h3>
            <p>
              The <strong>Ordo Malleus</strong> (a clandestine Vatican-Crown counter-thaumaturgy directorate operating out of Croydon and Lambeth) monitors ley-line spikes using mobile direction-finding vans and witch-hound packs.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><strong>75%–99% Heat (Triangulation Warning):</strong> Malleus strike teams begin sweeping the perimeter. The HUD flashes crimson.</li>
              <li><strong>100% Heat (TOTAL SECTOR LOCKDOWN):</strong> Inquisition Witch-Hounds lock down the building. All <code>probe</code>, <code>breach</code>, and <code>extract</code> directives are blocked until you run <code>spoof</code> (-15 Obols), <code>bribe</code> (-25 Obols), invoke a Stealth Yokai, or retreat to <strong>[F4] SAFEHOUSE / ALTAR</strong>.</li>
              <li><strong>Global Entropy (0.00%):</strong> Measures the irreversible fraying of mundane reality. Ticks upward by <code>+0.01%</code> to <code>+0.05%</code> during travel and rest, and spikes if you botch a Sealing Ritual.</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};

// ============================================================================ //
// 5. START SCREEN WITH OPERATIVE PORTRAIT SELECTION, SAVE WIPE & TITLE ART
// ============================================================================ //
const StartScreen = ({ onStart, onLoad }: { onStart: (name: string, portrait: string, agency: string) => void; onLoad: () => void; onOpenManual: () => void }) => {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [portrait, setPortrait] = useState('/portraits/thaumaturge_m1.png');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveTick, setSaveTick] = useState(0);

  const savedData = localStorage.getItem('thaumaturgic_os_save_v1');
  let savedOperative: string | null = null;
  if (savedData && saveTick >= 0) {
    try { savedOperative = JSON.parse(savedData).playerName; } catch { /* ignore */ }
  }

  const handleWipeSave = () => {
    if (window.confirm('PURGE LOCAL TETHER DATA? This will permanently erase your current operative save.')) {
      ThaumaturgicAudio.errorBuzz();
      localStorage.removeItem('thaumaturgic_os_save_v1');
      localStorage.removeItem('thaumaturgic_os_contracts_v1');
      localStorage.removeItem('thaumaturgic_os_micro_entropy_v1');
      setSaveTick(prev => prev + 1);
    }
  };

  const handleInitiateClick = () => {
    ThaumaturgicAudio.keyClick();
    if (!name.trim()) setName('VERGIL');
    if (!agency.trim()) setAgency('DARKWIRE');
    setShowConfirm(true);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, margin: 0, padding: 0, overflow: 'hidden' }}>
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '820px', backgroundColor: theme.bgPanel, border: `2px solid ${theme.textBright}`, boxShadow: `0 0 40px rgba(98, 240, 128, 0.15)` }}>
            <div style={{ flex: '1', borderRight: `1px dashed ${theme.borderTerminal}`, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#030503' }}>
              <h2 style={{ margin: '0 0 15px 0', color: theme.textBright, letterSpacing: '4px', textTransform: 'uppercase' }}>{name || 'VERGIL'}</h2>
              <img src={getFullBodyPath(portrait)} alt="Full Body Operative" style={{ width: '100%', maxHeight: '460px', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(74,124,89,0.35))' }} />
            </div>
            <div style={{ flex: '1', padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: theme.accentRed, borderBottom: `1px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px', margin: 0 }}>&gt; CONFIRM OPERATIVE TETHER</h3>
              <div style={{ marginTop: '20px', lineHeight: '2.1', fontSize: '0.88rem' }}>
                <div><span style={{ color: theme.textMuted }}>CALLSIGN:</span> <strong style={{ color: theme.textBright }}>{(name || 'VERGIL').toUpperCase()}</strong></div>
                <div><span style={{ color: theme.textMuted }}>SYNDICATE:</span> <strong style={{ color: theme.textBright }}>{(agency || 'DARKWIRE').toUpperCase()}</strong></div>
                <div><span style={{ color: theme.textMuted }}>STARTING HUMANITY:</span> <span style={{ color: theme.textBright }}>100% (STABLE)</span></div>
                <div><span style={{ color: theme.textMuted }}>DIRECTIVE:</span> <span style={{ color: theme.accentAmber }}>SEVER THE 72 GOETIAN ANCHORS &amp; BANISH THE FOUR HORSEMEN</span></div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => {
                    ThaumaturgicAudio.scryPing();
                    localStorage.removeItem('thaumaturgic_os_contracts_v1');
                    localStorage.removeItem('thaumaturgic_os_micro_entropy_v1');
                    onStart(name || 'VERGIL', portrait, agency || 'DARKWIRE');
                  }}
                  style={{ padding: '14px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '1rem', letterSpacing: '2px' }}
                >
                  &gt; FINALIZE TETHER &amp; DEPLOY
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{ padding: '12px', backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono }}
                >
                  &gt; REVISE OPERATIVE DOSSIER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified boundary container without margin or overflow issues */}
      <div style={{ width: '640px', maxHeight: '96vh', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgPanel, boxShadow: `0 0 30px rgba(98, 240, 128, 0.12)`, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Responsive, Uncropped Title Banner (image_30.png) */}
        <div style={{ width: '100%', height: '350px', position: 'relative', borderBottom: `1px solid ${theme.borderTerminal}`, overflow: 'hidden', backgroundColor: 'black', flexShrink: 0 }}>
          <img 
            src="/title_art.jpg" 
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith('/title_art.jpg')) {
                target.src = '/title_art.png';
              } else if (target.src.endsWith('/title_art.png')) {
                target.src = '/branding/animus_mundi_start_banner.png';
              }
            }}
            alt="Animus Mundi: Seals of the 4" 
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', backgroundColor: '#020403' }}
          />
          {/* Transition overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,13,10,1) 0%, rgba(9,13,10,0) 25%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
        </div>

        <div style={{ padding: '16px 28px 24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: theme.accentAmber, letterSpacing: '2px' }}>THAUMATURGIC OS // NET-OPS v4.09</span>

          </div>
          <h2 style={{ margin: '0', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '6px', letterSpacing: '3px', color: theme.textBright, fontSize: '1.15rem' }}>
            INITIATING DATA-TETHER
          </h2>
          <p style={{ fontSize: '0.74rem', color: '#a8ccaf', lineHeight: '1.4', margin: '0' }}>
            The Four Horsemen are bleeding into London through the 72 Spirits of Solomon. Infiltrate fractured sectors via terminal CLI, dodge Malleus Inquisition strike teams, deduce each demon's True Name, and bind them into the Brass Vessel.
          </p>

          {savedOperative && (
            <div style={{ padding: '10px', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgDark, textAlign: 'center' }}>
              <div style={{ color: theme.textMuted, fontSize: '0.68rem', marginBottom: '6px' }}>EXISTING OPERATIVE TETHER FOUND:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { ThaumaturgicAudio.scryPing(); onLoad(); }} style={{ flex: 2, padding: '9px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '1px' }}>
                  &gt; RESUME: OP_{savedOperative.toUpperCase()}
                </button>
                <button onClick={handleWipeSave} style={{ flex: 1, padding: '9px', backgroundColor: '#2a0808', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.72rem' }}>
                  WIPE
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT OPERATIVE CALLSIGN:</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VERGIL" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT AFFILIATED SYNDICATE:</label>
              <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. DARKWIRE" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.74rem', color: theme.textBright }}>&gt; SELECT OPERATIVE DOSSIER PORTRAIT:</label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {[
                  { id: 'thaumaturge_m1', src: '/portraits/thaumaturge_m1.png' },
                  { id: 'thaumaturge_m2', src: '/portraits/thaumaturge_m2.png' },
                  { id: 'thaumaturge_f1', src: '/portraits/thaumaturge_f1.png' },
                  { id: 'thaumaturge_f2', src: '/portraits/thaumaturge_f2.png' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => { ThaumaturgicAudio.keyClick(); setPortrait(p.src); }}
                    style={{
                      padding: '3px', cursor: 'pointer',
                      backgroundColor: portrait === p.src ? theme.textTerminal : 'transparent',
                      border: `2px solid ${portrait === p.src ? theme.textBright : theme.borderTerminal}`,
                      borderRadius: '50%', transition: 'all 0.15s'
                    }}
                  >
                    <img
                      src={p.src}
                      alt="Operative"
                      style={{
                        width: '56px', height: '56px', objectFit: 'cover', borderRadius: '50%',
                        opacity: portrait === p.src ? 1 : 0.45,
                        filter: portrait === p.src ? 'none' : 'grayscale(100%) sepia(20%) hue-rotate(80deg)'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleInitiateClick} style={{ width: '100%', padding: '11px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px' }}>
              INITIALIZE TETHER PROTOCOL //
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================ //
// 6. SEALING & BANISHMENT TERMINALS (WITH VISIBLE TRACE LINES)
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
      const fullName = suspect.name.toUpperCase();
      let i = 0;
      setTypedName('');
      setShowSealed(false);
      const interval = setInterval(() => {
        setTypedName(fullName.substring(0, i + 1));
        ThaumaturgicAudio.keyClick();
        i++;
        if (i >= fullName.length) {
          clearInterval(interval);
          setTimeout(() => {
            ThaumaturgicAudio.sealSuccess();
            setShowSealed(true);
          }, 1200);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [phase, suspect.name]);

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

    (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) =>
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } })
    );

    if (suspect.id !== actualAnchorId) {
      ThaumaturgicAudio.errorBuzz();
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 15 });
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
      addToast(`SEALING SUCCESSFUL. Target ${suspect.name} bound to the brass vessel.`, 'SEAL');
    } else {
      ThaumaturgicAudio.errorBuzz();
      addToast(`RITUAL FRACTURE. Global Entropy spiked by +10%.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 10 });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ width: '500px', padding: '30px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, boxShadow: `0 0 30px rgba(98, 240, 128, 0.2)`, fontFamily: theme.fontMono, color: theme.textTerminal }}>
        {phase !== 'COMPLETE' && (
          <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '8px', color: theme.textBright }}>
            &gt; ROOT_ACCESS // VESSEL_SEALING_PROTOCOL
          </h3>
        )}

        {phase === 'AUTH' && (
          <form onSubmit={handleAuthSubmit}>
            <p style={{ fontSize: '0.8rem', marginBottom: '10px', lineHeight: '1.5' }}>
              HYPOTHESIS LOCKED: <strong style={{ color: theme.textBright }}>{suspect.name.toUpperCase()}</strong> ({suspect.rank} of {suspect.allegiance}).<br/>
              <span style={{ color: theme.accentAmber }}>WARNING: If this entity is NOT the true Anchor of the current Sector, your catalysts will burn and the backlash will spike Global Entropy (+15%).</span>
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
              You inscribed the seal of <strong>{suspect.name}</strong>, but the entity haunting this sector rejected the binding. Your catalysts vaporized in a violent backlash.<br/><br/>
              <strong>PENALTY:</strong> -20 Humanity | +15.00% Global Entropy.<br/>
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
              <span style={{ color: theme.accentRed, fontWeight: 'bold', animation: 'blink 1s infinite' }}>! CONNECTION VOLATILE</span>
              <span style={{ color: timeLeft <= 5 ? theme.accentRed : theme.textBright, fontWeight: 'bold' }}>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <p style={{ fontSize: '0.78rem', alignSelf: 'flex-start', marginBottom: '16px', color: theme.textMuted }}>
              REQUESTING ALIGNMENT: <span style={{ color: theme.textTerminal }}>[{matrix.id}]</span>
            </p>
            <div style={{ position: 'relative', width: '300px', height: '300px', border: `1px solid ${theme.borderTerminal}`, backgroundColor: theme.bgDark, borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={`/seals/${suspect.id}.png`}
                alt="Target Seal"
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: '180px', height: '180px', opacity: 0.3, pointerEvents: 'none',
                  filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'
                }}
              />
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                <polygon points={matrix.sequence.map(id => `${matrix.nodes.find(n => n.id === id)!.x},${matrix.nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={theme.borderTerminal} strokeWidth="0.6" />
                <polyline points={path.map((nodeId) => `${matrix.nodes.find(n => n.id === nodeId)!.x},${matrix.nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke={theme.textBright} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {currentPointer && path.length > 0 && path.length < matrix.sequence.length && (
                  <line x1={matrix.nodes.find(n => n.id === path[path.length - 1])!.x} y1={matrix.nodes.find(n => n.id === path[path.length - 1])!.y} x2={currentPointer.x} y2={currentPointer.y} stroke={theme.textTerminal} strokeWidth="1.2" strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
                )}
                {matrix.nodes.map((node) => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === matrix.sequence[path.length] || (path.length === 0 && node.id === matrix.sequence[0]);
                  return (
                    <g key={node.id} style={{ pointerEvents: 'none' }}>
                      <circle cx={node.x} cy={node.y} r={isNext ? "3.5" : "2"} fill={isCompleted ? theme.textBright : theme.bgDark} stroke={isNext ? theme.textBright : theme.textTerminal} strokeWidth="0.6" />
                      {isNext && <circle cx={node.x} cy={node.y} r="5.5" fill="none" stroke={theme.textBright} strokeWidth="0.6" style={{ animation: 'blink 1s infinite' }} />}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {phase === 'COMPLETE' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img
              src={`/seals/${suspect.id}.png`}
              alt="Goetian Seal"
              style={{
                width: '200px', height: '200px', marginBottom: '20px',
                filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'
              }}
            />
            <h2 style={{ color: theme.textBright, letterSpacing: '6px', minHeight: '35px', margin: '0' }}>
              {typedName}
            </h2>
            {showSealed && (
              <>
                <div style={{ color: theme.accentRed, fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '8px', marginTop: '10px', animation: 'slowPulse 2.5s ease-in-out infinite' }}>
                  [SEALED]
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a8ccaf', marginTop: '12px' }}>
                  +5% Banishment Probability toward <strong>{suspect.allegiance}</strong> | Sector Permanently Secured &amp; Adjacent Ley-Routes Unlocked!
                </p>
                {!isCleanSeal && (
                  <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginTop: '10px' }}>
                    _CONTAINMENT FAILURE: GLOBAL ENTROPY SPIKED (+10%).
                  </p>
                )}
                <button
                  onClick={onClose}
                  style={{ marginTop: '25px', padding: '10px 20px', width: '100%', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.textBright}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}
                >
                  &gt; ACKNOWLEDGE_CONTAINMENT
                </button>
              </>
            )}
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
      addToast(`RITUAL FRACTURE. GLOBAL ENTROPY +25%.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 25 });
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
  const activeMatrix = matrices[currentMatrixIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ width: '560px', padding: '32px', backgroundColor: overrideTheme.bg, border: `2px solid ${overrideTheme.border}`, boxShadow: `0 0 50px rgba(255, 51, 51, 0.2)`, fontFamily: theme.fontMono, color: overrideTheme.text }}>
        {phase === 'LEDGER' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: `1px solid ${overrideTheme.border}`, paddingBottom: '10px', marginBottom: '12px' }}>
              <HorsemanSigilSvg horseman={horseman} color={overrideTheme.bright} size={52} />
              <div>
                <h3 style={{ color: overrideTheme.bright, margin: 0 }}>&gt; GRAND RITE OF BANISHMENT // {horseman}</h3>
                <div style={{ fontSize: '0.74rem', color: overrideTheme.text }}>{HORSEMAN_LORE[horseman].riderTitle}</div>
              </div>
            </div>
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
              <span style={{ color: overrideTheme.bright }}>MATRIX: {currentMatrixIdx + 1}/3 [{activeMatrix.id}]</span>
              <span style={{ color: overrideTheme.bright }}>T-MINUS: {timeLeft}s</span>
            </div>
            <div style={{ position: 'relative', width: '310px', height: '310px', border: `2px solid ${overrideTheme.border}`, backgroundColor: 'black', borderRadius: '50%' }}>
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                {/* Guide Polygon (Now Solid & Clearly Visible) */}
                <polygon points={activeMatrix.sequence.map(id => `${activeMatrix.nodes.find(n => n.id === id)!.x},${activeMatrix.nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={overrideTheme.border} strokeWidth="0.9" strokeOpacity="0.7" />
                {/* Completed Trace Path */}
                <polyline points={path.map((nodeId) => `${activeMatrix.nodes.find(n => n.id === nodeId)!.x},${activeMatrix.nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {/* Active Pointer Rubber-Band Line (Restored!) */}
                {currentPointer && path.length > 0 && path.length < activeMatrix.sequence.length && (
                  <line
                    x1={activeMatrix.nodes.find(n => n.id === path[path.length - 1])!.x}
                    y1={activeMatrix.nodes.find(n => n.id === path[path.length - 1])!.y}
                    x2={currentPointer.x}
                    y2={currentPointer.y}
                    stroke={overrideTheme.bright}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {activeMatrix.nodes.map((node) => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === activeMatrix.sequence[path.length] || (path.length === 0 && node.id === activeMatrix.sequence[0]);
                  return (
                    <g key={node.id} style={{ pointerEvents: 'none' }}>
                      <circle cx={node.x} cy={node.y} r={isNext ? "4" : "2.4"} fill={isCompleted ? '#ffffff' : 'black'} stroke={isNext ? '#ffffff' : overrideTheme.border} strokeWidth="0.8" />
                      {isNext && <circle cx={node.x} cy={node.y} r="6" fill="none" stroke="#ffffff" strokeWidth="0.7" style={{ animation: 'blink 1s infinite' }} />}
                    </g>
                  );
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
                : `The Grand Rite fractured (${winProbability}% roll failed or timed out). Global Entropy spiked by +25%. Seal more Lieutenants before retrying!`}
            </p>
            <button onClick={onClose} style={{ padding: '12px 24px', marginTop: '25px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>&gt; RETURN TO OS</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================ //
// 7. MAIN 6-VIEWPORT THAUMATURGIC OS COMPONENT
// ============================================================================ //
export default function App() {
  const { state, dispatch, draftContract, resetGame, sealGoetia, startInvestigation, loadGame, travelTo } = useEngine();

  // Viewport, Font Scaling, Manual Modal & Map Zoom/Pan States
  const [viewport, setViewport] = useState<ViewportMode>('FIELD_OPS');
  const [mapViewMode, setMapViewMode] = useState<'SUB_GRID' | 'GEO_TRACKER'>('SUB_GRID');
  const [fontScale, setFontScale] = useState<FontScale>('MD');
  const [showManual, setShowManual] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Map Zoom & Pan State
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  // Micro-Entropy State (0.01% increments for travel/rest/breach)
  const [microEntropy, setMicroEntropy] = useState<number>(() => {
    const saved = localStorage.getItem('thaumaturgic_os_micro_entropy_v1');
    return saved ? parseFloat(saved) || 0 : 0;
  });

  // Procedural Sector Contracts Dictionary
  const [contracts, setContracts] = useState<Record<string, SectorContract>>(() => {
    const saved = localStorage.getItem('thaumaturgic_os_contracts_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  const [yokaiCharges, setYokaiCharges] = useState<Record<string, number>>({});

  // Codex Deduction State
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
  const cliInputRef = useRef<HTMLInputElement>(null);
  const visualFxRef = useRef<{
    sonarRings: { x: number; y: number; r: number; alpha: number }[];
    angle: number;
    wavePhase: number;
  }>({ sonarRings: [], angle: 0, wavePhase: 0 });

  const formatLabel = (str: string) => str.replace(/_/g, ' ').toUpperCase();

  const isSectorSecured = (sectorId: string) => !!state.flags[`sector_secured_${sectorId}`];
  const isSectorUnlocked = (sec: MacroSectorDef) => {
    if (sec.unlockedByDefault || state.flags[`sector_unlocked_${sec.id}`] || isSectorSecured(sec.id)) return true;
    return sec.connections.some(connId => isSectorSecured(connId));
  };

  const addMicroEntropy = (delta: number) => {
    setMicroEntropy(prev => {
      const next = Math.max(0, +(prev + delta).toFixed(2));
      localStorage.setItem('thaumaturgic_os_micro_entropy_v1', String(next));
      return next;
    });
  };

  const totalGlobalEntropy = Math.min(100, +(state.globalEntropy + microEntropy).toFixed(2));

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const appendLog = (html: string, type: TerminalEntry['type'] = 'normal') => {
    setTerminalLines(prev => [...prev, { id: Date.now() + Math.random(), html, type }]);
  };

  useEffect(() => {
    if (Object.keys(contracts).length > 0) {
      localStorage.setItem('thaumaturgic_os_contracts_v1', JSON.stringify(contracts));
    }
  }, [contracts]);

  useEffect(() => {
    if (state.gameStage === 'ACTIVE' && Object.keys(contracts).length === 0) {
      const initialContracts: Record<string, SectorContract> = {};
      const usedGoetia: string[] = [];
      MACRO_SECTORS.filter(s => s.id !== 'safehouse').forEach(sec => {
        const c = generateSectorContract(sec.id, sec.label, state.sealedGoetia, usedGoetia);
        usedGoetia.push(c.targetGoetiaId);
        initialContracts[sec.id] = c;
      });
      setContracts(initialContracts);

      if (Object.keys(state.inventory).length === 0) {
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 55 } });
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 2 } });
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'cursed_earth', amount: 2 } });
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'alchemical_distillate', amount: 2 } });
        dispatch({ type: 'SET_FLAG', payload: { flagId: 'kitsune_mask_found', value: true } });
        dispatch({ type: 'SET_FLAG', payload: { flagId: 'tengu_feather_found', value: true } });
      }

      appendLog(
        `<div style="border-left:2px solid #62f080;padding-left:10px;margin:4px 0;">` +
        `<div style="color:#62f080;font-weight:bold;">// THAUMATURGIC OS v4.09 — TERMINAL INFILTRATION PROTOCOL</div>` +
        `<div style="color:#a8ccaf;line-height:1.55;">` +
        `You are stationed at the <strong>PERIMETER TETHER</strong> outside Room 1. Field actions are executed via this CLI console:<br/>` +
        `• Type <code style="color:#ffb800;">probe 1</code> to scan Room 1, then <code style="color:#ffb800;">breach 1</code> to enter it.<br/>` +
        `• Type <code style="color:#ffb800;">extract</code> inside a breached room to harvest Forensic Clues &amp; Salvage.<br/>` +
        `• If a room has a Hazard (<code>AETHYRIC_STATIC</code>, <code>INQUISITION_WIRE</code>, <code>MIASMA_FOG</code>), type <code style="color:#00f3ff;">degauss</code>, <code style="color:#00f3ff;">bypass</code>, or <code style="color:#00f3ff;">purify</code> first!<br/>` +
        `• If Inquisition Heat nears 100%, type <code style="color:#ff2a55;">spoof</code> (-15 Obols) or <code style="color:#ff2a55;">bribe</code> (-25 Obols) to call off Malleus strike teams.` +
        `</div></div>`,
        'info'
      );
    }
  }, [state.gameStage, contracts, state.sealedGoetia, state.inventory, dispatch]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); setViewport('FIELD_OPS'); }
      if (e.key === 'F2') { e.preventDefault(); setViewport('CODEX'); }
      if (e.key === 'F3') { e.preventDefault(); setViewport('KAGE_NO_SHO'); }
      if (e.key === 'F4') { e.preventDefault(); setViewport('SAFEHOUSE_ALTAR'); }
      if (e.key === 'F5') { e.preventDefault(); setViewport('HORSEMEN'); }
      if (e.key === 'F6') { e.preventDefault(); setViewport('DOSSIER'); }
      if (e.key === 'F7') { e.preventDefault(); setViewport('MANUAL'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentContract = contracts[state.currentNode];
  const currentSubNode = currentContract?.subNodes.find(n => n.id === currentContract.activeSubNodeId) || null;
  const selectedSubNode = currentContract?.subNodes.find(n => n.id === currentContract.selectedSubNodeId) || null;
  const currentHeat = state.sectorEntropy[state.currentNode] || 0;

  // Helper to resolve a room argument (e.g. "1", "2", or selectedSubNode)
  const resolveTargetRoom = (arg?: string): SubGridNode | null => {
    if (!currentContract) return null;
    if (!arg) return selectedSubNode;
    const num = parseInt(arg.trim(), 10);
    if (!isNaN(num)) {
      return currentContract.subNodes.find(n => n.index === num) || null;
    }
    return currentContract.subNodes.find(n => n.label.toLowerCase().includes(arg.toLowerCase())) || null;
  };

  const isAdjacentOrEntry = (targetNode: SubGridNode): boolean => {
    if (!currentSubNode) {
      // At Perimeter Tether: only Room 1 (index 1) is reachable
      return targetNode.index === 1;
    }
    return currentSubNode.connections.includes(targetNode.id);
  };

  const handleUnbindYokai = (yokaiId: string, reason = 'Manually severed') => {
    ThaumaturgicAudio.errorBuzz();
    const updatedTether = state.tetheredYokai.filter(id => id !== yokaiId);
    dispatch({
      type: 'LOAD_GAME',
      payload: { ...state, tetheredYokai: updatedTether, activeContracts: updatedTether }
    });
    const yName = allYokai.find(y => y.id === yokaiId)?.nameEn || yokaiId;
    appendLog(`[*] TETHER SEVERED: <strong style="color:#ff2a55;">${yName}</strong> unbound (${reason}).`, 'warn');
    addToast(`Unbound: ${yName}`, 'ALERT');
  };

  // --- CLI FIELD OPERATIONS ---
  const handleProbeSubNode = (targetNode?: SubGridNode | null) => {
    if (!currentContract) return;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(`[✓] Sector is permanently SECURED. Switch to REGIONAL MAP to deploy elsewhere.`, 'success');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS INQUISITION LOCKDOWN (100% HEAT)! Field actions blocked. Type <code>spoof</code> (-15 Obols) or <code>bribe</code> (-25 Obols) to clear lockdown!`, 'error');
      addToast(`100% Heat Lockdown! Run 'spoof' or 'bribe'`, 'ALERT');
      return;
    }

    const node = targetNode || selectedSubNode;
    if (!node) return;

    if (node.status !== 'LOCKED') {
      appendLog(`[i] Room <strong>${node.label}</strong> is already ${node.status}.`, 'system');
      return;
    }
    if (!isAdjacentOrEntry(node)) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Cannot probe <strong>${node.label}</strong>—not adjacent to your current position (${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER - Room 1 only'}).`, 'error');
      return;
    }

    const humCost = state.tetheredYokai.length > 0 ? 2 : 5;
    if (state.humanity <= humCost) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Insufficient Humanity to cast Auspex Probe.`, 'error');
      return;
    }

    ThaumaturgicAudio.scryPing();
    dispatch({ type: 'MODIFY_HUMANITY', payload: -humCost });
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 1.0 });

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === node.id ? { ...n, status: 'PROBED' as const } : n
    );
    setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, selectedSubNodeId: node.id, subNodes: updatedNodes } }));

    const sigDesc =
      node.nodeType === 'ANOMALY' ? '<span style="color:#62f080;">[ESOTERIC ANOMALY + SALVAGE]</span>' :
      node.nodeType === 'SHRINE' ? '<span style="color:#00f3ff;">[DORMANT KAMI SHRINE]</span>' :
      node.nodeType === 'AMBUSH' ? '<span style="color:#ff2a55;">[WARNING: MALLEUS INQUISITION HOUND AMBUSH!]</span>' :
      node.nodeType === 'ANCHOR' ? '<span style="color:#ffb800;">[GOETIAN CONDUIT ANCHOR]</span>' : '[MUNDANE ROOM]';

    const hazardDesc = node.hazard !== 'NONE' ? ` | HAZARD: <span style="color:#ffb800;">[${node.hazard}]</span>` : '';
    appendLog(`[📡 AUSPEX PROBE] <strong>${node.label}</strong> (-${humCost} HUM): ${sigDesc}${hazardDesc}`, 'info');
  };

  const handleBreachOrMoveSubNode = (targetNode?: SubGridNode | null) => {
    if (!currentContract) return;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(`[✓] Sector already SECURED.`, 'success');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS INQUISITION LOCKDOWN (100% HEAT)! Witch-hound squads have sealed all doors. Type <code>spoof</code> (-15 Obols) or <code>bribe</code> (-25 Obols) to break the cordon!`, 'error');
      addToast(`SECTOR LOCKED AT 100% HEAT!`, 'ALERT');
      return;
    }

    const node = targetNode || selectedSubNode;
    if (!node) return;

    if (currentSubNode && node.id === currentSubNode.id) {
      appendLog(`[i] Already positioned inside <strong>${node.label}</strong>.`, 'system');
      return;
    }
    if (!isAdjacentOrEntry(node)) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] <strong>${node.label}</strong> is not connected to your current position (${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER -> Breach Room 1 first'}).`, 'error');
      return;
    }

    ThaumaturgicAudio.senseSweep();
    addMicroEntropy(0.01);
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 8, alpha: 1.0 });

    const wasLocked = node.status === 'LOCKED' || node.status === 'PROBED';
    let heatGain = wasLocked ? node.wardLevel * 9 : 2;

    if (wasLocked && node.nodeType === 'AMBUSH') {
      heatGain += 20;
      dispatch({ type: 'MODIFY_HUMANITY', payload: -12 });
      appendLog(`[!] MALLEUS INQUISITION AMBUSH in <strong>${node.label}</strong>! Witch-hounds tracked your tether (-12 Humanity, +${heatGain}% Inquisition Heat)!`, 'error');
      addToast(`Inquisition Ambush! -12 Humanity`, 'ALERT');
    } else {
      appendLog(`[⚡ ${wasLocked ? 'BREACH' : 'MOVE'}] Entered <strong>${node.label}</strong> (+${heatGain}% Inquisition Heat).`, 'info');
    }

    if (node.hazard !== 'NONE') {
      const counterCmd = node.hazard === 'AETHYRIC_STATIC' ? 'degauss' : node.hazard === 'INQUISITION_WIRE' ? 'bypass' : 'purify';
      appendLog(`[⚠️ ROOM HAZARD ACTIVE: <strong>${node.hazard}</strong>] Run CLI directive <code style="color:#00f3ff;">${counterCmd}</code> before extracting!`, 'warn');
    }

    const newHeat = Math.min(100, currentHeat + heatGain);
    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: heatGain } });

    if (newHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`<div style="background:rgba(255,42,85,0.2);border:1px solid #ff2a55;padding:8px;color:#ff2a55;font-weight:bold;">[🚨 100% INQUISITION HEAT — TOTAL SECTOR LOCKDOWN!] Malleus Strike Teams have cordoned ${currentContract.sectorLabel}. Type <code>spoof</code> or <code>bribe</code> in CLI immediately!</div>`, 'error');
      addToast(`100% HEAT! SECTOR LOCKED DOWN!`, 'ALERT');
    } else if (newHeat >= 75 && currentHeat < 75) {
      ThaumaturgicAudio.errorBuzz();
      addToast(`WARNING: Inquisition Heat at ${newHeat}%!`, 'ALERT');
    }

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

  const handleClearRoomHazard = (expectedHazard: 'AETHYRIC_STATIC' | 'INQUISITION_WIRE' | 'MIASMA_FOG') => {
    if (!currentContract || !currentSubNode) {
      appendLog(`[-] You must breach Room 1 to enter the sub-grid first.`, 'error');
      return;
    }
    if (currentSubNode.hazard !== expectedHazard) {
      appendLog(`[i] No ${expectedHazard} present in ${currentSubNode.label}.`, 'system');
      return;
    }
    ThaumaturgicAudio.scryPing();
    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === currentSubNode.id ? { ...n, hazard: 'NONE' as const } : n
    );
    setContracts(prev => ({
      ...prev,
      [currentContract.sectorId]: { ...currentContract, subNodes: updatedNodes }
    }));
    if (expectedHazard === 'INQUISITION_WIRE') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -10 } });
      appendLog(`[+] INQUISITION WIRETAP BYPASSED in <strong>${currentSubNode.label}</strong> (-10% Inquisition Heat). Safe to run <code>extract</code>.`, 'success');
    } else {
      appendLog(`[+] HAZARD CLEARED: <strong>${expectedHazard}</strong> neutralized in ${currentSubNode.label}. Safe to run <code>extract</code>.`, 'success');
    }
    addToast(`Cleared ${expectedHazard}!`, 'SEAL');
  };

  const handleExtractSubNode = () => {
    if (!currentContract || !currentSubNode) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] You are at the Perimeter Tether. Type <code>breach 1</code> to enter Room 1 first.`, 'error');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] SECTOR LOCKDOWN (100% HEAT). Extraction blocked! Type <code>spoof</code> or <code>bribe</code> first.`, 'error');
      return;
    }
    if (currentSubNode.status === 'EXTRACTED') {
      appendLog(`[i] <strong>${currentSubNode.label}</strong> has already been swept clean.`, 'system');
      return;
    }

    // Check active room hazard!
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      const counterCmd = currentSubNode.hazard === 'AETHYRIC_STATIC' ? 'degauss' : currentSubNode.hazard === 'INQUISITION_WIRE' ? 'bypass' : 'purify';
      dispatch({ type: 'MODIFY_HUMANITY', payload: -6 });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: 10 } });
      appendLog(`[!] EXTRACTION BLOCKED BY <strong>${currentSubNode.hazard}</strong> (-6 HUM, +10% Heat)! Type <code style="color:#00f3ff;">${counterCmd}</code> in the CLI to clear the hazard first!`, 'error');
      addToast(`Hazard Blocked Extraction! Type '${counterCmd}'`, 'ALERT');
      return;
    }

    ThaumaturgicAudio.sealSuccess();
    addMicroEntropy(0.01);
    const updatedLogs = [...currentContract.discoveredLogs];

    if (currentSubNode.forensicText) {
      updatedLogs.push({
        id: `${currentSubNode.id}_log`,
        nodeLabel: currentSubNode.label,
        text: currentSubNode.forensicText
      });
      appendLog(
        `<div style="background:rgba(98,240,128,0.07);border-left:3px solid #62f080;padding:8px 10px;margin:4px 0;">` +
        `<div style="color:#62f080;font-weight:bold;">[🔍 FORENSIC ANOMALY RECORDED AT ${currentSubNode.label}]</div>` +
        `<div style="color:#ffffff;margin-top:4px;">"${currentSubNode.forensicText}"</div>` +
        `<div style="color:#ffb800;font-size:0.75rem;margin-top:4px;">-&gt; Open <strong>[F2] CODEX</strong> to cross-reference this phenomenon!</div>` +
        `</div>`,
        'success'
      );
      addToast(`Forensic Log Recorded! Check [F2] Codex.`, 'INTEL');
    }

    if (currentSubNode.nodeType === 'SHRINE' && currentSubNode.shrineYokaiId) {
      const yokai = allYokai.find(y => y.id === currentSubNode.shrineYokaiId);
      if (yokai && yokai.unlockFlag) {
        dispatch({ type: 'SET_FLAG', payload: { flagId: yokai.unlockFlag, value: true } });
        appendLog(`[⛩️ KAMI SHRINE AWAKENED] Discovered spirit relic for <strong style="color:#00f3ff;">${yokai.nameEn}</strong>!`, 'success');
        addToast(`Yokai Discovered: ${yokai.nameEn}`, 'SEAL');
      }
    }

    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      appendLog(`[📦 SALVAGE HARVESTED] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>.`, 'info');
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

  const handleInvokeYokaiPower = (yokaiId: string) => {
    const spec = YOKAI_INVOCATIONS[yokaiId] || { label: 'INVOKE', maxCharges: 1, desc: '' };
    const currentCharges = yokaiCharges[yokaiId] ?? spec.maxCharges;
    if (currentCharges <= 0) {
      handleUnbindYokai(yokaiId, 'Contract charges exhausted');
      return;
    }

    const yName = allYokai.find(y => y.id === yokaiId)?.nameEn || yokaiId;

    if (yokaiId === 'yokai_kitsune') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -30 } });
      appendLog(`[👹 ${yName.toUpperCase()} // FOXFIRE SHROUD] Illusory flames masked your trail (-30% Inquisition Heat).`, 'success');
    } else if (yokaiId === 'yokai_tengu') {
      if (!currentContract) return;
      if (state.humanity <= 5) { addToast('Requires 5 Humanity!', 'ALERT'); return; }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -5 });
      const revealedNodes = currentContract.subNodes.map(n => n.status === 'LOCKED' ? { ...n, status: 'PROBED' as const } : n);
      setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, subNodes: revealedNodes } }));
      appendLog(`[👹 ${yName.toUpperCase()} // GALE SWEEP] Mountain winds scoured the sector (-5 HUM). All room signatures revealed!`, 'success');
    } else if (yokaiId === 'yokai_baku') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -15 } });
      dispatch({ type: 'MODIFY_HUMANITY', payload: 20 });
      appendLog(`[👹 ${yName.toUpperCase()} // DEVOUR NIGHTMARE] Baku consumed local paranoia (-15% Heat, +20 Humanity).`, 'success');
    } else if (yokaiId === 'yokai_zashiki') {
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 35 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 1 } });
      appendLog(`[👹 ${yName.toUpperCase()} // FORTUNE BOON] Bestowed +35 Obols and +1 Scrap Metal before departing!`, 'success');
    } else if (yokaiId === 'yokai_kameosa') {
      if (state.humanity <= 8) { addToast('Requires 8 Humanity!', 'ALERT'); return; }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -8 });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 1 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'cursed_earth', amount: 1 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'alchemical_distillate', amount: 1 } });
      appendLog(`[👹 ${yName.toUpperCase()} // FERMENT MATTER] Turned your blood (-8 HUM) into +1 Metal, +1 Earth, and +1 Distillate!`, 'success');
    } else if (yokaiId === 'yokai_kamaitachi') {
      if (!currentContract || !selectedSubNode) return;
      if (!isAdjacentOrEntry(selectedSubNode)) {
        addToast('Select an adjacent room (or Room 1 from Perimeter) first!', 'ALERT');
        return;
      }
      const updatedNodes = currentContract.subNodes.map(n =>
        n.id === selectedSubNode.id
          ? { ...n, status: 'BREACHED' as const, hazard: 'NONE' as const, nodeType: n.nodeType === 'AMBUSH' ? ('SALVAGE' as const) : n.nodeType }
          : n
      );
      setContracts(prev => ({
        ...prev,
        [currentContract.sectorId]: {
          ...currentContract,
          activeSubNodeId: selectedSubNode.id,
          subNodes: updatedNodes
        }
      }));
      appendLog(`[👹 ${yName.toUpperCase()} // WIND SICKLE] Sliced silently into <strong>${selectedSubNode.label}</strong> (0% Heat, Ambush &amp; Hazards neutralized)!`, 'success');
    } else if (yokaiId === 'yokai_amabie') {
      if ((state.inventory.obols || 0) < 10) { addToast('Requires 10 Obols!', 'ALERT'); return; }
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } });
      addMicroEntropy(-2.5);
      appendLog(`[👹 ${yName.toUpperCase()} // PROPHETIC WARD] Purged -2.50% Global Entropy (-10 Obols).`, 'success');
    } else if (yokaiId === 'yokai_noppera') {
      if (currentContract) {
        const disarmNodes = currentContract.subNodes.map(n =>
          n.nodeType === 'AMBUSH' ? { ...n, nodeType: 'SALVAGE' as const, hazard: 'NONE' as const, status: 'PROBED' as const } : n
        );
        setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, subNodes: disarmNodes } }));
      }
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -15 } });
      appendLog(`[👹 ${yName.toUpperCase()} // FACELESS DECOY] Disarmed sector Inquisition ambushes and dropped Heat by -15%.`, 'success');
    }

    ThaumaturgicAudio.scryPing();
    const remaining = currentCharges - 1;
    setYokaiCharges(prev => ({ ...prev, [yokaiId]: remaining }));

    if (remaining <= 0) {
      handleUnbindYokai(yokaiId, 'All charges expended');
    } else {
      addToast(`${yName}: ${remaining}/${spec.maxCharges} Charges Left`, 'SEAL');
    }
  };

  // --- CLI COMMAND PROCESSOR ---
  const processCliCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    appendLog(`<span style="color:#62f080;">root@${state.playerName.toLowerCase() || 'operative'}:~#</span> ${trimmed}`, 'command');

    if (cmd === 'help' || cmd === '?') {
      appendLog(
        `<div style="background:rgba(31,61,38,0.25);border:1px solid #1f3d26;padding:10px;line-height:1.6;">` +
        `<strong style="color:#62f080;">FIELD OPS CLI DIRECTIVES:</strong><br/>` +
        `• <code style="color:#ffb800;">probe [1-6]</code> — Scan room # (or selected room) for Ambushes, Shrines &amp; Hazards<br/>` +
        `• <code style="color:#ffb800;">breach [1-6]</code> / <code style="color:#ffb800;">move [1-6]</code> — Breach or enter room #<br/>` +
        `• <code style="color:#ffb800;">extract</code> — Harvest forensic clue, shrine relic, &amp; salvage from current room<br/>` +
        `• <code style="color:#00f3ff;">degauss</code> | <code style="color:#00f3ff;">bypass</code> | <code style="color:#00f3ff;">purify</code> — Clear Static, Wiretaps, or Miasma hazards<br/>` +
        `• <code style="color:#ff2a55;">spoof</code> (-15 Obols: -25% Heat) | <code style="color:#ff2a55;">bribe</code> (-25 Obols: -45% Heat, clears 100% Lockdown)<br/>` +
        `• <code style="color:#62f080;">status</code> | <code style="color:#62f080;">map</code> | <code style="color:#62f080;">codex</code> | <code style="color:#62f080;">safehouse</code> | <code style="color:#62f080;">horsemen</code> | <code style="color:#62f080;">clear</code>` +
        `</div>`,
        'info'
      );
    } else if (cmd === 'probe' || cmd === 'scan') {
      handleProbeSubNode(resolveTargetRoom(arg));
    } else if (cmd === 'breach' || cmd === 'move' || cmd === 'enter' || cmd === 'node') {
      handleBreachOrMoveSubNode(resolveTargetRoom(arg));
    } else if (cmd === 'extract' || cmd === 'loot') {
      handleExtractSubNode();
    } else if (cmd === 'degauss') {
      handleClearRoomHazard('AETHYRIC_STATIC');
    } else if (cmd === 'bypass') {
      handleClearRoomHazard('INQUISITION_WIRE');
    } else if (cmd === 'purify') {
      handleClearRoomHazard('MIASMA_FOG');
    } else if (cmd === 'spoof') {
      if ((state.inventory.obols || 0) < 15) {
        ThaumaturgicAudio.errorBuzz();
        appendLog(`[-] Frequency Spoofing requires 15 Obols.`, 'error');
        return;
      }
      ThaumaturgicAudio.scryPing();
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -15 } });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -25 } });
      appendLog(`[📡 SIGNAL SPOOFED] Broadcasted phantom telemetry to Malleus vans (-15 Obols, -25% Inquisition Heat).`, 'success');
      addToast(`Inquisition Heat -25%`, 'SEAL');
    } else if (cmd === 'bribe') {
      if ((state.inventory.obols || 0) < 25) {
        ThaumaturgicAudio.errorBuzz();
        appendLog(`[-] Bribing Malleus Watch constables requires 25 Obols.`, 'error');
        return;
      }
      ThaumaturgicAudio.sealSuccess();
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -25 } });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -45 } });
      appendLog(`[🪙 INQUISITION BRIBED] Paid 25 Obols to corrupt Malleus Watch officers (-45% Inquisition Heat; Cordon lifted).`, 'success');
      addToast(`Inquisition Cordon Lifted (-45% Heat)!`, 'SEAL');
    } else if (cmd === 'status' || cmd === 'look') {
      if (!currentContract) return;
      appendLog(`[+] SECTOR: <strong>${currentContract.sectorLabel}</strong> | POSITION: <strong>${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}</strong> | HEAT: <strong>${currentHeat}%</strong>`, 'info');
      currentContract.subNodes.forEach(n => {
        const reach = isAdjacentOrEntry(n) ? '<span style="color:#62f080;">[ADJACENT]</span>' : '';
        const haz = n.status !== 'LOCKED' && n.hazard !== 'NONE' ? `<span style="color:#ffb800;">[HAZARD: ${n.hazard}]</span>` : '';
        appendLog(`  Room ${n.index}: <strong>${n.label}</strong> [${n.status}] ${reach} ${haz}`, 'normal');
      });
    } else if (cmd === 'map') {
      setMapViewMode(prev => prev === 'SUB_GRID' ? 'GEO_TRACKER' : 'SUB_GRID');
    } else if (cmd === 'codex') {
      setViewport('CODEX');
    } else if (cmd === 'kage') {
      setViewport('KAGE_NO_SHO');
    } else if (cmd === 'safehouse' || cmd === 'altar') {
      setViewport('SAFEHOUSE_ALTAR');
    } else if (cmd === 'horsemen') {
      setViewport('HORSEMEN');
    } else if (cmd === 'dossier') {
      setViewport('DOSSIER');
    } else if (cmd === 'manual') { 
      setViewport('MANUAL'); 
    } else if (cmd === 'clear' || cmd === 'cls') {
      setTerminalLines([]);
    } else {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Unknown directive "${cmd}". Type <code>help</code> for tactical CLI syntax.`, 'error');
    }
  };

  // --- CANVAS RENDERING LOOP (WITH ZOOM & PAN TRANSFORM) ---
  useEffect(() => {
    if (state.gameStage !== 'ACTIVE' || viewport !== 'FIELD_OPS') return;
    let animId: number;

    const renderLoop = () => {
      const fx = visualFxRef.current;
      fx.angle += 0.025;
      const heat = state.sectorEntropy[state.currentNode] || 0;
      fx.wavePhase += 0.14 + (heat / 220);

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

          // Background Grid
          ctx.strokeStyle = 'rgba(74, 124, 89, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
          for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

          // Apply Zoom & Pan Transform around Canvas Center
          ctx.save();
          ctx.translate(w / 2 + mapPan.x, h / 2 + mapPan.y);
          ctx.scale(mapZoom, mapZoom);
          ctx.translate(-w / 2, -h / 2);

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
            const sectorSecured = isSectorSecured(currentContract.sectorId);

            currentContract.subNodes.forEach(node => {
              node.connections.forEach(tid => {
                const target = currentContract.subNodes.find(n => n.id === tid);
                if (!target) return;
                ctx.beginPath();
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.strokeStyle = sectorSecured
                  ? 'rgba(98, 240, 128, 0.55)'
                  : node.status !== 'LOCKED' && target.status !== 'LOCKED'
                  ? 'rgba(98, 240, 128, 0.4)'
                  : 'rgba(74, 124, 89, 0.22)';
                ctx.lineWidth = 1.6;
                ctx.stroke();
              });
            });

            currentContract.subNodes.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === currentContract.activeSubNodeId;
              const isSelected = node.id === currentContract.selectedSubNodeId;

              let color = '#ff2a55';
              if (sectorSecured || node.status === 'EXTRACTED') color = '#62f080';
              else if (node.status === 'PROBED') {
                color = node.nodeType === 'AMBUSH' ? '#ff2a55' : node.nodeType === 'SHRINE' ? '#00f3ff' : '#ffb800';
              } else if (node.status === 'BREACHED') color = '#ffb800';

              ctx.save();
              ctx.translate(nx, ny);
              ctx.rotate(isCurrent ? fx.angle : -fx.angle * 0.5);
              ctx.beginPath();
              const r = isCurrent ? 21 : 16;
              for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
                else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
              }
              ctx.closePath();
              ctx.strokeStyle = isSelected ? '#ffffff' : color;
              ctx.lineWidth = isSelected ? 2.4 : 1.5;
              ctx.stroke();
              ctx.restore();

              ctx.beginPath();
              ctx.arc(nx, ny, 5, 0, Math.PI * 2);
              ctx.fillStyle = isCurrent ? '#62f080' : '#050706';
              ctx.fill();
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.font = 'bold 11px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = isSelected ? '#ffffff' : '#a8ccaf';
              ctx.fillText(node.label, nx, ny + 30);

              let subBadge = sectorSecured ? '[SECURED]' : `[${node.status}]`;
              if (!sectorSecured && node.status === 'PROBED') {
                subBadge = node.nodeType === 'AMBUSH' ? '[! AMBUSH !]' : node.nodeType === 'SHRINE' ? '[SHRINE]' : node.nodeType === 'ANCHOR' ? '[ANCHOR]' : '[ANOMALY]';
              }
              ctx.font = '10px "Courier New", monospace';
              ctx.fillStyle = color;
              ctx.fillText(subBadge, nx, ny + 42);

              if (node.status !== 'LOCKED' && node.hazard !== 'NONE' && !sectorSecured) {
                ctx.fillStyle = '#00f3ff';
                ctx.fillText(`! ${node.hazard} !`, nx, ny - 22);
              }
            });
          } else {
            // DRAW 16-SECTOR REGIONAL CAMPAIGN MAP
            MACRO_SECTORS.forEach(node => {
              const unlockedA = isSectorUnlocked(node);
              node.connections.forEach(tid => {
                const target = MACRO_SECTORS.find(n => n.id === tid);
                if (!target) return;
                const unlockedB = isSectorUnlocked(target);
                ctx.beginPath();
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.strokeStyle = unlockedA && unlockedB ? 'rgba(98, 240, 128, 0.35)' : 'rgba(42, 82, 51, 0.15)';
                ctx.lineWidth = unlockedA && unlockedB ? 1.5 : 0.9;
                ctx.stroke();
              });
            });

            MACRO_SECTORS.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === state.currentNode;
              const secured = isSectorSecured(node.id);
              const unlocked = isSectorUnlocked(node);
              const nodeHeat = state.sectorEntropy[node.id] || 0;

              let color = '#2a5233';
              if (node.id === 'safehouse') color = '#00f3ff';
              else if (secured) color = '#62f080';
              else if (unlocked) color = nodeHeat >= 75 ? '#ff2a55' : '#ffb800';

              ctx.beginPath();
              ctx.arc(nx, ny, isCurrent ? 13 : unlocked ? 9 : 5, 0, Math.PI * 2);
              ctx.fillStyle = secured ? 'rgba(98, 240, 128, 0.25)' : '#050706';
              ctx.fill();
              ctx.strokeStyle = isCurrent ? '#ffffff' : color;
              ctx.lineWidth = isCurrent ? 2.5 : 1.8;
              ctx.stroke();

              ctx.font = unlocked ? 'bold 10px "Courier New", monospace' : '9px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = isCurrent ? '#ffffff' : unlocked ? '#a8ccaf' : '#2a5233';
              ctx.fillText(unlocked ? node.short : '??? [LOCKED]', nx, ny + 23);

              if (unlocked) {
                ctx.font = '9px "Courier New", monospace';
                ctx.fillStyle = color;
                const statusTxt = node.id === 'safehouse' ? '[SAFEHOUSE]' : secured ? '✓ SECURED' : `HEAT:${nodeHeat}%`;
                ctx.fillText(statusTxt, nx, ny + 34);
              }
            });
          }

          ctx.restore();
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
          const amp = Math.min(h / 2 - 2, 3 + (heat / 10));
          ctx.beginPath();
          ctx.strokeStyle = heat >= 75 ? '#ff2a55' : heat >= 35 ? '#ffb800' : '#62f080';
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
  }, [state.gameStage, viewport, mapViewMode, currentContract, state.currentNode, state.sectorEntropy, state.flags, mapZoom, mapPan]);

  // Convert Mouse Screen Coordinates into Zoomed/Panned Canvas World Coordinates
  const getWorldCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return { wx: 0, wy: 0, w: 1, h: 1 };
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
    const wx = (sx - w / 2 - mapPan.x) / mapZoom + w / 2;
    const wy = (sy - h / 2 - mapPan.y) / mapZoom + h / 2;
    return { wx, wy, w, h };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isPanningRef.current = true;
    didDragRef.current = false;
    panStartRef.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.hypot(dx - mapPan.x, dy - mapPan.y) > 4) {
      didDragRef.current = true;
    }
    setMapPan({ x: dx, y: dy });
  };

  const handleCanvasMouseUp = () => {
    isPanningRef.current = false;
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    setMapZoom(prev => Math.min(2.8, Math.max(0.6, +(prev + delta).toFixed(2))));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (didDragRef.current) return;
    const { wx, wy, w, h } = getWorldCoords(e);

    if (mapViewMode === 'SUB_GRID' && currentContract) {
      for (const node of currentContract.subNodes) {
        const nx = node.x * w;
        const ny = node.y * h;
        if (Math.hypot(wx - nx, wy - ny) <= 28) {
          ThaumaturgicAudio.keyClick();
          setContracts(prev => ({
            ...prev,
            [currentContract.sectorId]: { ...currentContract, selectedSubNodeId: node.id }
          }));
          visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 0.9 });
          cliInputRef.current?.focus();
          break;
        }
      }
    } else {
      for (const sec of MACRO_SECTORS) {
        const nx = sec.x * w;
        const ny = sec.y * h;
        if (Math.hypot(wx - nx, wy - ny) <= 24) {
          if (!isSectorUnlocked(sec)) {
            ThaumaturgicAudio.errorBuzz();
            addToast(`Sector Locked! Secure an adjacent sector first to open this ley-line.`, 'ALERT');
            return;
          }
          ThaumaturgicAudio.scryPing();
          addMicroEntropy(0.02); // Travel time increases Global Entropy by +0.02%
          setDeducedSigns([]);
          if (sec.id === 'safehouse') {
            travelTo('safehouse');
            setViewport('SAFEHOUSE_ALTAR');
          } else {
            travelTo(sec.id);
            setMapViewMode('SUB_GRID');
            const statusNote = isSectorSecured(sec.id) ? '[SECTOR SECURED]' : '[ACTIVE RUPTURE]';
            appendLog(`[*] ROUTED TETHER TO SECTOR: <strong style="color:#62f080;">${sec.label}</strong> (${sec.region}) ${statusNote}. (+0.02% Global Entropy)`, 'info');
          }
          break;
        }
      }
    }
  };

  // Secure Logout Handler (Returns to Start Screen without deleting save)
  const handleLogout = () => {
    ThaumaturgicAudio.keyClick();
    dispatch({ type: 'LOAD_GAME', payload: { ...state, gameStage: 'START_SCREEN' } });
  };

  if (state.gameStage === 'START_SCREEN') {
    return (
      <>
        {showManual && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: theme.bgDark, zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>SYNDICATE FIELD MANUAL // PRE-DEPLOYMENT BRIEFING</span>
              <button onClick={() => setShowManual(false)} style={{ padding: '5px 12px', backgroundColor: '#2a0808', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.74rem' }}>
                [X] RETURN TO LOGIN
              </button>
            </div>
            <ManualViewport fontScale={fontScale} />
          </div>
        )}
        <StartScreen onStart={startInvestigation} onLoad={loadGame} onOpenManual={() => setShowManual(true)} />
      </>
    );
  }

  // Current Sector's active clue count (Resets to 0 when sector is secured!)
  const activeSectorClueCount = currentContract && !isSectorSecured(currentContract.sectorId)
    ? currentContract.discoveredLogs.length
    : 0;

  const filteredCodexGoetia = allGoetia.filter(g => {
    if (codexHorsemanFilter !== 'ALL' && g.allegiance !== codexHorsemanFilter) return false;
    if (deducedSigns.length === 0) return true;
    return deducedSigns.every(tag => g.requiredIntel.includes(tag));
  });

  const selectedSuspect = allGoetia.find(g => g.id === selectedSuspectId) || allGoetia[0];
  const securedSectorsCount = MACRO_SECTORS.filter(s => s.id !== 'safehouse' && isSectorSecured(s.id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, overflow: 'hidden', userSelect: 'none' }}>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes slowPulse { 0%, 100% { opacity: 0.6; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); text-shadow: 0 0 15px #ff2a55; } }
        @keyframes slideInRight { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes sigilGlitch {
          0%, 100% { transform: translate(0, 0) scale(1); filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(90%) blur(2.5px); }
          25% { transform: translate(-3px, 1px) skewX(6deg); filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(130%) blur(1.5px) drop-shadow(4px 0 #ff2a55); }
          50% { transform: translate(2px, -2px) scale(1.03); filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(70%) blur(3.5px); }
          75% { transform: translate(-2px, -1px) skewX(-6deg); filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(120%) blur(2px) drop-shadow(-4px 0 #00f3ff); }
        }
        .crt-scanlines {
          pointer-events: none; position: fixed; inset: 0; z-index: 50;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), radial-gradient(circle at center, transparent 65%, rgba(0, 5, 2, 0.6) 100%);
          background-size: 100% 3px, 100% 100%;
        }
        .macro-chip {
          background: rgba(98, 240, 128, 0.07); border: 1px solid #1f3d26; color: #62f080;
          padding: 5px 10px; font-family: inherit; font-size: 0.74rem; cursor: pointer; white-space: nowrap; transition: all 0.15s;
        }
        .macro-chip:hover:not(:disabled) { background: rgba(98, 240, 128, 0.2); border-color: #62f080; }
        .macro-chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .macro-chip-amber { background: rgba(255, 184, 0, 0.09); border-color: rgba(255, 184, 0, 0.45); color: #ffb800; }
        .macro-chip-danger { background: rgba(255, 42, 85, 0.12); border-color: rgba(255, 42, 85, 0.5); color: #ff2a55; }
        .viewport-tab {
          padding: 6px 10px; font-family: inherit; font-size: 0.72rem; font-weight: bold; letter-spacing: 0.5px;
          cursor: pointer; border: 1px solid #1f3d26; background: #060907; color: #4a7c59; transition: all 0.15s;
        }
        .viewport-tab.active {
          background: #62f080; color: #000000; border-color: #62f080; box-shadow: 0 0 12px rgba(98, 240, 128, 0.35);
        }
      `}</style>

      <div className="crt-scanlines" />
      

      {/* ================================================================== */}
      {/* TOP TACTICAL BAR: 6-VIEWPORT SWITCHER, TEXT SIZE, MANUAL & LOGOUT  */}
      {/* ================================================================== */}
      <header style={{ height: '48px', flexShrink: 0, backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className={`viewport-tab ${viewport === 'FIELD_OPS' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('FIELD_OPS'); }}>
            [F1] FIELD_OPS
          </button>
          <button className={`viewport-tab ${viewport === 'CODEX' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('CODEX'); }}>
            [F2] CODEX ({activeSectorClueCount})
          </button>
          <button className={`viewport-tab ${viewport === 'KAGE_NO_SHO' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('KAGE_NO_SHO'); }}>
            [F3] KAGE_NO_SHO ({state.tetheredYokai.length}/2)
          </button>
          <button className={`viewport-tab ${viewport === 'SAFEHOUSE_ALTAR' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('SAFEHOUSE_ALTAR'); }}>
            [F4] SAFEHOUSE / ALTAR
          </button>
          <button
            className={`viewport-tab ${viewport === 'HORSEMEN' ? 'active' : ''}`}
            onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('HORSEMEN'); }}
            style={viewport !== 'HORSEMEN' ? { borderColor: theme.accentRed, color: theme.accentRed } : undefined}
          >
            [F5] THE 4 HORSEMEN
          </button>
          <button className={`viewport-tab ${viewport === 'DOSSIER' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('DOSSIER'); }}>
            [F6] DOSSIER
          </button>
          <button className={`viewport-tab ${viewport === 'MANUAL' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('MANUAL'); }}>
            [F7] MANUAL
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ padding: '4px 7px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentRed }}>
            ENTROPY: <strong>{totalGlobalEntropy.toFixed(2)}%</strong>
          </span>

          <span style={{ padding: '4px 7px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: state.humanity < 40 ? theme.accentRed : theme.textBright }}>
            HUM: <strong>{state.humanity}%</strong>
          </span>

          <span style={{ padding: '4px 7px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentAmber, fontWeight: 'bold' }}>
            OBOLS: {state.inventory.obols || 0}
          </span>

          {/* Text Scale Toggle */}
          <button
            onClick={() => {
              ThaumaturgicAudio.keyClick();
              setFontScale(prev => prev === 'SM' ? 'MD' : prev === 'MD' ? 'LG' : 'SM');
            }}
            title="Cycle Interface Text Size (SM / MD / LG)"
            className="macro-chip"
            style={{ padding: '4px 7px' }}
          >
            TXT:{fontScale}
          </button>

          <button onClick={() => { ThaumaturgicAudio.enabled = !audioEnabled; setAudioEnabled(!audioEnabled); }} style={{ padding: '4px 7px', backgroundColor: 'transparent', border: `1px solid ${theme.borderTerminal}`, color: theme.textTerminal, cursor: 'pointer' }}>
            {audioEnabled ? '🔊' : '🔇'}
          </button>

          {/* Log Out Button */}
          <button onClick={handleLogout} className="macro-chip macro-chip-danger" style={{ padding: '4px 8px' }} title="Save & Return to Start Screen">
            LOG OUT
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* VIEWPORT 1: [F1] FIELD_OPS (SUB-GRID, ZOOM/PAN MAP & CLI CONSOLE)  */}
      {/* ================================================================== */}
      {viewport === 'FIELD_OPS' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '8px', padding: '8px' }}>
          <section style={{ width: '52%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>

            {/* Inquisition Heat & High-Risk Alert Banner */}
            <div style={{ backgroundColor: currentHeat >= 75 ? '#1f050a' : theme.bgPanel, border: `1px solid ${currentHeat >= 75 ? theme.accentRed : theme.borderTerminal}`, padding: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '6px' }}>
                <span style={{ color: theme.textBright, fontWeight: 'bold' }}>
                  {currentContract?.sectorLabel || formatLabel(state.currentNode)} // POS: {currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}
                </span>
                <span style={{ color: currentHeat >= 75 ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>
                  INQUISITION HEAT: {currentHeat}% {currentHeat >= 100 ? '[LOCKED DOWN!]' : currentHeat >= 75 ? '[CRITICAL!]' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '10px', backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, padding: '1px' }}>
                  <div style={{ width: `${currentHeat}%`, height: '100%', backgroundColor: currentHeat >= 75 ? theme.accentRed : currentHeat >= 35 ? theme.accentAmber : theme.textBright, transition: 'width 0.25s' }} />
                </div>
                <canvas ref={waveformCanvasRef} width={96} height={22} style={{ backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, flexShrink: 0 }} />
              </div>
              {currentHeat >= 75 && (
                <div style={{ marginTop: '6px', color: theme.accentRed, fontSize: '0.74rem', fontWeight: 'bold', animation: 'blink 1s infinite' }}>
                  {currentHeat >= 100
                    ? '🚨 ORDO MALLEUS LOCKDOWN ACTIVE (100% HEAT): All room actions blocked! Type `spoof` (-15 Obols) or `bribe` (-25 Obols) in CLI!'
                    : '⚠️ WARNING: Malleus Witch-Hound triangulation at 75%+! Type `spoof` in CLI or retreat to Safehouse before Heat hits 100%!'}
                </div>
              )}
            </div>

            {/* Interactive Sub-Grid / 16-Sector Geo-Tracker Canvas with Zoom & Pan */}
            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => { setMapViewMode('SUB_GRID'); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className={`macro-chip ${mapViewMode === 'SUB_GRID' ? 'macro-chip-amber' : ''}`}>LOCAL SUB-GRID</button>
                  <button onClick={() => { setMapViewMode('GEO_TRACKER'); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className={`macro-chip ${mapViewMode === 'GEO_TRACKER' ? 'macro-chip-amber' : ''}`}>REGIONAL MAP ({securedSectorsCount}/16)</button>
                </div>

                {/* Zoom & Pan Controls */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: 'rgba(5,7,6,0.9)', padding: '3px 6px', border: `1px solid ${theme.borderTerminal}` }}>
                  <span style={{ color: theme.textMuted, marginRight: '4px' }}>ZOOM: {Math.round(mapZoom * 100)}%</span>
                  <button onClick={() => setMapZoom(z => Math.min(2.8, +(z + 0.25).toFixed(2)))} className="macro-chip" style={{ padding: '2px 7px' }}>+</button>
                  <button onClick={() => setMapZoom(z => Math.max(0.6, +(z - 0.25).toFixed(2)))} className="macro-chip" style={{ padding: '2px 7px' }}>-</button>
                  <button onClick={() => { setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className="macro-chip" style={{ padding: '2px 7px' }}>RESET</button>
                </div>
              </div>

              <canvas
                ref={mapCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleCanvasWheel}
                onClick={handleCanvasClick}
                style={{ width: '100%', height: '100%', display: 'block', cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
              />

              {/* Bottom Status Strip (CLI Driven — No Clickable Probe/Breach/Extract Buttons!) */}
              {mapViewMode === 'SUB_GRID' && selectedSubNode && (
                <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(5,7,6,0.94)', border: `1px solid ${theme.borderTerminal}`, padding: '8px 12px', zIndex: 10, fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: theme.textMuted }}>SELECTED: </span>
                    <strong style={{ color: theme.textBright }}>{selectedSubNode.label}</strong>
                    <span style={{ marginLeft: '8px', color: theme.accentAmber }}>[{selectedSubNode.status}]</span>
                    {selectedSubNode.status !== 'LOCKED' && selectedSubNode.hazard !== 'NONE' && (
                      <span style={{ marginLeft: '8px', color: theme.accentCyan }}>[HAZARD: {selectedSubNode.hazard}]</span>
                    )}
                  </div>
                  <div style={{ color: '#a8ccaf', fontSize: '0.72rem' }}>
                    CLI: <code style={{ color: theme.accentAmber }}>probe {selectedSubNode.index}</code> | <code style={{ color: theme.accentAmber }}>breach {selectedSubNode.index}</code> | <code style={{ color: theme.accentAmber }}>extract</code>
                  </div>
                </div>
              )}
            </div>

            {/* Active Shikigami & Raw Salvage Strip */}
            <div style={{ height: '108px', flexShrink: 0, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '10px', display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.textBright, fontWeight: 'bold', marginBottom: '6px' }}>ACTIVE SHIKIGAMI TETHER ({state.tetheredYokai.length}/2)</div>
                {state.tetheredYokai.length === 0 ? (
                  <div style={{ color: theme.textMuted }}>No Yokai bound. Open <strong style={{ color: theme.textBright }}>[F3] KAGE_NO_SHO</strong> to bind spirits.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {state.tetheredYokai.map(yid => {
                      const y = allYokai.find(item => item.id === yid);
                      const spec = YOKAI_INVOCATIONS[yid] || { label: 'INVOKE', maxCharges: 1, desc: '' };
                      const charges = yokaiCharges[yid] ?? spec.maxCharges;
                      return (
                        <div key={yid} style={{ flex: 1, padding: '6px 8px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: theme.textBright, fontSize: '0.72rem' }}>{y?.nameEn}</strong>
                            <span style={{ color: theme.accentAmber, fontSize: '0.66rem' }}>[{charges}/{spec.maxCharges} USES]</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleInvokeYokaiPower(yid)} title={spec.desc} className="macro-chip macro-chip-amber" style={{ flex: 1, padding: '3px 6px', fontSize: '0.66rem', textAlign: 'center' }}>
                              ⚡ {spec.label}
                            </button>
                            <button onClick={() => handleUnbindYokai(yid, 'Manually severed by operative')} title="Sever Pact & Unbind Spirit" className="macro-chip macro-chip-danger" style={{ padding: '3px 6px', fontSize: '0.66rem' }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ width: '230px', borderLeft: `1px dashed ${theme.borderTerminal}`, paddingLeft: '12px' }}>
                <div style={{ color: theme.accentAmber, fontWeight: 'bold', marginBottom: '4px' }}>RAW SALVAGE IN STORAGE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scrap Metal:</span> <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cursed Earth:</span> <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Alch. Distillate:</span> <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></div>
              </div>
            </div>
          </section>

          {/* RIGHT PANE: FIELD FORENSIC CLI CONSOLE */}
          <section style={{ width: '48%', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, overflow: 'hidden', zoom: FONT_ZOOM_MAP[fontScale] }}>
            <div style={{ height: '32px', backgroundColor: '#040805', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', flexShrink: 0 }}>
              <span><strong style={{ color: theme.textBright }}>● TTY1 CONSOLE</strong> // {currentContract?.sectorLabel} ({activeSectorClueCount}/3 Clues)</span>
              <span style={{ color: theme.accentAmber }}>VESSEL: {state.sealedGoetia.length}/72 SEALED</span>
            </div>

            <div onClick={() => cliInputRef.current?.focus()} style={{ flex: 1, padding: '14px', overflowY: 'auto', fontSize: '0.82rem', lineHeight: '1.58', backgroundColor: '#030504', userSelect: 'text', cursor: 'text' }}>
              {terminalLines.map(line => {
                const colorMap = { normal: '#a8ccaf', info: '#62f080', system: '#4a7c59', success: '#62f080', warn: '#ffb800', error: '#ff2a55', command: '#ffffff' };
                return <div key={line.id} style={{ color: colorMap[line.type], marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: line.html }} />;
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* CLI Syntax Reference Strip (No Auto-Click Field Action Buttons) */}
            <div style={{ backgroundColor: '#050906', borderTop: `1px solid ${theme.borderTerminal}`, padding: '6px 12px', fontSize: '0.7rem', color: '#a8ccaf', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span>SYNTAX: <code style={{ color: theme.accentAmber }}>probe [1-6]</code> | <code style={{ color: theme.accentAmber }}>breach [1-6]</code> | <code style={{ color: theme.accentAmber }}>extract</code></span>
              <span>HAZARDS: <code style={{ color: theme.accentCyan }}>degauss</code> | <code style={{ color: theme.accentCyan }}>bypass</code> | <code style={{ color: theme.accentCyan }}>purify</code></span>
              <span>HEAT: <code style={{ color: theme.accentRed }}>spoof</code> | <code style={{ color: theme.accentRed }}>bribe</code></span>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!cliInput.trim()) return;
                processCliCommand(cliInput);
                setCliInput('');
              }}
              style={{ height: '42px', backgroundColor: '#000', borderTop: `1px solid ${theme.borderTerminal}`, padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem' }}>root@os:~#</span>
              <input
                ref={cliInputRef}
                autoFocus
                value={cliInput}
                onChange={e => setCliInput(e.target.value)}
                placeholder="Type directive (e.g. probe 1, breach 1, extract, degauss, spoof, help)..."
                style={{ flex: 1, backgroundColor: 'transparent', color: theme.textBright, border: 'none', outline: 'none', fontFamily: theme.fontMono, fontSize: '0.82rem' }}
              />
              <button type="submit" className="macro-chip">EXEC</button>
            </form>
          </section>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 2: [F2] GOETIAN_CODEX (MANUAL DEDUCTION & SIGIL MATRIX)   */}
      {/* ================================================================== */}
      {viewport === 'CODEX' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '10px', padding: '10px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <section style={{ width: '34%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            <div style={{ height: '40%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>1. ACTIVE SECTOR CLUES ({activeSectorClueCount})</span>
                <span style={{ color: theme.accentAmber }}>{currentContract?.sectorLabel}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!currentContract || isSectorSecured(currentContract.sectorId)) ? (
                  <div style={{ color: theme.textBright }}>
                    ✓ {currentContract?.sectorLabel || 'Sector'} has been permanently SECURED and its logs archived. Deploy to a new sector on the Regional Map!
                  </div>
                ) : currentContract.discoveredLogs.length === 0 ? (
                  <div style={{ color: theme.textMuted, fontStyle: 'italic' }}>
                    No forensic logs extracted in {currentContract.sectorLabel} yet. Return to [F1] FIELD_OPS and run <code>probe 1</code> &rarr; <code>breach 1</code> &rarr; <code>extract</code>.
                  </div>
                ) : (
                  currentContract.discoveredLogs.map((log, i) => (
                    <div key={log.id} style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.textBright}` }}>
                      <div style={{ color: theme.accentAmber, fontWeight: 'bold', fontSize: '0.72rem' }}>CLUE #{i + 1} // {log.nodeLabel}</div>
                      <div style={{ color: '#ffffff', marginTop: '3px' }}>"{log.text}"</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
                <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem' }}>2. DEDUCE PHENOMENA ({deducedSigns.length}/3)</span>
                {deducedSigns.length > 0 && (
                  <button onClick={() => setDeducedSigns([])} className="macro-chip macro-chip-danger" style={{ padding: '2px 8px' }}>CLEAR FILTERS</button>
                )}
              </div>
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
                        padding: '7px 8px', textAlign: 'left',
                        backgroundColor: isChecked ? 'rgba(98, 240, 128, 0.2)' : '#030504',
                        border: `1px solid ${isChecked ? theme.textBright : theme.borderTerminal}`,
                        color: isChecked ? theme.textBright : '#a8ccaf',
                        cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.74rem'
                      }}
                    >
                      {isChecked ? '[X] ' : '[ ] '} {phenom.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section style={{ width: '34%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.82rem' }}>3. MATCHING GOETIA ({filteredCodexGoetia.length}/72)</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => (
                  <button key={h} onClick={() => setCodexHorsemanFilter(h)} className={`macro-chip ${codexHorsemanFilter === h ? 'macro-chip-amber' : ''}`} style={{ padding: '2px 6px', fontSize: '0.68rem' }}>
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
                      padding: '8px 10px', textAlign: 'left',
                      backgroundColor: isSelected ? '#112217' : '#030504',
                      border: `1px solid ${isSelected ? theme.textBright : theme.borderTerminal}`,
                      color: isSealed ? theme.textMuted : theme.textBright,
                      cursor: 'pointer', fontFamily: theme.fontMono,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>#{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#a8ccaf' }}>{g.rank} of {g.allegiance} — {g.title}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem', padding: '2px 6px',
                        border: isSealed ? `1px solid ${theme.accentRed}` : 'none',
                        backgroundColor: isSealed ? 'rgba(255, 42, 85, 0.12)' : 'transparent',
                        color: isSealed ? theme.accentRed : theme.accentAmber,
                        fontWeight: isSealed ? 'bold' : 'normal'
                      }}
                    >
                      {isSealed ? '✗ SEALED' : '[INSPECT]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

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

              {(() => {
                const isTargetSealed = state.sealedGoetia.includes(selectedSuspect.id);
                return (
                  <div
                    style={{
                      position: 'relative', width: '145px', height: '145px', margin: '0 auto 12px auto',
                      backgroundColor: '#030504',
                      border: `1px solid ${isTargetSealed ? theme.accentRed : theme.borderTerminal}`,
                      borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      overflow: 'hidden',
                      boxShadow: isTargetSealed ? 'inset 0 0 20px rgba(255, 42, 85, 0.2)' : 'inset 0 0 15px rgba(98, 240, 128, 0.08)'
                    }}
                  >
                    <img
                      src={`/seals/${selectedSuspect.id}.png`}
                      alt={`${selectedSuspect.name} Seal`}
                      style={{
                        width: '118px', height: '118px',
                        opacity: isTargetSealed ? 0.85 : 0.22,
                        filter: isTargetSealed ? 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' : undefined,
                        animation: isTargetSealed ? 'none' : 'sigilGlitch 2.2s infinite steps(2)',
                        pointerEvents: 'none'
                      }}
                    />
                    {!isTargetSealed && (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 2px, transparent 2px, transparent 4px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', backgroundColor: 'rgba(5, 7, 6, 0.88)', border: `1px dashed ${theme.borderTerminal}`, padding: '3px 8px', fontSize: '0.62rem', color: theme.accentAmber, letterSpacing: '1px', fontWeight: 'bold' }}>
                          [ SIGIL_OBSCURED ]
                        </div>
                      </>
                    )}
                    {isTargetSealed && (
                      <>
                        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                          <line x1="12" y1="12" x2="88" y2="88" stroke={theme.accentRed} strokeWidth="3.5" strokeOpacity="0.85" />
                          <line x1="88" y1="12" x2="12" y2="88" stroke={theme.accentRed} strokeWidth="3.5" strokeOpacity="0.85" />
                        </svg>
                        <div style={{ position: 'absolute', transform: 'rotate(-14deg)', border: `2px solid ${theme.accentRed}`, backgroundColor: 'rgba(15, 2, 2, 0.92)', color: theme.accentRed, padding: '3px 10px', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '3px', boxShadow: '0 0 12px rgba(255, 42, 85, 0.6)' }}>
                          [SEALED]
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <p style={{ fontSize: '0.78rem', color: '#a8ccaf', lineHeight: '1.55', padding: '10px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}` }}>
                {selectedSuspect.description}
              </p>

              <div style={{ marginTop: '12px', padding: '10px', border: `1px dashed ${theme.borderTerminal}`, backgroundColor: '#030504' }}>
                <div style={{ fontSize: '0.74rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '6px' }}>KNOWN MANIFESTATION SIGNS:</div>
                {selectedSuspect.requiredIntel.map(tag => {
                  const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
                  const isToggled = deducedSigns.includes(tag);
                  return (
                    <div key={tag} style={{ fontSize: '0.74rem', marginBottom: '4px', color: isToggled ? theme.textBright : '#a8ccaf' }}>
                      {isToggled ? '✓ ' : '• '} <strong>{def?.label || formatLabel(tag)}</strong>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px', padding: '10px', border: `1px solid ${theme.accentRed}`, backgroundColor: '#030504' }}>
                <div style={{ fontSize: '0.74rem', color: theme.accentRed, fontWeight: 'bold', marginBottom: '6px' }}>REQUIRED BINDING CATALYSTS:</div>
                {Object.entries(selectedSuspect.sealCost || {}).map(([item, amt]) => {
                  const have = state.inventory[item] || 0;
                  return (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                      <span style={{ color: '#ffffff' }}>{formatLabel(item)} x{amt}</span>
                      <span style={{ color: have >= amt ? theme.textBright : theme.accentRed, fontWeight: 'bold' }}>(Have: {have}/{amt})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {state.sealedGoetia.includes(selectedSuspect.id) ? (
              <div style={{ padding: '12px', marginTop: '12px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold', letterSpacing: '2px' }}>
                [ ENTITY SEALED IN VESSEL ]
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                {(() => {
                  const sealCost = selectedSuspect.sealCost || {};
                  const canAfford = Object.entries(sealCost).every(([item, amt]) => (state.inventory[item] || 0) >= amt);
                  return (
                    <button
                      onClick={() => setActiveSealSuspectId(selectedSuspect.id)}
                      disabled={!canAfford}
                      style={{
                        width: '100%', padding: '13px',
                        backgroundColor: canAfford ? theme.accentRed : '#1a1a1a',
                        color: canAfford ? 'white' : theme.textMuted,
                        border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed',
                        fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '1px', fontSize: '0.8rem'
                      }}
                    >
                      {canAfford ? `> ENGAGE SEALING RITE: ${selectedSuspect.name.toUpperCase()}` : `> SYNTHESIZE CATALYSTS IN [F4] SAFEHOUSE FIRST`}
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
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.9rem' }}>KAGE-NO-SHO // THE BOOK OF SHADOWS (RULE OF TWO)</div>
              <div style={{ color: '#a8ccaf', fontSize: '0.76rem', marginTop: '3px' }}>
                Bind up to 2 Yokai intermediaries simultaneously. Each bound spirit grants a Passive Interceptor and a finite Active Invocation.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.accentCyan, fontSize: '0.82rem', fontWeight: 'bold' }}>ESOTERIC INK: {state.ink || 0}</span>
              <button
                onClick={() => {
                  if ((state.inventory.obols || 0) >= 10) {
                    ThaumaturgicAudio.keyClick();
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

          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {allYokai.map(yokai => {
              const isBound = state.tetheredYokai.includes(yokai.id);
              const cost = yokai.draftCost;
              const canAfford = (!cost.obols || (state.inventory.obols || 0) >= cost.obols) && (!cost.humanity || state.humanity > cost.humanity) && (!cost.ink || (state.ink || 0) >= cost.ink);
              const costStr = [cost.obols ? `${cost.obols} Obols` : '', cost.humanity ? `${cost.humanity} Humanity` : '', cost.ink ? `${cost.ink} Ink` : ''].filter(Boolean).join(' + ');

              const spec = YOKAI_INVOCATIONS[yokai.id] || { label: 'INVOKE', maxCharges: 1, desc: '' };
              const chargesLeft = yokaiCharges[yokai.id] ?? spec.maxCharges;

              return (
                <div key={yokai.id} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBound ? theme.textBright : theme.borderTerminal}`, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: theme.accentAmber, letterSpacing: '1px' }}>{yokai.utilityClass.toUpperCase()}</span>
                      {isBound && <span style={{ fontSize: '0.68rem', backgroundColor: theme.textBright, color: 'black', padding: '1px 6px', fontWeight: 'bold' }}>BOUND</span>}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', color: theme.textBright, fontSize: '0.95rem' }}>{yokai.nameEn}</h3>
                    <p style={{ fontSize: '0.74rem', color: '#ffffff', lineHeight: '1.45', marginBottom: '6px' }}>{yokai.gameUtility}</p>
                    <div style={{ padding: '6px', backgroundColor: '#030504', border: `1px dashed ${theme.borderTerminal}`, fontSize: '0.7rem', color: theme.accentAmber }}>
                      <strong>ACTIVE ({spec.maxCharges} CHARGES):</strong> {spec.label} — {spec.desc}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: theme.textMuted, fontStyle: 'italic', marginTop: '8px' }}>"{yokai.costDescription}"</p>
                  </div>

                  <div style={{ marginTop: '10px', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: isBound ? theme.textBright : theme.accentRed, fontWeight: 'bold', marginBottom: '8px' }}>
                      {isBound ? `CHARGES REMAINING: ${chargesLeft} / ${spec.maxCharges}` : `PACT COST: ${costStr}`}
                    </div>
                    {isBound ? (
                      <button
                        onClick={() => handleUnbindYokai(yokai.id, 'Manually severed in Kage-no-Sho')}
                        className="macro-chip macro-chip-danger"
                        style={{ width: '100%', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}
                      >
                        &gt; SEVER PACT (UNBIND)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          ThaumaturgicAudio.sealSuccess();
                          draftContract(yokai.id, yokai.draftCost);
                          setYokaiCharges(prev => ({ ...prev, [yokai.id]: spec.maxCharges }));
                          addToast(`Bound ${yokai.nameEn} (${spec.maxCharges} Charges)!`, 'SEAL');
                        }}
                        disabled={!canAfford}
                        className="macro-chip"
                        style={{ width: '100%', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}
                      >
                        {canAfford ? '> FORGE PACT & BIND' : '> INSUFFICIENT TRIBUTE'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 4: [F4] SAFEHOUSE / ALTAR (SYNTHESIS, REST & WARDING)     */}
      {/* ================================================================== */}
      {viewport === 'SAFEHOUSE_ALTAR' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <section style={{ width: '62%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px', marginBottom: '10px' }}>
              <div>
                <h2 style={{ margin: 0, color: theme.textBright, fontSize: '1rem', letterSpacing: '2px' }}>&gt; SAFEHOUSE ALTAR // ALCHEMICAL SYNTHESIS</h2>
                <div style={{ fontSize: '0.74rem', color: '#a8ccaf', marginTop: '2px' }}>
                  Transmute raw field salvage into refined planetary Solomonic catalysts.
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

          <section style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: theme.textBright, fontSize: '0.9rem' }}>&gt; SAFEHOUSE HEARTH // TETHER RECOVERY</h3>
              <p style={{ fontSize: '0.76rem', color: '#a8ccaf', lineHeight: '1.5' }}>
                Rest inside the brass-warded safehouse to restore +30 Humanity. Resting advances world time (+0.05% Global Entropy &amp; +4% Inquisition Heat in active sectors).
              </p>
              <button
                onClick={() => {
                  ThaumaturgicAudio.sealSuccess();
                  dispatch({ type: 'MODIFY_HUMANITY', payload: 30 });
                  dispatch({ type: 'ADVANCE_TIME', payload: 4 });
                  addMicroEntropy(0.05);
                  addToast(`Restored +30 Humanity (+0.05% Global Entropy).`, 'SEAL');
                }}
                disabled={state.humanity >= 100}
                className="macro-chip"
                style={{ width: '100%', padding: '10px', marginTop: '8px', fontWeight: 'bold' }}
              >
                &gt; REST AT SAFEHOUSE (+30 HUMANITY / +0.05% ENTROPY)
              </button>
            </div>

            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.9rem' }}>&gt; INQUISITION COUNTER-INTELLIGENCE</h3>
              <p style={{ fontSize: '0.74rem', color: '#a8ccaf', marginBottom: '10px' }}>
                Burn 20 Obols to jam Ordo Malleus direction-finders and lift lockouts in an active sector (-35% Inquisition Heat).
              </p>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MACRO_SECTORS.filter(s => s.id !== 'safehouse' && isSectorUnlocked(s) && !isSectorSecured(s.id)).map(sec => {
                  const heat = state.sectorEntropy[sec.id] || 0;
                  return (
                    <div key={sec.id} style={{ padding: '8px 10px', backgroundColor: '#030504', border: `1px solid ${heat >= 100 ? theme.accentRed : theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: theme.textBright, fontSize: '0.76rem' }}>{sec.label}</strong>
                        <div style={{ fontSize: '0.7rem', color: heat >= 75 ? theme.accentRed : theme.accentAmber }}>
                          INQUISITION HEAT: {heat}% {heat >= 100 ? '[LOCKED DOWN]' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          ThaumaturgicAudio.scryPing();
                          dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -20 } });
                          dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: sec.id, amount: -35 } });
                          addToast(`Suppressed -35% Heat in ${sec.label}`, 'SEAL');
                        }}
                        disabled={heat === 0 || (state.inventory.obols || 0) < 20}
                        className="macro-chip macro-chip-danger"
                      >
                        JAM MALLEUS (-20 OBOLS)
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
      {/* VIEWPORT 5: [F5] THE 4 HORSEMEN (WITH VECTOR SIGILS)               */}
      {/* ================================================================== */}
      {viewport === 'HORSEMEN' && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.accentRed}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: theme.accentRed, fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '2px' }}>
                APOCALYPSE TELEMETRY // THE FOUR HORSEMEN OF THE ESCHATON
              </div>
              <div style={{ color: '#a8ccaf', fontSize: '0.76rem', marginTop: '4px' }}>
                Each Horseman is tethered to reality by <strong>18 Goetian Lieutenants</strong>. Sealing a high-ranking <strong>King, Prince, or Duke</strong> triggers a <em>Resonance Cascade</em> that severs 1–2 lesser Lieutenants automatically. Each severed anchor raises your Grand Banishment Rite probability by <strong>+5%</strong>.
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '190px' }}>
              <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>HORSEMEN BANISHED</div>
              <div style={{ fontSize: '1.6rem', color: theme.textBright, fontWeight: 'bold' }}>
                {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).filter(h => state.flags[`banished_${h.toLowerCase()}`]).length} / 4
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', overflow: 'hidden' }}>
            {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => {
              const info = HORSEMAN_LORE[h];
              const lieutenants = allGoetia.filter(g => g.allegiance === h);
              const sealedCount = lieutenants.filter(g => state.sealedGoetia.includes(g.id)).length;
              const winProb = Math.min(95, 5 + sealedCount * 5);
              const isBanished = !!state.flags[`banished_${h.toLowerCase()}`];

              return (
                <div
                  key={h}
                  style={{
                    backgroundColor: theme.bgPanel,
                    border: `1px solid ${isBanished ? theme.textBright : info.color}`,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    boxShadow: `inset 0 0 25px ${isBanished ? 'rgba(98,240,128,0.1)' : 'rgba(255,42,85,0.06)'}`
                  }}
                >
                  <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: info.color, letterSpacing: '1px' }}>
                      <span>{info.sealName}</span>
                      <span>{isBanished ? '[BANISHED]' : `[${18 - sealedCount} ANCHORS ACTIVE]`}</span>
                    </div>

                    {/* Horseman Header + Custom Vector Sigil */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                      <HorsemanSigilSvg horseman={h} color={info.color} size={56} />
                      <div>
                        <h2 style={{ margin: 0, color: '#ffffff', letterSpacing: '3px', fontSize: '1.3rem' }}>{h}</h2>
                        <div style={{ fontSize: '0.68rem', color: info.color, fontWeight: 'bold', marginTop: '2px' }}>{info.riderTitle}</div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.72rem', color: '#a8ccaf', lineHeight: '1.45', margin: '0 0 10px 0' }}>{info.omenDesc}</p>

                    <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                        <span style={{ color: '#a8ccaf' }}>ANCHORS SEVERED: <strong>{sealedCount}/18</strong></span>
                        <span style={{ color: info.color, fontWeight: 'bold' }}>RITE ODDS: {winProb}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#000', border: `1px solid ${theme.borderTerminal}` }}>
                        <div style={{ width: `${(sealedCount / 18) * 100}%`, height: '100%', backgroundColor: info.color, transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.68rem', color: theme.textMuted, marginBottom: '4px', fontWeight: 'bold' }}>
                      COURT OF {h} (18 LIEUTENANTS):
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {lieutenants.map(g => {
                        const isSealed = state.sealedGoetia.includes(g.id);
                        return (
                          <div
                            key={g.id}
                            onClick={() => { setSelectedSuspectId(g.id); setViewport('CODEX'); }}
                            style={{
                              display: 'flex', justifyContent: 'space-between', padding: '3px 5px',
                              fontSize: '0.7rem', cursor: 'pointer',
                              backgroundColor: isSealed ? 'rgba(98, 240, 128, 0.08)' : 'transparent',
                              color: isSealed ? theme.textBright : '#a8ccaf',
                              textDecoration: isSealed ? 'line-through' : 'none'
                            }}
                          >
                            <span>#{g.manifestId.toString().padStart(2, '0')} {g.name} ({g.rank})</span>
                            <span style={{ color: isSealed ? theme.textBright : theme.accentRed }}>
                              {isSealed ? 'SEALED' : 'TETHERED'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    {isBanished ? (
                      <div style={{ padding: '12px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold', fontSize: '0.78rem', letterSpacing: '2px' }}>
                        ✓ {h} BANISHED FROM REALITY
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveBanishmentTarget(h)}
                        style={{
                          width: '100%', padding: '12px',
                          backgroundColor: '#2a0808', color: '#ffffff',
                          border: `1px solid ${info.color}`,
                          cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold',
                          fontSize: '0.75rem', letterSpacing: '1px'
                        }}
                      >
                        &gt; INITIATE {h} GRAND RITE ({winProb}%)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 6: [F6] AGENT_DOSSIER (LOCKED PORTRAIT & 0.01% ENTROPY)   */}
      {/* ================================================================== */}
      {viewport === 'DOSSIER' && (
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '12px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <section style={{ width: '38%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold' }}>BIOMETRIC TETHER FEED</span>
              <span style={{ color: theme.accentAmber }}>STATUS: LOCKED</span>
            </div>

            <img
              src={getFullBodyPath(state.playerPortrait)}
              alt="Operative Full Body"
              style={{ maxHeight: '82%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(98, 240, 128, 0.28))' }}
            />

            <div style={{ width: '100%', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '10px', textAlign: 'center', fontSize: '0.72rem', color: theme.textMuted, letterSpacing: '1px' }}>
              IDENTITY IMPRINT: <strong style={{ color: theme.textBright }}>{state.playerName.toUpperCase()}</strong> // BIOMETRICALLY SEALED
            </div>
          </section>

          <section style={{ width: '62%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: theme.accentAmber, letterSpacing: '2px' }}>NOCTURNAL SYNDICATE // OPERATIVE SERVICE RECORD</div>
              <h1 style={{ margin: '4px 0 16px 0', color: theme.textBright, letterSpacing: '3px', fontSize: '1.6rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '10px' }}>
                OPERATIVE {state.playerName.toUpperCase()} // {state.agencyName.toUpperCase()}
              </h1>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>GOETIA BOUND IN VESSEL</div>
                  <div style={{ fontSize: '1.8rem', color: theme.textBright, fontWeight: 'bold', marginTop: '4px' }}>{state.sealedGoetia.length} / 72</div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>SECTORS SECURED</div>
                  <div style={{ fontSize: '1.8rem', color: theme.accentAmber, fontWeight: 'bold', marginTop: '4px' }}>{securedSectorsCount} / 16</div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>HORSEMEN BANISHED</div>
                  <div style={{ fontSize: '1.8rem', color: theme.accentRed, fontWeight: 'bold', marginTop: '4px' }}>
                    {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).filter(h => state.flags[`banished_${h.toLowerCase()}`]).length} / 4
                  </div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>TETHER STABILITY (HUMANITY)</div>
                  <div style={{ fontSize: '1.6rem', color: theme.textBright, fontWeight: 'bold', marginTop: '4px' }}>{state.humanity}%</div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>GLOBAL ENTROPY (PRECISION)</div>
                  <div style={{ fontSize: '1.6rem', color: theme.accentRed, fontWeight: 'bold', marginTop: '4px' }}>{totalGlobalEntropy.toFixed(2)}%</div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>OBOL TREASURY</div>
                  <div style={{ fontSize: '1.6rem', color: theme.accentAmber, fontWeight: 'bold', marginTop: '4px' }}>{state.inventory.obols || 0}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '8px' }}>
                  SOLOMONIC BRASS VESSEL // BOUND ENTITIES ({state.sealedGoetia.length})
                </div>
                {state.sealedGoetia.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: theme.textMuted, fontStyle: 'italic' }}>No Goetian Lieutenants bound yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {state.sealedGoetia.map(gid => {
                      const g = allGoetia.find(item => item.id === gid);
                      return (
                        <span key={gid} style={{ padding: '4px 8px', backgroundColor: '#112217', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontSize: '0.72rem' }}>
                          ✓ #{g?.manifestId} {g?.name.toUpperCase()} ({g?.allegiance})
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: `1px dashed ${theme.accentRed}`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: theme.accentRed, fontWeight: 'bold', fontSize: '0.82rem' }}>SESSION MANAGEMENT &amp; TETHER PURGE</div>
                <div style={{ color: '#a8ccaf', fontSize: '0.72rem' }}>Log out safely to the Start Screen, or permanently wipe all local save data.</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleLogout} className="macro-chip macro-chip-amber" style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                  &gt; LOG OUT TO TITLE
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('TERMINATE SESSION & WIPE LOCAL SAVE DATA? This cannot be undone.')) {
                      ThaumaturgicAudio.errorBuzz();
                      localStorage.removeItem('thaumaturgic_os_contracts_v1');
                      localStorage.removeItem('thaumaturgic_os_micro_entropy_v1');
                      setContracts({});
                      setMicroEntropy(0);
                      resetGame();
                    }
                  }}
                  style={{ padding: '12px 18px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '1px' }}
                >
                  &gt; WIPE SAVE &amp; RESET
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ================================================================== */}
      {/* VIEWPORT 7: [F7] MANUAL (OPERATIVE GUIDE & SOLOMONIC LORE)         */}
      {/* ================================================================== */}
      {viewport === 'MANUAL' && <ManualViewport fontScale={fontScale} />}

      {/* ================================================================== */}
      {/* SEALING & BANISHMENT MODALS + RESONANCE CASCADES + TOASTS          */}
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
              dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 45 } });
              dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -100 } });
              dispatch({ type: 'SET_FLAG', payload: { flagId: `sector_secured_${state.currentNode}`, value: true } });

              const currentMacro = MACRO_SECTORS.find(s => s.id === state.currentNode);
              if (currentMacro) {
                currentMacro.connections.forEach(connId => {
                  dispatch({ type: 'SET_FLAG', payload: { flagId: `sector_unlocked_${connId}`, value: true } });
                });
              }

              // SOLOMONIC HIERARCHY RESONANCE CASCADE:
              // Sealing a King, Prince, or Duke automatically collapses 1-2 lesser Lieutenants of the same Horseman!
              let cascadeMsg = '';
              if (['King', 'Prince', 'Duke'].includes(suspect.rank)) {
                const vassals = allGoetia.filter(
                  g => g.allegiance === suspect.allegiance &&
                  g.id !== sealedId &&
                  !state.sealedGoetia.includes(g.id) &&
                  !['King', 'Prince'].includes(g.rank)
                );
                const cascadeTargets = vassals.slice(0, suspect.rank === 'King' ? 2 : 1);
                if (cascadeTargets.length > 0) {
                  cascadeTargets.forEach(v => sealGoetia(v.id));
                  cascadeMsg = `<br/><span style="color:#ffb800;">⚡ SOLOMONIC RESONANCE CASCADE: Binding ${suspect.rank} ${suspect.name} collapsed the feudal tether of ${cascadeTargets.map(v => `#${v.manifestId} ${v.name} (${v.rank})`).join(' & ')} into the Brass Vessel!</span>`;
                }
              }

              // Clear Codex filters & discovered logs for the secured sector so the badge resets to (0)
              setDeducedSigns([]);
              if (currentContract) {
                setContracts(prev => ({
                  ...prev,
                  [currentContract.sectorId]: {
                    ...currentContract,
                    discoveredLogs: []
                  }
                }));
              }

              appendLog(
                `<div style="border-left:3px solid #62f080;padding-left:10px;margin:6px 0;color:#62f080;">` +
                `<strong>[✓ SECTOR PERMANENTLY SECURED: ${currentContract?.sectorLabel}]</strong><br/>` +
                `Goetian Anchor <strong>${suspect.name}</strong> severed! +45 Obols awarded. Adjacent ley-line sectors unlocked on your <strong>REGIONAL MAP</strong>.${cascadeMsg}` +
                `</div>`,
                'success'
              );
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