// src/engine/state.ts

// --- 1. Core ID Types ---
export type IntelTag = string;
export type YokaiId = string;
export type NodeId = string;
export type ItemId = string;
export type GoetiaId = string;

// --- 2. Supporting Interfaces ---
export interface Lead {
  id: string;
  text: string;
  resolved?: boolean;
  // Add any other properties your Leads use here (e.g., relatedNode, isResolved)
}

export interface ActionEffect {
  type: string;
  payload?: any;
}

export interface Choice {
  label: string;
  effects?: ActionEffect[];
  next?: string;
}

// --- 3. The Unified Game State ---
export interface GameState {
  // 🔹 Core Esoteric Resources (Top-Level)
  humanity: number;       // Your spiritual health
  ink: number;            // Dragon's Blood Ink (vital for sealing/contracts)

  // 🔹 General Inventory
  // Obols, lamp_oil, sacred_sand, etc., live inside this dictionary
  inventory: Record<ItemId, number>;

  // 🔹 Loadout & Progression
  activeContracts: YokaiId[];
  intelLog: IntelTag[];
  activeLeads: Lead[];
  identifiedGoetia: GoetiaId[];
  sealedGoetia: GoetiaId[];

  // 🔹 World Tracking
  currentNode: NodeId;
  globalChaos: number;
  flags: Record<string, boolean>;
}

// --- 4. The Starting Conditions ---
export const initialGameState: GameState = {
  humanity: 100,
  ink: 3,
  
  // Start with 50 Obols in the inventory dictionary
  inventory: {
    "obols": 50, 
    "lamp_oil": 1
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