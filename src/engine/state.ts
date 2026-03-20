// src/engine/state.ts

// --- 1. STRICT ID TYPES ---
export type IntelTag = string; 
export type GoetiaId = string; 
export type YokaiId = string;  
export type NodeId = string;   
export type ItemId = string; 

// --- 2. DATA STRUCTURES ---
export interface Lead {
  id: string;
  text: string;
  resolved: boolean;
}

// --- 3. THE MASTER STATE INTERFACE ---
export interface GameState {
  humanity: number;       
  globalChaos: number;    
  inventory: Record<ItemId, number>; 
  activeContracts: YokaiId[]; 
  intelLog: IntelTag[];       
  sealedGoetia: GoetiaId[];   
  activeLeads: Lead[];
  currentNode: NodeId;    
  flags: Record<string, boolean>; 
}

// --- 4. THE STARTING CONDITIONS ---
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
  sealedGoetia: [],
  activeLeads: [
    { id: "lead_01", text: "Investigate the corrupted cameras in Westminster.", resolved: false }
  ],
  currentNode: "london_hub",
  flags: {}
};

// --- 5. NARRATIVE & LOGIC TYPES ---
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