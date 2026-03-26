Animus Mundi: Seals of the 4
============================

**A Neo-Noir Thaumaturgic OS Simulator.**

**Developed with: React, TypeScript, Vite**

* * * * *

<div align="center"> <img src="/public/title_art.png" alt="Animus Mundi Title Screen" width="600px"/> <p><em>The localized manifestation of Conquest over real-world geography. (Visual Reference: image_6.png)</em></p> </div>

1\. Overview
---------------------

**Animus Mundi: Seals of the 4** is a single-pane tactical simulation. The player assumes the role of a *Thaumaturge Operative*, interacting entirely through a "Thaumaturgic OS"---a piece of esoteric hardware designed to map, track, and ultimately bind conceptual threats to Gaia's stability.

The ultimate objective is to prevent a conceptual apocalypse by systematically isolating and banishing the Four Horsemen: **CONQUEST**, **WAR**, **FAMINE**, and **DEATH**.

2\. Narrative Framework & Immutable World Laws
----------------------------------------------

This platform is not a standard branching narrative; it is a **State-Driven Environmental Investigation**. All content (narrative nodes, items, codex entries) must strictly adhere to the established "lore math" and state-laws to maintain mechanical tension.

2.1. The Premise: The 72 Anchors
--------------------------------

The Four Horsemen cannot manifest directly. They require "conceptual anchors" to interact with and subjugate the mundane world. These anchors are the 72 Goetian lieutenants of the Ars Goetia.

-   **The Math:** There are 72 Goetia total. They are divided into four legions of 18, each serving one specific Horseman.

-   **The Goal:** The core game loop involves hunting these 18 lieutenants. Sealing a Goetia lieutenant permanently severs one of that Horseman's anchors. The engine explicitly tracks `sealedGoetia` by `allegiance` (e.g., 'WAR') to calculate the success probability of the final Banishment Protocol.

2.2. The Investigation Concept: Signs over Prints
-------------------------------------------------

Operatives do not hunt the Goetia directly; they hunt the *anomalies* caused by their presence.

-   The Goetia leave "Signs."

-   Narrative text must prioritize atmosphere and the highly detailed, immersive description of these anomalies (e.g., localized logical fog creating biological decay, spontaneous outbreaks of martial paranoia, crops rotting overnight).

-   The **GOETIAN_CODEX** acts as the analysis engine, cross-referencing these specific signs to authorize identification and sealing.

3\. Gameplay Mechanics Overview (The Engine)
--------------------------------------------

The OS engine is built on a strict state machine that governs the dynamic flow of investigation, threat analysis, and resource management.

3.1. The Investigation Loop: Static and Reactive Pacing
-------------------------------------------------------

-   **One-Way Door Investigation:** Environmental investigation options must not be repeatable. When a player interacts with an object (e.g., "TRACK THE ANOMALY"), the narrative must permanent update, and the option must vanish.

-   **Instruction vs. Progression:** Not every action should yield a massive mechanical effect. The engine prioritizes narrative pacing. Some actions are purely instructional (lore gathering), serving to unlock progressions actions (spiking heat, yielding intel, or adding leads to the map).

3.2. Threat Matrices (The Operational Risk)
-------------------------------------------

The player must manage multiple threat systems that react to their investigation speed.

-   **Humanity:** The operative's primary resource. Restored by resting at the **SAFEHOUSE**, which advances time.

-   **Global Entropy:** The ultimate fail-state. This meter only increases when the player **CATASTROPHICALLY FAILS** a high-level ritual (a standard Goetian seal or a Horseman banishment). A purely execution-based punishment.

-   **Local Sector Heat:** The main lockdown clock. Spikes when breaking wards, digging for clues, or traveling. While the operative is resting or traveling, the Goetian lieutenants in the field continue their work, causing Local Heat to spike across all other field nodes on the map. Safehouse triage actions allow resources to be burned to lower the local heat.

3.3. Kage-no-Sho: Yokai & Shikigami Utility
-------------------------------------------

While the Goetia are threats that must be sealed, the operative can bind lesser Japanese spirits (Yokai) to act as Shikigami---active OS sub-routines and tactical tools. These spirits are vital for manipulating the OS's core rules and managing the threat meters.

-   **Acquisition (The Pact):** Yokai are bound via the **KAGE_NO_SHO** terminal (Book of Shadows). Binding requires a Pact, costing resources like Obols or even a temporary reduction in maximum Humanity (Tether Alignment).

-   **Utility Classification:** Shikigami are classified by their functional utility within the OS:

    -   **Infiltration (Heat Management):** Spirits that generate false esoteric noise, reducing the `Local Sector Heat` generated by investigation actions, or actively lowering current Heat while in the Safehouse.

    -   **Esoteric Support (Minigame Assistance):** Spirits that interact directly with the tracing interface, potentially extending the 15-second standard timer or simplifying complex Euler shapes.

    -   **Operative Care (Humanity Management):** Spirits bound to stabilize the Tether, allowing for slower rest cycles (Humanity recovery) that generate less time-advancement penalty.

    -   **Scouting (Lead Management):** Spirits that can be dispatched to reveal connected map nodes without advancing time or traveling, or identifying hidden Signs within a sector.

3.4. Endgame: The Grand Rite (Banishment Terminal)
--------------------------------------------------

The final confrontation against a Horseman is high-risk and mechanically heavy.

-   **Calculated Odds:** The success probability of the Rite is procedures and immutable: **`5% (Base) + (sealedGoetiaCount * 5%)`**, capped at 95%. This math validates all other mechanical loops (hunting lieutenants is the sole way to improve odds).

-   **Endurance Tracing:** The Grand Rite is not a single trace. It requires a shared 60-second timer to clear **three** procedurally generated matrices back-to-back. If the timer hits zero or the player suffers a ritual fracture, the attempt is over.