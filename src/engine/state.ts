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

// --- 5. NARRATIVE & LOGIC TYPES (Add to bottom of state.ts) ---

import type { GameAction } from './reducer'; // We need to import the actions so choices can trigger them

export interface Choice {
  id: string;
  label: string;
  // A function that checks the current state to see if the button should be shown/clickable
  condition?: (state: GameState) => boolean; 
  // An array of actions that fire when the player clicks this choice
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
  title: string; // e.g., "The Pale Rider's Vanguard"
  description: string;
  requiredIntel: IntelTag[]; // The clues needed to identify them
  sealCost: Record<ItemId, number>; // What items are needed to banish them
}