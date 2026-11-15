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
import type { SectorContract } from './sectorGenerator';
import { advanceWorld, applyCampaignMilestones, releaseDemon, TIME_UNITS_PER_TICK } from './world';
import { isTraining } from './tutorial';
import {
  addBond, applySectorClosures, departOffended, getMaxCharges, isBondThree, renewPact, whyCannotBind, KAGE_TUNING
} from './kage';

export type GameAction =
  | { type: 'START_INVESTIGATION'; payload: { name: string; portrait: string; agency: string } }
  | { type: 'TRAVEL'; payload: string }
  | { type: 'GATHER_INTEL'; payload: string }
  | { type: 'MODIFY_INVENTORY'; payload: { itemId: string; amount: number } }
  | { type: 'IDENTIFY_GOETIA'; payload: string }
  | { type: 'SEAL_GOETIA'; payload: string }
  | { type: 'RELEASE_GOETIA'; payload: { goetiaId: string; sectorId: string } }
  | { type: 'DRAFT_CONTRACT'; payload: { yokaiId: string; costs: ContractCost; maxCharges?: number } }
  | { type: 'UNBIND_YOKAI'; payload: string }
  | { type: 'CONSUME_YOKAI_CHARGE'; payload: { yokaiId: string; maxCharges?: number } }
  | { type: 'BREAK_PACT'; payload: string }
  | { type: 'RENEW_PACT'; payload: string }
  | { type: 'ADD_BOND'; payload: { yokaiId: string; amount: number } }
  | { type: 'MODIFY_FACTION'; payload: { factionId: string; amount: number } }
  | { type: 'MODIFY_HUMANITY'; payload: number }
  | { type: 'MODIFY_INK'; payload: number }
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
  | { type: 'SET_CONTRACTS'; payload: Record<string, SectorContract> }
  /** Functional update of the contracts map, always applied to the latest state. */
  | { type: 'UPDATE_CONTRACTS'; payload: (prev: Record<string, SectorContract>) => Record<string, SectorContract> }
  | { type: 'ACK_NOTICES'; payload: number[] }
  | { type: 'RESET_GAME' };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function setTether(state: GameState, tether: string[]): GameState {
  // Keep the legacy `activeContracts` mirror in sync so old code paths / saves don't break
  return { ...state, tetheredYokai: tether, activeContracts: tether };
}

type ActionOf<K extends GameAction['type']> = Extract<GameAction, { type: K }>;
type Handler<K extends GameAction['type']> = (state: GameState, action: ActionOf<K>) => GameState;

const hasYokai = (state: GameState, yokaiId: string) => (state.tetheredYokai || []).includes(yokaiId);
const spendObols = (state: GameState, amount: number) => ({ ...state.inventory, obols: Math.max(0, (state.inventory.obols || 0) - amount) });

// ---------------------------------------------------------------------------
// MOVEMENT & TIME
// ---------------------------------------------------------------------------
const travel: Handler<'TRAVEL'> = (state, action) => {
  // YOKAI INTERCEPTOR: Tengu (Safe Travel): no travel heat, but an Obol toll (5, or 2 at Bond III)
  const isTengu = hasYokai(state, 'yokai_tengu');
  const heatPenalty = isTengu ? 0 : 10;
  let obolCost = 0;
  if (isTengu) obolCost = isBondThree(state, 'yokai_tengu') ? 2 : 5;

  const nodeId = action.payload;
  const currentSectorEntropy = state.sectorEntropy[nodeId] || 0;

  // Each trip is one tick of world time: anchors elsewhere ripen, manifested demons spread
  return advanceWorld({
    ...state,
    currentNode: nodeId,
    sectorEntropy: { ...state.sectorEntropy, [nodeId]: Math.min(100, currentSectorEntropy + heatPenalty) },
    inventory: spendObols(state, obolCost)
  }, 1, nodeId);
};

const advanceTime: Handler<'ADVANCE_TIME'> = (state, action) => {
  let timeAmount = action.payload;
  let obolDrain = 0;
  // YOKAI INTERCEPTOR: Baku (Double time cost & 10 Obol drain when resting/passing time)
  if (hasYokai(state, 'yokai_baku')) {
    timeAmount *= 2;
    obolDrain = isBondThree(state, 'yokai_baku') ? 5 : 10;
  }
  const updatedSectorEntropy = { ...state.sectorEntropy };
  Object.keys(updatedSectorEntropy).forEach(nodeId => {
    updatedSectorEntropy[nodeId] = Math.min(100, updatedSectorEntropy[nodeId] + timeAmount);
  });
  return advanceWorld({
    ...state,
    sectorEntropy: updatedSectorEntropy,
    inventory: spendObols(state, obolDrain)
  }, Math.round(timeAmount / TIME_UNITS_PER_TICK));
};

const restAtSafehouse: Handler<'REST_AT_SAFEHOUSE'> = (state, action) => {
  const maxHumanity = getMaxHumanity(state);
  // ADVANCE_TIME applies Baku's double-time + Obol toll
  const afterTime = advanceTime(state, { type: 'ADVANCE_TIME', payload: action.payload.time });
  // YOKAI INTERCEPTOR: Baku fully restores Humanity — but only when resting
  const healed = hasYokai(state, 'yokai_baku') ? maxHumanity : afterTime.humanity + action.payload.heal;
  return { ...afterTime, humanity: clamp(healed, 0, maxHumanity) };
};

// ---------------------------------------------------------------------------
// INVENTORY, SPIRITS & CASE FILES
// ---------------------------------------------------------------------------
const modifyInventory: Handler<'MODIFY_INVENTORY'> = (state, action) => {
  const { itemId, amount } = action.payload;
  // YOKAI INTERCEPTOR: Zashiki-warashi (Obol Generation)
  const bonus = itemId === 'obols' && amount > 0 && hasYokai(state, 'yokai_zashiki') ? 3 : 0;
  const currentAmt = state.inventory[itemId] || 0;
  return { ...state, inventory: { ...state.inventory, [itemId]: Math.max(0, currentAmt + amount + bonus) } };
};

const sealGoetia: Handler<'SEAL_GOETIA'> = (state, action) => {
  if (state.sealedGoetia.includes(action.payload) || state.releasedGoetia.includes(action.payload)) return state;
  return { ...state, sealedGoetia: [...state.sealedGoetia, action.payload] };
};

// ---------------------------------------------------------------------------
// YOKAI PACTS (KAGE NO SHO)
// ---------------------------------------------------------------------------
const draftContract: Handler<'DRAFT_CONTRACT'> = (state, action) => {
  const { yokaiId, costs } = action.payload;
  const activeYokai = state.tetheredYokai || [];
  if (activeYokai.includes(yokaiId)) return state;
  // KAGE NO SHO: only written pages can be bound, and offended spirits refuse
  const block = whyCannotBind(state, yokaiId);
  if (block === 'UNWRITTEN' || block === 'OFFENDED') return state;
  const maxCharges = getMaxCharges(state, yokaiId);

  // THE RULE OF TWO: If you have 2 Yokai, drop the oldest one to make room
  const newTether = [...activeYokai, yokaiId];
  const dropped = newTether.length > 2 ? newTether.shift() : undefined;

  const yokaiCharges = { ...state.yokaiCharges };
  if (dropped) delete yokaiCharges[dropped];
  yokaiCharges[yokaiId] = maxCharges;

  const next = setTether(state, newTether);
  const inventory = { ...state.inventory };
  if (costs.obols) inventory.obols = Math.max(0, (state.inventory.obols || 0) - costs.obols);
  if (costs.tributeItemId) inventory[costs.tributeItemId] = Math.max(0, (state.inventory[costs.tributeItemId] || 0) - 1);
  return {
    ...next,
    yokaiCharges,
    humanity: clamp(state.humanity - (costs.humanity || 0), 0, getMaxHumanity(next)),
    ink: Math.max(0, (state.ink || 0) - (costs.ink || 0)),
    inventory
  };
};

const unbindYokai: Handler<'UNBIND_YOKAI'> = (state, action) => {
  if (!hasYokai(state, action.payload)) return state;
  const yokaiCharges = { ...state.yokaiCharges };
  delete yokaiCharges[action.payload];
  return { ...setTether(state, state.tetheredYokai.filter(id => id !== action.payload)), yokaiCharges };
};

const consumeYokaiCharge: Handler<'CONSUME_YOKAI_CHARGE'> = (state, action) => {
  const { yokaiId } = action.payload;
  const remaining = (state.yokaiCharges[yokaiId] ?? getMaxCharges(state, yokaiId)) - 1;
  const bonded = addBond(state, yokaiId, KAGE_TUNING.bondPerInvocation);
  // Burned dry: the daemon leaves, briefly offended
  if (remaining <= 0) return departOffended(bonded, yokaiId, KAGE_TUNING.burnedDryOffense, KAGE_TUNING.burnedDryBondLoss);
  return { ...bonded, yokaiCharges: { ...bonded.yokaiCharges, [yokaiId]: remaining } };
};

const breakPact: Handler<'BREAK_PACT'> = (state, action) => {
  // Severing a pact by hand while it still has charges offends the spirit for longer
  if (!hasYokai(state, action.payload)) return state;
  const charges = state.yokaiCharges[action.payload] ?? getMaxCharges(state, action.payload);
  if (charges <= 0) return unbindYokai(state, { type: 'UNBIND_YOKAI', payload: action.payload });
  return departOffended(state, action.payload, KAGE_TUNING.brokenPactOffense, KAGE_TUNING.brokenPactBondLoss);
};

// ---------------------------------------------------------------------------
// THREATS
// ---------------------------------------------------------------------------
const modifyHumanity: Handler<'MODIFY_HUMANITY'> = (state, action) => {
  let humanityChange = action.payload;
  let extraHeat = 0;
  // YOKAI INTERCEPTOR: Noppera-bō halves damage, but the world rejects the faceless illusion (+Heat)
  if (humanityChange < 0 && hasYokai(state, 'yokai_noppera')) {
    humanityChange = Math.ceil(humanityChange * 0.5);
    extraHeat = isBondThree(state, 'yokai_noppera') ? 2 : 5;
  }
  const next = { ...state, humanity: clamp(state.humanity + humanityChange, 0, getMaxHumanity(state)) };
  if (extraHeat === 0) return next;
  const currentHeat = next.sectorEntropy[next.currentNode] || 0;
  return { ...next, sectorEntropy: { ...next.sectorEntropy, [next.currentNode]: Math.min(100, currentHeat + extraHeat) } };
};

/** Yokai interceptors on a rise in global entropy: Kamaitachi amplifies it, Amabie buys it off. */
function interceptEntropySpike(state: GameState, spike: number): { change: number; toll: number } {
  let change = spike;
  // YOKAI INTERCEPTOR: Kamaitachi (Doubles failure penalty)
  if (hasYokai(state, 'yokai_kamaitachi')) change *= isBondThree(state, 'yokai_kamaitachi') ? 1.5 : 2;
  // YOKAI INTERCEPTOR: Amabie (Ritual Failure Protection)
  if (!hasYokai(state, 'yokai_amabie')) return { change, toll: 0 };
  const toll = isBondThree(state, 'yokai_amabie') ? 10 : 15;
  // Pay the toll and the spike is nullified; can't pay, and the Tether snaps (game over)
  return (state.inventory.obols || 0) >= toll ? { change: 0, toll } : { change: ENTROPY_CEILING, toll: 0 };
}

const modifyGlobalEntropy: Handler<'MODIFY_GLOBAL_ENTROPY'> = (state, action) => {
  const { change, toll } = action.payload > 0 ? interceptEntropySpike(state, action.payload) : { change: action.payload, toll: 0 };
  return {
    ...state,
    globalEntropy: clamp(state.globalEntropy + change, 0, ENTROPY_CEILING),
    inventory: spendObols(state, toll)
  };
};

const addMicroEntropy: Handler<'ADD_MICRO_ENTROPY'> = (state, action) => {
  // Ambient drift: never touched by Yokai interceptors. Negative values first
  // drain the drift pool, then the main entropy pool.
  const next = +((state.microEntropy || 0) + action.payload).toFixed(2);
  if (next >= 0) return { ...state, microEntropy: next };
  return { ...state, microEntropy: 0, globalEntropy: Math.max(0, +(state.globalEntropy + next).toFixed(2)) };
};

const modifySectorEntropy: Handler<'MODIFY_SECTOR_ENTROPY'> = (state, action) => {
  const { nodeId, amount } = action.payload;
  const targetNode = nodeId || state.currentNode;
  let heatSpike = amount;
  let humanityDrain = 0;
  // YOKAI INTERCEPTOR: Kitsune Mask (50% Heat Reduction), at the price of a little sanity
  if (heatSpike > 0 && hasYokai(state, 'yokai_kitsune')) {
    heatSpike = Math.max(1, Math.floor(heatSpike * 0.5));
    humanityDrain = isBondThree(state, 'yokai_kitsune') ? 1 : 2;
  }
  const currentSectorEntropy = state.sectorEntropy[targetNode] || 0;
  return {
    ...state,
    sectorEntropy: { ...state.sectorEntropy, [targetNode]: clamp(currentSectorEntropy + heatSpike, 0, 100) },
    humanity: Math.max(0, state.humanity - humanityDrain)
  };
};

// ---------------------------------------------------------------------------
// DISPATCH TABLE
// ---------------------------------------------------------------------------
const HANDLERS: { [K in GameAction['type']]: Handler<K> } = {
  START_INVESTIGATION: (state, a) => ({ ...state, gameStage: 'ACTIVE', playerName: a.payload.name, playerPortrait: a.payload.portrait, agencyName: a.payload.agency }),
  TRAVEL: travel,
  SET_CURRENT_NODE: (state, a) => ({ ...state, currentNode: a.payload }),
  GATHER_INTEL: (state, a) => (state.intelLog.includes(a.payload) ? state : { ...state, intelLog: [...state.intelLog, a.payload] }),
  MODIFY_INVENTORY: modifyInventory,
  IDENTIFY_GOETIA: (state, a) => (state.identifiedGoetia.includes(a.payload) ? state : { ...state, identifiedGoetia: [...state.identifiedGoetia, a.payload] }),
  SEAL_GOETIA: sealGoetia,
  // A failed Sealing Rite: the demon manifests permanently and its sector is lost.
  RELEASE_GOETIA: (state, a) => releaseDemon(state, a.payload.goetiaId, a.payload.sectorId),
  SET_CONTRACTS: (state, a) => ({ ...state, contracts: a.payload }),
  UPDATE_CONTRACTS: (state, a) => ({ ...state, contracts: a.payload(state.contracts || {}) }),
  ACK_NOTICES: (state, a) => ({ ...state, notices: state.notices.filter(n => !a.payload.includes(n.id)) }),
  DRAFT_CONTRACT: draftContract,
  UNBIND_YOKAI: unbindYokai,
  CONSUME_YOKAI_CHARGE: consumeYokaiCharge,
  BREAK_PACT: breakPact,
  RENEW_PACT: (state, a) => renewPact(state, a.payload),
  ADD_BOND: (state, a) => addBond(state, a.payload.yokaiId, a.payload.amount),
  MODIFY_FACTION: (state, a) => {
    const current = state.factions[a.payload.factionId] ?? 50;
    return { ...state, factions: { ...state.factions, [a.payload.factionId]: clamp(current + a.payload.amount, 0, 100) } };
  },
  MODIFY_HUMANITY: modifyHumanity,
  MODIFY_INK: (state, a) => ({ ...state, ink: Math.max(0, (state.ink || 0) + a.payload) }),
  REST_AT_SAFEHOUSE: restAtSafehouse,
  MODIFY_GLOBAL_ENTROPY: modifyGlobalEntropy,
  ADD_MICRO_ENTROPY: addMicroEntropy,
  ADVANCE_TIME: advanceTime,
  MODIFY_SECTOR_ENTROPY: modifySectorEntropy,
  SET_ATTUNED_SECTOR: (state, a) => ({ ...state, attunedSectors: { ...state.attunedSectors, [a.payload]: true } }),
  SET_DEDUCED_SIGNS: (state, a) => ({ ...state, deducedSigns: a.payload }),
  ADD_LEAD: (state, a) => {
    const currentLeads = state.activeLeads || []; // Safety net for old saves!
    if (currentLeads.some(l => l.id === a.payload.id)) return state;
    return { ...state, activeLeads: [...currentLeads, { ...a.payload, resolved: false }] };
  },
  RESOLVE_LEAD: (state, a) => ({
    ...state,
    activeLeads: (state.activeLeads || []).map(lead => (lead.id === a.payload ? { ...lead, resolved: true } : lead))
  }),
  SET_FLAG: (state, a) => ({ ...state, flags: { ...state.flags, [a.payload.flagId]: a.payload.value } }),
  // --- SYSTEM ACTIONS ---
  LOAD_GAME: (_state, a) => normalizeLoadedState(a.payload),
  EXIT_TO_MENU: state => ({ ...state, gameStage: 'START_SCREEN' }),
  RESET_GAME: () => initialGameState
};

function baseReducer(state: GameState, action: GameAction): GameState {
  const handler = HANDLERS[action.type] as Handler<GameAction['type']> | undefined;
  return handler ? handler(state, action as never) : state;
}

/** Main reducer: applies the action, then checks whether the run has ended. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Sector closures feed the KAGE NO SHO (bonds, tributes, offended spirits cooling off)
  // ...and the long campaign (cases closed, the full Lesser Key)
  const next = applyCampaignMilestones(state, applySectorClosures(state, baseReducer(state, action)));
  if (
    next.gameStage === 'ACTIVE' &&
    !isTraining(next) && // the guided case never ends the run (its game-over screen would wipe the real save)
    (next.humanity <= HUMANITY_FLOOR || getTotalGlobalEntropy(next) >= ENTROPY_CEILING)
  ) {
    return { ...next, gameStage: 'GAME_OVER' };
  }
  return next;
}
