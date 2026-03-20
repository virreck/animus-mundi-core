import type { GameState, IntelTag, YokaiId, NodeId, ItemId, Lead, GoetiaId } from './state';
import { initialGameState } from './state';
import type { ActivationCost } from '../content/yokai/types'; // <-- Import the cost type

export type GameAction = 
  | { type: 'TRAVEL'; payload: NodeId }
  | { type: 'GATHER_INTEL'; payload: IntelTag }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: YokaiId; cost: number } }
  | { type: 'EXECUTE_YOKAI'; payload: { yokaiId: YokaiId; costs: ActivationCost } } // <-- UPDATED
  | { type: 'ADVANCE_TIME'; payload: number }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: ItemId; amount: number } }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'IDENTIFY_GOETIA'; payload: GoetiaId }
  | { type: 'SEAL_GOETIA'; payload: GoetiaId }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TRAVEL':
      return { ...state, currentNode: action.payload, globalChaos: state.globalChaos + 2 };
      
    case 'GATHER_INTEL':
      if (state.intelLog.includes(action.payload)) return state;
      return { ...state, intelLog: [...state.intelLog, action.payload] };
      
    case 'DRAFT_CONTRACT':
      const currentObols = state.inventory["obols"] || 0;
      if (currentObols < action.payload.cost) return state; 
      return {
        ...state,
        inventory: { ...state.inventory, "obols": currentObols - action.payload.cost },
        activeContracts: [...state.activeContracts, action.payload.yokaiId]
      };
      
    case 'EXECUTE_YOKAI': {
      // --- NEW LOGIC INTEGRATED HERE ---
      const { yokaiId, costs } = action.payload;
      const newInventory = { ...state.inventory };

      // 1. Validation: Check if player has the required resources
      if (costs.humanity && state.humanity < costs.humanity) {
        console.warn("Insufficient Humanity.");
        return state;
      }
      if (costs.ink && state.ink < costs.ink) {
        console.warn("Insufficient Ink.");
        return state;
      }
      if (costs.requiredItemId) {
        const itemCount = newInventory[costs.requiredItemId] || 0;
        if (itemCount < 1) {
          console.warn(`Missing required item: ${costs.requiredItemId}`);
          return state;
        }
      }

      // 2. Execution: Deduct the inventory item if required
      if (costs.requiredItemId) {
        newInventory[costs.requiredItemId] -= 1;
        // Clean up empty slots
        if (newInventory[costs.requiredItemId] <= 0) {
          delete newInventory[costs.requiredItemId];
        }
      }

      // 3. Apply state changes and burn the contract
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
      return { 
        ...state, 
        inventory: { ...state.inventory, [action.payload.itemId]: currentAmount + action.payload.amount } 
      };
      
    case 'ADD_LEAD':
      if (state.activeLeads.some(lead => lead.id === action.payload.id)) return state;
      return { ...state, activeLeads: [...state.activeLeads, action.payload] };
      
    case 'IDENTIFY_GOETIA':
      if (state.identifiedGoetia.includes(action.payload)) return state;
      return { ...state, identifiedGoetia: [...state.identifiedGoetia, action.payload] };
      
    case 'SEAL_GOETIA':
      if (state.sealedGoetia.includes(action.payload)) return state;
      return { ...state, sealedGoetia: [...state.sealedGoetia, action.payload] };
      
    case 'RESET_GAME':
      return initialGameState;
      
    default:
      return state;
  }
}