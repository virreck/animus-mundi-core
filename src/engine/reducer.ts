// src/engine/reducer.ts
import type { GameState, IntelTag, YokaiId, NodeId, ItemId, Lead, GoetiaId, FactionId } from './state';
import { initialGameState } from './state';
import type { ActivationCost, ContractCost } from '../content/yokai/types';

export type GameAction = 
  | { type: 'START_INVESTIGATION'; payload: { name: string; portrait: string; agency: string } }
  | { type: 'TRAVEL'; payload: NodeId }
  | { type: 'GATHER_INTEL'; payload: IntelTag }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: YokaiId; costs: ContractCost } }
  | { type: 'EXECUTE_YOKAI'; payload: { yokaiId: YokaiId; costs: ActivationCost } } 
  | { type: 'ADVANCE_TIME'; payload: number }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: ItemId; amount: number } }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'IDENTIFY_GOETIA'; payload: GoetiaId }
  | { type: 'SEAL_GOETIA'; payload: GoetiaId }
  | { type: 'MODIFY_FACTION'; payload: { factionId: FactionId; amount: number } }
  | { type: 'MODIFY_HUMANITY'; payload: number }
  | { type: 'SET_FLAG'; payload: { flagId: string; value: boolean } }
  | { type: 'RESOLVE_LEAD'; payload: string }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_INVESTIGATION':
      return {
        ...state,
        gameStage: 'ACTIVE',
        playerName: action.payload.name || 'Operative',
        playerPortrait: action.payload.portrait,
        agencyName: action.payload.agency || 'Independent Consultations'
      };

    case 'TRAVEL':
      return { ...state, currentNode: action.payload, globalChaos: state.globalChaos + 2 };
      
    case 'GATHER_INTEL':
      if (state.intelLog.includes(action.payload)) return state;
      return { ...state, intelLog: [...state.intelLog, action.payload] };
      
    case 'DRAFT_CONTRACT': {
      const { yokaiId, costs } = action.payload;
      const currentInventory = { ...state.inventory };

      if (costs.obols && (currentInventory["obols"] || 0) < costs.obols) return state;
      if (costs.humanity && state.humanity < costs.humanity) return state;
      if (costs.ink && state.ink < costs.ink) return state;
      if (costs.tributeItemId && (currentInventory[costs.tributeItemId] || 0) < 1) return state;

      if (costs.obols) currentInventory["obols"] -= costs.obols;
      if (costs.tributeItemId) {
        currentInventory[costs.tributeItemId] -= 1;
        if (currentInventory[costs.tributeItemId] <= 0) delete currentInventory[costs.tributeItemId];
      }

      return {
        ...state,
        humanity: state.humanity - (costs.humanity || 0),
        ink: state.ink - (costs.ink || 0),
        inventory: currentInventory,
        activeContracts: [...state.activeContracts, yokaiId]
      };
    }
      
    case 'EXECUTE_YOKAI': {
      const { yokaiId, costs } = action.payload;
      const newInventory = { ...state.inventory };

      if (costs.humanity && state.humanity < costs.humanity) return state;
      if (costs.ink && state.ink < costs.ink) return state;
      if (costs.requiredItemId && (newInventory[costs.requiredItemId] || 0) < 1) return state;

      if (costs.requiredItemId) {
        newInventory[costs.requiredItemId] -= 1;
        if (newInventory[costs.requiredItemId] <= 0) delete newInventory[costs.requiredItemId];
      }

      return {
        ...state,
        humanity: state.humanity - (costs.humanity || 0),
        ink: state.ink - (costs.ink || 0),
        inventory: newInventory,
        activeContracts: state.activeContracts.filter(id => id !== yokaiId)
      };
    }
      
    case 'ADVANCE_TIME':
      return { ...state, globalChaos: state.globalChaos + action.payload };
      
    case 'MODIFY_INVENTORY':
      const currentAmount = state.inventory[action.payload.itemId] || 0;
      return { ...state, inventory: { ...state.inventory, [action.payload.itemId]: currentAmount + action.payload.amount } };
      
    case 'ADD_LEAD':
      if (state.activeLeads.some(lead => lead.id === action.payload.id)) return state;
      return { ...state, activeLeads: [...state.activeLeads, action.payload] };
      
    case 'IDENTIFY_GOETIA':
      if (state.identifiedGoetia.includes(action.payload)) return state;
      return { ...state, identifiedGoetia: [...state.identifiedGoetia, action.payload] };
      
    case 'SEAL_GOETIA':
      if (state.sealedGoetia.includes(action.payload)) return state;
      return { ...state, sealedGoetia: [...state.sealedGoetia, action.payload] };

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

    case 'LOAD_GAME':
      return action.payload;
      
    case 'RESET_GAME':
      return initialGameState;
      
    default:
      return state;
  }
}
