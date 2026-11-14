// src/engine/state.ts

export type NodeId = string;
export type GoetiaId = string;
export type YokaiId = string;
export type FactionId = string;

export interface Lead {
  id: string;
  text: string;
  resolved: boolean;
}

export interface GameState {
  gameStage: 'START_SCREEN' | 'ACTIVE' | 'GAME_OVER';
  playerName: string;
  playerPortrait: string;
  agencyName: string;
  
  currentNode: NodeId;
  humanity: number;
  
  // --- THE THREAT TRACKERS ---
  globalEntropy: number;
  sectorEntropy: Record<string, number>; 
  
  inventory: Record<string, number>;
  intelLog: string[];
  flags: Record<string, boolean>;
  activeLeads: Lead[];
  
  factions: Record<FactionId, number>;
  
  identifiedGoetia: GoetiaId[];
  sealedGoetia: GoetiaId[];
  /** Demons that broke free of a failed Sealing Rite. They can never be sealed. */
  releasedGoetia: GoetiaId[];
  
  /** @deprecated Legacy mirror of `tetheredYokai`, kept so old saves still load. */
  activeContracts: YokaiId[];
  ink: number;

  tetheredYokai: YokaiId[];

  // --- STATE THAT USED TO LIVE OUTSIDE THE SAVE FILE ---
  /** Low-precision entropy drift (travel, room entries, rests). Added to `globalEntropy` for display & game-over checks. */
  microEntropy: number;
  /** Remaining active-invocation charges per bound Yokai. */
  yokaiCharges: Record<YokaiId, number>;
  /** Sectors whose anchor has been attuned (+4s sealing bonus). */
  attunedSectors: Record<NodeId, boolean>;
  /** Phenomena the player has ticked in the Codex for the current case. */
  deducedSigns: string[];
}

/** Humanity at or below this ends the run. */
export const HUMANITY_FLOOR = 0;
/** Combined global entropy at or above this ends the run. */
export const ENTROPY_CEILING = 100;

export function getTotalGlobalEntropy(state: Pick<GameState, 'globalEntropy' | 'microEntropy'>): number {
  return Math.min(ENTROPY_CEILING, +((state.globalEntropy || 0) + (state.microEntropy || 0)).toFixed(2));
}

/** A sector is lost for good once its anchor demon has broken free of a failed seal. */
export const isSectorFailed = (state: Pick<GameState, 'flags'>, sectorId: string) =>
  !!state.flags[`sector_failed_${sectorId}`];

export function getMaxHumanity(state: Pick<GameState, 'tetheredYokai'>): number {
  // Zashiki-warashi permanently lowers your max humanity while bound
  return (state.tetheredYokai || []).includes('yokai_zashiki') ? 85 : 100;
}

export const initialGameState: GameState = {
  gameStage: 'START_SCREEN',
  playerName: '',
  playerPortrait: '',
  agencyName: '',
  
  currentNode: 'caterham_churchyard',
  humanity: 100,
  
  // --- DEFAULT THREAT STATES ---
  globalEntropy: 0,
  sectorEntropy: {}, 
  
  inventory: {},
  intelLog: [],
  flags: {},
  activeLeads: [],
  factions: { malleus: 50, independent: 50 },
  identifiedGoetia: [],
  sealedGoetia: [],
  releasedGoetia: [],
  activeContracts: [],
  tetheredYokai: [],
  ink: 0,
  microEntropy: 0,
  yokaiCharges: {},
  attunedSectors: {},
  deducedSigns: []
};

/**
 * Fills in any fields missing from an older save so the rest of the engine
 * can rely on them being present.
 */
export function normalizeLoadedState(raw: Partial<GameState>, legacyMicroEntropy = 0): GameState {
  const tethered = raw.tetheredYokai || raw.activeContracts || [];
  return {
    ...initialGameState,
    ...raw,
    tetheredYokai: tethered,
    activeContracts: tethered,
    sectorEntropy: raw.sectorEntropy || {},
    inventory: raw.inventory || {},
    intelLog: raw.intelLog || [],
    flags: raw.flags || {},
    activeLeads: raw.activeLeads || [],
    factions: { ...initialGameState.factions, ...(raw.factions || {}) },
    identifiedGoetia: raw.identifiedGoetia || [],
    sealedGoetia: raw.sealedGoetia || [],
    releasedGoetia: raw.releasedGoetia || [],
    microEntropy: typeof raw.microEntropy === 'number' ? raw.microEntropy : legacyMicroEntropy,
    yokaiCharges: raw.yokaiCharges || {},
    attunedSectors: raw.attunedSectors || {},
    deducedSigns: raw.deducedSigns || []
  };
}