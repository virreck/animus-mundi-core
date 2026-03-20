// src/engine/reducer.ts
import type { GameState, IntelTag, YokaiId, NodeId, ItemId, Lead } from './state';
import { initialGameState } from './state';

// --- ALLOWED ACTIONS ---
export type GameAction = 
  | { type: 'TRAVEL'; payload: NodeId }
  | { type: 'GATHER_INTEL'; payload: IntelTag }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: YokaiId; cost: number } }
  | { type: 'EXECUTE_YOKAI'; payload: YokaiId }
  | { type: 'ADVANCE_TIME'; payload: number }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: ItemId; amount: number } }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'RESET_GAME' };

// --- THE ENGINE LOGIC ---
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    
    case 'TRAVEL':
      return {
        ...state,
        currentNode: action.payload,
        globalChaos: state.globalChaos + 2 // Traveling takes time
      };

    case 'GATHER_INTEL':
      if (state.intelLog.includes(action.payload)) return state;
      return { ...state, intelLog: [...state.intelLog, action.payload] };

    case 'DRAFT_CONTRACT':
      const currentObols = state.inventory["obols"] || 0;
      if (currentObols < action.payload.cost) return state; // Block if too poor
      return {
        ...state,
        inventory: { ...state.inventory, "obols": currentObols - action.payload.cost },
        activeContracts: [...state.activeContracts, action.payload.yokaiId]
      };

    case 'EXECUTE_YOKAI':
      return {
        ...state,
        activeContracts: state.activeContracts.filter(id => id !== action.payload)
      };

    case 'ADVANCE_TIME':
      return { ...state, globalChaos: state.globalChaos + action.payload };

    case 'MODIFY_INVENTORY':
      const currentAmount = state.inventory[action.payload.itemId] || 0;
      return {
        ...state,
        inventory: { ...state.inventory, [action.payload.itemId]: currentAmount + action.payload.amount }
      };

    case 'ADD_LEAD':
      if (state.activeLeads.some(lead => lead.id === action.payload.id)) return state;
      return { ...state, activeLeads: [...state.activeLeads, action.payload] };

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
}