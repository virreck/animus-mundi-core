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
  
  activeContracts: YokaiId[];
  ink: number;
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
  activeContracts: [],
  ink: 0
};