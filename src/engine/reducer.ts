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
  // Helper to ensure backward compatibility with your state arrays
  const activeYokai = state.tetheredYokai || state.activeContracts || [];
  
  // Zashiki-warashi permanently lowers your max humanity
  const maxHumanity = activeYokai.includes('yokai_zashiki') ? 85 : 100;

  switch (action.type) {
    case 'START_INVESTIGATION':
      return { ...state, gameStage: 'ACTIVE', playerName: action.payload.name, playerPortrait: action.payload.portrait, agencyName: action.payload.agency };
    
    case 'TRAVEL': {
      // YOKAI INTERCEPTOR: Tengu (Safe Travel)
      const isTengu = activeYokai.includes('yokai_tengu');
      const heatPenalty = isTengu ? 0 : 10; // Tengu nullifies travel heat
      const obolCost = isTengu ? 5 : 0;     // Tengu demands 5 Obols per trip

      const nodeId = action.payload;
      const currentSectorEntropy = state.sectorEntropy[nodeId] || 0;

      return { 
        ...state, 
        currentNode: nodeId, 
        sectorEntropy: {
          ...state.sectorEntropy,
          [nodeId]: Math.min(100, currentSectorEntropy + heatPenalty)
        },
        inventory: {
          ...state.inventory,
          obols: Math.max(0, (state.inventory.obols || 0) - obolCost)
        }
      };
    }

    case 'GATHER_INTEL':
      if (state.intelLog.includes(action.payload)) return state;
      return { ...state, intelLog: [...state.intelLog, action.payload] };

    case 'MODIFY_INVENTORY': {
      const { itemId, amount } = action.payload;
      let finalAmount = amount;

      // YOKAI INTERCEPTOR: Zashiki-warashi (Obol Generation)
      if (itemId === 'obols' && amount > 0 && activeYokai.includes('yokai_zashiki')) {
        finalAmount += 3;
      }
      
      const currentAmt = state.inventory[itemId] || 0;
      return { 
        ...state, 
        inventory: { 
          ...state.inventory, 
          [itemId]: Math.max(0, currentAmt + finalAmount) 
        } 
      };
    }

    case 'IDENTIFY_GOETIA':
      if (state.identifiedGoetia.includes(action.payload)) return state;
      return { ...state, identifiedGoetia: [...state.identifiedGoetia, action.payload] };

    case 'SEAL_GOETIA':
      if (state.sealedGoetia.includes(action.payload)) return state;
      return { ...state, sealedGoetia: [...state.sealedGoetia, action.payload] };

    case 'DRAFT_CONTRACT': {
      const { yokaiId, costs } = action.payload;
      
      // THE RULE OF TWO: If you have 2 Yokai, drop the oldest one to make room
      const newTether = [...activeYokai, yokaiId];
      if (newTether.length > 2) newTether.shift(); 

      return {
        ...state,
        tetheredYokai: newTether,
        activeContracts: newTether, // Syncing both arrays to prevent legacy crashes
        humanity: state.humanity - (costs.humanity || 0),
        ink: (state.ink || 0) - (costs.ink || 0),
        inventory: {
          ...state.inventory,
          ...(costs.obols ? { obols: Math.max(0, (state.inventory.obols || 0) - costs.obols) } : {}),
          ...(costs.tributeItemId ? { [costs.tributeItemId]: Math.max(0, (state.inventory[costs.tributeItemId] || 0) - 1) } : {})
        }
      };
    }

    case 'MODIFY_FACTION': {
      const currentFaction = state.factions[action.payload.factionId] || 50;
      return { ...state, factions: { ...state.factions, [action.payload.factionId]: Math.max(0, Math.min(100, currentFaction + action.payload.amount)) } };
    }

    // --- THREAT AND HEALTH MODIFIERS ---
    case 'MODIFY_HUMANITY': {
      let humanityChange = action.payload;
      let extraHeat = 0;

      // YOKAI INTERCEPTOR: Baku (Healing Boost)
      if (humanityChange > 0 && activeYokai.includes('yokai_baku')) {
        humanityChange = 100; // Baku fully restores humanity
      }

      // YOKAI INTERCEPTOR: Noppera-bō (Damage Reduction)
      if (humanityChange < 0 && activeYokai.includes('yokai_noppera')) {
        humanityChange = Math.ceil(humanityChange * 0.5); // Halves damage
        extraHeat = 5; // The world rejects the faceless illusion
      }

      const newState = {
        ...state,
        humanity: Math.max(0, Math.min(maxHumanity, state.humanity + humanityChange))
      };

      if (extraHeat > 0) {
        const currentHeat = newState.sectorEntropy[newState.currentNode] || 0;
        newState.sectorEntropy = {
          ...newState.sectorEntropy,
          [newState.currentNode]: Math.min(100, currentHeat + extraHeat)
        };
      }

      return newState;
    }
      
    case 'MODIFY_GLOBAL_ENTROPY': {
      let entropyChange = action.payload;
      let obolDrain = 0;

      if (entropyChange > 0) {
        // YOKAI INTERCEPTOR: Kamaitachi (Doubles failure penalty)
        if (activeYokai.includes('yokai_kamaitachi')) {
          entropyChange *= 2;
        }

        // YOKAI INTERCEPTOR: Amabie (Ritual Failure Protection)
        if (activeYokai.includes('yokai_amabie')) {
          const currentObols = state.inventory.obols || 0;
          if (currentObols >= 15) {
            entropyChange = 0; // Nullify the spike!
            obolDrain = 15;    // Take the toll
          } else {
            entropyChange = 100; // Cannot pay the toll? The Tether snaps. Game over.
          }
        }
      }

      return {
        ...state,
        globalEntropy: Math.min(100, Math.max(0, state.globalEntropy + entropyChange)),
        inventory: {
          ...state.inventory,
          obols: Math.max(0, (state.inventory.obols || 0) - obolDrain)
        }
      };
    }

    case 'ADVANCE_TIME': {
      let timeAmount = action.payload;
      let obolDrain = 0;

      // YOKAI INTERCEPTOR: Baku (Double time cost & 10 Obol drain when resting/passing time)
      if (activeYokai.includes('yokai_baku')) {
        timeAmount *= 2;
        obolDrain = 10;
      }

      const updatedSectorEntropy = { ...state.sectorEntropy };
      Object.keys(updatedSectorEntropy).forEach(nodeId => {
        updatedSectorEntropy[nodeId] = Math.min(100, updatedSectorEntropy[nodeId] + timeAmount);
      });

      return { 
        ...state, 
        sectorEntropy: updatedSectorEntropy,
        inventory: {
          ...state.inventory,
          obols: Math.max(0, (state.inventory.obols || 0) - obolDrain)
        }
      };
    }

    case 'MODIFY_SECTOR_ENTROPY': {
      const { nodeId, amount } = action.payload;
      const targetNode = nodeId || state.currentNode;
      let heatSpike = amount;
      let humanityDrain = 0;

      // YOKAI INTERCEPTOR: Kitsune Mask (50% Heat Reduction)
      if (heatSpike > 0 && activeYokai.includes('yokai_kitsune')) {
        heatSpike = Math.max(1, Math.floor(heatSpike * 0.5));
        humanityDrain = 2; // The Kitsune drains your sanity
      }

      const currentSectorEntropy = state.sectorEntropy[targetNode] || 0;
      return {
        ...state,
        sectorEntropy: {
          ...state.sectorEntropy,
          [targetNode]: Math.min(100, Math.max(0, currentSectorEntropy + heatSpike))
        },
        humanity: Math.max(0, state.humanity - humanityDrain)
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