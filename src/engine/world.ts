// src/engine/world.ts
// The regional map as a living system: which sectors are open, how fast neglected
// anchors "ripen" toward manifesting on their own, and how demons that have already
// broken free bleed Heat and entropy into the sectors around them.
import type { MacroSectorDef } from '../content/map';
import { allGoetia } from '../content/goetia';
import type { HorsemanAllegiance } from '../content/goetia/types';
import { type GameState, type EngineNotice, getTotalGlobalEntropy, isSectorFailed, ENTROPY_CEILING, TOTAL_GOETIA } from './state';
import { generateSectorContract } from './sectorGenerator';
import { generateSite, getAllSectors, getSectorDef, isProceduralSite, MAX_PROCEDURAL_SITES, type ProceduralSiteDef } from './sites';

export { getAllSectors, getSectorDef } from './sites';

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

/** THE LONG CAMPAIGN: how new cases keep arriving until all 72 have had a home. */
export const CAMPAIGN_TUNING = {
  /** New cases only appear while fewer than this many sectors are open. */
  maxOpenCases: 5,
  /** Ticks a secured sector lies dormant before it can re-infest... */
  reinfestAfter: 14,
  /** ...plus 0 to this many more, varied per sector and per cycle. */
  reinfestJitter: 6,
  /** No new site breaks open before this tick, then at most one every `siteInterval` ticks. */
  firstSiteTick: 8,
  siteInterval: 6
} as const;

/** World-clock ticks per unit of ADVANCE_TIME (a Safehouse rest is 4 units = 1 tick). */
export const TIME_UNITS_PER_TICK = 4;

/** Set this flag to stop the world clock (used by the guided first case). */
export const WORLD_CLOCK_PAUSED_FLAG = 'world_clock_paused';

// ---------------------------------------------------------------------------
// MAP SELECTORS
// ---------------------------------------------------------------------------
type FlagState = Pick<GameState, 'flags'> & Partial<Pick<GameState, 'campaign'>>;

export const isSectorSecured = (state: FlagState, sectorId: string) => !!state.flags[`sector_secured_${sectorId}`];

/** Resolved either way (secured or lost) — no further operations possible. */
export const isSectorClosed = (state: FlagState, sectorId: string) => isSectorSecured(state, sectorId) || isSectorFailed(state, sectorId);

export function isSectorUnlocked(state: FlagState, sec: MacroSectorDef): boolean {
  if (sec.unlockedByDefault || state.flags[`sector_unlocked_${sec.id}`] || isSectorClosed(state, sec.id)) return true;
  // A lost sector still opens its neighbours, so one failure can't wall off the rest of the map
  return sec.connections.some(connId => isSectorClosed(state, connId));
}

/** Unlocked, unresolved field sectors — the ones whose anchors are ripening. */
export function getOpenSectors(state: FlagState): MacroSectorDef[] {
  return getAllSectors(state).filter(s => s.id !== 'safehouse' && isSectorUnlocked(state, s) && !isSectorClosed(state, s.id));
}

export const getRipeness = (state: Pick<GameState, 'sectorRipeness'>, sectorId: string) => state.sectorRipeness?.[sectorId] || 0;

/** Sectors next to `sectorId` that currently hold a manifested demon. */
export function countAdjacentManifestations(state: Pick<GameState, 'manifestations'> & Partial<Pick<GameState, 'campaign'>>, sectorId: string): number {
  const def = getSectorDef(state, sectorId);
  if (!def) return 0;
  const haunted = new Set(Object.values(state.manifestations || {}));
  return def.connections.filter(c => haunted.has(c)).length;
}

export function getRipenRate(state: GameState, sectorId: string): number {
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
export function releaseDemon(state: GameState, goetiaId: string, sectorId: string): GameState {
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
export function advanceWorld(state: GameState, ticks: number, exclude?: string): GameState {
  if (ticks <= 0 || state.gameStage !== 'ACTIVE' || state.flags[WORLD_CLOCK_PAUSED_FLAG]) return state;
  let next: GameState = { ...state, sectorRipeness: { ...state.sectorRipeness }, sectorEntropy: { ...state.sectorEntropy }, notices: [...state.notices] };

  for (let t = 0; t < ticks; t++) {
    // 1. Manifested demons bleed into their neighbours
    const manifested = Object.entries(next.manifestations);
    manifested.forEach(([, sectorId]) => {
      getSectorDef(next, sectorId)?.connections.forEach(conn => {
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
      const crossed = WORLD_TUNING.warnAt.findLast(w => before < w && after >= w);
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

    // 4. The long campaign: dormant sectors re-infest, new sites break open
    next = stepCampaign(next, exclude);
  }
  return next;
}

// ---------------------------------------------------------------------------
// THE LONG CAMPAIGN
// ---------------------------------------------------------------------------
/** Demons that are neither sealed, released, nor the anchor of a sector still in play. */
export function getUnhousedGoetia(state: GameState): string[] {
  const claimed = new Set<string>([...state.sealedGoetia, ...(state.releasedGoetia || [])]);
  Object.values(state.contracts || {}).forEach(c => {
    if (!isSectorClosed(state, c.sectorId)) claimed.add(c.targetGoetiaId);
  });
  return allGoetia.filter(g => !claimed.has(g.id)).map(g => g.id);
}

/** Every spirit is sealed or loose: no new cases will ever arrive. */
export const isCampaignExhausted = (state: GameState) =>
  state.sealedGoetia.length + (state.releasedGoetia || []).length >= TOTAL_GOETIA;

const hashId = (id: string) => [...id].reduce((h, ch) => (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0, 7);

/** Dormant ticks before `sectorId` re-infests, varied per sector and per cycle. */
export function getReinfestThreshold(state: Pick<GameState, 'campaign'>, sectorId: string): number {
  const cycle = state.campaign?.cycles?.[sectorId] || 0;
  return CAMPAIGN_TUNING.reinfestAfter + (hashId(sectorId) + cycle * 5) % (CAMPAIGN_TUNING.reinfestJitter + 1);
}

/** Gives `sectorId` a fresh case file around a spirit that has no home yet. */
function draftCase(state: GameState, sec: MacroSectorDef) {
  const unavailable = [...state.sealedGoetia, ...(state.releasedGoetia || [])];
  const used = Object.values(state.contracts)
    .filter(c => c.sectorId !== sec.id && !isSectorClosed(state, c.sectorId))
    .map(c => c.targetGoetiaId);
  return generateSectorContract(sec.id, sec.label, unavailable, used, undefined, isProceduralSite(sec) ? sec.rooms : undefined);
}

function openSite(state: GameState, site: ProceduralSiteDef): GameState {
  const withSite: GameState = {
    ...state,
    campaign: { ...state.campaign, sites: [...state.campaign.sites, site], nextSiteAt: state.campaign.tick + CAMPAIGN_TUNING.siteInterval }
  };
  return {
    ...withSite,
    contracts: { ...withSite.contracts, [site.id]: draftCase(withSite, site) },
    sectorRipeness: { ...withSite.sectorRipeness, [site.id]: 0 },
    notices: [...withSite.notices, notice('CAMPAIGN', `NEW SITE: ${site.label} has broken open on the regional map (${site.short}).`)]
  };
}

function reinfest(state: GameState, sec: MacroSectorDef): GameState {
  const flags = { ...state.flags, [`sector_unlocked_${sec.id}`]: true };
  delete flags[`sector_secured_${sec.id}`];
  const dormancy = { ...state.campaign.dormancy };
  delete dormancy[sec.id];
  const attunedSectors = { ...state.attunedSectors };
  delete attunedSectors[sec.id];
  const cycles = { ...state.campaign.cycles, [sec.id]: (state.campaign.cycles[sec.id] || 0) + 1 };
  const reopened: GameState = { ...state, flags, attunedSectors, campaign: { ...state.campaign, dormancy, cycles } };
  return {
    ...reopened,
    contracts: { ...reopened.contracts, [sec.id]: draftCase(reopened, sec) },
    sectorRipeness: { ...reopened.sectorRipeness, [sec.id]: 0 },
    notices: [...reopened.notices, notice('CAMPAIGN', `RE-INFESTATION: a new anchor has taken root in ${sec.label}. The sector is open again.`)]
  };
}

/**
 * One tick of the long campaign. Secured sectors count down toward re-infestation, and new
 * sites break open on a schedule. At most one new case arrives per tick, and none while the
 * map already has `maxOpenCases` open sectors or every spirit already has a home.
 */
export function stepCampaign(state: GameState, exclude?: string): GameState {
  const sectors = getAllSectors(state).filter(s => s.id !== 'safehouse');
  const dormancy = { ...state.campaign.dormancy };
  sectors.forEach(sec => {
    if (isSectorSecured(state, sec.id)) dormancy[sec.id] = (dormancy[sec.id] || 0) + 1;
  });
  let next: GameState = { ...state, campaign: { ...state.campaign, tick: state.campaign.tick + 1, dormancy } };
  const c = next.campaign;

  if (getUnhousedGoetia(next).length === 0) return next;
  if (getOpenSectors(next).length >= CAMPAIGN_TUNING.maxOpenCases) return next;

  // New ground first: the map grows as the campaign runs
  if (c.tick >= CAMPAIGN_TUNING.firstSiteTick && c.tick >= c.nextSiteAt && c.sites.length < MAX_PROCEDURAL_SITES) {
    const site = generateSite(next);
    if (site) return openSite(next, site);
    next = { ...next, campaign: { ...c, nextSiteAt: c.tick + CAMPAIGN_TUNING.siteInterval } };
  }

  // Otherwise the longest-dormant secured sector re-infests
  const ready = sectors
    .filter(sec => sec.id !== exclude && sec.id !== next.currentNode && isSectorSecured(next, sec.id))
    .filter(sec => (dormancy[sec.id] || 0) >= getReinfestThreshold(next, sec.id))
    .sort((a, b) => (dormancy[b.id] || 0) - (dormancy[a.id] || 0))[0];
  return ready ? reinfest(next, ready) : next;
}

/** Sectors secured between two states (feeds the campaign's case count). */
export const countNewlySecured = (prev: GameState, next: GameState) =>
  Object.keys(next.flags).filter(f => f.startsWith('sector_secured_') && next.flags[f] && !prev.flags[f]).length;

export const LESSER_KEY_COMPLETE_FLAG = 'lesser_key_complete';

/** Run after every action: counts closed cases and marks the moment all 72 are in the Vessel. */
export function applyCampaignMilestones(prev: GameState, next: GameState): GameState {
  if (!next.campaign) return next;
  let s = next;
  const closed = countNewlySecured(prev, next);
  if (closed > 0) s = { ...s, campaign: { ...s.campaign, casesClosed: s.campaign.casesClosed + closed } };
  if (s.sealedGoetia.length >= TOTAL_GOETIA && !s.flags[LESSER_KEY_COMPLETE_FLAG]) {
    s = {
      ...s,
      flags: { ...s.flags, [LESSER_KEY_COMPLETE_FLAG]: true },
      notices: [...s.notices, notice('CAMPAIGN', 'THE LESSER KEY IS COMPLETE. All 72 spirits rest in the Brass Vessel. The Four stand alone.')]
    };
  }
  return s;
}

// ---------------------------------------------------------------------------
// SOLOMONIC CASCADE
// ---------------------------------------------------------------------------
/**
 * Lieutenants that collapse into the Vessel when a King (2), Prince or Duke (1) is sealed in
 * `sectorId`. Never another King or Prince, never a released spirit, and never the anchor of
 * another sector still in play (that sector would be left with nothing to seal).
 */
export function pickCascadeVassals(state: GameState, sealedId: string, sectorId: string): string[] {
  const lord = allGoetia.find(g => g.id === sealedId);
  if (!lord || !['King', 'Prince', 'Duke'].includes(lord.rank)) return [];
  const reserved = new Set(
    Object.values(state.contracts || {})
      .filter(c => c.sectorId !== sectorId && !isSectorClosed(state, c.sectorId))
      .map(c => c.targetGoetiaId)
  );
  return allGoetia
    .filter(g =>
      g.allegiance === lord.allegiance &&
      g.id !== sealedId &&
      !state.sealedGoetia.includes(g.id) &&
      !(state.releasedGoetia || []).includes(g.id) &&
      !reserved.has(g.id) &&
      !['King', 'Prince'].includes(g.rank))
    .slice(0, lord.rank === 'King' ? 2 : 1)
    .map(g => g.id);
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
