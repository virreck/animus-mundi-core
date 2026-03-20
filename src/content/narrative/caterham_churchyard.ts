// src/content/narrative/caterham_churchyard.ts
import type { NarrativeNode } from '../../engine/state';

export const caterhamChurchyard: NarrativeNode = {
  id: "caterham_churchyard",
  title: "St. Mary's Churchyard",
  text: "The earth here feels 'hollow'. The ancient yew trees bordering the graves are totally devoid of life, their root systems calcified and white like bone. A faint scent of ozone lingers in the freezing air.",
  
  choices: [
    {
      id: "examine_roots",
      label: "Examine the calcified root systems.",
      // Only show this choice if they HAVEN'T found the intel yet
      condition: (state) => !state.intelLog.includes("calcified_roots"),
      actions: [
        { type: "GATHER_INTEL", payload: "calcified_roots" },
        { type: "ADVANCE_TIME", payload: 2 } // Investigating takes time
      ]
    },
    {
      id: "sensor_sweep",
      label: "Run an ambient temperature sweep.",
      condition: (state) => !state.intelLog.includes("temp_drop"),
      actions: [
        { type: "GATHER_INTEL", payload: "temp_drop" },
        { type: "GATHER_INTEL", payload: "ozone_scent" }
      ]
    },
    {
      id: "use_katashiro",
      label: "Deploy Katashiro into the crypt. (Requires Katashiro)",
      // The Engine checks if the Katashiro is currently in your Active Tether
      condition: (state) => state.activeContracts.includes("katashiro_decoy"),
      actions: [
        { type: "EXECUTE_YOKAI", payload: "katashiro_decoy" },
        { type: "MODIFY_INVENTORY", payload: { itemId: "cold_iron_filings", amount: 1 } },
        { type: "ADD_LEAD", payload: { id: "crypt_iron", text: "The decoy recovered cold iron from the crypt.", resolved: false } }
      ]
    }
  ]
};