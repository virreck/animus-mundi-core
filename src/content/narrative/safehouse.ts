// src/content/narrative/safehouse.ts
import type { GameState } from '../../engine/state';
import type { GameAction } from '../../engine/reducer';

export const safehouse = {
  get title() {
    return "OPERATIVE SAFEHOUSE";
  },
  
  get text() {
    return "{playerName}, the logic fog cannot penetrate the heavy brass warding of your sanctuary. The hum of the Thaumaturgic OS servers provides a steady, grounding rhythm. This is a place to synthesize catalysts, analyze data, and realign your tether before deploying back into the chaos.";
  },
  
  choices: [
    // --- LOOP 1: THE HEARTH (Rest) ---
    // Trades Global Entropy for Humanity.
    {
      id: "safehouse_rest",
      label: "RESTORE TETHER ALIGNMENT (+30 HUMANITY, +5% GLOBAL ENTROPY)",
      condition: (state: GameState) => state.humanity < 100,
      actions: [
        { type: 'MODIFY_HUMANITY', payload: 30 },
        { type: 'ADVANCE_TIME', payload: 5 }
      ] as GameAction[]
    },

    // --- LOOP 2: ALTAR OF SYNTHESIS (Crafting) ---
    // Converts raw materials into Sealing Catalysts. 
    // This choice ONLY appears if they have the exact right ingredients.
    {
      id: "craft_cold_iron",
      label: "SYNTHESIZE: COLD IRON FILINGS (-10 OBOLS, -1 RAW IRON)",
      condition: (state: GameState) => 
        (state.inventory['obols'] || 0) >= 10 && 
        (state.inventory['raw_iron'] || 0) >= 1,
      actions: [
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'raw_iron', amount: -1 } },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'cold_iron_filings', amount: 1 } }
      ] as GameAction[]
    },

    // --- LOOP 3: INTEL DECRYPTION (Research) ---
    // Allows the player to buy Intel safely with Obols and Time, rather than risking the field.
    {
      id: "decrypt_comms",
      label: "DECRYPT M.I. COMMS (-15 OBOLS, +10% GLOBAL ENTROPY)",
      condition: (state: GameState) => 
        (state.inventory['obols'] || 0) >= 15 && 
        !state.intelLog.includes('malleus_patrol_routes'),
      actions: [
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -15 } },
        { type: 'ADVANCE_TIME', payload: 10 },
        { type: 'GATHER_INTEL', payload: 'malleus_patrol_routes' }
      ] as GameAction[]
    },

    // --- LOOP 4: REMOTE WARDING (Sector Triage) ---
    // Burns resources to lower the heat in a specific sector so the player can return to it.
    {
      id: "ward_churchyard",
      label: "REMOTE WARDING: ST. LAWRENCE CHURCHYARD (-20 OBOLS, -25% SECTOR HEAT)",
      condition: (state: GameState) => 
        (state.inventory['obols'] || 0) >= 20 && 
        (state.sectorEntropy['caterham_churchyard'] || 0) > 0,
      actions: [
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -20 } },
        { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: 'caterham_churchyard', amount: -25 } }
      ] as GameAction[]
    }
  ]
};