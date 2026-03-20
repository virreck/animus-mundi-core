// src/engine/state.ts

export type IntelTag = string; 
export type GoetiaId = string; 
export type YokaiId = string;  
export type NodeId = string;   
export type ItemId = string; 

export interface Lead {
  id: string;
  text: string;
  resolved: boolean;
}

export interface GameState {
  humanity: number;       
  globalChaos: number;    
  inventory: Record<ItemId, number>; 
  activeContracts: YokaiId[]; 
  intelLog: IntelTag[];       
  identifiedGoetia: GoetiaId[]; // <-- NEW: Tracking manual identification
  sealedGoetia: GoetiaId[];   
  activeLeads: Lead[];
  currentNode: NodeId;    
  flags: Record<string, boolean>; 
}

export const initialGameState: GameState = {
  humanity: 100,
  globalChaos: 10, 
  inventory: {
    "obols": 50,
    "dragons_blood_ink": 3,
    "paper_doll": 5
  },
  activeContracts: [],
  intelLog: [],
  identifiedGoetia: [], // <-- NEW
  sealedGoetia: [],
  activeLeads: [
    { id: "lead_01", text: "Investigate the corrupted cameras in Westminster.", resolved: false }
  ],
  currentNode: "london_hub",
  flags: {}
};

import type { GameAction } from './reducer';

export interface Choice {
  id: string;
  label: string;
  condition?: (state: GameState) => boolean; 
  actions: GameAction[]; 
}

export interface NarrativeNode {
  id: NodeId;
  title: string;
  text: string;
  choices: Choice[];
}

export interface GoetiaDef {
  id: GoetiaId;
  name: string;
  title: string; 
  description: string;
  requiredIntel: IntelTag[]; 
  sealCost: Record<ItemId, number>; 
}