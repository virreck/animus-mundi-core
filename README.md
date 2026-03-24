# ☿ THAUMATURGIC_OS v3.1

**A Tactical Esoteric Operating System & State-Driven Narrative RPG.**

Thaumaturgic OS is a browser-based, interactive fiction and resource management game. Players take on the role of an independent occult operative navigating a localized esoteric breach in Caterham, UK. The game blends branching narrative investigation with survival mechanics, real-time threat tracking, and procedural geometry mini-games.

## ⚙️ Core Mechanics

* **State-Driven Narrative Engine:** A robust React `useReducer` architecture that tracks flags, inventory, and intel. Narrative nodes use a "Reverse Waterfall" logic to dynamically overwrite room descriptions based on player actions, preventing choice-spamming and ensuring logical progression.
* **Dual-Threat Tracking System:**
    * **Global Entropy:** The doomsday clock. Advancing time or resting increases this meter. If it hits 100%, the session terminates.
    * **Sector Heat:** Localized volatility. Aggressive actions (brute-forcing wards, messy sealing) spike local heat. If a sector reaches 100%, the Malleus Inquisition locks it down, rendering the node inaccessible.
* **Esoteric Geo-Tracker (Map):** A tactical SVG overlay mapping real-world Caterham locations (St. Lawrence Churchyard, Abandoned Asylum). Players travel between nodes, incurring time and entropy costs.
* **Procedural Sealing Protocol:** A high-tension mini-game for capturing Goetian targets. Uses Coprime Star Polygon algorithms to procedurally generate unbroken Euler paths (Pentagrams, Heptagrams, Bound Enneagrams). Players must trace the exact geometric containment matrix before the sector destabilizes.
* **The Safehouse Hub:** A sanctuary node featuring core gameplay loops:
    * **The Hearth:** Restore Humanity at the cost of Global Entropy.
    * **Altar of Synthesis:** Craft high-tier Sealing Catalysts from raw inventory materials.
    * **Remote Warding:** Spend Obols to triage and lower Sector Heat in compromised locations.
* **Auto-Save Daemon:** Local browser persistence (`localStorage`) captures the `GameState` after every action, allowing operatives to seamlessly resume sessions.

## 🏗️ Architecture & Tech Stack

* **Frontend:** React 18+
* **Language:** TypeScript (Strict typing for `GameState` and `GameAction` unions)
* **Styling:** Inline React styles utilizing a centralized `theme` object for a cohesive Neo-Noir Terminal aesthetic (Deep Greens, Terminal Blacks, Accent Reds).
* **State Management:** React `useReducer` for global state dispatching, coupled with a custom `useEngine` hook to expose localized functions.

### Directory Structure Blueprint

```text
src/
├── engine/
│   ├── state.ts        # Interface definitions and initialGameState
│   └── reducer.ts      # The master switch statement handling all GameActions
├── content/
│   ├── narrative/      # The dynamic scene files
│   │   ├── caterham_churchyard.ts
│   │   ├── caterham_asylum.ts
│   │   └── safehouse.ts
│   ├── goetia.ts       # Codex data and seal requirements
│   └── yokai.ts        # Kage_No_Sho contract data
├── ui/
│   └── hooks/
│       └── useEngine.ts # Exposes engine dispatchers and the Auto-Save Daemon
├── App.tsx             # Master UI Wrapper, Tab Router, and SVG logic
└── main.tsx            # React DOM entry point
```

## 🔄 The Core Gameplay Loop

1.  **Deploy:** Use the Geo-Tracker to travel to an Active Sector (e.g., St. Lawrence Churchyard).
2.  **Investigate:** Spend Humanity and risk Sector Heat to gather Intel, Items, and map Leads.
3.  **Cross-Reference:** Check the Goetian Codex. If you have gathered the required Intel, Identify the target to reveal their required Sealing Catalysts.
4.  **Retreat & Synthesize:** Return to the Safehouse to rest, lower heat, and craft the necessary items.
5.  **Execute:** Deploy to the target's location and initiate the Sealing Protocol mini-game to bind them to the Brass Vessel.

## 🚀 Installation & Initialization

1. Clone the repository.
2. Ensure you have Node.js installed.
3. Run the following terminal commands:
   ```bash
   npm install
   npm run dev
   ```
4. Access the Thaumaturgic OS via your local host port.

## 📁 Asset Requirements

The OS expects the following directory structure in the `public/` folder for visual assets:
* `/portraits/` - Square (256x256) `.png` files for the tactical UI profile pictures.
* `/portraits/full_body/` - Full character illustrations (prefixed with `fb_`) for the deployment dossier modal.
* `/seals/` - Transparent `.png` files named by Goetian ID (e.g., `murmur.png`) for the Codex and Tracing mini-game.
