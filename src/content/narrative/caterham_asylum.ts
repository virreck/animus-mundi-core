// src/content/narrative/caterham_asylum.ts
import type { GameState } from '../../engine/state';
import type { GameAction } from '../../engine/reducer';

export const caterham_asylum_gates = {
  title: "ASYLUM PERIMETER",
  text: (state: GameState) => {
    if (state.flags['caterham_asylum_gates_inspect_wards_clicked']) {
      return "Your OS isolates the audio feed over the screaming crowd. You pick up a distinct, hoarse voice giving tactical commands from the asylum roof. The riot isn't random; it's being orchestrated to keep the authorities busy.";
    }
    return "The streets surrounding the Caterham Asylum are descending into total anarchy. The local constabulary has formed a riot line, completely overwhelmed by sudden, inexplicable violence from the local populace. The heavy wrought-iron gates to the asylum are shut tight, serving as the eye of the storm.";
  },
  choices: [
    {
      id: "inspect_wards",
      label: "AUDIO TRIAGE: ANALYZE THE RIOT (TIME PASSES)",
      condition: (state: GameState) => !state.flags['caterham_asylum_gates_inspect_wards_clicked'],
      actions: [
        { type: 'ADVANCE_TIME', payload: 2 },
        { type: 'GATHER_INTEL', payload: 'hoarse_voice' },
        { type: 'SET_FLAG', payload: { flagId: 'caterham_asylum_gates_inspect_wards_clicked', value: true } }
      ] as GameAction[]
    },
    {
      id: "force_entry",
      label: "BRAWL THROUGH THE RIOT LINE (-15 HUMANITY, +20 SECTOR HEAT)",
      condition: () => true,
      actions: [
        { type: 'MODIFY_HUMANITY', payload: -15 },
        { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: 'caterham_asylum', amount: 20 } },
        { type: 'SET_CURRENT_NODE', payload: 'asylum_records_room' }
      ] as GameAction[]
    },
    {
      id: "clean_entry",
      label: "DEPLOY YOKAI: KAMAITACHI (SEVER THE GATE LOCKS)",
      condition: (state: GameState) => state.tetheredYokai.includes('yokai_kamaitachi'),
      actions: [
        { type: 'SET_CURRENT_NODE', payload: 'asylum_records_room' }
      ] as GameAction[]
    }
  ]
};

export const asylum_records_room = {
  title: "ASYLUM ADMINISTRATION",
  text: (state: GameState) => {
    if (state.flags['asylum_records_room_search_files_clicked']) {
      return "You rifle through the ransacked manifests. You find a shipping discrepancy: the massive intake of bodies stolen from the churchyard was diverted directly into the basement incinerator rooms right before the rioting started.";
    }
    return "The administration wing has been completely gutted. Filing cabinets are overturned and the windows are shattered. The rioters haven't breached this deep yet, meaning the raw logistics data is still intact—but lingering here leaves you exposed.";
  },
  choices: [
    {
      id: "search_files",
      label: "DIG THROUGH THE MANIFESTS (+10 SECTOR HEAT)",
      condition: (state: GameState) => !state.flags['asylum_records_room_search_files_clicked'],
      actions: [
        { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: 'caterham_asylum', amount: 10 } },
        { type: 'ADVANCE_TIME', payload: 3 },
        { type: 'SET_FLAG', payload: { flagId: 'asylum_records_room_search_files_clicked', value: true } }
      ] as GameAction[]
    },
    {
      id: "loot_desk",
      label: "CROWBAR THE HEAD DOCTOR'S DESK",
      condition: (state: GameState) => !state.flags['asylum_desk_looted'],
      actions: [
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 15 } },
        { type: 'SET_FLAG', payload: { flagId: 'asylum_desk_looted', value: true } }
      ] as GameAction[]
    },
    {
      id: "descend",
      label: "BREACH THE INCINERATOR BASEMENT",
      condition: () => true,
      actions: [
        { type: 'SET_CURRENT_NODE', payload: 'asylum_basement_rupture' }
      ] as GameAction[]
    }
  ]
};

export const asylum_basement_rupture = {
  title: "INCINERATOR ROOM (ANCHOR)",
  text: (state: GameState) => {
    if (state.flags['asylum_rupture_sealed']) {
      return "The heavy iron wards you drove into the floor slam the physical tear shut. Above you, the sound of the riot begins to immediately fracture and die down as the supply of chaotic fuel is violently cut off. You've stabilized this sector.";
    }
    return "You step into the sweltering dark. The concrete floor is cracked wide open, exposing a raw, physical tear leaking dense, chaotic fuel. This is a Goetic logistics hub. A lieutenant is using the stolen corpses to build a physical beachhead for a Horseman.";
  },
  choices: [
    {
      id: "seal_rupture",
      label: "SABOTAGE THE BEACHHEAD (-2 COLD IRON, -25% SECTOR HEAT)",
      condition: (state: GameState) => !state.flags['asylum_rupture_sealed'] && (state.inventory['cold_iron_filings'] || 0) >= 2,
      actions: [
        { type: 'MODIFY_INVENTORY', payload: { itemId: 'cold_iron_filings', amount: -2 } },
        { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: 'caterham_asylum', amount: -25 } },
        { type: 'MODIFY_HUMANITY', payload: 10 },
        { type: 'GATHER_INTEL', payload: 'necrotic_stasis' },
        { type: 'ADD_LEAD', payload: { id: 'asylum_cleared', text: 'The Asylum hub is offline, but the remaining cargo trucks are headed for the Thames Nexus.' } },
        { type: 'SET_FLAG', payload: { flagId: 'asylum_rupture_sealed', value: true } }
      ] as GameAction[]
    },
    {
      id: "retreat_safehouse",
      label: "EXTRACT TO SAFEHOUSE (ADVANCES TIME)",
      condition: () => true,
      actions: [
        { type: 'ADVANCE_TIME', payload: 5 },
        { type: 'SET_CURRENT_NODE', payload: 'safehouse' }
      ] as GameAction[]
    }
  ]
};