// src/engine/state.ts

export type IntelTag = string;
export type YokaiId = string;
export type NodeId = string;
export type ItemId = string;
export type GoetiaId = string;
export type FactionId = string; // <-- NEW

export interface Lead {
  id: string;
  text: string;
  resolved?: boolean; 
}

export interface ActionEffect {
  type: string;
  payload?: any;
}

export interface Choice {
  id: string;
  label: string;
  condition?: (state: GameState) => boolean;
  actions: any[]; 
}

export interface NarrativeNode {
  id: string;
  title: string;
  text: string;
  choices: Choice[];
}

export interface GameState {
  humanity: number;       
  ink: number;            
  inventory: Record<ItemId, number>;

  gameStage: 'START_SCREEN' | 'ACTIVE';
  playerName: string;                   
  playerPortrait: string;               
  agencyName: string;                  
  
  // --- NEW: Faction Standing ---
  factions: Record<FactionId, number>;

  activeContracts: YokaiId[];
  intelLog: IntelTag[];
  activeLeads: Lead[];
  identifiedGoetia: GoetiaId[];
  sealedGoetia: GoetiaId[];

  currentNode: NodeId;
  globalChaos: number;
  flags: Record<string, boolean>; // For narrative memory
}

export const initialGameState: GameState = {
  gameStage: 'START_SCREEN',
  playerName: 'Unknown Operative',
  playerPortrait: 'sigil_1',
  agencyName: 'Independent
  humanity: 100,
  ink: 3,
  inventory: {
    "obols": 50, 
    "lamp_oil": 1
  },
  
  // Base standing: 50 is neutral. 0 is Kill-on-Sight. 100 is Exalted.
  factions: {
    "malleus": 50,
    "underworld": 50
  },

  activeContracts: [],
  intelLog: [],
  activeLeads: [],
  identifiedGoetia: [],
  sealedGoetia: [],
  
  currentNode: "london_hub",
  globalChaos: 10,
  flags: {}
};
