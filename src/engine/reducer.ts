// src/engine/reducer.ts
import { type GameState, initialGameState } from './state';
import type { ContractCost } from '../content/yokai/types';

export type GameAction =
  | { type: 'START_INVESTIGATION'; payload: { name: string; portrait: string; agency: string } }
  | { type: 'TRAVEL'; payload: string }
  | { type: 'GATHER_INTEL'; payload: string }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: string; amount: number } }
  | { type: 'IDENTIFY_GOETIA'; payload: string }
  | { type: 'SEAL_GOETIA'; payload: string }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: string; costs: ContractCost } }
  | { type: 'MODIFY_FACTION'; payload: { factionId: string; amount: number } }
  | { type: 'MODIFY_HUMANITY'; payload: number }
  | { type: 'ADD_LEAD'; payload: { id: string; text: string } }
  | { type: 'SET_FLAG'; payload: { flagId: string; value: boolean } }
  | { type: 'RESOLVE_LEAD'; payload: string }
  | { type: 'ADVANCE_TIME'; payload: number } 
  | { type: 'MODIFY_GLOBAL_ENTROPY'; payload: number }
  | { type: 'MODIFY_SECTOR_ENTROPY'; payload: { nodeId: string; amount: number } } 
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_INVESTIGATION':
      return { ...state, gameStage: 'ACTIVE', playerName: action.payload.name, playerPortrait: action.payload.portrait, agencyName: action.payload.agency };
    case 'TRAVEL':
      return { ...state, currentNode: action.payload, globalEntropy: Math.min(100, state.globalEntropy + 2) };
    case 'GATHER_INTEL':
      if (state.intelLog.includes(action.payload)) return state;
      return { ...state, intelLog: [...state.intelLog, action.payload] };
    case 'MODIFY_INVENTORY':
      const currentAmt = state.inventory[action.payload.itemId] || 0;
      return { ...state, inventory: { ...state.inventory, [action.payload.itemId]: Math.max(0, currentAmt + action.payload.amount) } };
    case 'IDENTIFY_GOETIA':
      if (state.identifiedGoetia.includes(action.payload)) return state;
      return { ...state, identifiedGoetia: [...state.identifiedGoetia, action.payload] };
    case 'SEAL_GOETIA':
      if (state.sealedGoetia.includes(action.payload)) return state;
      return { ...state, sealedGoetia: [...state.sealedGoetia, action.payload] };
    case 'DRAFT_CONTRACT':
      const { yokaiId, costs } = action.payload;
      return {
        ...state,
        activeContracts: [...state.activeContracts, yokaiId],
        humanity: state.humanity - (costs.humanity || 0),
        ink: state.ink - (costs.ink || 0),
        inventory: {
          ...state.inventory,
          ...(costs.obols ? { obols: (state.inventory.obols || 0) - costs.obols } : {}),
          ...(costs.tributeItemId ? { [costs.tributeItemId]: (state.inventory[costs.tributeItemId] || 0) - 1 } : {})
        }
      };
    case 'MODIFY_FACTION':
      const currentFaction = state.factions[action.payload.factionId] || 50;
      return { ...state, factions: { ...state.factions, [action.payload.factionId]: Math.max(0, Math.min(100, currentFaction + action.payload.amount)) } };
    
// --- THREAT AND HEALTH MODIFIERS ---
    case 'MODIFY_HUMANITY': {
      let humanityChange = action.payload;

      // YOKAI UTILITY: OPERATIVE CARE (e.g., Baku)
      // If the operative is resting/gaining humanity, the Baku consumes nightmares to boost the heal by +15.
      if (humanityChange > 0 && state.tetheredYokai.includes('yokai_baku')) {
        humanityChange += 15;
      }

      return { 
        ...state, 
        humanity: Math.min(100, Math.max(0, state.humanity + humanityChange)) 
      };
    }
      
    case 'MODIFY_GLOBAL_ENTROPY':
      // The Doomsday Clock: Only ticks up on massive failures
      return { ...state, globalEntropy: Math.min(100, state.globalEntropy + action.payload) };

    case 'ADVANCE_TIME': {
      // Time passes. The world gets worse. 
      // This loops through every sector you have visited/tracked and raises its heat.
      const updatedSectorEntropy = { ...state.sectorEntropy };
      Object.keys(updatedSectorEntropy).forEach(nodeId => {
        updatedSectorEntropy[nodeId] = Math.min(100, updatedSectorEntropy[nodeId] + action.payload);
      });
      return { ...state, sectorEntropy: updatedSectorEntropy };
    }

    case 'MODIFY_SECTOR_ENTROPY': {
      const nodeId = action.payload.nodeId || state.currentNode;
      let heatSpike = action.payload.amount;

      // YOKAI UTILITY: INFILTRATION (e.g., Kitsune)
      // If heat is increasing, and the operative has the stealth Shikigami bound, reduce the spike by 25%.
      if (heatSpike > 0 && state.tetheredYokai.includes('yokai_kitsune')) {
        heatSpike = Math.max(1, Math.floor(heatSpike * 0.75)); 
      }

      const currentHeat = state.sectorEntropy[nodeId] || 0;
      const newHeat = Math.min(100, Math.max(0, currentHeat + heatSpike));

      return {
        ...state,
        sectorEntropy: { ...state.sectorEntropy, [nodeId]: newHeat }
      };
    }

    case 'ADD_LEAD':
      if (state.activeLeads.find(l => l.id === action.payload.id)) return state;
      return { ...state, activeLeads: [...state.activeLeads, { ...action.payload, resolved: false }] };
    case 'SET_FLAG':
      return { ...state, flags: { ...state.flags, [action.payload.flagId]: action.payload.value } };
    case 'RESOLVE_LEAD':
      return { ...state, activeLeads: state.activeLeads.map(lead => lead.id === action.payload ? { ...lead, resolved: true } : lead ) };
    
    // --- SYSTEM ACTIONS ---
    case 'LOAD_GAME':
      return action.payload;
    case 'RESET_GAME':
      return initialGameState;
    default:
      return state;
  }
}