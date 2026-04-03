// src/content/narrative/caterham_churchyard.ts
import type { GameState } from '../../engine/state';
import type { GameAction } from '../../engine/reducer';

export const caterhamChurchyard = {
  title: "ST. LAWRENCE CHURCHYARD",
  
  text: (state: GameState) => {
    if (state.flags['churchyard_cleared']) {
      return "The heavy iron spikes you drove into the crypt floor hold fast. The supply line of chaotic fuel is severed. The Inquisition cruisers are already starting to pack up their barricades as the localized tension in the air evaporates. It's time to follow the supply chain to its destination.";
    }

    if (state.flags['churchyard_crypt_opened']) {
      return "You bypass the Malleus perimeter and slip into the Macabre Crypt. The heavy stone slabs haven't just been moved; they've been shattered from the inside out. The air is thick with the smell of sulfur and turned earth. The bodies are gone.";
    }

    if (state.flags['churchyard_wards_inspected']) {
      return "You crouch by the breached iron fence, keeping out of sight of the Inquisition floodlights. The iron bars haven't been cut—they've rapidly oxidized and rusted to dust. Standard Goetic entry tactic. Whatever breached this line was dragging heavy, physical cargo out of the older graves.";
    }

    return "The historic grounds of St. Lawrence are bathed in the harsh blue and red flashes of Malleus Inquisition cruisers. It's an active esoteric crime scene. The eastern perimeter is taped off, and armored hounds are sweeping the tombstones. The local constabulary looks terrified.";
  },
  
  choices: [
    {
      id: "inspect_wards",
      label: "FORENSIC ANALYSIS: THE BREACHED FENCE (TIME PASSES)",
      condition: (state: GameState) => !state.flags['churchyard_wards_inspected'],
      actions: [
        { type: 'SET_FLAG', payload: { flagId: 'churchyard_wards_inspected', value: true } },
        { type: 'ADVANCE_TIME', payload: 2 },
        { type: 'GATHER_INTEL', payload: 'weapon_decay' }
      ] as GameAction[]
    },
    {
      id: "follow_trail",
      label: "INFILTRATE THE MACABRE CRYPT (+15 SECTOR HEAT)",
      condition: (state: GameState) => 
        state.flags['churchyard_wards_inspected'] && 
        !state.flags['churchyard_crypt_opened'],
      actions: [
        { type: 'SET_FLAG', payload: { flagId: 'churchyard_crypt_opened', value: true } },
        { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: 'caterham_churchyard', amount: 15 } },
        { type: 'ADVANCE_TIME', payload: 3 },
        { type: 'GATHER_INTEL', payload: 'corpse_theft' }
      ] as GameAction[]
    },
    {
      id: "enter_crypt",
      label: "SABOTAGE THE ANCHOR POINT (-1 COLD IRON, -5 HUMANITY)",
      condition: (state: GameState) => 
        state.flags['churchyard_crypt_opened'] && 
        !state.flags['churchyard_cleared'] &&
        (state.inventory['cold_iron_filings'] || 0) >= 1,
      actions: [
        { type: 'MODIFY_HUMANITY', payload: -5 },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'cold_iron_filings', amount: -1 } },
        { type: 'SET_FLAG', payload: { flagId: 'churchyard_cleared', value: true } },
        
        // The Loot
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 12 } },
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'grave_dust', amount: 1 } },
        
        // The Next Map Destination
        { type: 'ADD_LEAD', payload: { 
          id: 'asylum_trail', 
          text: 'The stolen corpses from the crypt were loaded onto trucks headed for the abandoned St. Lawrence Asylum.' 
        }}
      ] as GameAction[]
    },
    {
      id: "retreat_safehouse",
      label: "EXTRACT TO SAFEHOUSE (ADVANCES TIME)",
      condition: (state: GameState) => state.flags['churchyard_cleared'],
      actions: [
        { type: 'ADVANCE_TIME', payload: 4 },
        { type: 'SET_CURRENT_NODE', payload: 'safehouse' }
      ] as GameAction[]
    }
  ]
};