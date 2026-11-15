// src/ui/session/useSessionCore.ts
// Session state: engine, UI state, contracts, logs, toasts and derived case data.
import { useState, useEffect, useRef } from 'react';
import { allGoetia } from '../../content/goetia';
import { MACRO_SECTORS, type MacroSectorDef } from '../../content/map';
import { type EvidenceLog } from '../../engine/evidence';
import { type SectorContract, generateSectorContract, getUniqueGoetiaSigns } from '../../engine/sectorGenerator';
import { getMaxHumanity, getTotalGlobalEntropy, isSectorFailed } from '../../engine/state';
import { useEngine } from '../hooks/useEngine';
import type { GoeticRank } from '../../content/goetia/types';
import {
  createTutorialState,
  isTraining,
  TUTORIAL_DONE_KEY,
  TUTORIAL_RESUME_FLAG,
  TUTORIAL_TITLE_FLAG,
  TUTORIAL_SECTOR_LABEL,
  type OperativeIdentity,
  type TutorialReturn
} from '../../engine/tutorial';
import {
  isSectorSecured as engineIsSectorSecured,
  isSectorClosed as engineIsSectorClosed,
  isSectorUnlocked as engineIsSectorUnlocked,
  getAllSectors
} from '../../engine/world';
import { type ControlMode, type FontScale, type TerminalEntry, type ViewportMode, escapeHtml } from '../theme';

export function useSessionCore() {
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
  /** Active touch/mouse pointers on the map (for pinch-zoom), and the pinch baseline. */
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; zoom: number; mid: { x: number; y: number }; pan: { x: number; y: number } } | null>(null);
  /** The map's own box; the canvas is sized from this, never from a parent that contains it. */
  const mapWrapRef = useRef<HTMLDivElement>(null);
  /** Phones and folded foldables show Field Ops as map + wire split, or either one full-height. */
  const [mobilePane, setMobilePane] = useState<'SPLIT' | 'MAP' | 'WIRE'>('SPLIT');

  // Contracts live in the game state (and the save file); these helpers keep the old call style.
  const contracts: Record<string, SectorContract> = state.contracts || {};
  const setContracts = (
    next: Record<string, SectorContract> | ((prev: Record<string, SectorContract>) => Record<string, SectorContract>)
  ) => dispatch(typeof next === 'function' ? { type: 'UPDATE_CONTRACTS', payload: next } : { type: 'SET_CONTRACTS', payload: next });

  /** Functional update of one sector's contract, always based on the latest stored value. */
  const updateContract = (sectorId: string, fn: (c: SectorContract) => SectorContract) =>
    setContracts(prev => (prev[sectorId] ? { ...prev, [sectorId]: fn(prev[sectorId]) } : prev));

  // Persisted in the save file via the reducer
  const yokaiCharges = state.yokaiCharges || {};
  const attunedSectors = state.attunedSectors || {};
  const deducedSigns = state.deducedSigns || [];
  const setDeducedSigns = (next: string[] | ((prev: string[]) => string[])) =>
    dispatch({ type: 'SET_DEDUCED_SIGNS', payload: typeof next === 'function' ? next(deducedSigns) : next });
  const [codexHorsemanFilter, setCodexHorsemanFilter] = useState<'ALL' | 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH'>('ALL');
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('01_bael');
  const [codexRankFilter, setCodexRankFilter] = useState<'ALL' | GoeticRank>('ALL');
  const [hideStruck, setHideStruck] = useState(false);

  const [activeSealSuspectId, setActiveSealSuspectId] = useState<string | null>(null);
  const [activeBanishmentTarget, setActiveBanishmentTarget] = useState<'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH' | null>(null);

  const [terminalLines, setTerminalLines] = useState<TerminalEntry[]>([]);
  const [cliInput, setCliInput] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const cliInputRef = useRef<HTMLInputElement>(null);
  const visualFxRef = useRef<{
    sonarRings: { x: number; y: number; r: number; alpha: number }[];
    angle: number;
    wavePhase: number;
  }>({ sonarRings: [], angle: 0, wavePhase: 0 });

  const isSectorSecured = (sectorId: string) => engineIsSectorSecured(state, sectorId);
  /** Lost for good: the anchor broke free of a failed Sealing Rite. */
  const isSectorLost = (sectorId: string) => isSectorFailed(state, sectorId);
  /** Resolved either way (secured or lost) — no further operations possible. */
  const isSectorClosed = (sectorId: string) => engineIsSectorClosed(state, sectorId);
  const isReleased = (goetiaId: string) => (state.releasedGoetia || []).includes(goetiaId);
  const isSectorUnlocked = (sec: MacroSectorDef) => engineIsSectorUnlocked(state, sec);
  /** The sixteen starting sectors plus every site the campaign has opened since. */
  const allSectors = getAllSectors(state);
  const lostSectorsCount = allSectors.filter(s => s.id !== 'safehouse' && isSectorLost(s.id)).length;

  const securedSectorsCount = allSectors.filter(s => s.id !== 'safehouse' && isSectorSecured(s.id)).length;

  const triggerHudFlash = (kind: 'DAMAGE' | 'DECODE') => {
    setHudFlash(kind);
    setTimeout(() => setHudFlash('NONE'), 420);
  };

  // --- GUIDED FIRST CASE -----------------------------------------------------
  const [tutorialStep, setTutorialStep] = useState(0);
  const isTrainingRun = isTraining(state);

  /** Swaps in the sandboxed training crypt. The real save is untouched (autosave is off in training). */
  const startTutorial = (identity: OperativeIdentity, returnTo: TutorialReturn) => {
    setActiveSealSuspectId(null);
    setActiveBanishmentTarget(null);
    setTerminalLines([]);
    setViewport('FIELD_OPS');
    setMapViewMode('SUB_GRID');
    setSelectedSuspectId('01_bael');
    setTutorialStep(0);
    dispatch({ type: 'LOAD_GAME', payload: createTutorialState(identity, returnTo) });
    appendLog(`[+] TRAINING TETHER ESTABLISHED // ${escapeHtml(TUTORIAL_SECTOR_LABEL)}`, 'info');
  };

  /** Ends (or skips) the guided case: back to the saved run, the title screen, or a brand-new run. */
  const finishTutorial = () => {
    try { localStorage.setItem(TUTORIAL_DONE_KEY, '1'); } catch { /* ignore */ }
    const identity = { name: state.playerName, portrait: state.playerPortrait, agency: state.agencyName };
    const resume = !!state.flags[TUTORIAL_RESUME_FLAG];
    const toTitle = !!state.flags[TUTORIAL_TITLE_FLAG];
    setActiveSealSuspectId(null);
    setTerminalLines([]);
    setViewport('FIELD_OPS');
    setMapViewMode('SUB_GRID');
    setTutorialStep(0);
    if (resume) {
      loadGame();
    } else {
      dispatch({ type: 'RESET_GAME' });
      if (!toTitle) startInvestigation(identity.name, identity.portrait, identity.agency);
    }
  };

  const handleFullReset = () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('thaumaturgic_os')) localStorage.removeItem(k);
    });
    setContracts({});
    setTerminalLines([]);
    setActiveSealSuspectId(null);
    setActiveBanishmentTarget(null);
    resetGame();
  };

  const addMicroEntropy = (delta: number) => dispatch({ type: 'ADD_MICRO_ENTROPY', payload: delta });

  const totalGlobalEntropy = getTotalGlobalEntropy(state);
  const maxHumanity = getMaxHumanity(state);

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  };

  const appendLog = (html: string, type: TerminalEntry['type'] = 'normal') => {
    setTerminalLines(prev => [...prev, { id: Date.now() + Math.random(), html, type }]);
  };

  // Engine notices (anchor instability, auto-manifestations) are printed once, then acknowledged
  useEffect(() => {
    if (!state.notices || state.notices.length === 0) return;
    state.notices.forEach(n => {
      if (n.kind === 'MANIFEST') {
        appendLog(`<div style="border-left:3px solid #ff2a55;padding-left:10px;margin:4px 0;color:#ff2a55;"><strong>[☠ ${escapeHtml(n.text)}]</strong></div>`, 'error');
        addToast(n.text, 'ALERT');
      } else if (n.kind === 'CAMPAIGN') {
        appendLog(`<div style="border-left:3px solid #00f3ff;padding-left:10px;margin:4px 0;color:#00f3ff;"><strong>[◈ ${escapeHtml(n.text)}]</strong></div>`, 'info');
        addToast(n.text, 'INTEL');
      } else {
        appendLog(`[⚠ ${escapeHtml(n.text)}]`, 'warn');
      }
    });
    dispatch({ type: 'ACK_NOTICES', payload: state.notices.map(n => n.id) });
  }, [state.notices]);

  useEffect(() => {
    if (state.gameStage === 'ACTIVE' && Object.keys(contracts).length === 0) {
      const initialContracts: Record<string, SectorContract> = {};
      const usedGoetia: string[] = [];
      MACRO_SECTORS.filter(s => s.id !== 'safehouse').forEach(sec => {
        const c = generateSectorContract(sec.id, sec.label, [...state.sealedGoetia, ...(state.releasedGoetia || [])], usedGoetia);
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

      appendLog(`[+] TETHER ESTABLISHED // ${escapeHtml(state.playerName.toUpperCase())} ONLINE.`, 'info');
    }
  }, [state.gameStage, contracts, state.sealedGoetia, state.inventory, dispatch]);

  // Repair saves hit by the old cascade bug: any unsecured sector whose target
  // demon is already sealed gets a fresh, still-unsealed target.
  useEffect(() => {
    if (state.gameStage !== 'ACTIVE') return;
    const unavailable = [...state.sealedGoetia, ...(state.releasedGoetia || [])];
    if (allGoetia.every(g => unavailable.includes(g.id))) return; // nothing left to assign
    const isClosed = (id: string) => !!state.flags[`sector_secured_${id}`] || !!state.flags[`sector_failed_${id}`];
    const broken = Object.values(contracts).filter(
      c => state.sealedGoetia.includes(c.targetGoetiaId) && !state.flags[`sector_secured_${c.sectorId}`]
    );
    // Untouched sectors generated by an older version (fixed 6-room layout, no witness, no quirk)
    // are rebuilt around the same demon so they get the new layout and evidence.
    const legacy = Object.values(contracts).filter(
      c => c.quirk === undefined && !c.activeSubNodeId && c.discoveredLogs.length === 0 && !isClosed(c.sectorId) && !broken.includes(c)
    );
    if (broken.length === 0 && legacy.length === 0) return;
    setContracts(prev => {
      const next = { ...prev };
      const used = Object.values(prev).map(c => c.targetGoetiaId);
      broken.forEach(c => {
        const fresh = generateSectorContract(c.sectorId, c.sectorLabel, unavailable, used);
        used.push(fresh.targetGoetiaId);
        next[c.sectorId] = fresh;
      });
      legacy.forEach(c => {
        next[c.sectorId] = generateSectorContract(c.sectorId, c.sectorLabel, unavailable, used, c.targetGoetiaId);
      });
      return next;
    });
  }, [state.gameStage, contracts, state.sealedGoetia, state.releasedGoetia, state.flags]);

  useEffect(() => {
    if (viewport === 'FIELD_OPS' && consoleScrollRef.current) {
      const el = consoleScrollRef.current;
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => {
        if (consoleScrollRef.current) {
          consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
        }
      });
    }
  }, [terminalLines, viewport]);

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

  // --- CODEX: the player narrows the field; nothing is filtered automatically ---
  const caseEvidence: EvidenceLog[] = currentContract && !isSectorClosed(currentContract.sectorId) ? currentContract.discoveredLogs : [];
  // deducedSigns holds required tags; tags the player has ruled out are stored with a leading '!'
  const requiredSigns = deducedSigns.filter(t => !t.startsWith('!'));
  const excludedSigns = deducedSigns.filter(t => t.startsWith('!')).map(t => t.slice(1));
  /** Cycles a phenomenon filter: neutral -> required -> excluded -> neutral. */
  const cycleSignFilter = (tag: string) =>
    setDeducedSigns(prev => {
      // Cycle: unset -> required -> excluded -> unset
      const excluded = `!${tag}`;
      if (prev.includes(tag)) return [...prev.filter(t => t !== tag), excluded];
      if (prev.includes(excluded)) return prev.filter(t => t !== excluded);
      return [...prev, tag];
    });
  const struckSuspects: string[] = (currentContract && !isSectorClosed(currentContract.sectorId) && currentContract.struckSuspects) || [];
  const toggleStruckSuspect = (goetiaId: string) => {
    if (!currentContract) return;
    updateContract(currentContract.sectorId, c => {
      const struck = c.struckSuspects || [];
      return { ...c, struckSuspects: struck.includes(goetiaId) ? struck.filter(id => id !== goetiaId) : [...struck, goetiaId] };
    });
  };
  const filteredCodexGoetia = allGoetia.filter(g => {
    if (codexHorsemanFilter !== 'ALL' && g.allegiance !== codexHorsemanFilter) return false;
    if (codexRankFilter !== 'ALL' && g.rank !== codexRankFilter) return false;
    if (hideStruck && struckSuspects.includes(g.id)) return false;
    const signs = getUniqueGoetiaSigns(g.id);
    return requiredSigns.every(tag => signs.includes(tag)) && excludedSigns.every(tag => !signs.includes(tag));
  });

  useEffect(() => {
    // Keep a valid selection, but never auto-pick "the answer" for the player
    if (filteredCodexGoetia.length > 0 && !filteredCodexGoetia.some(g => g.id === selectedSuspectId)) {
      setSelectedSuspectId(filteredCodexGoetia[0].id);
    }
  }, [filteredCodexGoetia, selectedSuspectId]);

  return {
    tutorialStep,
    setTutorialStep,
    isTrainingRun,
    startTutorial,
    finishTutorial,
    state,
    dispatch,
    draftContract,
    resetGame,
    sealGoetia,
    startInvestigation,
    loadGame,
    travelTo,
    viewport,
    setViewport,
    mapViewMode,
    setMapViewMode,
    fontScale,
    setFontScale,
    controlMode,
    setControlMode,
    showManual,
    setShowManual,
    audioEnabled,
    setAudioEnabled,
    hudFlash,
    setHudFlash,
    mapZoom,
    setMapZoom,
    mapPan,
    setMapPan,
    isPanningRef,
    panStartRef,
    didDragRef,
    pointersRef,
    pinchRef,
    mapWrapRef,
    mobilePane,
    setMobilePane,
    contracts,
    setContracts,
    updateContract,
    yokaiCharges,
    attunedSectors,
    deducedSigns,
    setDeducedSigns,
    codexHorsemanFilter,
    setCodexHorsemanFilter,
    selectedSuspectId,
    setSelectedSuspectId,
    codexRankFilter,
    hideStruck,
    setCodexRankFilter,
    setHideStruck,
    activeSealSuspectId,
    setActiveSealSuspectId,
    activeBanishmentTarget,
    setActiveBanishmentTarget,
    terminalLines,
    setTerminalLines,
    cliInput,
    setCliInput,
    toasts,
    setToasts,
    mapCanvasRef,
    waveformCanvasRef,
    consoleScrollRef,
    terminalEndRef,
    cliInputRef,
    visualFxRef,
    isSectorSecured,
    isSectorLost,
    isSectorClosed,
    isReleased,
    isSectorUnlocked,
    allSectors,
    lostSectorsCount,
    securedSectorsCount,
    triggerHudFlash,
    handleFullReset,
    addMicroEntropy,
    totalGlobalEntropy,
    maxHumanity,
    addToast,
    appendLog,
    currentContract,
    currentSubNode,
    selectedSubNode,
    currentHeat,
    caseEvidence,
    requiredSigns,
    excludedSigns,
    cycleSignFilter,
    struckSuspects,
    toggleStruckSuspect,
    filteredCodexGoetia
  };
}

export type SessionCore = ReturnType<typeof useSessionCore>;
