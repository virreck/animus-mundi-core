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
  HAZARD_MANIFEST,
  getUniqueGoetiaSigns,
  generateSectorContract,
  type SectorContract,
  type SubGridNode,
  type ForensicChannel
} from './engine/sectorGenerator';

interface TerminalEntry {
  id: number;
  html: string;
  type: 'normal' | 'info' | 'system' | 'success' | 'warn' | 'error' | 'command';
}

type ViewportMode = 'FIELD_OPS' | 'CODEX' | 'KAGE_NO_SHO' | 'SAFEHOUSE_ALTAR' | 'HORSEMEN' | 'DOSSIER' | 'MANUAL';
type FontScale = 'SM' | 'MD' | 'LG';
type ControlMode = 'PALETTE' | 'CLI';

const FONT_ZOOM_MAP: Record<FontScale, number> = { SM: 1, MD: 1.1, LG: 1.2 };

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

const YOKAI_DAEMON_SPECS: Record<string, {
  codeName: string;
  classTag: string;
  passiveHook: string;
  activeLabel: string;
  maxCharges: number;
  activeDesc: string;
  loreNote: string;
}> = {
  yokai_kitsune: {
    codeName: 'KITSUNE.SYS // SPECTRAL PROXY',
    classTag: 'COUNTER-SURVEILLANCE',
    passiveHook: 'PASSIVE HOOK: Reduces Room Scan Humanity cost from -5% to -2%.',
    activeLabel: 'FOXFIRE SHROUD',
    maxCharges: 2,
    activeDesc: 'Injects phantom MAC addresses into Ordo Malleus trackers, venting -30% Inquisition Heat.',
    loreNote: 'Nine-tailed fox spirit bound into a coaxial packet-spoofing talisman.'
  },
  yokai_tengu: {
    codeName: 'TENGU.DMN // AERIAL LIDAR',
    classTag: 'RECONNAISSANCE',
    passiveHook: 'PASSIVE HOOK: Reduces Room Scan cost to -2% HUM.',
    activeLabel: 'GALE SWEEP',
    maxCharges: 2,
    activeDesc: 'Spends 5% Humanity to radar-scan the entire sub-grid, revealing all 6 rooms at once.',
    loreNote: 'Mountain crow-tengu bound to high-frequency microwave telemetry relays.'
  },
  yokai_baku: {
    codeName: 'BAKU.EXE // COGNITIVE SCRUBBER',
    classTag: 'NEURO-STABILIZER',
    passiveHook: 'PASSIVE HOOK: Halves Humanity backlash when triggering room traps.',
    activeLabel: 'DEVOUR NIGHTMARE',
    maxCharges: 2,
    activeDesc: 'Consumes local paranoia waves, converting -15% Inquisition Heat into +20% Humanity.',
    loreNote: 'Dream-devouring chimera spirit wired directly into the operative biometric headset.'
  },
  yokai_zashiki: {
    codeName: 'ZASHIKI.BOT // TREASURY LEDGER',
    classTag: 'LOGISTICS & ARBITRAGE',
    passiveHook: 'PASSIVE HOOK: Optimizes salvage routing across syndicate dead-drops.',
    activeLabel: 'FORTUNE BOON',
    maxCharges: 1,
    activeDesc: 'Single-use: Liquidates dormant syndicate caches for +35 Obols & +1 Scrap Metal.',
    loreNote: 'Parlor-dwelling guardian spirit that manipulates subterranean bullion ledgers.'
  },
  yokai_kameosa: {
    codeName: 'KAMEOSA.ALC // CRUCIBLE VAT',
    classTag: 'ALCHEMICAL SYNTHESIS',
    passiveHook: 'PASSIVE HOOK: Safehouse Altar recipes cost 0 Obols (substituting -2% Humanity per craft).',
    activeLabel: 'FERMENT MATTER',
    maxCharges: 3,
    activeDesc: 'Spends 8% Humanity to synthesize +1 Scrap Metal, +1 Cursed Earth, & +1 Distillate.',
    loreNote: 'Inexhaustible sake-jar tsukumogami retrofitted for rapid planetary catalyst distillation.'
  },
  yokai_kamaitachi: {
    codeName: 'KAMAITACHI.VEX // VORTEX BREACHER',
    classTag: 'TACTICAL INFILTRATION',
    passiveHook: 'PASSIVE HOOK: Grants +5s on Goetian Sealing Rites and +15s on Grand Banishments.',
    activeLabel: 'WIND SICKLE',
    maxCharges: 2,
    activeDesc: 'Silently enters the selected adjacent room with 0% Heat, disarming Patrols & Traps.',
    loreNote: 'Whirlwind weasel triad that slices through warded iron and laser tripwires before sensors register.'
  },
  yokai_amabie: {
    codeName: 'AMABIE.ISO // REALITY ANCHOR',
    classTag: 'ENTROPY MITIGATION',
    passiveHook: 'PASSIVE HOOK: Dampens micro-entropy drift during regional transit.',
    activeLabel: 'PROPHETIC WARD',
    maxCharges: 1,
    activeDesc: 'Single-use: Spends 10 Obols to broadcast a stabilizing woodblock seal (-2.50% Global Entropy).',
    loreNote: 'Pelagic prophetic mermaid spirit whose geometric likeness repairs fraying reality.'
  },
  yokai_noppera: {
    codeName: 'NOPPERA.MSK // IDENTITY SPOOFER',
    classTag: 'DECEPTION & STEALTH',
    passiveHook: 'PASSIVE HOOK: Masks biometric signature from Malleus facial-recognition cameras.',
    activeLabel: 'FACELESS DECOY',
    maxCharges: 2,
    activeDesc: 'Disarms all Malleus Hound Patrols in the current sector and drops Inquisition Heat by -15%.',
    loreNote: 'Faceless phantom daemon that loops blank CCTV frames across Inquisition precincts.'
  }
};

const HorsemanSigilSvg = ({ horseman, color, size = 64 }: { horseman: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH'; color: string; size?: number }) => (
  <svg viewBox="0 0 100 100" style={{ width: size, height: size, flexShrink: 0, filter: `drop-shadow(0 0 6px ${color})` }}>
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

const ThaumaturgicAudio = {
  ctx: null as AudioContext | null,
  enabled: true,
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
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
  typewriterClack() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1950 + Math.random() * 450, now);
      filter.Q.setValueAtTime(2.8, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.24, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);
      this.playTone(1350 + Math.random() * 250, 'square', 0.022, 0.055, 320);
    } catch { /* ignore */ }
  },
  heavyStampImpact() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(155, now);
      subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.45);
      subGain.gain.setValueAtTime(0.38, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.48);

      const crunchOsc = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunchOsc.type = 'sawtooth';
      crunchOsc.frequency.setValueAtTime(220, now);
      crunchOsc.frequency.exponentialRampToValueAtTime(42, now + 0.25);
      crunchGain.gain.setValueAtTime(0.18, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      crunchOsc.connect(crunchGain);
      crunchGain.connect(this.ctx.destination);
      crunchOsc.start(now);
      crunchOsc.stop(now + 0.26);
    } catch { /* ignore */ }
  },
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
  for (let i = 0; i < config.n; i++) {
    const angle = rotationOffset + (i * 2 * Math.PI) / config.n;
    nodes.push({ id: i, x: 50 + 42 * Math.sin(angle), y: 50 - 42 * Math.cos(angle) });
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
  const timeLimit = Math.ceil((sequence.length - 1) * 1.45) + 4;
  return { id: `${isBound ? "BOUND_" : "LESSER_"}${config.name}_PROTOCOL`, timeLimit, nodes, sequence };
}

const getFullBodyPath = (squarePath: string) => {
  const filename = (squarePath || '/portraits/thaumaturge_m1.png').split('/').pop();
  return `/portraits/full_body/fb_${filename}`;
};

const ManualViewport = ({ fontScale }: { fontScale: FontScale }) => {
  const [tab, setTab] = useState<'FORENSICS' | 'COUNTERS' | 'LORE' | 'INQUISITION'>('FORENSICS');
  const subTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer',
    border: `1px solid ${active ? theme.textBright : theme.borderTerminal}`,
    backgroundColor: active ? theme.textBright : '#060907',
    color: active ? '#000000' : '#4a7c59'
  });

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
      <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: theme.accentAmber, letterSpacing: '2px' }}>SYNDICATE FIELD CODEX // THAUMATURGIC OS v4.12</div>
          <h2 style={{ margin: '2px 0 0 0', color: theme.textBright, letterSpacing: '2px', fontSize: '1.15rem' }}>OPERATIVE FIELD MANUAL &amp; PROTOCOL INDEX</h2>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('FORENSICS'); }} style={subTabStyle(tab === 'FORENSICS')}>1. RECON &amp; FORENSICS</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('COUNTERS'); }} style={subTabStyle(tab === 'COUNTERS')}>2. PRE-ENTRY COUNTERS</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('LORE'); }} style={subTabStyle(tab === 'LORE')}>3. SOLOMONIC DEMONOLOGY</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('INQUISITION'); }} style={subTabStyle(tab === 'INQUISITION')}>4. ORDO MALLEUS &amp; HEAT</button>
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '20px', overflowY: 'auto', fontSize: '0.84rem', lineHeight: '1.65', color: '#a8ccaf' }}>
        {tab === 'FORENSICS' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0 }}>STEP-BY-STEP ROOM INFILTRATION &amp; 3-TOOL FORENSICS</h3>
            <p>
              Every Goetian demon has a <strong>unique 3-phenomenon fingerprint</strong>. Decode all 3 clues in a sector to isolate the exact demon in <strong>[F2] CODEX</strong>:
            </p>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'grid', gridTemplateColumns: '150px 160px 1fr', rowGap: '10px', columnGap: '12px', marginTop: '12px' }}>
              <strong style={{ color: theme.accentAmber }}>scan [1-6]</strong>
              <span style={{ color: '#a8ccaf' }}>[RECON]</span>
              <span>Scans a reachable room from outside, revealing if a Malleus Patrol or Threshold Trap is waiting inside.</span>

              <strong style={{ color: theme.accentAmber }}>enter [1-6]</strong>
              <span style={{ color: '#a8ccaf' }}>[MOVEMENT]</span>
              <span>Steps inside a reachable room. Walking into an active trap or patrol without disarming it first triggers heavy Humanity &amp; Heat penalties!</span>

              <strong style={{ color: theme.textBright }}>vox</strong>
              <span style={{ color: theme.textBright }}>[AUDIO CLUES]</span>
              <span>Decodes acoustic phenomena: hoarse voices, whispers, wolf howls, avian shrieks, seismic tremors, and gale winds.</span>

              <strong style={{ color: theme.textBright }}>assay</strong>
              <span style={{ color: theme.textBright }}>[MATTER CLUES]</span>
              <span>Tests physical &amp; biological residue: amphibian slime, rust decay, transmuted metals, spores, blood frenzy, and sulfur.</span>

              <strong style={{ color: theme.textBright }}>auspex</strong>
              <span style={{ color: theme.textBright }}>[ASTRAL CLUES]</span>
              <span>Reads thermal, optical, &amp; spatial shifts: light refraction, dead scripts, star drift, mind fog, -18°C stasis, and 1,200°C scorching.</span>

              <strong style={{ color: theme.accentCyan }}>loot / attune</strong>
              <span style={{ color: '#a8ccaf' }}>[SHRINE / ANCHOR]</span>
              <span><code>loot</code> awakens Kami Shrines &amp; collects salvage. Running <code>attune</code> inside Room 6 ([ANCHOR]) grants +4s on your Sealing Rite timer!</span>
            </div>
          </div>
        )}

        {tab === 'COUNTERS' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.accentCyan, marginTop: 0 }}>PRE-ENTRY COUNTERMEASURES (DISARM BEFORE ENTERING!)</h3>
            <p>
              When you run <code>scan [1-6]</code> on a reachable room, the terminal reports any Malleus Patrol or Trap waiting inside. <strong>You can pass a room number (e.g., <code>degauss 2</code>) to disarm it from outside before entering</strong>:
            </p>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'grid', gridTemplateColumns: '160px 210px 1fr', rowGap: '10px', columnGap: '12px', marginTop: '12px' }}>
              <strong style={{ color: theme.accentRed }}>decoy [1-6]</strong>
              <span style={{ color: theme.accentRed }}>Malleus Hound Patrol</span>
              <span>Lures the Inquisition patrol out of the room so you can enter without taking ambush damage.</span>

              <strong style={{ color: theme.accentCyan }}>degauss [1-6]</strong>
              <span style={{ color: theme.accentAmber }}>Aethyric Static Field</span>
              <span>Symptom: Electromagnetic static screech scrambling forensic instruments.</span>

              <strong style={{ color: theme.accentCyan }}>bypass [1-6]</strong>
              <span style={{ color: theme.accentAmber }}>Malleus Laser Tripwire</span>
              <span>Symptom: Encrypted Inquisition laser tripwires spanning the doorway threshold (-10% Heat when bypassed).</span>

              <strong style={{ color: theme.accentCyan }}>purge [1-6]</strong>
              <span style={{ color: theme.accentAmber }}>Toxic Brimstone Miasma</span>
              <span>Symptom: Choking, spore-laden sulfur vapor blanketing the chamber floor.</span>

              <strong style={{ color: theme.accentCyan }}>dispel [1-6]</strong>
              <span style={{ color: theme.accentAmber }}>Goetic Blood-Hex Ward</span>
              <span>Symptom: Pulsing crimson sigils sealing the room architecture against intrusion.</span>
            </div>
          </div>
        )}

        {tab === 'LORE' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0 }}>THE 72 SPIRITS OF SOLOMON &amp; RESONANCE CASCADES</h3>
            <p>
              In the 17th-century <em>Lemegeton Clavicula Salomonis</em>, King Solomon bound <strong>72 Goetic spirits</strong> into a single Brass Vessel using their geometric seals and planetary metals: <strong>Kings</strong> (Gold Leaf), <strong>Marquises</strong> (Silver Shavings), <strong>Dukes</strong> (Copper Wire), <strong>Presidents</strong> (Quicksilver Drops), <strong>Princes</strong> (Sacred Sand), <strong>Earls</strong> (Cold Iron Filings), and <strong>Knights</strong> (Lead Weights).
            </p>
            <p>
              Each of the <strong>Four Horsemen</strong> (Conquest, War, Famine, Death) uses 18 Goetian Lieutenants to anchor itself into London and Surrey. Sealing a high-ranking <strong>King, Prince, or Duke</strong> triggers a <em>Solomonic Resonance Cascade</em> that automatically severs and binds <strong>1 to 2 lesser demons</strong> of that Horseman's court into your Brass Vessel.
            </p>
          </div>
        )}

        {tab === 'INQUISITION' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.accentRed, marginTop: 0 }}>THE ORDO MALLEUS &amp; 100% HEAT LOCKDOWNS</h3>
            <p>
              The <strong>Ordo Malleus</strong> monitors ley-line spikes using mobile direction-finding vans and witch-hound packs. Every room entry raises <strong>Inquisition Heat (0%–100%)</strong> based on the room's Ward Level (<strong>+8%</strong>, <strong>+16%</strong>, or <strong>+24%</strong> on first entry; <strong>+2%</strong> when backtracking):
            </p>
            <ul>
              <li><strong>75%–99% Heat:</strong> Malleus strike teams sweep the perimeter. The CRT display flickers crimson.</li>
              <li><strong>100% Heat (TOTAL SECTOR LOCKDOWN):</strong> All room actions are locked out! Execute <code>spoof</code> (-15 Obols for -25% Heat) or <code>bribe</code> (-25 Obols for -45% Heat) to lift the cordon.</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};

const StartScreen = ({
  onStart,
  onLoad,
  onOpenManual,
  onFullReset
}: {
  onStart: (name: string, portrait: string, agency: string) => void;
  onLoad: () => void;
  onOpenManual: () => void;
  onFullReset: () => void;
}) => {
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
    if (window.confirm('PURGE LOCAL TETHER DATA? This will erase your current operative save and reset all 72 Goetia seals.')) {
      ThaumaturgicAudio.errorBuzz();
      onFullReset();
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100dvh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, margin: 0, padding: '8px', overflow: 'hidden' }}>
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', maxWidth: '820px', maxHeight: '95dvh', overflowY: 'auto', backgroundColor: theme.bgPanel, border: `2px solid ${theme.textBright}`, boxShadow: `0 0 40px rgba(98, 240, 128, 0.15)` }}>
            <div style={{ flex: '1 1 280px', borderRight: `1px dashed ${theme.borderTerminal}`, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#030503' }}>
              <h2 style={{ margin: '0 0 12px 0', color: theme.textBright, letterSpacing: '4px', textTransform: 'uppercase' }}>{name || 'VERGIL'}</h2>
              <img src={getFullBodyPath(portrait)} alt="Full Body Operative" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(74,124,89,0.35))' }} />
            </div>
            <div style={{ flex: '1 1 320px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: theme.accentRed, borderBottom: `1px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px', margin: 0 }}>&gt; CONFIRM OPERATIVE TETHER</h3>
              <div style={{ marginTop: '18px', lineHeight: '2.0', fontSize: '0.86rem' }}>
                <div><span style={{ color: theme.textMuted }}>CALLSIGN:</span> <strong style={{ color: theme.textBright }}>{(name || 'VERGIL').toUpperCase()}</strong></div>
                <div><span style={{ color: theme.textMuted }}>SYNDICATE:</span> <strong style={{ color: theme.textBright }}>{(agency || 'DARKWIRE').toUpperCase()}</strong></div>
                <div><span style={{ color: theme.textMuted }}>STARTING HUMANITY:</span> <span style={{ color: theme.textBright }}>100% (STABLE)</span></div>
                <div><span style={{ color: theme.textMuted }}>DIRECTIVE:</span> <span style={{ color: theme.accentAmber }}>SEVER THE 72 GOETIAN ANCHORS &amp; BANISH THE FOUR HORSEMEN</span></div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    ThaumaturgicAudio.scryPing();
                    onFullReset();
                    onStart(name || 'VERGIL', portrait, agency || 'DARKWIRE');
                  }}
                  style={{ padding: '13px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '2px' }}
                >
                  &gt; FINALIZE TETHER &amp; DEPLOY
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{ padding: '10px', backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono }}
                >
                  &gt; REVISE OPERATIVE DOSSIER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '620px', maxHeight: '96dvh', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgPanel, boxShadow: `0 0 30px rgba(98, 240, 128, 0.12)`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', position: 'relative', borderBottom: `1px solid ${theme.borderTerminal}`, backgroundColor: '#020403', flexShrink: 0 }}>
          <img
            src="/title_art.jpg"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith('/title_art.jpg')) target.src = '/title_art.png';
              else if (target.src.endsWith('/title_art.png')) target.src = '/branding/animus_mundi_start_banner.png';
            }}
            alt="Animus Mundi: Seals of the 4"
            style={{ width: '100%', height: 'auto', maxHeight: '240px', display: 'block', objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,13,10,1) 0%, rgba(9,13,10,0) 20%)', pointerEvents: 'none' }} />
        </div>

        <div style={{ padding: '16px 24px 22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: theme.accentAmber, letterSpacing: '2px' }}>THAUMATURGIC OS // NET-OPS v4.12</span>
            <button
              onClick={onOpenManual}
              style={{
                backgroundColor: 'rgba(255, 184, 0, 0.09)',
                border: '1px solid rgba(255, 184, 0, 0.45)',
                color: theme.accentAmber,
                padding: '4px 10px',
                fontFamily: theme.fontMono,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              [? FIELD MANUAL &amp; LORE]
            </button>
          </div>
          <h2 style={{ margin: 0, borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '6px', letterSpacing: '3px', color: theme.textBright, fontSize: '1.1rem' }}>
            INITIATING DATA-TETHER
          </h2>

          {savedOperative && (
            <div style={{ padding: '10px', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgDark, textAlign: 'center' }}>
              <div style={{ color: theme.textMuted, fontSize: '0.68rem', marginBottom: '6px' }}>EXISTING OPERATIVE TETHER FOUND:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { ThaumaturgicAudio.scryPing(); onLoad(); }} style={{ flex: 2, padding: '9px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '1px' }}>
                  &gt; RESUME: OP_{savedOperative.toUpperCase()}
                </button>
                <button onClick={handleWipeSave} style={{ flex: 1, padding: '9px', backgroundColor: '#2a0808', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.72rem' }}>
                  WIPE SAVE
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT OPERATIVE CALLSIGN:</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VERGIL" style={{ width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT AFFILIATED SYNDICATE:</label>
              <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. DARKWIRE" style={{ width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.74rem', color: theme.textBright }}>&gt; SELECT OPERATIVE DOSSIER PORTRAIT:</label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                      borderRadius: '50%'
                    }}
                  >
                    <img
                      src={p.src}
                      alt="Operative"
                      style={{
                        width: '54px', height: '54px', objectFit: 'cover', borderRadius: '50%',
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

interface SealingTerminalProps {
  suspect: typeof allGoetia[0];
  actualAnchorId: string;
  sealCost: Record<string, number>;
  attunedBonusSeconds: number;
  onClose: () => void;
  onSuccessSeal: (goetiaId: string) => string[];
  dispatch: React.Dispatch<GameAction>;
  sealGoetia: (id: string) => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
  tetheredYokai: string[];
}

const SealingTerminal = ({
  suspect,
  actualAnchorId,
  sealCost,
  attunedBonusSeconds,
  onClose,
  onSuccessSeal,
  dispatch,
  sealGoetia,
  addToast,
  tetheredYokai
}: SealingTerminalProps) => {
  const [matrix] = useState(() => generateSealMatrix());
  const [phase, setPhase] = useState<'AUTH' | 'WARDING' | 'COMPLETE' | 'MISIDENTIFIED'>('AUTH');
  const [nameInput, setNameInput] = useState('');
  const hasTimeBuff = tetheredYokai.includes('yokai_kamaitachi');
  const [timeLeft, setTimeLeft] = useState(matrix.timeLimit + (hasTimeBuff ? 5 : 0) + attunedBonusSeconds);
  const [path, setPath] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{x: number, y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [typedName, setTypedName] = useState('');
  const [showSealed, setShowSealed] = useState(false);
  const [isCleanSeal, setIsCleanSeal] = useState(true);
  const [cascadedNames, setCascadedNames] = useState<string[]>([]);

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
        ThaumaturgicAudio.typewriterClack();
        i++;
        if (i >= fullName.length) {
          clearInterval(interval);
          setTimeout(() => {
            ThaumaturgicAudio.heavyStampImpact();
            setShowSealed(true);
          }, 650);
        }
      }, 220);
      return () => clearInterval(interval);
    }
  }, [phase, suspect.name]);

  useEffect(() => {
    if (phase === 'WARDING' && path.length === matrix.sequence.length) executeFinalSeal(true);
  }, [path.length, phase, matrix.sequence.length]);

  const getSVGCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
  };

  // Supports BOTH continuous dragging AND clicking node-to-node!
  const checkNodeHit = (coords: { x: number; y: number }) => {
    setPath(prevPath => {
      const nextId = matrix.sequence[prevPath.length];
      if (nextId === undefined) return prevPath;
      const targetNode = matrix.nodes.find(n => n.id === nextId)!;
      if (Math.hypot(coords.x - targetNode.x, coords.y - targetNode.y) < 17) {
        ThaumaturgicAudio.keyClick();
        return [...prevPath, targetNode.id];
      }
      return prevPath;
    });
  };

  const startTracing = (e: React.PointerEvent) => {
    if (phase !== 'WARDING') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSVGCoords(e);
    if (!coords) return;
    setCurrentPointer({ x: coords.x, y: coords.y });
    checkNodeHit(coords);
  };

  const moveTracing = (e: React.PointerEvent) => {
    if (phase !== 'WARDING' || !currentPointer) return;
    const coords = getSVGCoords(e);
    if (coords) {
      setCurrentPointer({ x: coords.x, y: coords.y });
      checkNodeHit(coords);
    }
  };

  const stopTracing = (e: React.PointerEvent) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    setCurrentPointer(null);
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
    const bonusNames = onSuccessSeal(suspect.id);
    setCascadedNames(bonusNames);
    if (isClean) {
      addToast(`SEALING SUCCESSFUL. Target ${suspect.name} bound to the brass vessel.`, 'SEAL');
    } else {
      ThaumaturgicAudio.errorBuzz();
      addToast(`RITUAL FRACTURE. Global Entropy spiked by +10%.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 10 });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '12px' }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '26px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, boxShadow: `0 0 30px rgba(98, 240, 128, 0.2)`, fontFamily: theme.fontMono, color: theme.textTerminal, animation: showSealed ? 'heavyImpactShake 0.34s ease-out both' : 'none' }}>
        {phase !== 'COMPLETE' && (
          <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '8px', color: theme.textBright }}>
            &gt; ROOT_ACCESS // VESSEL_SEALING_PROTOCOL
          </h3>
        )}
        {phase === 'AUTH' && (
          <form onSubmit={handleAuthSubmit}>
            <p style={{ fontSize: '0.8rem', marginBottom: '10px', lineHeight: '1.5' }}>
              HYPOTHESIS LOCKED: <strong style={{ color: theme.textBright }}>{suspect.name.toUpperCase()}</strong> ({suspect.rank} of {suspect.allegiance}).<br/>
              <span style={{ color: theme.accentAmber }}>WARNING: If this entity is NOT the true Anchor of the current Sector, your catalysts will burn and spike Global Entropy (+15%).</span>
            </p>
            <div style={{ padding: '10px', marginBottom: '12px', backgroundColor: '#030604', border: `1px solid ${theme.textBright}`, fontSize: '0.76rem', color: '#ffffff', lineHeight: '1.5' }}>
              <strong style={{ color: theme.textBright }}>HOW TO COMPLETE THE SEALING RITE:</strong><br/>
              Once you commit, a timer starts. <strong>Click and drag continuously</strong> (or click node-to-node) starting from the <strong>pulsing green ring</strong>, following the ring as it jumps along the geometry until all lines are lit!
            </div>
            <input autoFocus type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder={`TYPE "${suspect.name.toUpperCase()}" TO COMMIT`} style={{ padding: '10px', width: '100%', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', textTransform: 'uppercase' }} />
            <button type="submit" style={{ marginTop: '12px', padding: '10px', width: '100%', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&gt; BURN CATALYSTS &amp; START SEALING RITE</button>
            <button type="button" onClick={onClose} style={{ marginTop: '8px', padding: '10px', width: '100%', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </form>
        )}
        {phase === 'MISIDENTIFIED' && (
          <div style={{ textAlign: 'center', padding: '15px 0' }}>
            <h2 style={{ color: theme.accentRed, letterSpacing: '3px', margin: '0 0 10px 0' }}>! FALSE TRUE-NAME BACKLASH !</h2>
            <p style={{ fontSize: '0.82rem', color: '#ffb3b3', lineHeight: '1.6' }}>
              You inscribed the seal of <strong>{suspect.name}</strong>, but the entity haunting this sector rejected the binding.<br/><br/>
              <strong>PENALTY:</strong> -20 Humanity | +15.00% Global Entropy.
            </p>
            <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: theme.fontMono }}>
              &gt; EMERGENCY DISCONNECT
            </button>
          </div>
        )}
        {phase === 'WARDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold' }}>STEP {path.length}/{matrix.sequence.length}</span>
              <span style={{ color: timeLeft <= 5 ? theme.accentRed : theme.textBright, fontWeight: 'bold' }}>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <div style={{ width: '100%', textAlign: 'center', padding: '6px', marginBottom: '10px', backgroundColor: '#030504', border: `1px dashed ${theme.textBright}`, color: '#ffffff', fontSize: '0.75rem' }}>
              Trace or click the <strong style={{ color: theme.textBright }}>PULSING GREEN TARGET NODE</strong> to weave the containment sigil!
            </div>
            <div style={{ position: 'relative', width: '280px', height: '280px', border: `1px solid ${theme.borderTerminal}`, backgroundColor: theme.bgDark, borderRadius: '50%', overflow: 'hidden' }}>
              <img src={`/seals/${suspect.id}.png`} alt="Target Seal" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '170px', height: '170px', opacity: 0.3, pointerEvents: 'none', filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                <polygon points={matrix.sequence.map(id => `${matrix.nodes.find(n => n.id === id)!.x},${matrix.nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={theme.borderTerminal} strokeWidth="0.7" />
                <polyline points={path.map(nodeId => `${matrix.nodes.find(n => n.id === nodeId)!.x},${matrix.nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke={theme.textBright} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {currentPointer && path.length > 0 && path.length < matrix.sequence.length && (
                  <line x1={matrix.nodes.find(n => n.id === path[path.length - 1])!.x} y1={matrix.nodes.find(n => n.id === path[path.length - 1])!.y} x2={currentPointer.x} y2={currentPointer.y} stroke={theme.textBright} strokeWidth="1.3" strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
                )}
                {matrix.nodes.map(node => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === matrix.sequence[path.length];
                  return (
                    <g key={node.id} style={{ pointerEvents: 'none' }}>
                      <circle cx={node.x} cy={node.y} r={isNext ? "4.2" : "2.4"} fill={isNext ? theme.textBright : isCompleted ? theme.textBright : theme.bgDark} stroke={isNext ? '#ffffff' : theme.textTerminal} strokeWidth="0.8" />
                      {isNext && <circle cx={node.x} cy={node.y} r="7.5" fill="none" stroke={theme.textBright} strokeWidth="1.1" style={{ animation: 'blink 0.8s infinite' }} />}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
        {phase === 'COMPLETE' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src={`/seals/${suspect.id}.png`} alt="Goetian Seal" style={{ width: '165px', height: '165px', marginBottom: '14px', filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' }} />
            <h2 style={{ color: theme.textBright, letterSpacing: '6px', minHeight: '35px', margin: '0' }}>{typedName}</h2>
            {showSealed && (
              <>
                <div style={{ color: theme.accentRed, border: `3px solid ${theme.accentRed}`, padding: '4px 16px', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '8px', marginTop: '10px', animation: 'stampSlam 0.22s ease-out forwards', boxShadow: '0 0 25px rgba(255,42,85,0.6)' }}>
                  [SEALED]
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a8ccaf', marginTop: '12px' }}>
                  +5% Banishment Probability toward <strong>{suspect.allegiance}</strong> | Sector Permanently Secured!
                </p>
                {cascadedNames.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(255, 184, 0, 0.12)', border: `1px solid ${theme.accentAmber}`, color: theme.accentAmber, fontSize: '0.75rem', lineHeight: '1.45' }}>
                    <strong>⚡ FEUDAL RESONANCE CASCADE:</strong><br/>
                    Because <strong>{suspect.name}</strong> is a high-ranking <strong>{suspect.rank}</strong> of {suspect.allegiance}, binding them automatically collapsed and sealed their vassal spirit(s) in the Codex: <strong>{cascadedNames.join(' & ')}</strong>!
                  </div>
                )}
                {!isCleanSeal && <p style={{ color: theme.accentRed, fontSize: '0.78rem', marginTop: '8px' }}>_TIMER EXPIRED: Emergency containment succeeded, but Global Entropy rose by +10%.</p>}
                <button onClick={onClose} style={{ marginTop: '18px', padding: '10px 20px', width: '100%', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.textBright}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}>
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
        executeResolution(Math.random() * 100 <= winProbability);
      }
    }
  }, [path.length, phase, currentMatrixIdx, matrices, winProbability]);

  const executeResolution = (success: boolean) => {
    setIsVictory(success);
    setPhase('RESOLUTION');
    if (success) {
      ThaumaturgicAudio.heavyStampImpact();
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

  const checkNodeHit = (coords: { x: number; y: number }) => {
    setPath(prevPath => {
      const nextId = matrices[currentMatrixIdx].sequence[prevPath.length];
      if (nextId === undefined) return prevPath;
      const targetNode = matrices[currentMatrixIdx].nodes.find(n => n.id === nextId)!;
      if (Math.hypot(coords.x - targetNode.x, coords.y - targetNode.y) < 17) {
        ThaumaturgicAudio.keyClick();
        return [...prevPath, targetNode.id];
      }
      return prevPath;
    });
  };

  const startTracing = (e: React.PointerEvent) => {
    if (phase !== 'RITUAL') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSVGCoords(e);
    if (!coords) return;
    setCurrentPointer({ x: coords.x, y: coords.y });
    checkNodeHit(coords);
  };

  const moveTracing = (e: React.PointerEvent) => {
    if (phase !== 'RITUAL' || !currentPointer) return;
    const coords = getSVGCoords(e);
    if (coords) {
      setCurrentPointer({ x: coords.x, y: coords.y });
      checkNodeHit(coords);
    }
  };

  const stopTracing = (e: React.PointerEvent) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    setCurrentPointer(null);
  };

  const overrideTheme = { bg: '#0f0202', border: '#ff3333', text: '#ff6666', bright: '#ffb3b3' };
  const activeMatrix = matrices[currentMatrixIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '12px' }}>
      <div style={{ width: '100%', maxWidth: '560px', padding: '28px', backgroundColor: overrideTheme.bg, border: `2px solid ${overrideTheme.border}`, boxShadow: `0 0 50px rgba(255, 51, 51, 0.2)`, fontFamily: theme.fontMono, color: overrideTheme.text, animation: isVictory ? 'heavyImpactShake 0.38s ease-out both' : 'none' }}>
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
            <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '0.76rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', backgroundColor: 'black', padding: '10px', border: `1px solid ${overrideTheme.border}` }}>
              {lieutenants.map(g => {
                const isSealed = state.sealedGoetia.includes(g.id);
                return (
                  <div key={g.id} style={{ color: isSealed ? '#62f080' : overrideTheme.text }}>
                    #{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()} {isSealed ? '[SEALED]' : '[ACTIVE]'}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'black', border: `1px dashed ${overrideTheme.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: overrideTheme.text }}>CALCULATED BANISHMENT PROBABILITY</div>
              <div style={{ fontSize: '2rem', color: overrideTheme.bright, fontWeight: 'bold' }}>{winProbability}%</div>
            </div>
            <button onClick={() => setPhase('RITUAL')} style={{ width: '100%', padding: '14px', marginTop: '14px', backgroundColor: overrideTheme.bright, color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px' }}>&gt; COMMENCE TRIPLE-MATRIX ENDURANCE RITE</button>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', marginTop: '8px', backgroundColor: 'transparent', color: overrideTheme.text, border: `1px solid ${overrideTheme.text}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </div>
        )}
        {phase === 'RITUAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <span style={{ color: overrideTheme.bright }}>MATRIX: {currentMatrixIdx + 1}/3 (STEP {path.length}/{activeMatrix.sequence.length})</span>
              <span style={{ color: overrideTheme.bright }}>T-MINUS: {timeLeft}s</span>
            </div>
            <div style={{ width: '100%', textAlign: 'center', padding: '5px', marginBottom: '10px', backgroundColor: '#1a0404', border: `1px dashed ${overrideTheme.border}`, color: '#ffffff', fontSize: '0.74rem' }}>
              Drag or click the <strong style={{ color: '#ffffff' }}>PULSING TARGET NODE</strong> to complete all 3 sigil matrices!
            </div>
            <div style={{ position: 'relative', width: '290px', height: '290px', border: `2px solid ${overrideTheme.border}`, backgroundColor: 'black', borderRadius: '50%' }}>
              <svg ref={svgRef} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }} onPointerDown={startTracing} onPointerMove={moveTracing} onPointerUp={stopTracing} onPointerCancel={stopTracing} onPointerLeave={stopTracing}>
                <polygon points={activeMatrix.sequence.map(id => `${activeMatrix.nodes.find(n => n.id === id)!.x},${activeMatrix.nodes.find(n => n.id === id)!.y}`).join(' ')} fill="none" stroke={overrideTheme.border} strokeWidth="0.9" strokeOpacity="0.7" />
                <polyline points={path.map(nodeId => `${activeMatrix.nodes.find(n => n.id === nodeId)!.x},${activeMatrix.nodes.find(n => n.id === nodeId)!.y}`).join(' ')} fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                {currentPointer && path.length > 0 && path.length < activeMatrix.sequence.length && (
                  <line x1={activeMatrix.nodes.find(n => n.id === path[path.length - 1])!.x} y1={activeMatrix.nodes.find(n => n.id === path[path.length - 1])!.y} x2={currentPointer.x} y2={currentPointer.y} stroke={overrideTheme.bright} strokeWidth="1.5" strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
                )}
                {activeMatrix.nodes.map(node => {
                  const isCompleted = path.includes(node.id);
                  const isNext = node.id === activeMatrix.sequence[path.length];
                  return (
                    <g key={node.id} style={{ pointerEvents: 'none' }}>
                      <circle cx={node.x} cy={node.y} r={isNext ? "4.2" : "2.4"} fill={isNext ? '#ffffff' : isCompleted ? '#ffffff' : 'black'} stroke={isNext ? '#ffffff' : overrideTheme.border} strokeWidth="0.8" />
                      {isNext && <circle cx={node.x} cy={node.y} r="7.5" fill="none" stroke="#ffffff" strokeWidth="1.1" style={{ animation: 'blink 0.8s infinite' }} />}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
        {phase === 'RESOLUTION' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h1 style={{ color: isVictory ? 'white' : overrideTheme.bright, letterSpacing: '6px', fontSize: '1.8rem', margin: '0 0 15px 0' }}>
              {isVictory ? 'HORSEMAN BANISHED' : 'TETHER RUPTURE'}
            </h1>
            <p style={{ color: overrideTheme.text, lineHeight: '1.6', fontSize: '0.88rem' }}>
              {isVictory
                ? `The conceptual apex of ${horseman} has been permanently severed from mundane reality.`
                : `The Grand Rite fractured (${winProbability}% roll failed or timed out). Global Entropy spiked by +25%.`}
            </p>
            <button onClick={onClose} style={{ padding: '12px 24px', marginTop: '20px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>&gt; RETURN TO OS</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const { state, dispatch, draftContract, resetGame, sealGoetia, startInvestigation, loadGame, travelTo } = useEngine();

  const [viewport, setViewport] = useState<ViewportMode>('FIELD_OPS');
  const [mapViewMode, setMapViewMode] = useState<'SUB_GRID' | 'GEO_TRACKER'>('SUB_GRID');
  const [fontScale, setFontScale] = useState<FontScale>('MD');
  const [controlMode, setControlMode] = useState<ControlMode>('PALETTE');
  const [showManual, setShowManual] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hudFlash, setHudFlash] = useState<'NONE' | 'DAMAGE' | 'DECODE'>('NONE');

  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const [microEntropy, setMicroEntropy] = useState<number>(() => {
    const saved = localStorage.getItem('thaumaturgic_os_micro_entropy_v2');
    return saved ? parseFloat(saved) || 0 : 0;
  });

  const [contracts, setContracts] = useState<Record<string, SectorContract>>(() => {
    const saved = localStorage.getItem('thaumaturgic_os_contracts_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  const [yokaiCharges, setYokaiCharges] = useState<Record<string, number>>({});
  const [attunedSectors, setAttunedSectors] = useState<Record<string, boolean>>({});
  const [deducedSigns, setDeducedSigns] = useState<string[]>([]);
  const [codexHorsemanFilter, setCodexHorsemanFilter] = useState<'ALL' | 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH'>('ALL');
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('01_bael');

  const [activeSealSuspectId, setActiveSealSuspectId] = useState<string | null>(null);
  const [activeBanishmentTarget, setActiveBanishmentTarget] = useState<'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH' | null>(null);

  const [terminalLines, setTerminalLines] = useState<TerminalEntry[]>([]);
  const [cliInput, setCliInput] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

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

  const triggerHudFlash = (kind: 'DAMAGE' | 'DECODE') => {
    setHudFlash(kind);
    setTimeout(() => setHudFlash('NONE'), 420);
  };

  const handleFullReset = () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('thaumaturgic_os')) localStorage.removeItem(k);
    });
    setContracts({});
    setMicroEntropy(0);
    setDeducedSigns([]);
    setYokaiCharges({});
    setAttunedSectors({});
    setTerminalLines([]);
    resetGame();
  };

  const isSectorSecured = (sectorId: string) => !!state.flags[`sector_secured_${sectorId}`];
  const isSectorUnlocked = (sec: MacroSectorDef) => {
    if (sec.unlockedByDefault || state.flags[`sector_unlocked_${sec.id}`] || isSectorSecured(sec.id)) return true;
    return sec.connections.some(connId => isSectorSecured(connId));
  };

  const addMicroEntropy = (delta: number) => {
    setMicroEntropy(prev => {
      const next = Math.max(0, +(prev + delta).toFixed(2));
      localStorage.setItem('thaumaturgic_os_micro_entropy_v2', String(next));
      return next;
    });
  };

  const totalGlobalEntropy = Math.min(100, +(state.globalEntropy + microEntropy).toFixed(2));

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  };

  const appendLog = (html: string, type: TerminalEntry['type'] = 'normal') => {
    setTerminalLines(prev => [...prev, { id: Date.now() + Math.random(), html, type }]);
  };

  useEffect(() => {
    if (Object.keys(contracts).length > 0) {
      localStorage.setItem('thaumaturgic_os_contracts_v2', JSON.stringify(contracts));
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
      }

      appendLog(
        `<div style="border-left:2px solid #62f080;padding-left:10px;margin:4px 0;">` +
        `<div style="color:#62f080;font-weight:bold;">// THAUMATURGIC OS v4.12 — FIELD INFILTRATION PROTOCOL</div>` +
        `<div style="color:#a8ccaf;line-height:1.5;">` +
        `1. <strong>RECON BEFORE ENTERING:</strong> Run <code style="color:#ffb800;">scan 1</code> to check Room 1 for Traps or Malleus Patrols.<br/>` +
        `2. <strong>DISARM FROM OUTSIDE:</strong> Disarm Patrols (<code style="color:#ff2a55;">decoy 1</code>) or Traps (<code style="color:#00f3ff;">degauss</code>, <code style="color:#00f3ff;">bypass</code>, <code style="color:#00f3ff;">purge</code>, <code style="color:#00f3ff;">dispel</code>) <em>before</em> running <code style="color:#ffb800;">enter</code> to avoid trap damage!<br/>` +
        `3. <strong>DECODE 3 CLUES:</strong> Inside a room, match <code style="color:#62f080;">vox</code> (Audio), <code style="color:#62f080;">assay</code> (Matter), or <code style="color:#62f080;">auspex</code> (Astral/Thermal) to the room's clue symptom.<br/>` +
        `4. <strong>SHIKIGAMI DAEMONS ([F3] KAGE):</strong> Bind a spirit in <strong>[F3] KAGE</strong> to cut Scan Humanity costs in half (-2% HUM) and unlock active Heat-venting powers!` +
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

  // Auto-select the top matching demon in [F2] CODEX whenever filters change!
  const filteredCodexGoetia = allGoetia.filter(g => {
    if (codexHorsemanFilter !== 'ALL' && g.allegiance !== codexHorsemanFilter) return false;
    if (deducedSigns.length === 0) return true;
    const uniqueSigns = getUniqueGoetiaSigns(g.id);
    return deducedSigns.every(tag => uniqueSigns.includes(tag));
  });

  useEffect(() => {
    if (filteredCodexGoetia.length > 0 && !filteredCodexGoetia.some(g => g.id === selectedSuspectId)) {
      setSelectedSuspectId(filteredCodexGoetia[0].id);
    } else if (deducedSigns.length > 0 && filteredCodexGoetia.length === 1 && selectedSuspectId !== filteredCodexGoetia[0].id) {
      setSelectedSuspectId(filteredCodexGoetia[0].id);
    }
  }, [deducedSigns, codexHorsemanFilter, filteredCodexGoetia, selectedSuspectId]);

  const currentContract = contracts[state.currentNode];
  const currentSubNode = currentContract?.subNodes.find(n => n.id === currentContract.activeSubNodeId) || null;
  const selectedSubNode = currentContract?.subNodes.find(n => n.id === currentContract.selectedSubNodeId) || null;
  const currentHeat = state.sectorEntropy[state.currentNode] || 0;

  const resolveTargetRoom = (arg?: string): SubGridNode | null => {
    if (!currentContract) return null;
    if (!arg || !arg.trim()) return selectedSubNode || currentSubNode;
    const num = parseInt(arg.trim(), 10);
    if (!isNaN(num)) return currentContract.subNodes.find(n => n.index === num) || null;
    return currentContract.subNodes.find(n => n.label.toLowerCase().includes(arg.toLowerCase())) || null;
  };

  const isAdjacentOrEntry = (targetNode: SubGridNode): boolean => {
    if (!currentSubNode) return targetNode.index === 1;
    return currentSubNode.connections.includes(targetNode.id);
  };

  // Calculates the exact Heat cost of entering a room so the player is never surprised
  const getRoomEntryHeatCost = (node: SubGridNode): number => {
    const firstEntry = node.status === 'LOCKED' || node.status === 'SCANNED';
    return firstEntry ? node.wardLevel * 8 : 2;
  };

  const handleUnbindYokai = (yokaiId: string, reason = 'Manually severed') => {
    ThaumaturgicAudio.errorBuzz();
    const updatedTether = state.tetheredYokai.filter(id => id !== yokaiId);
    dispatch({
      type: 'LOAD_GAME',
      payload: { ...state, tetheredYokai: updatedTether, activeContracts: updatedTether }
    });
    const yName = allYokai.find(y => y.id === yokaiId)?.nameEn || yokaiId;
    appendLog(`[*] DAEMON UNBOUND: <strong style="color:#ff2a55;">${yName}</strong> (${reason}).`, 'warn');
    addToast(`Unbound: ${yName}`, 'ALERT');
  };

  const handleScanRoom = (targetNode?: SubGridNode | null) => {
    if (!currentContract) return;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(`[✓] Sector is permanently SECURED. Switch to REGIONAL MAP to deploy elsewhere.`, 'success');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS LOCKDOWN (100% HEAT)! Execute <code>spoof</code> or <code>bribe</code> first.`, 'error');
      return;
    }

    const node = targetNode || selectedSubNode;
    if (!node) return;
    if (node.status !== 'LOCKED') {
      appendLog(`[i] <strong>${node.label}</strong> is already ${node.status}.`, 'system');
      return;
    }
    if (!isAdjacentOrEntry(node)) {
      ThaumaturgicAudio.errorBuzz();
      const reachableList = currentContract.subNodes.filter(n => isAdjacentOrEntry(n)).map(n => `Room ${n.index}`).join(', ');
      appendLog(`[-] Cannot scan <strong>${node.label}</strong>—not connected to your current position (${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}). Reachable rooms: <strong>${reachableList}</strong>.`, 'error');
      return;
    }

    const humCost = state.tetheredYokai.length > 0 ? 2 : 5;
    if (state.humanity <= humCost) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Insufficient Humanity to run Auspex Scan.`, 'error');
      return;
    }

    ThaumaturgicAudio.scryPing();
    dispatch({ type: 'MODIFY_HUMANITY', payload: -humCost });
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 1.0 });

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === node.id ? { ...n, status: 'SCANNED' as const } : n
    );
    setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, selectedSubNodeId: node.id, subNodes: updatedNodes } }));

    const entryHeat = getRoomEntryHeatCost(node);
    const sigDesc =
      node.nodeType === 'ANOMALY' ? '<span style="color:#62f080;">[CLUE SIGNAL DETECTED]</span>' :
      node.nodeType === 'SHRINE' ? '<span style="color:#00f3ff;">[DORMANT KAMI SHRINE]</span>' :
      node.nodeType === 'PATROL' ? '<span style="color:#ff2a55;">[MALLEUS HOUND PATROL INSIDE!]</span>' :
      '<span style="color:#ffb800;">[GOETIAN CONDUIT ANCHOR]</span>';

    let warningTxt = `<br/><span style="color:#a8ccaf;">• Entry Ward Cost: <strong>+${entryHeat}% Heat</strong> when you run <code>enter ${node.index}</code>.</span>`;
    if (node.patrolActive) {
      warningTxt += `<br/><span style="color:#ff2a55;">⚠️ THRESHOLD ALERT: Malleus Hound Patrol inside! Run <code>decoy ${node.index}</code> BEFORE entering to lure them away safely.</span>`;
    } else if (node.hazard !== 'NONE') {
      warningTxt += `<br/><span style="color:#00f3ff;">⚠️ THRESHOLD TRAP: "${HAZARD_MANIFEST[node.hazard].symptom}" — Disarm BEFORE entering (<code>degauss ${node.index}</code> / <code>bypass ${node.index}</code> / <code>purge ${node.index}</code> / <code>dispel ${node.index}</code>).</span>`;
    } else {
      warningTxt += `<br/><span style="color:#62f080;">✓ Threshold clear of traps. Safe to run <code>enter ${node.index}</code>.</span>`;
    }

    appendLog(`[📡 SCAN] <strong>${node.label}</strong> (-${humCost}% HUM): ${sigDesc}${warningTxt}`, 'info');
  };

  // Resolves an explicit room number if typed (e.g. `degauss 2`), or falls back to selected/current room
  const resolveCounterTarget = (arg?: string): SubGridNode | null => {
    if (!currentContract) return null;
    if (arg && arg.trim()) {
      return resolveTargetRoom(arg);
    }
    if (selectedSubNode && selectedSubNode.status !== 'LOCKED' && (selectedSubNode.patrolActive || selectedSubNode.hazard !== 'NONE')) {
      return selectedSubNode;
    }
    if (currentSubNode && (currentSubNode.patrolActive || currentSubNode.hazard !== 'NONE')) {
      return currentSubNode;
    }
    return selectedSubNode || currentSubNode;
  };

  const handleDecoyPatrol = (arg?: string) => {
    if (!currentContract) return;
    const target = resolveCounterTarget(arg);
    if (!target) return;

    if (!target.patrolActive) {
      appendLog(`[i] No active Malleus Patrol in <strong>${target.label}</strong>. (Specify a room number like <code>decoy 4</code> or click a room on the map.)`, 'system');
      return;
    }
    ThaumaturgicAudio.scryPing();
    triggerHudFlash('DECODE');
    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === target.id ? { ...n, patrolActive: false } : n
    );
    setContracts(prev => ({
      ...prev,
      [currentContract.sectorId]: { ...currentContract, selectedSubNodeId: target.id, subNodes: updatedNodes }
    }));
    appendLog(`[✓ DECOY DEPLOYED on <strong>${target.label}</strong>] Phantom signal lured the Malleus Hound Patrol away! Safe to <code>enter ${target.index}</code> (+${getRoomEntryHeatCost(target)}% Heat).`, 'success');
    addToast(`Patrol Cleared in ${target.label}!`, 'SEAL');
  };

  const handleAttemptTrapCounter = (cmdUsed: string, arg?: string) => {
    if (!currentContract) return;
    const target = resolveCounterTarget(arg);
    if (!target) return;

    if (target.status === 'LOCKED') {
      appendLog(`[-] Scan <strong>${target.label}</strong> first (<code>scan ${target.index}</code>) before attempting to disarm its threshold.`, 'warn');
      return;
    }
    if (target.hazard === 'NONE') {
      appendLog(`[i] No active trap in <strong>${target.label}</strong>. (Tip: Type the room number, e.g. <code>${cmdUsed} 2</code>, or click the room on the map first.)`, 'system');
      return;
    }

    const hazardSpec = HAZARD_MANIFEST[target.hazard];
    if (hazardSpec.counterCmd !== cmdUsed) {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      const shockHum = state.tetheredYokai.includes('yokai_baku') ? -3 : -6;
      dispatch({ type: 'MODIFY_HUMANITY', payload: shockHum });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: 8 } });
      appendLog(`[!] WRONG COUNTER-MEASURE on <strong>${target.label}</strong>! Running <code>${cmdUsed}</code> against <strong>${hazardSpec.label}</strong> caused a feedback shock (${shockHum}% HUM, +8% Heat)!`, 'error');
      addToast(`Wrong Counter-Command! ${shockHum}% HUM`, 'ALERT');
      return;
    }

    ThaumaturgicAudio.scryPing();
    triggerHudFlash('DECODE');
    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === target.id ? { ...n, hazard: 'NONE' as const } : n
    );
    setContracts(prev => ({
      ...prev,
      [currentContract.sectorId]: { ...currentContract, selectedSubNodeId: target.id, subNodes: updatedNodes }
    }));

    if (target.hazard === 'WIRE') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -10 } });
    }
    appendLog(`[✓ TRAP DISARMED on <strong>${target.label}</strong>] ${hazardSpec.clearMsg}`, 'success');

    // Immediately show the room's clue symptom if the player is inside or has scanned it!
    if (target.rawSignalSymptom && target.status !== 'CLEARED') {
      if (currentSubNode && currentSubNode.id === target.id) {
        appendLog(`[🔎 CLUE SIGNAL REVEALED in <strong>${target.label}</strong>] <em>"${target.rawSignalSymptom}"</em> — Run matching forensic tool: <code>vox</code> (Audio), <code>assay</code> (Matter), or <code>auspex</code> (Astral/Thermal).`, 'info');
      } else {
        appendLog(`[✓ THRESHOLD SAFE] Ready to run <code>enter ${target.index}</code> (+${getRoomEntryHeatCost(target)}% Heat).`, 'info');
      }
    }
    addToast(`Disarmed: ${hazardSpec.label}`, 'SEAL');
  };

  const handleEnterRoom = (targetNode?: SubGridNode | null) => {
    if (!currentContract) return;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(`[✓] Sector already SECURED.`, 'success');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] 100% HEAT LOCKDOWN! Run <code>spoof</code> or <code>bribe</code> to lift the Malleus cordon.`, 'error');
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
      const reachableList = currentContract.subNodes.filter(n => isAdjacentOrEntry(n)).map(n => `Room ${n.index}`).join(', ');
      appendLog(`[-] <strong>${node.label}</strong> is not connected to your current room (${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}). Connected rooms: <strong>${reachableList}</strong>.`, 'error');
      return;
    }

    ThaumaturgicAudio.senseSweep();
    addMicroEntropy(0.01);
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 8, alpha: 1.0 });

    let heatGain = getRoomEntryHeatCost(node);
    let patrolClearedOnImpact = false;
    let trapClearedOnImpact = false;

    if (node.patrolActive) {
      heatGain += 20;
      patrolClearedOnImpact = true;
      dispatch({ type: 'MODIFY_HUMANITY', payload: -12 });
      triggerHudFlash('DAMAGE');
      appendLog(`[!] WALKED INTO MALLEUS PATROL in <strong>${node.label}</strong>! Witch-hounds ambushed your tether (-12% HUM, +${heatGain}% Heat)! (Tip: Run <code>scan</code> then <code>decoy</code> before entering!)`, 'error');
      addToast(`Malleus Ambush! -12% Humanity`, 'ALERT');
    } else if (node.hazard !== 'NONE') {
      // Entering a room while its trap is still live triggers immediate trap damage & disarms it on impact!
      const trapName = HAZARD_MANIFEST[node.hazard].label;
      const trapHumPenalty = state.tetheredYokai.includes('yokai_baku') ? -4 : -8;
      heatGain += 10;
      trapClearedOnImpact = true;
      dispatch({ type: 'MODIFY_HUMANITY', payload: trapHumPenalty });
      triggerHudFlash('DAMAGE');
      appendLog(`[💥 THRESHOLD TRAP TRIGGERED in <strong>${node.label}</strong>!] You walked through a live <strong>${trapName}</strong> without disarming it from outside (${trapHumPenalty}% HUM, +${heatGain}% Total Heat)!`, 'error');
      addToast(`Triggered ${trapName}! (${trapHumPenalty}% HUM)`, 'ALERT');
    } else {
      appendLog(`[⚡ ENTER] Moved into <strong>${node.label}</strong> (+${heatGain}% Inquisition Heat).`, 'info');
    }

    if (node.nodeType === 'ANCHOR') {
      appendLog(
        `<div style="border-left:2px solid #ffb800;padding-left:8px;margin:4px 0;color:#ffb800;">` +
        `<strong>[⚡ GOETIAN CONDUIT ANCHOR REACHED]</strong> This chamber is the epicenter of the demon's tear in reality. Decode the room's clue signal, and type <code style="color:#62f080;">attune</code> to calibrate your Brass Vessel for a <strong>+4s timer bonus</strong> on this sector's Sealing Rite!` +
        `</div>`,
        'warn'
      );
    }

    if (node.rawSignalSymptom && node.status !== 'CLEARED') {
      appendLog(`[🔎 CLUE SIGNAL IN <strong>${node.label}</strong>] <em>"${node.rawSignalSymptom}"</em> — Run matching forensic tool: <code>vox</code> (Audio), <code>assay</code> (Matter), or <code>auspex</code> (Astral/Thermal).`, 'info');
    } else if (node.nodeType === 'SHRINE' && node.status !== 'CLEARED') {
      appendLog(`[⛩️ KAMI SHRINE] Dormant spirit altar found. Run <code>loot</code> to awaken the Shikigami daemon and collect salvage.`, 'info');
    } else if (!node.rawSignalSymptom && node.status !== 'CLEARED') {
      appendLog(`[📦 SALVAGE CACHE] Room clear of traps. Run <code>loot</code> to collect raw salvage.`, 'info');
    }

    const newHeat = Math.min(100, currentHeat + heatGain);
    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: heatGain } });

    if (newHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      appendLog(`<div style="background:rgba(255,42,85,0.2);border:1px solid #ff2a55;padding:8px;color:#ff2a55;font-weight:bold;">[🚨 100% INQUISITION HEAT — SECTOR LOCKDOWN!] Type <code>spoof</code> or <code>bribe</code> to lift cordon.</div>`, 'error');
    }

    const firstEntry = node.status === 'LOCKED' || node.status === 'SCANNED';
    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === node.id
        ? {
            ...n,
            status: firstEntry ? ('ENTERED' as const) : n.status,
            patrolActive: patrolClearedOnImpact ? false : n.patrolActive,
            hazard: trapClearedOnImpact ? ('NONE' as const) : n.hazard
          }
        : n
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

  const handleAttuneAnchor = () => {
    if (!currentContract || !currentSubNode) {
      appendLog(`[-] Enter a room first.`, 'error');
      return;
    }
    if (currentSubNode.nodeType !== 'ANCHOR') {
      appendLog(`[-] You can only run <code>attune</code> inside Room 6 (the <strong>[ANCHOR]</strong> chamber).`, 'warn');
      return;
    }
    if (attunedSectors[currentContract.sectorId]) {
      appendLog(`[i] Brass Vessel is already attuned to ${currentContract.sectorLabel} (+4s Sealing Rite bonus active).`, 'system');
      return;
    }
    ThaumaturgicAudio.sealSuccess();
    triggerHudFlash('DECODE');
    setAttunedSectors(prev => ({ ...prev, [currentContract.sectorId]: true }));
    appendLog(`[✓ VESSEL ATTUNED AT ANCHOR] Synchronized your Brass Vessel with the conduit frequency! You gain <strong>+4 seconds</strong> on the Sealing Rite timer in this sector.`, 'success');
    addToast(`Vessel Attuned! +4s Sealing Timer`, 'SEAL');
  };

  const handleRunForensicTool = (toolCmd: string, expectedChannel: ForensicChannel, toolLabel: string) => {
    if (!currentContract || !currentSubNode) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Enter Room 1 first (<code>enter 1</code>).`, 'error');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] SECTOR LOCKDOWN (100% HEAT). Forensic tools jammed!`, 'error');
      return;
    }
    if (currentSubNode.status === 'CLEARED') {
      appendLog(`[i] <strong>${currentSubNode.label}</strong> has already been cleared.`, 'system');
      return;
    }
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      const shockHum = state.tetheredYokai.includes('yokai_baku') ? -3 : -6;
      dispatch({ type: 'MODIFY_HUMANITY', payload: shockHum });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: 10 } });
      appendLog(`[!] TRAP INTERFERENCE! Running <code>${toolCmd}</code> while <em>"${HAZARD_MANIFEST[currentSubNode.hazard].symptom}"</em> is active caused feedback damage (${shockHum}% HUM, +10% Heat)!`, 'error');
      addToast(`Trap Blocked Scan! Disarm First!`, 'ALERT');
      return;
    }

    if (!currentSubNode.signalChannel) {
      handleLootRoom(true);
      return;
    }

    if (currentSubNode.signalChannel !== expectedChannel) {
      ThaumaturgicAudio.errorBuzz();
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: 5 } });
      appendLog(`[-] WRONG INSTRUMENT: <strong>${toolLabel}</strong> (<code>${toolCmd}</code>) returned static against: <em>"${currentSubNode.rawSignalSymptom}"</em> (+5% Heat).`, 'warn');
      addToast(`Wrong Forensic Tool! (+5% Heat)`, 'ALERT');
      return;
    }

    ThaumaturgicAudio.sealSuccess();
    triggerHudFlash('DECODE');
    addMicroEntropy(0.01);
    const updatedLogs = [...currentContract.discoveredLogs];

    if (currentSubNode.forensicText) {
      updatedLogs.push({
        id: `${currentSubNode.id}_log`,
        nodeLabel: currentSubNode.label,
        text: currentSubNode.forensicText,
        channel: expectedChannel
      });
      appendLog(
        `<div style="background:rgba(98,240,128,0.09);border-left:3px solid #62f080;padding:8px 10px;margin:4px 0;">` +
        `<div style="color:#62f080;font-weight:bold;">[✓ ${toolLabel} // CLUE ${updatedLogs.length}/3 DECODED AT ${currentSubNode.label}]</div>` +
        `<div style="color:#ffffff;margin-top:4px;">"${currentSubNode.forensicText}"</div>` +
        `<div style="color:#ffb800;font-size:0.75rem;margin-top:4px;">-&gt; Logged to <strong>[F2] CODEX</strong>!</div>` +
        `</div>`,
        'success'
      );
      addToast(`Clue ${updatedLogs.length}/3 Decoded!`, 'INTEL');
    }

    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      appendLog(`[📦 SALVAGE] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>.`, 'info');
    }

    // Guided Milestone Banner when all 3 clues are found!
    if (updatedLogs.length >= 3) {
      appendLog(
        `<div style="background:rgba(255,184,0,0.14);border:1px solid #ffb800;padding:10px;margin:6px 0;color:#ffb800;">` +
        `<strong>🎯 [3/3 CLUES DECODED — CASE READY FOR DEDUCTION!]</strong><br/>` +
        `Press <strong>[F2] CODEX</strong> (or type <code>codex</code>) to tick off your 3 phenomena and identify the demon, then craft its catalysts in <strong>[F4] SAFEHOUSE</strong>!` +
        `</div>`,
        'warn'
      );
      addToast(`3/3 Clues Found! Press [F2] CODEX`, 'SEAL');
    }

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === currentSubNode.id ? { ...n, status: 'CLEARED' as const } : n
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

  const handleLootRoom = (bypassSignalCheck = false) => {
    if (!currentContract || !currentSubNode) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Enter Room 1 first (<code>enter 1</code>).`, 'error');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] SECTOR LOCKDOWN (100% HEAT).`, 'error');
      return;
    }
    if (currentSubNode.status === 'CLEARED') {
      appendLog(`[i] <strong>${currentSubNode.label}</strong> is already cleared.`, 'system');
      return;
    }
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      dispatch({ type: 'MODIFY_HUMANITY', payload: -6 });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: 10 } });
      appendLog(`[!] TRAP BLOCKED LOOTING: <em>"${HAZARD_MANIFEST[currentSubNode.hazard].symptom}"</em> (-6% HUM, +10% Heat)!`, 'error');
      return;
    }
    if (!bypassSignalCheck && currentSubNode.signalChannel) {
      appendLog(`[!] UNDECODED CLUE IN ROOM: <em>"${currentSubNode.rawSignalSymptom}"</em> — Run <code>vox</code>, <code>assay</code>, or <code>auspex</code> to decode the clue and collect salvage!`, 'warn');
      return;
    }

    ThaumaturgicAudio.sealSuccess();
    triggerHudFlash('DECODE');
    addMicroEntropy(0.01);

    if (currentSubNode.nodeType === 'SHRINE' && currentSubNode.shrineYokaiId) {
      const yokai = allYokai.find(y => y.id === currentSubNode.shrineYokaiId);
      if (yokai && yokai.unlockFlag) {
        dispatch({ type: 'SET_FLAG', payload: { flagId: yokai.unlockFlag, value: true } });
        appendLog(
          `<div style="border-left:3px solid #00f3ff;padding-left:10px;margin:4px 0;color:#00f3ff;">` +
          `<strong>[⛩️ KAMI SHRINE AWAKENED: ${yokai.nameEn.toUpperCase()}]</strong><br/>` +
          `Open <strong>[F3] KAGE</strong> to bind up to 2 Shikigami daemons! Bound daemons cut your <code>scan</code> Humanity cost in half (-2% HUM) and grant active powers like venting -30% Heat or radar-sweeping all rooms.` +
          `</div>`,
          'success'
        );
        addToast(`Shikigami Unlocked: ${yokai.nameEn} (Check [F3] KAGE)`, 'SEAL');
      }
    }

    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      appendLog(`[📦 SALVAGE COLLECTED] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>.`, 'info');
    }

    const updatedNodes = currentContract.subNodes.map(n =>
      n.id === currentSubNode.id ? { ...n, status: 'CLEARED' as const } : n
    );

    setContracts(prev => ({
      ...prev,
      [currentContract.sectorId]: { ...currentContract, subNodes: updatedNodes }
    }));
  };

  const handleInvokeYokaiPower = (yokaiId: string) => {
    const spec = YOKAI_DAEMON_SPECS[yokaiId];
    if (!spec) return;
    const currentCharges = yokaiCharges[yokaiId] ?? spec.maxCharges;
    if (currentCharges <= 0) {
      handleUnbindYokai(yokaiId, 'Contract charges exhausted');
      return;
    }

    const yName = allYokai.find(y => y.id === yokaiId)?.nameEn || yokaiId;

    if (yokaiId === 'yokai_kitsune') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -30 } });
      appendLog(`[👹 ${spec.codeName} // FOXFIRE SHROUD] Injected phantom telemetry (-30% Inquisition Heat).`, 'success');
    } else if (yokaiId === 'yokai_tengu') {
      if (!currentContract) return;
      if (state.humanity <= 5) { addToast('Requires 5% Humanity!', 'ALERT'); return; }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -5 });
      const revealedNodes = currentContract.subNodes.map(n => n.status === 'LOCKED' ? { ...n, status: 'SCANNED' as const } : n);
      setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, subNodes: revealedNodes } }));
      appendLog(`[👹 ${spec.codeName} // GALE SWEEP] Aerial LiDAR scanned all 6 rooms (-5% HUM)!`, 'success');
    } else if (yokaiId === 'yokai_baku') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -15 } });
      dispatch({ type: 'MODIFY_HUMANITY', payload: 20 });
      appendLog(`[👹 ${spec.codeName} // DEVOUR NIGHTMARE] Converted -15% Inquisition Heat into +20% Humanity.`, 'success');
    } else if (yokaiId === 'yokai_zashiki') {
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 35 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 1 } });
      appendLog(`[👹 ${spec.codeName} // FORTUNE BOON] Liquidated syndicate cache for +35 Obols and +1 Scrap Metal!`, 'success');
    } else if (yokaiId === 'yokai_kameosa') {
      if (state.humanity <= 8) { addToast('Requires 8% Humanity!', 'ALERT'); return; }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -8 });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 1 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'cursed_earth', amount: 1 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'alchemical_distillate', amount: 1 } });
      appendLog(`[👹 ${spec.codeName} // FERMENT MATTER] Synthesized +1 Metal, +1 Earth, and +1 Distillate (-8% HUM)!`, 'success');
    } else if (yokaiId === 'yokai_kamaitachi') {
      if (!currentContract || !selectedSubNode) return;
      if (!isAdjacentOrEntry(selectedSubNode)) {
        addToast('Select a reachable adjacent room first!', 'ALERT');
        return;
      }
      const updatedNodes = currentContract.subNodes.map(n =>
        n.id === selectedSubNode.id
          ? { ...n, status: 'ENTERED' as const, hazard: 'NONE' as const, patrolActive: false }
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
      appendLog(`[👹 ${spec.codeName} // WIND SICKLE] Sliced silently into <strong>${selectedSubNode.label}</strong> (0% Heat, Patrols &amp; Traps disarmed)!`, 'success');
    } else if (yokaiId === 'yokai_amabie') {
      if ((state.inventory.obols || 0) < 10) { addToast('Requires 10 Obols!', 'ALERT'); return; }
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } });
      addMicroEntropy(-2.5);
      appendLog(`[👹 ${spec.codeName} // PROPHETIC WARD] Purged -2.50% Global Entropy (-10 Obols).`, 'success');
    } else if (yokaiId === 'yokai_noppera') {
      if (currentContract) {
        const disarmNodes = currentContract.subNodes.map(n =>
          n.patrolActive ? { ...n, patrolActive: false, status: n.status === 'LOCKED' ? ('SCANNED' as const) : n.status } : n
        );
        setContracts(prev => ({ ...prev, [currentContract.sectorId]: { ...currentContract, subNodes: disarmNodes } }));
      }
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -15 } });
      appendLog(`[👹 ${spec.codeName} // FACELESS DECOY] Disarmed sector Malleus Patrols and dropped Heat by -15%.`, 'success');
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

  const processCliCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    appendLog(`<span style="color:#62f080;">root@${state.playerName.toLowerCase() || 'operative'}:~#</span> ${trimmed}`, 'command');

    if (cmd === 'help' || cmd === '?') {
      appendLog(
        `<div style="background:rgba(31,61,38,0.25);border:1px solid #1f3d26;padding:10px;line-height:1.55;">` +
        `<strong style="color:#62f080;">1. RECON &amp; ENTRY:</strong> <code style="color:#ffb800;">scan [1-6]</code> | <code style="color:#ffb800;">enter [1-6]</code> | <code style="color:#ffb800;">loot</code> | <code style="color:#ffb800;">attune</code> (at Anchor)<br/>` +
        `<strong style="color:#00f3ff;">2. PRE-ENTRY COUNTERS:</strong> <code style="color:#ff2a55;">decoy [1-6]</code> | <code style="color:#00f3ff;">degauss [1-6]</code> | <code style="color:#00f3ff;">bypass [1-6]</code> | <code style="color:#00f3ff;">purge [1-6]</code> | <code style="color:#00f3ff;">dispel [1-6]</code><br/>` +
        `<strong style="color:#62f080;">3. FORENSIC SUITE:</strong> <code style="color:#62f080;">vox</code> (Audio) | <code style="color:#62f080;">assay</code> (Matter/Bio) | <code style="color:#62f080;">auspex</code> (Astral/Thermal)<br/>` +
        `<strong style="color:#ff2a55;">4. INQUISITION HEAT:</strong> <code style="color:#ff2a55;">spoof</code> (-15 Obols: -25% Heat) | <code style="color:#ff2a55;">bribe</code> (-25 Obols: -45% Heat)` +
        `</div>`,
        'info'
      );
    } else if (cmd === 'scan' || cmd === 'probe') {
      handleScanRoom(resolveTargetRoom(arg));
    } else if (cmd === 'enter' || cmd === 'breach' || cmd === 'move' || cmd === 'node') {
      handleEnterRoom(resolveTargetRoom(arg));
    } else if (cmd === 'loot' || cmd === 'extract') {
      handleLootRoom(false);
    } else if (cmd === 'attune') {
      handleAttuneAnchor();
    } else if (cmd === 'decoy') {
      handleDecoyPatrol(arg);
    } else if (['degauss', 'bypass', 'purge', 'purify', 'dispel'].includes(cmd)) {
      handleAttemptTrapCounter(cmd === 'purify' ? 'purge' : cmd, arg);
    } else if (cmd === 'vox') {
      handleRunForensicTool('vox', 'AUDIO', 'VOX SPECTROGRAM');
    } else if (cmd === 'assay' || cmd === 'reagent') {
      handleRunForensicTool('assay', 'MATTER', 'MATTER ASSAY');
    } else if (cmd === 'auspex' || cmd === 'lidar' || cmd === 'lens') {
      handleRunForensicTool('auspex', 'ASTRAL', 'AUSPEX SENSOR');
    } else if (cmd === 'spoof') {
      if ((state.inventory.obols || 0) < 15) {
        ThaumaturgicAudio.errorBuzz();
        appendLog(`[-] Frequency Spoofing requires 15 Obols.`, 'error');
        return;
      }
      ThaumaturgicAudio.scryPing();
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -15 } });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -25 } });
      appendLog(`[📡 SIGNAL SPOOFED] Broadcasted phantom telemetry (-15 Obols, -25% Inquisition Heat).`, 'success');
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
      appendLog(`[🪙 INQUISITION BRIBED] Paid 25 Obols to Malleus Watch officers (-45% Heat; Cordon lifted).`, 'success');
      addToast(`Inquisition Cordon Lifted (-45% Heat)!`, 'SEAL');
    } else if (cmd === 'status' || cmd === 'look') {
      if (!currentContract) return;
      appendLog(`[+] SECTOR: <strong>${currentContract.sectorLabel}</strong> | POS: <strong>${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}</strong> | HEAT: <strong>${currentHeat}%</strong>`, 'info');
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
      appendLog(`[-] Unknown command "${cmd}". Type <code>help</code> or use the buttons below.`, 'error');
    }
  };

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

          ctx.strokeStyle = 'rgba(74, 124, 89, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
          for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

          ctx.save();
          ctx.translate(w / 2 + mapPan.x, h / 2 + mapPan.y);
          ctx.scale(mapZoom, mapZoom);
          ctx.translate(-w / 2, -h / 2);

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

            // If at Perimeter Tether, draw a glowing entry line into Room 1
            if (!currentContract.activeSubNodeId) {
              const r1 = currentContract.subNodes[0];
              if (r1) {
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([5, 4]);
                ctx.moveTo(0.03 * w, r1.y * h);
                ctx.lineTo(r1.x * w, r1.y * h);
                ctx.strokeStyle = 'rgba(98, 240, 128, 0.85)';
                ctx.lineWidth = 2.4;
                ctx.stroke();
                ctx.fillStyle = '#62f080';
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.fillText('START ->', 0.06 * w, r1.y * h - 8);
                ctx.restore();
              }
            }

            // Draw Room Connections (Bright & Dashed for Currently Reachable Paths!)
            currentContract.subNodes.forEach(node => {
              node.connections.forEach(tid => {
                const target = currentContract.subNodes.find(n => n.id === tid);
                if (!target || node.index > target.index) return;
                const isActivePath =
                  currentContract.activeSubNodeId === node.id ||
                  currentContract.activeSubNodeId === target.id;

                ctx.save();
                ctx.beginPath();
                if (isActivePath && !sectorSecured) {
                  ctx.setLineDash([6, 4]);
                  ctx.strokeStyle = 'rgba(98, 240, 128, 0.85)';
                  ctx.lineWidth = 2.6;
                } else {
                  ctx.strokeStyle = sectorSecured
                    ? 'rgba(98, 240, 128, 0.55)'
                    : node.status !== 'LOCKED' && target.status !== 'LOCKED'
                    ? 'rgba(98, 240, 128, 0.35)'
                    : 'rgba(74, 124, 89, 0.18)';
                  ctx.lineWidth = 1.4;
                }
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.stroke();
                ctx.restore();
              });
            });

            currentContract.subNodes.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === currentContract.activeSubNodeId;
              const isSelected = node.id === currentContract.selectedSubNodeId;
              const isReachable = isAdjacentOrEntry(node) && !isCurrent;
              const entryHeat = getRoomEntryHeatCost(node);

              let color = '#ff2a55';
              if (sectorSecured || node.status === 'CLEARED') color = '#62f080';
              else if (node.status === 'SCANNED') {
                color = node.patrolActive ? '#ff2a55' : node.nodeType === 'SHRINE' ? '#00f3ff' : '#ffb800';
              } else if (node.status === 'ENTERED') color = '#ffb800';

              // Outer Reachable Halo
              if (isReachable && !sectorSecured) {
                ctx.beginPath();
                ctx.arc(nx, ny, 23, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(98, 240, 128, 0.45)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
              }

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
              ctx.lineWidth = isSelected ? 2.5 : 1.6;
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

              let subBadge = sectorSecured ? '[SECURED]' : isCurrent ? '[YOU ARE HERE]' : `[${node.status} // +${entryHeat}% HEAT]`;
              if (!sectorSecured && !isCurrent && node.status === 'SCANNED') {
                const typeTag = node.patrolActive ? '! PATROL !' : node.nodeType === 'SHRINE' ? 'SHRINE' : node.nodeType === 'ANCHOR' ? 'ANCHOR' : 'CLUE';
                subBadge = `[${typeTag} // +${entryHeat}% HEAT]`;
              }
              ctx.font = '10px "Courier New", monospace';
              ctx.fillStyle = isCurrent ? '#62f080' : color;
              ctx.fillText(subBadge, nx, ny + 42);

              if (isReachable && !sectorSecured) {
                ctx.fillStyle = '#62f080';
                ctx.font = 'bold 9px "Courier New", monospace';
                ctx.fillText('● REACHABLE', nx, ny + 53);
              }

              if (node.status !== 'LOCKED' && !sectorSecured) {
                if (node.patrolActive) {
                  ctx.fillStyle = '#ff2a55';
                  ctx.font = 'bold 10px "Courier New", monospace';
                  ctx.fillText(`! PATROL: DECOY ${node.index} !`, nx, ny - 23);
                } else if (node.hazard !== 'NONE') {
                  ctx.fillStyle = '#00f3ff';
                  ctx.font = 'bold 10px "Courier New", monospace';
                  ctx.fillText(`! TRAP: ${node.hazard} !`, nx, ny - 23);
                }
              }
            });
          } else {
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

  const getWorldCoordsFromClient = (clientX: number, clientY: number) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return { wx: 0, wy: 0, w: 1, h: 1 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
    const wx = (sx - w / 2 - mapPan.x) / mapZoom + w / 2;
    const wy = (sy - h / 2 - mapPan.y) / mapZoom + h / 2;
    return { wx, wy, w, h };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPanningRef.current = true;
    didDragRef.current = false;
    panStartRef.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.hypot(dx - mapPan.x, dy - mapPan.y) > 5) didDragRef.current = true;
    setMapPan({ x: dx, y: dy });
  };

  const handleCanvasPointerUp = () => {
    isPanningRef.current = false;
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    setMapZoom(prev => Math.min(2.8, Math.max(0.6, +(prev + delta).toFixed(2))));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (didDragRef.current) return;
    const { wx, wy, w, h } = getWorldCoordsFromClient(e.clientX, e.clientY);

    if (mapViewMode === 'SUB_GRID' && currentContract) {
      for (const node of currentContract.subNodes) {
        const nx = node.x * w;
        const ny = node.y * h;
        if (Math.hypot(wx - nx, wy - ny) <= 30) {
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
        const nx = sec.x * w;
        const ny = sec.y * h;
        if (Math.hypot(wx - nx, wy - ny) <= 26) {
          if (!isSectorUnlocked(sec)) {
            ThaumaturgicAudio.errorBuzz();
            addToast(`Sector Locked! Secure an adjacent sector first.`, 'ALERT');
            return;
          }
          ThaumaturgicAudio.scryPing();
          addMicroEntropy(0.02);
          setDeducedSigns([]);
          if (sec.id === 'safehouse') {
            travelTo('safehouse');
            setViewport('SAFEHOUSE_ALTAR');
          } else {
            travelTo(sec.id);
            setMapViewMode('SUB_GRID');
            appendLog(`[*] ROUTED TETHER TO SECTOR: <strong style="color:#62f080;">${sec.label}</strong> (${sec.region}). (+0.02% Global Entropy)`, 'info');
          }
          break;
        }
      }
    }
  };

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
        <StartScreen
          onStart={startInvestigation}
          onLoad={loadGame}
          onOpenManual={() => setShowManual(true)}
          onFullReset={handleFullReset}
        />
      </>
    );
  }

  const activeSectorClueCount = currentContract && !isSectorSecured(currentContract.sectorId)
    ? currentContract.discoveredLogs.length
    : 0;

  const selectedSuspect = allGoetia.find(g => g.id === selectedSuspectId) || allGoetia[0];
  const securedSectorsCount = MACRO_SECTORS.filter(s => s.id !== 'safehouse' && isSectorSecured(s.id)).length;
  const selectedRoomHeatCost = selectedSubNode ? getRoomEntryHeatCost(selectedSubNode) : 8;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        backgroundColor: theme.bgDark,
        color: theme.textTerminal,
        fontFamily: theme.fontMono,
        overflow: 'hidden',
        userSelect: 'none',
        animation: hudFlash === 'DAMAGE' ? 'screenShake 0.36s cubic-bezier(.36,.07,.19,.97) both' : 'none'
      }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #050706; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes stampSlam {
          0% { transform: scale(2.6) rotate(-12deg); opacity: 0; }
          70% { transform: scale(0.92) rotate(-6deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate3d(0, 0, 0); }
          15% { transform: translate3d(-5px, 3px, 0); }
          30% { transform: translate3d(5px, -3px, 0); }
          45% { transform: translate3d(-4px, -2px, 0); }
          60% { transform: translate3d(4px, 2px, 0); }
          75% { transform: translate3d(-2px, 1px, 0); }
        }
        @keyframes heavyImpactShake {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          15% { transform: translate3d(0, 8px, 0) scale(0.985); }
          35% { transform: translate3d(-4px, -5px, 0) scale(1.005); }
          55% { transform: translate3d(4px, 3px, 0); }
          75% { transform: translate3d(-2px, -2px, 0); }
        }
        @keyframes crtFlicker {
          0%, 100% { opacity: 0.92; }
          48% { opacity: 0.96; }
          50% { opacity: 0.72; }
          52% { opacity: 0.95; }
        }
        @keyframes slideDownTop { from { transform: translateY(-120%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes sigilGlitch {
          0%, 100% { transform: translate(0, 0) scale(1); filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(90%) blur(2.5px); }
          50% { transform: translate(2px, -2px) scale(1.03); filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(70%) blur(3.5px); }
        }
        .crt-scanlines {
          pointer-events: none; position: fixed; inset: 0; z-index: 50;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), radial-gradient(circle at center, transparent 65%, rgba(0, 5, 2, 0.6) 100%);
          background-size: 100% 3px, 100% 100%;
        }
        .crt-critical {
          animation: crtFlicker 2.4s infinite;
          box-shadow: inset 0 0 45px rgba(255, 42, 85, 0.25);
        }
        .crt-glitch {
          background:
            linear-gradient(90deg, rgba(255, 42, 85, 0.14), rgba(0, 243, 255, 0.14)),
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
          background-size: 100% 100%, 100% 3px;
        }
        .macro-chip {
          background: rgba(98, 240, 128, 0.07); border: 1px solid #1f3d26; color: #62f080;
          padding: 4px 9px; font-family: inherit; font-size: 0.72rem; cursor: pointer; white-space: nowrap; transition: all 0.15s;
        }
        .macro-chip:hover:not(:disabled) { background: rgba(98, 240, 128, 0.22); border-color: #62f080; }
        .macro-chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .macro-chip-amber { background: rgba(255, 184, 0, 0.1); border-color: rgba(255, 184, 0, 0.45); color: #ffb800; }
        .macro-chip-cyan { background: rgba(0, 243, 255, 0.1); border-color: rgba(0, 243, 255, 0.45); color: #00f3ff; }
        .macro-chip-danger { background: rgba(255, 42, 85, 0.12); border-color: rgba(255, 42, 85, 0.5); color: #ff2a55; }
        .viewport-tab {
          padding: 6px 9px; font-family: inherit; font-size: 0.71rem; font-weight: bold;
          cursor: pointer; border: 1px solid #1f3d26; background: #060907; color: #4a7c59; white-space: nowrap;
        }
        .viewport-tab.active {
          background: #62f080; color: #000000; border-color: #62f080; box-shadow: 0 0 10px rgba(98, 240, 128, 0.35);
        }
        .responsive-split { display: flex; flex: 1; overflow: hidden; gap: 8px; padding: 8px; }
        .pane-left { width: 52%; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
        .pane-right { width: 48%; display: flex; flex-direction: column; overflow: hidden; }
        .codex-col { width: 33.33%; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
        .grid-4col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 920px) {
          .responsive-split { flex-direction: column; overflow-y: auto; }
          .pane-left, .pane-right, .codex-col { width: 100% !important; min-height: 360px; flex-shrink: 0; }
          .grid-4col { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 580px) {
          .grid-4col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className={`crt-scanlines ${currentHeat >= 75 ? 'crt-critical' : ''} ${hudFlash === 'DAMAGE' ? 'crt-glitch' : ''}`} />

      <header style={{ minHeight: '46px', flexShrink: 0, backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button className={`viewport-tab ${viewport === 'FIELD_OPS' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('FIELD_OPS'); }}>[F1] FIELD_OPS</button>
          <button
            className={`viewport-tab ${viewport === 'CODEX' ? 'active' : ''}`}
            onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('CODEX'); }}
            style={activeSectorClueCount >= 3 && viewport !== 'CODEX' ? { borderColor: theme.accentAmber, color: theme.accentAmber, boxShadow: '0 0 8px rgba(255,184,0,0.4)' } : undefined}
          >
            [F2] CODEX ({activeSectorClueCount}/3)
          </button>
          <button className={`viewport-tab ${viewport === 'KAGE_NO_SHO' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('KAGE_NO_SHO'); }}>[F3] KAGE ({state.tetheredYokai.length}/2)</button>
          <button className={`viewport-tab ${viewport === 'SAFEHOUSE_ALTAR' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('SAFEHOUSE_ALTAR'); }}>[F4] SAFEHOUSE</button>
          <button className={`viewport-tab ${viewport === 'HORSEMEN' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('HORSEMEN'); }} style={viewport !== 'HORSEMEN' ? { borderColor: theme.accentRed, color: theme.accentRed } : undefined}>[F5] HORSEMEN</button>
          <button className={`viewport-tab ${viewport === 'DOSSIER' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('DOSSIER'); }}>[F6] DOSSIER</button>
          <button className={`viewport-tab ${viewport === 'MANUAL' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('MANUAL'); }}>[F7] MANUAL</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, fontSize: '0.72rem' }}>
          <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentRed }}>
            ENTROPY: <strong>{totalGlobalEntropy.toFixed(2)}%</strong>
          </span>
          <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: state.humanity < 40 ? theme.accentRed : theme.textBright }}>
            HUM: <strong>{state.humanity}%</strong>
          </span>
          <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentAmber, fontWeight: 'bold' }}>
            OBOLS: {state.inventory.obols || 0}
          </span>
          <button
            onClick={() => { ThaumaturgicAudio.keyClick(); setControlMode(prev => prev === 'PALETTE' ? 'CLI' : 'PALETTE'); }}
            className={`macro-chip ${controlMode === 'PALETTE' ? 'macro-chip-amber' : ''}`}
            style={{ padding: '4px 7px' }}
          >
            MODE:{controlMode}
          </button>
          <button
            onClick={() => { ThaumaturgicAudio.keyClick(); setFontScale(prev => prev === 'SM' ? 'MD' : prev === 'MD' ? 'LG' : 'SM'); }}
            className="macro-chip"
            style={{ padding: '4px 7px' }}
          >
            TXT:{fontScale}
          </button>
          <button onClick={() => { ThaumaturgicAudio.enabled = !audioEnabled; setAudioEnabled(!audioEnabled); }} style={{ padding: '4px 7px', backgroundColor: 'transparent', border: `1px solid ${theme.borderTerminal}`, color: theme.textTerminal, cursor: 'pointer' }}>
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={handleLogout} className="macro-chip macro-chip-danger" style={{ padding: '4px 7px' }}>
            LOG OUT
          </button>
        </div>
      </header>

      {viewport === 'FIELD_OPS' && (
        <main
          className="responsive-split"
          style={{
            backgroundColor: hudFlash === 'DAMAGE' ? 'rgba(255,42,85,0.18)' : hudFlash === 'DECODE' ? 'rgba(98,240,128,0.12)' : 'transparent',
            transition: 'background-color 0.25s'
          }}
        >
          <section className="pane-left">
            <div style={{ backgroundColor: currentHeat >= 75 ? '#1f050a' : theme.bgPanel, border: `1px solid ${currentHeat >= 75 ? theme.accentRed : theme.borderTerminal}`, padding: '9px 10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '5px', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ color: theme.textBright, fontWeight: 'bold' }}>
                  {currentContract?.sectorLabel} // POS: {currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}
                </span>
                <span style={{ color: currentHeat >= 75 ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>
                  INQUISITION HEAT: {currentHeat}% {currentHeat >= 100 ? '[LOCKDOWN!]' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '9px', backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, padding: '1px' }}>
                  <div style={{ width: `${currentHeat}%`, height: '100%', backgroundColor: currentHeat >= 75 ? theme.accentRed : currentHeat >= 35 ? theme.accentAmber : theme.textBright, transition: 'width 0.25s' }} />
                </div>
                <canvas ref={waveformCanvasRef} width={90} height={20} style={{ backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, flexShrink: 0 }} />
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '240px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: 6, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, fontSize: '0.7rem', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => { setMapViewMode('SUB_GRID'); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className={`macro-chip ${mapViewMode === 'SUB_GRID' ? 'macro-chip-amber' : ''}`}>LOCAL SUB-GRID</button>
                  <button onClick={() => { setMapViewMode('GEO_TRACKER'); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className={`macro-chip ${mapViewMode === 'GEO_TRACKER' ? 'macro-chip-amber' : ''}`}>REGIONAL MAP ({securedSectorsCount}/16)</button>
                </div>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center', backgroundColor: 'rgba(5,7,6,0.9)', padding: '2px 5px', border: `1px solid ${theme.borderTerminal}` }}>
                  <span style={{ color: theme.textMuted }}>{Math.round(mapZoom * 100)}%</span>
                  <button onClick={() => setMapZoom(z => Math.min(2.8, +(z + 0.25).toFixed(2)))} className="macro-chip" style={{ padding: '1px 6px' }}>+</button>
                  <button onClick={() => setMapZoom(z => Math.max(0.6, +(z - 0.25).toFixed(2)))} className="macro-chip" style={{ padding: '1px 6px' }}>-</button>
                  <button onClick={() => { setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className="macro-chip" style={{ padding: '1px 6px' }}>RST</button>
                </div>
              </div>

              <canvas
                ref={mapCanvasRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerUp}
                onWheel={handleCanvasWheel}
                onClick={handleCanvasClick}
                style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' }}
              />

              {/* DUAL-LINE LIVE TELEMETRY BAR: PINS CURRENT ROOM CLUE + SELECTED TARGET ROOM INFO */}
              <div style={{ backgroundColor: 'rgba(5,7,6,0.96)', borderTop: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', zIndex: 10, fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span>
                    SELECTED TARGET: <strong style={{ color: theme.textBright }}>{selectedSubNode?.label || 'NONE'}</strong> [{selectedSubNode?.status}]
                    {selectedSubNode && selectedSubNode.id !== currentSubNode?.id && (
                      <span style={{ color: isAdjacentOrEntry(selectedSubNode) ? theme.accentAmber : theme.accentRed, marginLeft: '6px' }}>
                        ({isAdjacentOrEntry(selectedSubNode) ? `REACHABLE // +${selectedRoomHeatCost}% HEAT TO ENTER` : 'NOT ADJACENT'})
                      </span>
                    )}
                  </span>
                  {activeSectorClueCount >= 3 ? (
                    <button onClick={() => { ThaumaturgicAudio.scryPing(); setViewport('CODEX'); }} className="macro-chip macro-chip-amber" style={{ padding: '2px 8px', fontWeight: 'bold' }}>
                      🎯 3/3 CLUES FOUND — OPEN [F2] CODEX &rarr;
                    </button>
                  ) : (
                    <span style={{ color: theme.accentAmber }}>CLUES DECODED: <strong>{activeSectorClueCount}/3</strong></span>
                  )}
                </div>

                {/* Current Room Status (Never disappears when clicking other rooms!) */}
                {currentSubNode ? (
                  <div style={{ color: currentSubNode.hazard !== 'NONE' ? theme.accentCyan : currentSubNode.status === 'CLEARED' ? theme.textBright : '#ffffff' }}>
                    <strong>CURRENT ROOM ({currentSubNode.label}): </strong>
                    {currentSubNode.hazard !== 'NONE'
                      ? `⚠️ TRAP ACTIVE: "${HAZARD_MANIFEST[currentSubNode.hazard].symptom}"`
                      : currentSubNode.status === 'CLEARED'
                      ? `✓ Cleared.${currentSubNode.nodeType === 'ANCHOR' && !attunedSectors[currentContract?.sectorId || ''] ? " (Run 'attune' for +4s Sealing Timer bonus!)" : ' Click a connected green-linked room to continue.'}`
                      : currentSubNode.rawSignalSymptom
                      ? `🔎 CLUE SIGNAL: "${currentSubNode.rawSignalSymptom}" (Run vox / assay / auspex)`
                      : `⛩️ Shrine / Salvage ready. Run 'loot' to collect.`}
                  </div>
                ) : (
                  <div style={{ color: '#a8ccaf' }}>
                    <strong>CURRENT POS:</strong> Perimeter Tether. Run <code>scan 1</code> then <code>enter 1</code> (+8% Heat) to enter the sub-grid.
                  </div>
                )}

                {/* If a different Scanned Room is selected, show its Trap/Patrol status too */}
                {selectedSubNode && selectedSubNode.id !== currentSubNode?.id && selectedSubNode.status === 'SCANNED' && (
                  <div style={{ color: selectedSubNode.patrolActive ? theme.accentRed : selectedSubNode.hazard !== 'NONE' ? theme.accentCyan : theme.textBright }}>
                    <strong>SCANNED TARGET ({selectedSubNode.label}): </strong>
                    {selectedSubNode.patrolActive
                      ? `⚠️ MALLEUS PATROL INSIDE! Run 'decoy ${selectedSubNode.index}' before entering!`
                      : selectedSubNode.hazard !== 'NONE'
                      ? `⚠️ THRESHOLD TRAP: "${HAZARD_MANIFEST[selectedSubNode.hazard].symptom}" — Disarm before entering!`
                      : `✓ Threshold clear. Safe to run 'enter ${selectedSubNode.index}' (+${selectedRoomHeatCost}% Heat).`}
                  </div>
                )}
              </div>
            </div>

            <div style={{ minHeight: '90px', flexShrink: 0, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.73rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <div style={{ color: theme.textBright, fontWeight: 'bold', marginBottom: '4px' }}>ACTIVE SHIKIGAMI DAEMONS ({state.tetheredYokai.length}/2)</div>
                {state.tetheredYokai.length === 0 ? (
                  <div style={{ color: theme.textMuted }}>No Daemons bound. Open <strong style={{ color: theme.textBright }}>[F3] KAGE</strong> to halve Scan costs (-2% HUM) &amp; unlock field powers.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {state.tetheredYokai.map(yid => {
                      const y = allYokai.find(item => item.id === yid);
                      const spec = YOKAI_DAEMON_SPECS[yid];
                      const charges = yokaiCharges[yid] ?? (spec?.maxCharges || 1);
                      return (
                        <div key={yid} style={{ flex: 1, padding: '5px 7px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong style={{ color: theme.textBright, fontSize: '0.7rem' }}>{y?.nameEn}</strong>
                            <span style={{ color: theme.accentAmber, fontSize: '0.65rem' }}>[{charges}/{spec?.maxCharges} USES]</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleInvokeYokaiPower(yid)} title={spec?.activeDesc} className="macro-chip macro-chip-amber" style={{ flex: 1, padding: '3px 5px', fontSize: '0.65rem' }}>
                              ⚡ {spec?.activeLabel}
                            </button>
                            <button onClick={() => handleUnbindYokai(yid, 'Manually severed')} className="macro-chip macro-chip-danger" style={{ padding: '3px 6px', fontSize: '0.65rem' }}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ width: '190px', borderLeft: `1px dashed ${theme.borderTerminal}`, paddingLeft: '10px' }}>
                <div style={{ color: theme.accentAmber, fontWeight: 'bold', marginBottom: '3px' }}>RAW SALVAGE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scrap Metal:</span> <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cursed Earth:</span> <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Distillate:</span> <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></div>
              </div>
            </div>
          </section>

          <section className="pane-right" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, zoom: FONT_ZOOM_MAP[fontScale] }}>
            <div style={{ height: '30px', backgroundColor: '#040805', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', flexShrink: 0 }}>
              <span><strong style={{ color: theme.textBright }}>● TTY1 CONSOLE</strong> // {currentContract?.sectorLabel}</span>
              <span style={{ color: theme.accentAmber }}>VESSEL: {state.sealedGoetia.length}/72 SEALED</span>
            </div>

            <div onClick={() => cliInputRef.current?.focus()} style={{ flex: 1, padding: '12px', overflowY: 'auto', fontSize: '0.8rem', lineHeight: '1.55', backgroundColor: '#030504', userSelect: 'text', cursor: 'text' }}>
              {terminalLines.map(line => {
                const colorMap = { normal: '#a8ccaf', info: '#62f080', system: '#4a7c59', success: '#62f080', warn: '#ffb800', error: '#ff2a55', command: '#ffffff' };
                return <div key={line.id} style={{ color: colorMap[line.type], marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: line.html }} />;
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* ALWAYS-VISIBLE 3-ROW TACTICAL COMMAND DECK (NO HIDDEN SUB-TABS!) */}
            {controlMode === 'PALETTE' && (
              <div style={{ backgroundColor: '#060a07', borderTop: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.66rem', color: theme.accentAmber, fontWeight: 'bold', width: '74px' }}>1. RECON:</span>
                  <button onClick={() => processCliCommand(`scan ${selectedSubNode?.index || 1}`)} className="macro-chip">📡 scan {selectedSubNode?.index || 1}</button>
                  <button onClick={() => processCliCommand(`enter ${selectedSubNode?.index || 1}`)} className="macro-chip macro-chip-amber">⚡ enter {selectedSubNode?.index || 1} (+{selectedRoomHeatCost}% Heat)</button>
                  <button onClick={() => processCliCommand('loot')} className="macro-chip">📦 loot</button>
                  {currentSubNode?.nodeType === 'ANCHOR' && (
                    <button onClick={() => processCliCommand('attune')} className="macro-chip macro-chip-amber">⚡ attune (+4s Seal)</button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.66rem', color: theme.accentCyan, fontWeight: 'bold', width: '74px' }}>2. DISARM:</span>
                  <button onClick={() => processCliCommand(`decoy ${selectedSubNode?.index || 1}`)} className="macro-chip macro-chip-danger">🐕 decoy {selectedSubNode?.index || 1}</button>
                  <button onClick={() => processCliCommand(`degauss ${selectedSubNode?.index || 1}`)} className="macro-chip macro-chip-cyan">degauss {selectedSubNode?.index || 1}</button>
                  <button onClick={() => processCliCommand(`bypass ${selectedSubNode?.index || 1}`)} className="macro-chip macro-chip-cyan">bypass {selectedSubNode?.index || 1}</button>
                  <button onClick={() => processCliCommand(`purge ${selectedSubNode?.index || 1}`)} className="macro-chip macro-chip-cyan">purge {selectedSubNode?.index || 1}</button>
                  <button onClick={() => processCliCommand(`dispel ${selectedSubNode?.index || 1}`)} className="macro-chip macro-chip-cyan">dispel {selectedSubNode?.index || 1}</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.66rem', color: theme.textBright, fontWeight: 'bold', width: '74px' }}>3. TOOLS:</span>
                  <button onClick={() => processCliCommand('vox')} className="macro-chip">🎙️ vox (Audio)</button>
                  <button onClick={() => processCliCommand('assay')} className="macro-chip">🧪 assay (Matter)</button>
                  <button onClick={() => processCliCommand('auspex')} className="macro-chip">👁️ auspex (Astral)</button>
                  <button onClick={() => processCliCommand('spoof')} className="macro-chip macro-chip-danger">📡 spoof (-15 Ob)</button>
                  <button onClick={() => processCliCommand('bribe')} className="macro-chip macro-chip-danger">🪙 bribe (-25 Ob)</button>
                </div>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!cliInput.trim()) return;
                processCliCommand(cliInput);
                setCliInput('');
              }}
              style={{ height: '40px', backgroundColor: '#000', borderTop: `1px solid ${theme.borderTerminal}`, padding: '0 10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
            >
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>root@os:~#</span>
              <input
                ref={cliInputRef}
                value={cliInput}
                onChange={e => setCliInput(e.target.value)}
                placeholder="Type command (scan 1, degauss 2, enter 1, vox, assay, auspex, help)..."
                style={{ flex: 1, backgroundColor: 'transparent', color: theme.textBright, border: 'none', outline: 'none', fontFamily: theme.fontMono, fontSize: '0.8rem' }}
              />
              <button type="submit" className="macro-chip">EXEC</button>
            </form>
          </section>
        </main>
      )}

      {viewport === 'CODEX' && (
        <main className="responsive-split" style={{ zoom: FONT_ZOOM_MAP[fontScale] }}>
          <section className="codex-col">
            <div style={{ height: '40%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>1. DECODED SECTOR CLUES ({activeSectorClueCount}/3)</span>
                <span style={{ color: theme.accentAmber }}>{currentContract?.sectorLabel}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.76rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!currentContract || isSectorSecured(currentContract.sectorId)) ? (
                  <div style={{ color: theme.textBright }}>✓ Sector secured. Deploy to a new sector on the Regional Map!</div>
                ) : currentContract.discoveredLogs.length === 0 ? (
                  <div style={{ color: theme.textMuted, fontStyle: 'italic' }}>
                    No clues decoded yet. Enter rooms in [F1] FIELD_OPS and run <code>vox</code>, <code>assay</code>, or <code>auspex</code>.
                  </div>
                ) : (
                  currentContract.discoveredLogs.map((log, i) => (
                    <div key={log.id} style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.textBright}` }}>
                      <div style={{ color: theme.accentAmber, fontWeight: 'bold', fontSize: '0.7rem' }}>CLUE #{i + 1} [{log.channel}] // {log.nodeLabel}</div>
                      <div style={{ color: '#ffffff', marginTop: '3px' }}>"{log.text}"</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
                <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>2. FILTER PHENOMENA ({deducedSigns.length}/3)</span>
                {deducedSigns.length > 0 && (
                  <button onClick={() => setDeducedSigns([])} className="macro-chip macro-chip-danger" style={{ padding: '2px 8px' }}>CLEAR</button>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {PHENOMENON_CATALOG.map(phenom => {
                  const isChecked = deducedSigns.includes(phenom.tag);
                  return (
                    <button
                      key={phenom.tag}
                      onClick={() => {
                        ThaumaturgicAudio.keyClick();
                        setDeducedSigns(prev => prev.includes(phenom.tag) ? prev.filter(t => t !== phenom.tag) : [...prev, phenom.tag]);
                      }}
                      style={{
                        padding: '6px 8px', textAlign: 'left',
                        backgroundColor: isChecked ? 'rgba(98, 240, 128, 0.2)' : '#030504',
                        border: `1px solid ${isChecked ? theme.textBright : theme.borderTerminal}`,
                        color: isChecked ? theme.textBright : '#a8ccaf',
                        cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.72rem'
                      }}
                    >
                      {isChecked ? '[X] ' : '[ ] '} {phenom.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="codex-col" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>3. SUSPECTS ({filteredCodexGoetia.length}/72)</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {(['ALL', 'CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => (
                  <button key={h} onClick={() => setCodexHorsemanFilter(h)} className={`macro-chip ${codexHorsemanFilter === h ? 'macro-chip-amber' : ''}`} style={{ padding: '2px 5px', fontSize: '0.66rem' }}>
                    {h === 'ALL' ? 'ALL' : h.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {filteredCodexGoetia.map(g => {
                const isSealed = state.sealedGoetia.includes(g.id);
                const isSelected = g.id === selectedSuspectId;
                return (
                  <button
                    key={g.id}
                    onClick={() => { ThaumaturgicAudio.keyClick(); setSelectedSuspectId(g.id); }}
                    style={{
                      padding: '7px 10px', textAlign: 'left',
                      backgroundColor: isSelected ? '#112217' : '#030504',
                      border: `1px solid ${isSelected ? theme.textBright : theme.borderTerminal}`,
                      color: isSealed ? theme.textMuted : theme.textBright,
                      cursor: 'pointer', fontFamily: theme.fontMono,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>#{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()}</strong>
                      <div style={{ fontSize: '0.68rem', color: '#a8ccaf' }}>{g.rank} of {g.allegiance}</div>
                    </div>
                    <span style={{ fontSize: '0.66rem', color: isSealed ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>
                      {isSealed ? '✗ SEALED' : '[INSPECT]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* DOSSIER PANEL: SEALING BUTTON MOVED NEAR TOP SO BADGES/TOASTS NEVER COVER IT */}
          <section className="codex-col" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px 14px 48px 14px', overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: theme.accentAmber }}>ARS GOETIA DOSSIER // #{selectedSuspect.manifestId.toString().padStart(2, '0')} ({selectedSuspect.allegiance})</div>
              <h2 style={{ margin: '4px 0', color: theme.textBright }}>{selectedSuspect.name.toUpperCase()}</h2>
              <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 'bold', marginBottom: '10px' }}>{selectedSuspect.rank} — "{selectedSuspect.title}"</div>

              {/* TOP-MOUNTED SEALING RITE ACTION BUTTON */}
              {state.sealedGoetia.includes(selectedSuspect.id) ? (
                <div style={{ padding: '10px', marginBottom: '12px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold' }}>
                  [ ENTITY SEALED IN VESSEL ]
                </div>
              ) : (
                <div style={{ marginBottom: '12px' }}>
                  {(() => {
                    const sealCost = selectedSuspect.sealCost || {};
                    const canAfford = Object.entries(sealCost).every(([item, amt]) => (state.inventory[item] || 0) >= amt);
                    return (
                      <button
                        onClick={() => setActiveSealSuspectId(selectedSuspect.id)}
                        disabled={!canAfford}
                        style={{
                          width: '100%', padding: '12px',
                          backgroundColor: canAfford ? theme.accentRed : '#1a1a1a',
                          color: canAfford ? 'white' : theme.textMuted,
                          border: `1px solid ${canAfford ? '#ff6680' : theme.borderTerminal}`,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.8rem',
                          boxShadow: canAfford ? '0 0 15px rgba(255, 42, 85, 0.35)' : 'none'
                        }}
                      >
                        {canAfford ? `> ENGAGE SEALING RITE: ${selectedSuspect.name.toUpperCase()}` : `> CRAFT CATALYSTS IN [F4] SAFEHOUSE FIRST`}
                      </button>
                    );
                  })()}
                </div>
              )}

              <div style={{ marginBottom: '10px', padding: '8px', border: `1px solid ${theme.accentRed}`, backgroundColor: '#030504' }}>
                <div style={{ fontSize: '0.72rem', color: theme.accentRed, fontWeight: 'bold', marginBottom: '4px' }}>REQUIRED BINDING CATALYSTS:</div>
                {Object.entries(selectedSuspect.sealCost || {}).map(([item, amt]) => {
                  const have = state.inventory[item] || 0;
                  return (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <span style={{ color: '#ffffff' }}>{formatLabel(item)} x{amt}</span>
                      <span style={{ color: have >= amt ? theme.textBright : theme.accentRed, fontWeight: 'bold' }}>(Have: {have}/{amt})</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: '10px', padding: '8px', border: `1px dashed ${theme.borderTerminal}`, backgroundColor: '#030504' }}>
                <div style={{ fontSize: '0.72rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '4px' }}>UNIQUE 3-SIGN FINGERPRINT:</div>
                {getUniqueGoetiaSigns(selectedSuspect.id).map(tag => {
                  const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
                  const isToggled = deducedSigns.includes(tag);
                  return (
                    <div key={tag} style={{ fontSize: '0.72rem', color: isToggled ? theme.textBright : '#a8ccaf' }}>
                      {isToggled ? '✓ ' : '• '} <strong>{def?.label || formatLabel(tag)}</strong>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const isTargetSealed = state.sealedGoetia.includes(selectedSuspect.id);
                return (
                  <div style={{ position: 'relative', width: '125px', height: '125px', margin: '0 auto 10px auto', backgroundColor: '#030504', border: `1px solid ${isTargetSealed ? theme.accentRed : theme.borderTerminal}`, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <img
                      src={`/seals/${selectedSuspect.id}.png`}
                      alt={selectedSuspect.name}
                      style={{
                        width: '104px', height: '104px',
                        opacity: isTargetSealed ? 0.85 : 0.22,
                        filter: isTargetSealed ? 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' : undefined,
                        animation: isTargetSealed ? 'none' : 'sigilGlitch 2.2s infinite steps(2)'
                      }}
                    />
                    {isTargetSealed && (
                      <div style={{ position: 'absolute', transform: 'rotate(-12deg)', border: `2px solid ${theme.accentRed}`, backgroundColor: 'rgba(15, 2, 2, 0.92)', color: theme.accentRed, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        [SEALED]
                      </div>
                    )}
                  </div>
                );
              })()}

              <p style={{ fontSize: '0.76rem', color: '#a8ccaf', lineHeight: '1.5', padding: '8px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}` }}>
                {selectedSuspect.description}
              </p>
            </div>
          </section>
        </main>
      )}

      {viewport === 'KAGE_NO_SHO' && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.88rem' }}>KAGE-NO-SHO // SHIKIGAMI KERNEL INTERCEPTORS (MAX 2 BOUND)</div>
              <div style={{ color: '#a8ccaf', fontSize: '0.74rem', marginTop: '2px' }}>
                Bind up to 2 Shikigami Daemons into your Thaumaturgic OS. Having any daemon bound cuts your <code>scan</code> Humanity cost in half (-2% HUM instead of -5% HUM) and unlocks finite Active Invocations in the field.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: theme.accentCyan, fontSize: '0.8rem', fontWeight: 'bold' }}>ESOTERIC INK: {state.ink || 0}</span>
              <button
                onClick={() => {
                  if ((state.inventory.obols || 0) >= 10) {
                    ThaumaturgicAudio.keyClick();
                    dispatch({ type: 'LOAD_GAME', payload: { ...state, inventory: { ...state.inventory, obols: (state.inventory.obols || 0) - 10 }, ink: (state.ink || 0) + 1 } });
                    addToast(`Distilled +1 Esoteric Ink`, 'ITEM');
                  } else {
                    addToast(`Requires 10 Obols to distill Esoteric Ink.`, 'ALERT');
                  }
                }}
                className="macro-chip macro-chip-amber"
              >
                + DISTILL INK (-10 OBOLS)
              </button>
            </div>
          </div>

          <div className="grid-4col" style={{ flex: 1, overflowY: 'auto' }}>
            {allYokai.map(yokai => {
              const isBound = state.tetheredYokai.includes(yokai.id);
              const spec = YOKAI_DAEMON_SPECS[yokai.id] || {
                codeName: yokai.nameEn.toUpperCase(),
                classTag: 'SHIKIGAMI DAEMON',
                passiveHook: 'PASSIVE HOOK: Stabilizes operative tether.',
                activeLabel: 'INVOKE',
                maxCharges: 1,
                activeDesc: yokai.gameUtility,
                loreNote: ''
              };
              const cost = yokai.draftCost;
              const canAfford = (!cost.obols || (state.inventory.obols || 0) >= cost.obols) && (!cost.humanity || state.humanity > cost.humanity) && (!cost.ink || (state.ink || 0) >= cost.ink);
              const costStr = [cost.obols ? `${cost.obols} Obols` : '', cost.humanity ? `${cost.humanity}% HUM` : '', cost.ink ? `${cost.ink} Ink` : ''].filter(Boolean).join(' + ');
              const chargesLeft = yokaiCharges[yokai.id] ?? spec.maxCharges;

              return (
                <div key={yokai.id} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBound ? theme.textBright : theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.66rem', color: theme.accentAmber, letterSpacing: '1px' }}>{spec.classTag}</span>
                      {isBound && <span style={{ fontSize: '0.66rem', backgroundColor: theme.textBright, color: 'black', padding: '1px 6px', fontWeight: 'bold' }}>BOUND</span>}
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.9rem' }}>{spec.codeName}</h3>
                    <div style={{ fontSize: '0.72rem', color: theme.accentCyan, marginBottom: '6px' }}>{spec.passiveHook}</div>
                    <div style={{ padding: '6px', backgroundColor: '#030504', border: `1px dashed ${theme.borderTerminal}`, fontSize: '0.7rem', color: '#ffffff' }}>
                      <strong style={{ color: theme.accentAmber }}>ACTIVE ({spec.maxCharges} USES): {spec.activeLabel}</strong><br/>
                      {spec.activeDesc}
                    </div>
                    <p style={{ fontSize: '0.68rem', color: '#a8ccaf', fontStyle: 'italic', marginTop: '6px' }}>{spec.loreNote}</p>
                  </div>

                  <div style={{ marginTop: '8px', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: isBound ? theme.textBright : theme.accentRed, fontWeight: 'bold', marginBottom: '6px' }}>
                      {isBound ? `CHARGES: ${chargesLeft}/${spec.maxCharges}` : `BIND TRIBUTE: ${costStr}`}
                    </div>
                    {isBound ? (
                      <button onClick={() => handleUnbindYokai(yokai.id, 'Manually severed')} className="macro-chip macro-chip-danger" style={{ width: '100%', padding: '7px', fontWeight: 'bold' }}>
                        &gt; UNBIND DAEMON
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (state.tetheredYokai.length >= 2) {
                            addToast('Rule of Two: Unbind an active daemon first!', 'ALERT');
                            return;
                          }
                          ThaumaturgicAudio.sealSuccess();
                          draftContract(yokai.id, yokai.draftCost);
                          setYokaiCharges(prev => ({ ...prev, [yokai.id]: spec.maxCharges }));
                          addToast(`Bound ${yokai.nameEn}!`, 'SEAL');
                        }}
                        disabled={!canAfford}
                        className="macro-chip"
                        style={{ width: '100%', padding: '7px', fontWeight: 'bold' }}
                      >
                        {canAfford ? '> COMPILE & BIND PACT' : '> INSUFFICIENT TRIBUTE'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {viewport === 'SAFEHOUSE_ALTAR' && (
        <main className="responsive-split" style={{ zoom: FONT_ZOOM_MAP[fontScale] }}>
          <section className="pane-left" style={{ width: '60%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <div>
                <h2 style={{ margin: 0, color: theme.textBright, fontSize: '0.95rem' }}>&gt; SAFEHOUSE ALTAR // CATALYST SYNTHESIS</h2>
                <div style={{ fontSize: '0.72rem', color: '#a8ccaf' }}>
                  Transmute raw salvage into planetary Solomonic catalysts.
                  {state.tetheredYokai.includes('yokai_kameosa') && <span style={{ color: theme.accentAmber }}> [KAMEOSA.ALC ACTIVE: 0 Obol Cost, -2% HUM!]</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', backgroundColor: '#030504', padding: '5px 8px', border: `1px solid ${theme.borderTerminal}` }}>
                <span>Metal: <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></span>
                <span>Earth: <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></span>
                <span>Distillate: <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: theme.textBright, fontSize: '0.78rem' }}>{recipe.label.toUpperCase()}</strong>
                        <span style={{ color: theme.accentAmber, fontSize: '0.7rem' }}>x{ownedOutput}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#a8ccaf', margin: '4px 0 8px 0' }}>{recipe.desc}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: theme.textMuted }}>
                        {recipe.rawAmount}x {formatLabel(recipe.rawMaterialId)} + {isKameosa ? '2% HUM' : `${effObolCost} Obols`}
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

          <section className="pane-right" style={{ width: '40%', gap: '10px' }}>
            <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
              <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.88rem' }}>&gt; SAFEHOUSE HEARTH // TETHER RECOVERY</h3>
              <p style={{ fontSize: '0.74rem', color: '#a8ccaf', lineHeight: '1.5' }}>
                Restore +30% Humanity (+0.05% Global Entropy &amp; +4% Inquisition Heat in active sectors).
              </p>
              <button
                onClick={() => {
                  ThaumaturgicAudio.sealSuccess();
                  dispatch({ type: 'MODIFY_HUMANITY', payload: 30 });
                  dispatch({ type: 'ADVANCE_TIME', payload: 4 });
                  addMicroEntropy(0.05);
                  addToast(`Restored +30% Humanity (+0.05% Global Entropy).`, 'SEAL');
                }}
                disabled={state.humanity >= 100}
                className="macro-chip"
                style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
              >
                &gt; REST AT SAFEHOUSE (+30% HUM / +0.05% ENTROPY)
              </button>
            </div>

            <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.88rem' }}>&gt; INQUISITION COUNTER-INTELLIGENCE</h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MACRO_SECTORS.filter(s => s.id !== 'safehouse' && isSectorUnlocked(s) && !isSectorSecured(s.id)).map(sec => {
                  const heat = state.sectorEntropy[sec.id] || 0;
                  return (
                    <div key={sec.id} style={{ padding: '8px', backgroundColor: '#030504', border: `1px solid ${heat >= 100 ? theme.accentRed : theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: theme.textBright, fontSize: '0.74rem' }}>{sec.label}</strong>
                        <div style={{ fontSize: '0.68rem', color: heat >= 75 ? theme.accentRed : theme.accentAmber }}>HEAT: {heat}%</div>
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
                        JAM (-20 OBOLS)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      )}

      {viewport === 'HORSEMEN' && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
          <div className="grid-4col" style={{ flex: 1, overflowY: 'auto' }}>
            {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => {
              const info = HORSEMAN_LORE[h];
              const lieutenants = allGoetia.filter(g => g.allegiance === h);
              const sealedCount = lieutenants.filter(g => state.sealedGoetia.includes(g.id)).length;
              const winProb = Math.min(95, 5 + sealedCount * 5);
              const isBanished = !!state.flags[`banished_${h.toLowerCase()}`];

              return (
                <div key={h} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBanished ? theme.textBright : info.color}`, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: info.color }}>
                      <span>{info.sealName}</span>
                      <span>{isBanished ? '[BANISHED]' : `[${18 - sealedCount} ACTIVE]`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                      <HorsemanSigilSvg horseman={h} color={info.color} size={50} />
                      <div>
                        <h2 style={{ margin: 0, color: '#ffffff', letterSpacing: '2px', fontSize: '1.2rem' }}>{h}</h2>
                        <div style={{ fontSize: '0.66rem', color: info.color, fontWeight: 'bold' }}>{info.riderTitle}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#a8ccaf', lineHeight: '1.4' }}>{info.omenDesc}</p>
                    <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '7px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '4px' }}>
                        <span>ANCHORS: <strong>{sealedCount}/18</strong></span>
                        <span style={{ color: info.color, fontWeight: 'bold' }}>ODDS: {winProb}%</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: '#000', border: `1px solid ${theme.borderTerminal}` }}>
                        <div style={{ width: `${(sealedCount / 18) * 100}%`, height: '100%', backgroundColor: info.color }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '6px' }}>
                      {lieutenants.map(g => {
                        const isSealed = state.sealedGoetia.includes(g.id);
                        return (
                          <div key={g.id} onClick={() => { setSelectedSuspectId(g.id); setViewport('CODEX'); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '0.68rem', cursor: 'pointer', color: isSealed ? theme.textBright : '#a8ccaf', textDecoration: isSealed ? 'line-through' : 'none' }}>
                            <span>#{g.manifestId.toString().padStart(2, '0')} {g.name} ({g.rank})</span>
                            <span style={{ color: isSealed ? theme.textBright : theme.accentRed }}>{isSealed ? 'SEALED' : 'ACTIVE'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    {isBanished ? (
                      <div style={{ padding: '10px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold', fontSize: '0.74rem' }}>✓ {h} BANISHED</div>
                    ) : (
                      <button onClick={() => setActiveBanishmentTarget(h)} style={{ width: '100%', padding: '11px', backgroundColor: '#2a0808', color: '#ffffff', border: `1px solid ${info.color}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.73rem' }}>
                        &gt; INITIATE {h} RITE ({winProb}%)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {viewport === 'DOSSIER' && (
        <main className="responsive-split" style={{ zoom: FONT_ZOOM_MAP[fontScale] }}>
          <section className="pane-left" style={{ width: '38%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '18px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', fontSize: '0.74rem' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold' }}>BIOMETRIC TETHER FEED</span>
              <span style={{ color: theme.accentAmber }}>LOCKED</span>
            </div>
            <img src={getFullBodyPath(state.playerPortrait)} alt="Operative" style={{ maxHeight: '78%', maxWidth: '100%', objectFit: 'contain' }} />
            <div style={{ width: '100%', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '8px', textAlign: 'center', fontSize: '0.72rem' }}>
              OPERATIVE: <strong style={{ color: theme.textBright }}>{state.playerName.toUpperCase()}</strong>
            </div>
          </section>

          <section className="pane-right" style={{ width: '62%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '20px', justifyContent: 'space-between', overflowY: 'auto' }}>
            <div>
              <h1 style={{ margin: '0 0 14px 0', color: theme.textBright, fontSize: '1.4rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px' }}>
                OPERATIVE {state.playerName.toUpperCase()} // {state.agencyName.toUpperCase()}
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>GOETIA SEALED</div>
                  <div style={{ fontSize: '1.5rem', color: theme.textBright, fontWeight: 'bold' }}>{state.sealedGoetia.length} / 72</div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>SECTORS SECURED</div>
                  <div style={{ fontSize: '1.5rem', color: theme.accentAmber, fontWeight: 'bold' }}>{securedSectorsCount} / 16</div>
                </div>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>GLOBAL ENTROPY</div>
                  <div style={{ fontSize: '1.5rem', color: theme.accentRed, fontWeight: 'bold' }}>{totalGlobalEntropy.toFixed(2)}%</div>
                </div>
              </div>
              <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
                <div style={{ fontSize: '0.76rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '6px' }}>SOLOMONIC BRASS VESSEL ({state.sealedGoetia.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {state.sealedGoetia.map(gid => {
                    const g = allGoetia.find(item => item.id === gid);
                    return (
                      <span key={gid} style={{ padding: '3px 7px', backgroundColor: '#112217', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontSize: '0.7rem' }}>
                        ✓ #{g?.manifestId} {g?.name.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px dashed ${theme.accentRed}`, paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <button onClick={handleLogout} className="macro-chip macro-chip-amber" style={{ padding: '10px 14px', fontWeight: 'bold' }}>&gt; LOG OUT TO TITLE</button>
              <button
                onClick={() => {
                  if (window.confirm('TERMINATE SESSION & WIPE LOCAL SAVE DATA?')) {
                    ThaumaturgicAudio.errorBuzz();
                    handleFullReset();
                  }
                }}
                style={{ padding: '10px 16px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}
              >
                &gt; WIPE SAVE &amp; RESET
              </button>
            </div>
          </section>
        </main>
      )}

      {viewport === 'MANUAL' && <ManualViewport fontScale={fontScale} />}

      {activeSealSuspectId && (() => {
        const suspect = allGoetia.find(g => g.id === activeSealSuspectId);
        if (!suspect) return null;
        const actualAnchorId = currentContract?.targetGoetiaId || suspect.id;
        const attunedBonus = (currentContract && attunedSectors[currentContract.sectorId]) ? 4 : 0;
        return (
          <SealingTerminal
            suspect={suspect}
            actualAnchorId={actualAnchorId}
            sealCost={suspect.sealCost || {}}
            attunedBonusSeconds={attunedBonus}
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

              let cascadeMsg = '';
              const cascadedNamesList: string[] = [];
              if (['King', 'Prince', 'Duke'].includes(suspect.rank)) {
                const vassals = allGoetia.filter(
                  g => g.allegiance === suspect.allegiance &&
                  g.id !== sealedId &&
                  !state.sealedGoetia.includes(g.id) &&
                  !['King', 'Prince'].includes(g.rank)
                );
                const cascadeTargets = vassals.slice(0, suspect.rank === 'King' ? 2 : 1);
                if (cascadeTargets.length > 0) {
                  cascadeTargets.forEach(v => {
                    sealGoetia(v.id);
                    cascadedNamesList.push(`#${v.manifestId.toString().padStart(2, '0')} ${v.name.toUpperCase()} (${v.rank})`);
                  });
                  cascadeMsg = `<br/><span style="color:#ffb800;">⚡ SOLOMONIC RESONANCE CASCADE: Binding ${suspect.rank} ${suspect.name} automatically collapsed the feudal tether of ${cascadedNamesList.join(' & ')} into the Brass Vessel!</span>`;
                }
              }

              setDeducedSigns([]);
              if (currentContract) {
                setContracts(prev => ({
                  ...prev,
                  [currentContract.sectorId]: { ...currentContract, discoveredLogs: [] }
                }));
              }

              appendLog(
                `<div style="border-left:3px solid #62f080;padding-left:10px;margin:6px 0;color:#62f080;">` +
                `<strong>[✓ SECTOR PERMANENTLY SECURED: ${currentContract?.sectorLabel}]</strong><br/>` +
                `Goetian Anchor <strong>${suspect.name}</strong> severed! +45 Obols awarded.${cascadeMsg}` +
                `</div>`,
                'success'
              );
              return cascadedNamesList;
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

      {/* TOP-CENTER HUD TOASTS (NEVER COVERS BOTTOM-RIGHT BUTTONS OR NETLIFY BADGES) */}
      <div style={{ position: 'fixed', top: '52px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1000, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              animation: 'slideDownTop 0.22s ease-out forwards',
              backgroundColor: 'rgba(9, 13, 10, 0.96)',
              color: theme.textBright,
              border: `1px solid ${theme.borderTerminal}`,
              borderLeft: `4px solid ${toast.type === 'INTEL' ? theme.textBright : toast.type === 'ITEM' ? theme.accentAmber : theme.accentRed}`,
              padding: '8px 16px',
              fontFamily: theme.fontMono,
              fontSize: '0.76rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.9)',
              maxWidth: '420px',
              textAlign: 'center'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}