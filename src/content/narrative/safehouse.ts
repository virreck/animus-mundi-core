// src/content/narrative/safehouse.ts
import type { GameState } from '../../engine/state';
import type { GameAction } from '../../engine/reducer';

export const safehouse = {
  title: "OPERATIVE SAFEHOUSE",
  
  text: (state: GameState) => {
    return `Operative ${state.playerName.toUpperCase()}, the conceptual static finally drops. The heavy brass warding of this Nocturnal Syndicate safehouse blocks both Goetian influence and Malleus radio direction finders. You pull off the AR visor. This is a place to synthesize catalysts, analyze data, and realign your Tether before deploying back into the hot zone.`;
  },
  
  choices: [

    // --- DEV DEBUG: INSTANTLY GRANT ENDGAME REQUIREMENTS ---
    {
      id: "debug_endgame",
      label: "[DEV_TOOLS]: GRANT MURMUR INTEL & CATALYSTS",
      condition: (state: GameState) => !state.intelLog.includes('necrotic_stasis'),
      actions: [
        { type: 'GATHER_INTEL', payload: 'necrotic_stasis' },
        { type: 'GATHER_INTEL', payload: 'thermal_scorching' },
        { type: 'GATHER_INTEL', payload: 'amphibian_biology' },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'cold_iron_filings', amount: 1 } },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 5 } }
      ] as GameAction[]
    },

    // --- LOOP 1: THE HEARTH (Rest) ---
    {
      id: "safehouse_rest",
      label: "RESTORE TETHER ALIGNMENT (+30 HUMANITY, ADVANCES TIME)",
      condition: (state: GameState) => state.humanity < 100,
      actions: [
        { type: 'MODIFY_HUMANITY', payload: 30 },
        { type: 'ADVANCE_TIME', payload: 5 }
      ] as GameAction[]
    },

    // --- LOOP 2: ALTAR OF SYNTHESIS (Crafting) ---
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
    {
      id: "decrypt_comms",
      label: "DECRYPT INQUISITION COMMS (-15 OBOLS, ADVANCES TIME)",
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