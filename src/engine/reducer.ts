// src/engine/reducer.ts
import {
  type GameState,
  initialGameState,
  normalizeLoadedState,
  getMaxHumanity,
  getTotalGlobalEntropy,
  HUMANITY_FLOOR,
  ENTROPY_CEILING
} from './state';
import type { ContractCost } from '../content/yokai/types';

export type GameAction =
  | { type: 'START_INVESTIGATION'; payload: { name: string; portrait: string; agency: string } }
  | { type: 'TRAVEL'; payload: string }
  | { type: 'GATHER_INTEL'; payload: string }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: string; amount: number } }
  | { type: 'IDENTIFY_GOETIA'; payload: string }
  | { type: 'SEAL_GOETIA'; payload: string }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: string; costs: ContractCost; maxCharges?: number } }
  | { type: 'UNBIND_YOKAI'; payload: string }
  | { type: 'CONSUME_YOKAI_CHARGE'; payload: { yokaiId: string; maxCharges: number } }
  | { type: 'MODIFY_FACTION'; payload: { factionId: string; amount: number } }
  | { type: 'MODIFY_HUMANITY'; payload: number }
  | { type: 'REST_AT_SAFEHOUSE'; payload: { heal: number; time: number } }
  | { type: 'ADD_LEAD'; payload: { id: string; text: string } }
  | { type: 'SET_FLAG'; payload: { flagId: string; value: boolean } }
  | { type: 'RESOLVE_LEAD'; payload: string }
  | { type: 'ADVANCE_TIME'; payload: number }
  | { type: 'MODIFY_GLOBAL_ENTROPY'; payload: number }
  | { type: 'ADD_MICRO_ENTROPY'; payload: number }
  | { type: 'MODIFY_SECTOR_ENTROPY'; payload: { nodeId: string; amount: number } }
  | { type: 'SET_ATTUNED_SECTOR'; payload: string }
  | { type: 'SET_DEDUCED_SIGNS'; payload: string[] }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'SET_CURRENT_NODE'; payload: string }
  | { type: 'EXIT_TO_MENU' }
  | { type: 'RESET_GAME' };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function setTether(state: GameState, tether: string[]): GameState {
  // Keep the legacy `activeContracts` mirror in sync so old code paths / saves don't break
  return { ...state, tetheredYokai: tether, activeContracts: tether };
}

function baseReducer(state: GameState, action: GameAction): GameState {
  const activeYokai = state.tetheredYokai || [];
  const maxHumanity = getMaxHumanity(state);

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

    case 'SET_CURRENT_NODE':
      return { ...state, currentNode: action.payload };

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
      const { yokaiId, costs, maxCharges } = action.payload;
      if (activeYokai.includes(yokaiId)) return state;

      // THE RULE OF TWO: If you have 2 Yokai, drop the oldest one to make room
      const newTether = [...activeYokai, yokaiId];
      const dropped = newTether.length > 2 ? newTether.shift() : undefined;

      const yokaiCharges = { ...state.yokaiCharges };
      if (dropped) delete yokaiCharges[dropped];
      if (maxCharges !== undefined) yokaiCharges[yokaiId] = maxCharges;

      const next = setTether(state, newTether);
      return {
        ...next,
        yokaiCharges,
        humanity: clamp(state.humanity - (costs.humanity || 0), 0, getMaxHumanity(next)),
        ink: Math.max(0, (state.ink || 0) - (costs.ink || 0)),
        inventory: {
          ...state.inventory,
          ...(costs.obols ? { obols: Math.max(0, (state.inventory.obols || 0) - costs.obols) } : {}),
          ...(costs.tributeItemId ? { [costs.tributeItemId]: Math.max(0, (state.inventory[costs.tributeItemId] || 0) - 1) } : {})
        }
      };
    }

    case 'UNBIND_YOKAI': {
      if (!activeYokai.includes(action.payload)) return state;
      const yokaiCharges = { ...state.yokaiCharges };
      delete yokaiCharges[action.payload];
      return { ...setTether(state, activeYokai.filter(id => id !== action.payload)), yokaiCharges };
    }

    case 'CONSUME_YOKAI_CHARGE': {
      const { yokaiId, maxCharges } = action.payload;
      const remaining = (state.yokaiCharges[yokaiId] ?? maxCharges) - 1;
      if (remaining <= 0) return baseReducer(state, { type: 'UNBIND_YOKAI', payload: yokaiId });
      return { ...state, yokaiCharges: { ...state.yokaiCharges, [yokaiId]: remaining } };
    }

    case 'MODIFY_FACTION': {
      const currentFaction = state.factions[action.payload.factionId] ?? 50;
      return { ...state, factions: { ...state.factions, [action.payload.factionId]: clamp(currentFaction + action.payload.amount, 0, 100) } };
    }

    // --- THREAT AND HEALTH MODIFIERS ---
    case 'MODIFY_HUMANITY': {
      let humanityChange = action.payload;
      let extraHeat = 0;

      // YOKAI INTERCEPTOR: Noppera-bō (Damage Reduction)
      if (humanityChange < 0 && activeYokai.includes('yokai_noppera')) {
        humanityChange = Math.ceil(humanityChange * 0.5); // Halves damage
        extraHeat = 5; // The world rejects the faceless illusion
      }

      const newState = {
        ...state,
        humanity: clamp(state.humanity + humanityChange, 0, maxHumanity)
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

    case 'REST_AT_SAFEHOUSE': {
      // ADVANCE_TIME applies Baku's double-time + Obol toll
      const afterTime = baseReducer(state, { type: 'ADVANCE_TIME', payload: action.payload.time });
      // YOKAI INTERCEPTOR: Baku fully restores Humanity — but only when resting
      const healed = activeYokai.includes('yokai_baku')
        ? maxHumanity
        : afterTime.humanity + action.payload.heal;
      return { ...afterTime, humanity: clamp(healed, 0, maxHumanity) };
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
            entropyChange = ENTROPY_CEILING; // Cannot pay the toll? The Tether snaps. Game over.
          }
        }
      }

      return {
        ...state,
        globalEntropy: clamp(state.globalEntropy + entropyChange, 0, ENTROPY_CEILING),
        inventory: {
          ...state.inventory,
          obols: Math.max(0, (state.inventory.obols || 0) - obolDrain)
        }
      };
    }

    case 'ADD_MICRO_ENTROPY': {
      // Ambient drift: never touched by Yokai interceptors. Negative values first
      // drain the drift pool, then the main entropy pool.
      const next = +((state.microEntropy || 0) + action.payload).toFixed(2);
      if (next >= 0) return { ...state, microEntropy: next };
      return {
        ...state,
        microEntropy: 0,
        globalEntropy: Math.max(0, +(state.globalEntropy + next).toFixed(2))
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
          [targetNode]: clamp(currentSectorEntropy + heatSpike, 0, 100)
        },
        humanity: Math.max(0, state.humanity - humanityDrain)
      };
    }

    case 'SET_ATTUNED_SECTOR':
      return { ...state, attunedSectors: { ...state.attunedSectors, [action.payload]: true } };

    case 'SET_DEDUCED_SIGNS':
      return { ...state, deducedSigns: action.payload };

    case 'ADD_LEAD': {
      const currentLeads = state.activeLeads || []; // Safety net for old saves!
      if (currentLeads.find(l => l.id === action.payload.id)) return state;
      return { ...state, activeLeads: [...currentLeads, { ...action.payload, resolved: false }] };
    }
    case 'RESOLVE_LEAD': {
      const currentLeads = state.activeLeads || []; // Safety net for old saves!
      return {
        ...state,
        activeLeads: currentLeads.map(lead => lead.id === action.payload ? { ...lead, resolved: true } : lead)
      };
    }
    case 'SET_FLAG':
      return { ...state, flags: { ...state.flags, [action.payload.flagId]: action.payload.value } };

    // --- SYSTEM ACTIONS ---
    case 'LOAD_GAME':
      return normalizeLoadedState(action.payload);
    case 'EXIT_TO_MENU':
      return { ...state, gameStage: 'START_SCREEN' };
    case 'RESET_GAME':
      return initialGameState;
    default:
      return state;
  }
}

/** Main reducer: applies the action, then checks whether the run has ended. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = baseReducer(state, action);
  if (
    next.gameStage === 'ACTIVE' &&
    (next.humanity <= HUMANITY_FLOOR || getTotalGlobalEntropy(next) >= ENTROPY_CEILING)
  ) {
    return { ...next, gameStage: 'GAME_OVER' };
  }
  return next;
}
