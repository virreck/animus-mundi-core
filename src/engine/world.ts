// src/engine/world.ts
// The regional map as a living system: which sectors are open, how fast neglected
// anchors "ripen" toward manifesting on their own, and how demons that have already
// broken free bleed Heat and entropy into the sectors around them.
import { MACRO_SECTORS, type MacroSectorDef } from '../content/map';
import { allGoetia } from '../content/goetia';
import type { HorsemanAllegiance } from '../content/goetia/types';
import { type GameState, type NodeId, type EngineNotice, getTotalGlobalEntropy, isSectorFailed, ENTROPY_CEILING } from './state';

// ---------------------------------------------------------------------------
// TUNING
// ---------------------------------------------------------------------------
export const WORLD_TUNING = {
  /** Ripeness every open sector gains per tick of world time (one trip = one tick). */
  ripenBase: 4,
  /** +1 ripeness per tick for every `ripenEntropyStep`% of combined global entropy. */
  ripenEntropyStep: 20,
  /** Extra ripeness per tick for each manifested demon in a neighbouring sector. */
  ripenPerAdjacentManifestation: 3,
  /** Ripeness thresholds that trigger a terminal warning. */
  warnAt: [50, 75, 90],
  /** Heat each manifested demon adds to every neighbouring sector per tick. */
  spreadHeat: 4,
  /** Micro entropy each manifested demon adds per tick. */
  spreadEntropy: 0.1,
  /** Global entropy added when an anchor manifests on its own. */
  autoManifestEntropy: 5,
  /** Grand Rite: odds lost and seconds lost per manifested lieutenant of that court. */
  banishOddsPenalty: 5,
  banishSecondsPenalty: 3
} as const;

/** World-clock ticks per unit of ADVANCE_TIME (a Safehouse rest is 4 units = 1 tick). */
export const TIME_UNITS_PER_TICK = 4;

/** Set this flag to stop the world clock (used by the guided first case). */
export const WORLD_CLOCK_PAUSED_FLAG = 'world_clock_paused';

// ---------------------------------------------------------------------------
// MAP SELECTORS
// ---------------------------------------------------------------------------
type FlagState = Pick<GameState, 'flags'>;

export const getSectorDef = (sectorId: NodeId): MacroSectorDef | undefined => MACRO_SECTORS.find(s => s.id === sectorId);

export const isSectorSecured = (state: FlagState, sectorId: NodeId) => !!state.flags[`sector_secured_${sectorId}`];

/** Resolved either way (secured or lost) — no further operations possible. */
export const isSectorClosed = (state: FlagState, sectorId: NodeId) => isSectorSecured(state, sectorId) || isSectorFailed(state, sectorId);

export function isSectorUnlocked(state: FlagState, sec: MacroSectorDef): boolean {
  if (sec.unlockedByDefault || state.flags[`sector_unlocked_${sec.id}`] || isSectorClosed(state, sec.id)) return true;
  // A lost sector still opens its neighbours, so one failure can't wall off the rest of the map
  return sec.connections.some(connId => isSectorClosed(state, connId));
}

/** Unlocked, unresolved field sectors — the ones whose anchors are ripening. */
export function getOpenSectors(state: FlagState): MacroSectorDef[] {
  return MACRO_SECTORS.filter(s => s.id !== 'safehouse' && isSectorUnlocked(state, s) && !isSectorClosed(state, s.id));
}

export const getRipeness = (state: Pick<GameState, 'sectorRipeness'>, sectorId: NodeId) => state.sectorRipeness?.[sectorId] || 0;

/** Sectors next to `sectorId` that currently hold a manifested demon. */
export function countAdjacentManifestations(state: Pick<GameState, 'manifestations'>, sectorId: NodeId): number {
  const def = getSectorDef(sectorId);
  if (!def) return 0;
  const haunted = new Set(Object.values(state.manifestations || {}));
  return def.connections.filter(c => haunted.has(c)).length;
}

export function getRipenRate(state: GameState, sectorId: NodeId): number {
  return (
    WORLD_TUNING.ripenBase +
    Math.floor(getTotalGlobalEntropy(state) / WORLD_TUNING.ripenEntropyStep) +
    WORLD_TUNING.ripenPerAdjacentManifestation * countAdjacentManifestations(state, sectorId)
  );
}

// ---------------------------------------------------------------------------
// RELEASE & WORLD TIME
// ---------------------------------------------------------------------------
let noticeSeq = 0;
const notice = (kind: EngineNotice['kind'], text: string): EngineNotice => ({ id: Date.now() * 1000 + (noticeSeq++ % 1000), kind, text });

/** A demon breaks free: it can never be sealed, and the sector it broke through is lost. */
export function releaseDemon(state: GameState, goetiaId: string, sectorId: NodeId): GameState {
  if (state.sealedGoetia.includes(goetiaId)) return state;
  return {
    ...state,
    releasedGoetia: state.releasedGoetia.includes(goetiaId) ? state.releasedGoetia : [...state.releasedGoetia, goetiaId],
    manifestations: { ...state.manifestations, [goetiaId]: sectorId },
    flags: { ...state.flags, [`sector_failed_${sectorId}`]: true }
  };
}

/**
 * Advances world time by `ticks`. Manifested demons spread Heat and entropy into
 * neighbouring sectors, every open sector's anchor ripens (except `exclude`, the sector
 * the operative is heading into), and anchors that reach 100% manifest on their own.
 */
export function advanceWorld(state: GameState, ticks: number, exclude?: NodeId): GameState {
  if (ticks <= 0 || state.gameStage !== 'ACTIVE' || state.flags[WORLD_CLOCK_PAUSED_FLAG]) return state;
  let next: GameState = { ...state, sectorRipeness: { ...state.sectorRipeness }, sectorEntropy: { ...state.sectorEntropy }, notices: [...state.notices] };

  for (let t = 0; t < ticks; t++) {
    // 1. Manifested demons bleed into their neighbours
    const manifested = Object.entries(next.manifestations);
    manifested.forEach(([, sectorId]) => {
      getSectorDef(sectorId)?.connections.forEach(conn => {
        if (conn === 'safehouse' || isSectorClosed(next, conn)) return;
        next.sectorEntropy[conn] = Math.min(100, (next.sectorEntropy[conn] || 0) + WORLD_TUNING.spreadHeat);
      });
    });
    if (manifested.length > 0) {
      next.microEntropy = +((next.microEntropy || 0) + manifested.length * WORLD_TUNING.spreadEntropy).toFixed(2);
    }

    // 2. Open anchors ripen
    getOpenSectors(next).forEach(sec => {
      if (sec.id === exclude) return;
      const before = getRipeness(next, sec.id);
      const after = Math.min(100, before + getRipenRate(next, sec.id));
      next.sectorRipeness[sec.id] = after;
      const crossed = WORLD_TUNING.warnAt.filter(w => before < w && after >= w).pop();
      if (crossed && after < 100) {
        next.notices.push(notice('WARN', `ANCHOR INSTABILITY at ${sec.label}: ${after}% toward manifestation.`));
      }

      // 3. Fully ripe anchors tear through on their own
      if (after >= 100) {
        const contract = next.contracts[sec.id];
        if (!contract || next.sealedGoetia.includes(contract.targetGoetiaId)) return;
        const demon = allGoetia.find(g => g.id === contract.targetGoetiaId);
        next = releaseDemon(next, contract.targetGoetiaId, sec.id);
        next.globalEntropy = Math.min(ENTROPY_CEILING, next.globalEntropy + WORLD_TUNING.autoManifestEntropy);
        next.notices.push(notice('MANIFEST', `${demon?.name.toUpperCase() || 'AN ANCHOR'} HAS MANIFESTED at ${sec.label}. The sector is lost.`));
      }
    });
  }
  return next;
}

// ---------------------------------------------------------------------------
// GRAND RITE
// ---------------------------------------------------------------------------
export const countManifestedOfCourt = (state: Pick<GameState, 'releasedGoetia'>, court: HorsemanAllegiance) =>
  allGoetia.filter(g => g.allegiance === court && (state.releasedGoetia || []).includes(g.id)).length;

/** Banishment odds: +5% per sealed lieutenant, -5% per manifested one, never below 5% or above 95%. */
export function getBanishmentOdds(state: Pick<GameState, 'sealedGoetia' | 'releasedGoetia'>, court: HorsemanAllegiance): number {
  const sealed = allGoetia.filter(g => g.allegiance === court && state.sealedGoetia.includes(g.id)).length;
  const raw = 5 + sealed * 5 - countManifestedOfCourt(state, court) * WORLD_TUNING.banishOddsPenalty;
  return Math.max(5, Math.min(95, raw));
}

/** Grand Rite timer: 60s (+15s with Kamaitachi), -3s per manifested lieutenant, never under 30s. */
export function getBanishmentSeconds(state: Pick<GameState, 'releasedGoetia'>, court: HorsemanAllegiance, hasTimeBuff: boolean): number {
  return Math.max(30, 60 + (hasTimeBuff ? 15 : 0) - countManifestedOfCourt(state, court) * WORLD_TUNING.banishSecondsPenalty);
}
