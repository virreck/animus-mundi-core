// src/content/narrative/caterham_churchyard.ts
import type { GameState } from '../../engine/state';
import type { GameAction } from '../../engine/reducer';

export const caterhamChurchyard = {
  title: "ST. LAWRENCE CHURCHYARD",
  
  // --- DYNAMIC REACTIVE NARRATIVE (SCENE REPLACEMENT) ---
  text: (state: GameState) => {
    
    // 3. Final State: The node is cleared.
    if (state.flags['churchyard_cleared']) {
      return "The oppressive fog has lifted from St. Lawrence. The mundane world has reasserted itself, leaving only the distant hum of the Caterham Bypass and the chill of a normal autumn night. The anomaly here has been resolved, but the Malleus will return soon to clean up the mess. It's time to move.";
    }

    // 2. Middle State: The crypt is open.
    if (state.flags['churchyard_crypt_opened']) {
      return "The heavy stone slab of the Macabre Crypt has been shoved aside, grinding deep grooves into the surrounding earth. A cold, damp abyss stares back at you from the open doorway. The thermal trail leads directly down into the dark.";
    }

    // 1. Initial Action: The wards are inspected.
    if (state.flags['churchyard_wards_inspected']) {
      return "You kneel by the shattered Malleus perimeter. The warding tape hasn't just been broken; the esoteric ink has been flash-boiled off the plastic. Whatever breached this line generates intense, localized thermal anomalies. It dragged something heavy into the mud toward the older, unmarked graves.";
    }

    // 0. Default State: Arriving for the first time.
    return "The historic grounds of St. Lawrence are choking in a preternatural, static-laced fog. Ancient yew trees loom in the peripheral vision like silent executioners. The Malleus Inquisition has cordoned off the eastern perimeter with hazard tape inscribed with Enochian wards, but something has violently torn through them from the inside out. The smell of petrichor and burnt copper is overwhelming.";
  },
  
  choices: [
    // --- STEP 1: INSTRUCTION (Gathering Lore) ---
    {
      id: "inspect_wards",
      label: "INSPECT THE SHATTERED MALLEUS WARDS",
      condition: (state: GameState) => !state.flags['churchyard_wards_inspected'],
      actions: [
        { type: 'SET_FLAG', payload: { flagId: 'churchyard_wards_inspected', value: true } },
        { type: 'ADVANCE_TIME', payload: 2 }
      ] as GameAction[]
    },

    // --- STEP 2: PROGRESSION & CONSEQUENCE (Applying the Lore) ---
    {
      id: "follow_trail",
      label: "TRACK THE THERMAL ANOMALY (+15 SECTOR HEAT)",
      condition: (state: GameState) => 
        state.flags['churchyard_wards_inspected'] && 
        !state.flags['churchyard_crypt_opened'],
      actions: [
        { type: 'SET_FLAG', payload: { flagId: 'churchyard_crypt_opened', value: true } },
        { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: 'caterham_churchyard', amount: 15 } },
        { type: 'ADVANCE_TIME', payload: 5 }
      ] as GameAction[]
    },

    // --- STEP 3: THE PAYOFF (Intel, Loot, and Leads) ---
    {
      id: "enter_crypt",
      label: "DESCEND INTO THE MACABRE CRYPT (-5 HUMANITY)",
      condition: (state: GameState) => 
        state.flags['churchyard_crypt_opened'] && 
        !state.flags['churchyard_cleared'],
      actions: [
        { type: 'MODIFY_HUMANITY', payload: -5 },
        { type: 'SET_FLAG', payload: { flagId: 'churchyard_cleared', value: true } },
        
        // The Loot
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 12 } },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'grave_dust', amount: 1 } },
        
        // The Codex Clue
        { type: 'GATHER_INTEL', payload: 'thermal_scorching' },
        
        // The Next Map Destination!
        { type: 'ADD_LEAD', payload: { 
          id: 'asylum_trail', 
          text: 'The crypt tunnel collapsed, but the residual thermal signatures point directly toward the ruins of the old St. Lawrence Asylum up the hill.' 
        }}
      ] as GameAction[]
    }
  ]
};