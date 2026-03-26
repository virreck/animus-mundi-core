Animus Mundi: Seals of the 4
============================

**A Neo-Noir Thaumaturgic OS Simulator.**

**Developed with: React, TypeScript, Vite**

* * * * *

<div align="center"> <img src="/public/title_art.png" alt="Animus Mundi Title Screen" width="600px"/> <p></p> </div>

1\. Executive Summary
---------------------

**Animus Mundi: Seals of the 4** is a single-pane tactical simulation. The player assumes the role of a *Remote Thaumaturge Operative*, interacting with a physical, supernatural world entirely through a specialized interface: the "Thaumaturgic OS."

This OS terminal is not the *source* of the apocalypse; it is the specialized hardware designed to map, track, and ultimately execute the complex geometry required to bind real-world conceptual threats. The player character (the Operative) uses this terminal to coordinate investigations, manage resource logistics, and authorize physical rituals.

The ultimate objective is to prevent a conceptual apocalypse by systematically isolating and banishing the Four Horsemen: **CONQUEST**, **WAR**, **FAMINE**, and **DEATH**.

2\. Narrative Framework & Immutable World Laws
----------------------------------------------

This platform is a **State-Driven Environmental Investigation**. All tactical and narrative content (nodes, items, codex entries) must strictly adhere to the established "lore math" and physical laws of the supernatural world.

2.1. The Premise: The 72 Anchors
--------------------------------

The Four Horsemen are real, physically manifested entities that cannot manifest directly in the mundane world. They require "conceptual anchors" to subjugate reality. These anchors are the 72 Goetian lieutenants of the Ars Goetia.

-   **The Math:** There are 72 Goetia total. They are divided into four legions of 18, each serving one specific Horseman.

-   **The Strategy:** The player's tactical focus is to sever these anchors. Sealing a Goetia lieutenant permanently destroys one of that Horseman's connection points to reality. The engine explicitly tracks `sealedGoetia` by `allegiance` (e.g., 'WAR') to calculate the success probability of the final high-risk Banishment Protocol.

2.2. The Investigation Concept: Signs over Prints
-------------------------------------------------

The Goetia do not exist in standard physical space; operatives identify their influence via the *anomalies* caused by their presence.

-   The Goetia leave "Signs."

-   Narrative text must prioritize immersive, highly detailed description of these real-world anomalies (e.g., localized drops in ambient temperature, spontaneous outbreaks of martial paranoia, crops rotting overnight).

-   The **GOETIAN_CODEX** analyzes these incoming data streams to authorize true-name identification and ultimate sealing rituals.

3\. Gameplay Mechanics Overview (Remote Field Ops)
--------------------------------------------------

The application simulates the friction and data-management challenges of managing complex supernatural fieldwork from a distance.

3.1. The Investigation Loop: Static and Reactive Pacing
-------------------------------------------------------

-   **One-Way Door Investigation:** Field choices are irreversible physical actions. When an operative chooses to "Inspect the shattered wards," they are physically moving to that spot in the real world. The narrative permanently updates to show this consequence, and the option vanishes. Options must evolve or expire, never "grind."

-   **Instruction vs. Progression:** To balance pacing, not every action triggers a major mechanical shift. Some actions are purely instructional (data gathering), serving as pre-requisites to unlock progression actions (spiking heat, yielding intel, or adding new deployment leads to the map).

3.2. Operational Threat Matrices
--------------------------------

The OS represents complex, interrelated physical and spiritual risks as tactical data streams.

-   **Humanity (Tether Stability):** The physical and mental alignment of the remote operative. A real-world resource that represents real risk to the character, even if they aren't physically present at the hotspot. It is restored by resting at the **SAFEHOUSE**, which advances time.

-   **Local Sector Heat:** The OS's representation of Malleus Inquisition awareness and reality-volatility within a single node. While the operative is resting or traveling, the Goetian lieutenants in the field continue their work, causing Local Heat to spike across all other field nodes on the map.

-   **Global Entropy:** The primary Game Over fail-state. Only increases when the player **CATASTROPHICALLY FAILS** a high-level ritual (a standard Goetian seal or a Horseman banishment). A purely execution-based punishment representing real metaphysical collapse.

3.3. Kage-no-Sho: Yokai & Shikigami Intermediaries
--------------------------------------------------

Yokai are lesser Japanese spirits that the Operative can bind to act as Shikigami. They are not data points; they are real entities tethered to the **command console**, acting as spiritual lenses or direct physical intermediaries.

-   **Acquisition (The Pact):** Yokai are bound via the **KAGE_NO_SHO** terminal (Book of Shadows). Binding requires a formal Pact, costing items like Obols or even a temporary reduction in maximum Humanity (Tether Stability).

-   **Utility Classification:** Shikigami provide tactical utility within the OS by manipulating operational rules on behalf of the remote operative:

    -   **Suppression (Heat Management):** Spirits that physically quiet a sector or mask the Operative's specialized magical signature.

    -   **Ritual Support (Minigame Assistance):** Spirits tethered to the interface to actively stabilize the physical tracing geometry during complex sealing or banishment rituals.

    -   **Operative Care (Rest Optimization):** Spirits bound to stabilize the remote tether, allowing for rest cycles (Humanity recovery) that generate less time-advancement penalty.

3.4. Endgame: The Grand Rite (Banishment Terminal)
--------------------------------------------------

The final confrontation against a Horseman (omega-level event) uses the hostile Banishment Terminal.

-   **Calculated Odds:** The success probability of the Grand Rite is procedure and immutable: **`5% (Base) + (sealedGoetiaCount * 5%)`**, capped at 95%. This math validates all prior mechanical loops (hunting lieutenants is the sole way to improve odds).

-   **Endurance Tracing:** This Rite requires a shared 60-second timer to clear **three** procedurally generated matrices back-to-back. If the timer hits zero or the player suffers a ritual fracture, the attempt fails catastrophically.