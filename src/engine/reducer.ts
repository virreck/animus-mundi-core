// src/engine/reducer.ts
import type { GameState, IntelTag, YokaiId, NodeId, ItemId, Lead, GoetiaId, FactionId } from './state';
import { initialGameState } from './state';
import type { ActivationCost, ContractCost } from '../content/yokai/types';

export type GameAction = 
  | { type: 'TRAVEL'; payload: NodeId }
  | { type: 'GATHER_INTEL'; payload: IntelTag }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: YokaiId; costs: ContractCost } }
  | { type: 'EXECUTE_YOKAI'; payload: { yokaiId: YokaiId; costs: ActivationCost } } 
  | { type: 'ADVANCE_TIME'; payload: number }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: ItemId; amount: number } }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'IDENTIFY_GOETIA'; payload: GoetiaId }
  | { type: 'SEAL_GOETIA'; payload: GoetiaId }
  // --- NEW CORE NARRATIVE ACTIONS ---
  | { type: 'MODIFY_FACTION'; payload: { factionId: FactionId; amount: number } }
  | { type: 'MODIFY_HUMANITY'; payload: number }
  | { type: 'SET_FLAG'; payload: { flagId: string; value: boolean } }
  | { type: 'RESOLVE_LEAD'; payload: string }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // ... [Keep all your existing cases here exactly as they were!] ...

    case 'TRAVEL': return { ...state, currentNode: action.payload, globalChaos: state.globalChaos + 2 };
    case 'GATHER_INTEL': return state.intelLog.includes(action.payload) ? state : { ...state, intelLog: [...state.intelLog, action.payload] };
    
    // [I am omitting the long DRAFT_CONTRACT and EXECUTE_YOKAI blocks here for brevity, keep yours!]
    // ...

    case 'ADVANCE_TIME': return { ...state, globalChaos: state.globalChaos + action.payload };
    case 'MODIFY_INVENTORY': return { ...state, inventory: { ...state.inventory, [action.payload.itemId]: (state.inventory[action.payload.itemId] || 0) + action.payload.amount } };
    case 'ADD_LEAD': return state.activeLeads.some(lead => lead.id === action.payload.id) ? state : { ...state, activeLeads: [...state.activeLeads, action.payload] };
    case 'IDENTIFY_GOETIA': return state.identifiedGoetia.includes(action.payload) ? state : { ...state, identifiedGoetia: [...state.identifiedGoetia, action.payload] };
    case 'SEAL_GOETIA': return state.sealedGoetia.includes(action.payload) ? state : { ...state, sealedGoetia: [...state.sealedGoetia, action.payload] };
    
    // --- THE NEW LOGIC BLOCKS ---
    case 'MODIFY_FACTION':
      const currentStanding = state.factions[action.payload.factionId] || 50;
      return { 
        ...state, 
        factions: { ...state.factions, [action.payload.factionId]: Math.max(0, Math.min(100, currentStanding + action.payload.amount)) } 
      };

    case 'MODIFY_HUMANITY':
      return { ...state, humanity: Math.max(0, Math.min(100, state.humanity + action.payload)) };

    case 'SET_FLAG':
      return { ...state, flags: { ...state.flags, [action.payload.flagId]: action.payload.value } };

    case 'RESOLVE_LEAD':
      return {
        ...state,
        activeLeads: state.activeLeads.map(lead => 
          lead.id === action.payload ? { ...lead, resolved: true } : lead
        )
      };

    case 'RESET_GAME': return initialGameState;
    default: return state;
  }
}
