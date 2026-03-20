Animus Mundi Core
=================

**Animus Mundi Core** is a TypeScript-based investigation engine designed for a narrative-driven RPG centered on spiritual-industrial displacement. Players take on the role of an investigator navigating a world where the boundary between reality and the esoteric is thinning.

🛠 Core Systems
---------------

-   **The Open Tome UI**: A specialized React interface simulating an investigator's field journal, featuring a dual-page layout for simultaneous navigation and data analysis.

-   **Ars Goetia Index**: A data-driven manifest of 72 Goetic entities, each requiring specific "intel tags" gathered from the environment to be identified and banished.

-   **Yōroku (Yokai Contracts)**: A library of 52 unique Yokai entities that can be bound via Obols to provide utility in the field, ranging from sensory enhancement to stealth and enforcement.

-   **Narrative Engine**: A state-based branching dialogue system that tracks player choices, inventory changes, and world state.

🚀 Technical Stack
------------------

-   **Framework**: React (Vite).

-   **Language**: TypeScript for strict type safety across game data.

-   **State Management**: A custom Reducer-based engine for handling complex game logic and delta-based state updates.

🗺 Roadmap
----------

The project is currently transitioning from a standalone prototype to a fully indexed system. Upcoming priorities include:

-   **Logic Fog**: Implementing a visibility layer so the Grimoire only reveals Goetic entries as relevant intel is gathered.

-   **Utility Alignment**: Updating the `activationCost` and `gameUtility` logic for Yokai to integrate directly with the investigation loop.

-   **System Meters**: Re-implementing the **Sector Entropy (Chaos)** and **Humanity** meters to track the consequences of player actions.

-   **UI Polish**: Refining the parchment aesthetic and adding custom iconography for different entity classes.