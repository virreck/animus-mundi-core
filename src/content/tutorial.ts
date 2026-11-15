// src/content/tutorial.ts
// Script for the guided first case. Each step is a transmission from the handler, Vesper,
// plus (optionally) an objective that completes when `done` returns true.
// `{name}` and `{agency}` are replaced with the operative's details.
import type { GameState } from '../engine/state';
import type { EvidenceLog } from '../engine/evidence';
import { TUTORIAL_ROOMS, TUTORIAL_SECTOR_ID, TUTORIAL_TARGET_ID, TUTORIAL_YOKAI_ID } from '../engine/tutorial';
import { YOKAI_DAEMON_SPECS } from './yokaiSpecs';

export interface TutorialContext {
  state: GameState;
  viewport: string;
  mapViewMode: string;
  selectedSuspectId: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  /** Handler transmission, one paragraph per entry. */
  lines: string[];
  /** Shown as the current objective. Steps without one wait for CONTINUE. */
  objective?: string;
  done?: (ctx: TutorialContext) => boolean;
  /** Full-screen story card instead of the docked transmission panel. */
  fullscreen?: boolean;
  /** Label for the CONTINUE button on objective-less steps. */
  continueLabel?: string;
}

// --- helpers -----------------------------------------------------------------
const crypt = (ctx: TutorialContext) => ctx.state.contracts[TUTORIAL_SECTOR_ID];
const roomOf = (ctx: TutorialContext, id: string) => crypt(ctx)?.subNodes.find(n => n.id === id);
const at = (ctx: TutorialContext, id: string) => crypt(ctx)?.activeSubNodeId === id;
const evidence = (ctx: TutorialContext, kind: EvidenceLog['kind']) => (crypt(ctx)?.discoveredLogs || []).filter(l => l.kind === kind);
const scanned = (ctx: TutorialContext, id: string) => !!roomOf(ctx, id) && roomOf(ctx, id)!.status !== 'LOCKED';

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ---------------------------------------------------------------- OPENING
  {
    id: 'intro_1',
    title: 'INCOMING TRANSMISSION // {agency} SECURE RELAY',
    fullscreen: true,
    lines: [
      'Operative {name}. Vesper here. If you can read this, the rig booted and you are still you. Mostly.',
      'Three weeks ago the Solomonic seals failed. Not cracked — failed. Seventy-two spirits the old kings bound in brass came loose in the same breath, and something larger came through behind them.'
    ],
    continueLabel: 'CONTINUE'
  },
  {
    id: 'intro_2',
    title: 'THE FOUR COURTS',
    fullscreen: true,
    lines: [
      'Conquest. War. Famine. Death. The Horsemen cannot walk here yet. They need anchors — every loose spirit they pin to a place in London is another nail holding the door open. Pull the nails and the door shuts.',
      'The Ordo Malleus think the cure is fire. They will burn the city to the waterline, and you with it, if they catch your signal. Stay off their scopes.'
    ],
    continueLabel: 'CONTINUE'
  },
  {
    id: 'intro_3',
    title: 'THE TETHER',
    fullscreen: true,
    lines: [
      'You go in on foot. The OS is your kit — the terminal on your wrist, the bone-set behind your ear, the instruments in your coat. It reads what your senses cannot, and it spins a thread of warding between you and the ordinary world. That thread is your tether.',
      'Thin places pull at it. Every scan, every shock off a ward, every hour in rooms that should not exist takes a little of what makes you human. Run that to nothing and the thread snaps — and whatever walks back out will not be you.',
      'Tonight is a training run. St. Lawrence Crypt, Caterham. Something has been howling under the church since Michaelmas. I have frozen the clock on everything else. Learn the instruments. Then we go to war.'
    ],
    continueLabel: 'BOOT THE RIG'
  },

  // ---------------------------------------------------------------- FIELD OPS
  {
    id: 'interface',
    title: 'FIELD OPS',
    lines: [
      'This is Field Ops. The grid is the crypt as your rig maps it — rooms, corridors, and you, standing at the lychgate in the rain. The wire under it is where everything your instruments report lands.',
      'Along the top: ENTROPY is how frayed the world is. HUM is you. OBOLS pay for everything. Watch all three.'
    ],
    continueLabel: 'UNDERSTOOD'
  },
  {
    id: 'scan_1',
    title: 'RECON',
    lines: ['Never walk into a room blind. A scan throws an auspex ping through the wall: what is inside, what guards the door, what it will cost to go through. It takes a little Humanity.'],
    objective: 'Scan Room 1 — tap SCAN, or type scan 1.',
    done: ctx => scanned(ctx, TUTORIAL_ROOMS.lychgate)
  },
  {
    id: 'enter_1',
    title: 'ENTRY',
    lines: ['Clear threshold. Go in. Entering breaks the ward on the door, and broken wards are what the Malleus track — that is HEAT, per sector. At 100% they cordon it.'],
    objective: 'Enter Room 1.',
    done: ctx => at(ctx, TUTORIAL_ROOMS.lychgate)
  },
  {
    id: 'decode_1',
    title: 'INSTRUMENTS',
    lines: [
      'Read the signal on the wire. You have three instruments: VOX for anything you would hear, ASSAY for anything you could touch, AUSPEX for light, heat, time and the mind.',
      'Pick the wrong one and you just make noise. Noise is Heat.'
    ],
    objective: 'Decode the signal in Room 1 with the right instrument.',
    done: ctx => evidence(ctx, 'PHENOMENON').length >= 1
  },
  {
    id: 'scan_2',
    title: 'THRESHOLDS',
    lines: ['Clean reading — they will not all be. The door to Room 2 feels wrong. Look before you touch it.'],
    objective: 'Scan Room 2.',
    done: ctx => scanned(ctx, TUTORIAL_ROOMS.nave)
  },
  {
    id: 'disarm_2',
    title: 'COUNTERMEASURES',
    lines: [
      'A ward. The OS only ever gives you the symptom — you name the counter. Static that makes your fillings ache is aethyric: DEGAUSS it.',
      'There are four kinds. The MANUAL lists them all. Walk through a live one and it will hurt.'
    ],
    objective: 'Disarm Room 2 from outside — degauss 2.',
    done: ctx => roomOf(ctx, TUTORIAL_ROOMS.nave)?.hazard === 'NONE'
  },
  {
    id: 'decode_2',
    title: 'SECOND READING',
    lines: ['Now go in and read it.'],
    objective: 'Enter Room 2 and decode its signal.',
    done: ctx => evidence(ctx, 'PHENOMENON').length >= 2
  },
  {
    id: 'refine_2',
    title: 'DEGRADED SIGNAL',
    lines: [
      'See the amber? Degraded. At this concentration the assay cannot tell scale from slime from brine. Most field readings come back like this.',
      'REFINE reprocesses a reading until it points at one thing. It costs Humanity and Heat — sometimes it is cheaper to reason around it. This time, refine it.'
    ],
    objective: 'Refine the Room 2 reading — refine 2.',
    done: ctx => (evidence(ctx, 'PHENOMENON').find(l => l.id === `${TUTORIAL_ROOMS.nave}_log`)?.candidates?.length || 0) === 1
  },
  {
    id: 'patrol_3',
    title: 'THE HOUNDS',
    lines: [
      'Room 3. Scan it.',
      'If the scan shows Malleus witch-hounds, do not walk in — they will take you apart. A DECOY throws a phantom signal down the corridor and they follow it.'
    ],
    objective: 'Scan Room 3, decoy the patrol, then enter.',
    done: ctx => at(ctx, TUTORIAL_ROOMS.belfry) && roomOf(ctx, TUTORIAL_ROOMS.belfry)?.patrolActive === false
  },
  {
    id: 'witness_4',
    title: 'THE WITNESS',
    lines: [
      'Life signs in Room 4. Civilians see what instruments cannot — but fear eats memory, and what they give you will have holes in it.',
      'Take the statement anyway. Then hold it up against the Lemegeton later.'
    ],
    objective: 'Enter Room 4 and interview the witness.',
    done: ctx => evidence(ctx, 'WITNESS').length >= 1
  },
  {
    id: 'shrine_5',
    title: 'THE SHRINE',
    lines: ['Room 5 is an old kami shrine — someone has been leaving offerings in a Surrey crypt, which tells you how strange this year has been. Wake it and its spirit will bargain with you.'],
    objective: 'Enter Room 5 and loot the shrine.',
    done: ctx => !!ctx.state.flags.kitsune_mask_found
  },
  {
    id: 'kage',
    title: 'SHIKIGAMI',
    lines: [
      'Open the KAGE NO SHO — F3, the Book of Shadows. Every shrine you wake writes a spirit\u2019s page, and only a written page can be bound. Two at most. Each has a passive price and a few charges of power.',
      'Work with one and the bond deepens. Feed it ink and its favoured offering and its charges return. Burn it dry, or cut it loose, and it leaves you offended. The fox mask hides you from the Malleus. Bind it.'
    ],
    objective: 'Bind the Kitsune Mask in [F3] KAGE NO SHO.',
    done: ctx => ctx.state.tetheredYokai.includes(TUTORIAL_YOKAI_ID)
  },
  {
    id: 'invoke',
    title: 'INVOCATION',
    lines: ['Back to Field Ops. Your Heat has been climbing all night. Burn one of the fox’s charges — FOXFIRE SHROUD.'],
    objective: 'Invoke the Kitsune from the daemon panel in Field Ops.',
    // Done once a charge is spent (or the daemon is gone, so the step can't strand the player)
    done: ctx =>
      !!ctx.state.flags.kitsune_mask_found &&
      (!ctx.state.tetheredYokai.includes(TUTORIAL_YOKAI_ID) ||
        (ctx.state.yokaiCharges[TUTORIAL_YOKAI_ID] ?? YOKAI_DAEMON_SPECS[TUTORIAL_YOKAI_ID].maxCharges) < YOKAI_DAEMON_SPECS[TUTORIAL_YOKAI_ID].maxCharges)
  },
  {
    id: 'decode_6',
    title: 'THIRD READING',
    lines: ['Room 6. Read it — and leave it degraded. Let us see whether you can do without.'],
    objective: 'Enter Room 6 and decode its signal.',
    done: ctx => evidence(ctx, 'PHENOMENON').length >= 3
  },
  {
    id: 'anchor_7',
    title: 'THE ANCHOR',
    lines: [
      'Room 7 is the anchor — the place the thing is nailed to the world. ATTUNE your vessel to it and you will feel which Horseman it serves; the calibration buys you time on the seal.',
      'Attune a second time for its rank. That one hurts.'
    ],
    objective: 'Enter the anchor and attune twice (court, then rank).',
    done: ctx => evidence(ctx, 'COURT').length > 0 && evidence(ctx, 'RANK').length > 0
  },
  {
    id: 'codex',
    title: 'THE CASE FILE',
    lines: [
      'Open the CODEX — F2. Nobody narrows the Lemegeton for you. Tick the phenomena you are sure of, cross out the ones you have ruled out, filter by the court and rank the anchor gave you, and STRIKE anyone who does not fit.',
      'Whoever is left, read against the witness. A degraded reading is still evidence: the right spirit has one of its possibilities.',
      'Name the wrong spirit in a live operation and your catalysts burn for nothing.'
    ],
    objective: 'Open [F2] CODEX and select the spirit you believe is anchored here.',
    done: ctx => ctx.viewport === 'CODEX' && ctx.selectedSuspectId === TUTORIAL_TARGET_ID
  },
  {
    id: 'catalysts',
    title: 'CATALYSTS',
    lines: ['Every spirit is bound with its own planetary materials — its dossier lists them. Synthesise them from salvage at the Safehouse altar, F4.'],
    objective: 'Craft Amon’s catalysts in [F4] SAFEHOUSE.',
    done: ctx => (ctx.state.inventory.brimstone_ash || 0) >= 3 && (ctx.state.inventory.silver_shavings || 0) >= 1
  },
  {
    id: 'seal',
    title: 'THE SEALING RITE',
    lines: [
      'Back to the Codex. Speak its True Name, then trace the binding before the connection collapses.',
      'Understand this: in a live operation, failure is permanent. The spirit walks free, the sector is lost, and it does not stay put. Tonight, I will catch you if you fall.'
    ],
    objective: 'Engage the Sealing Rite and bind Amon.',
    done: ctx => ctx.state.sealedGoetia.includes(TUTORIAL_TARGET_ID)
  },
  {
    id: 'map',
    title: 'THE MAP',
    lines: [
      'Switch the grid to the REGIONAL MAP. Sixteen sectors.',
      'Every trip you make and every night you rest, the anchors you are not working ripen — the rings show how close they are. At 100% they tear through on their own, and whatever gets loose bleeds into its neighbours.'
    ],
    objective: 'Open the Regional Map.',
    done: ctx => ctx.viewport === 'FIELD_OPS' && ctx.mapViewMode === 'GEO_TRACKER'
  },
  {
    id: 'horsemen',
    title: 'THE HORSEMEN',
    lines: [
      'F5. Every lieutenant you seal weakens its Horseman’s grip. Every one that walks free tightens it.',
      'When you are ready, the Grand Rite of Banishment severs a Horseman for good. I cannot train you for that one. It is in the MANUAL — read it before you try.'
    ],
    objective: 'Open [F5] HORSEMEN.',
    done: ctx => ctx.viewport === 'HORSEMEN'
  },
  {
    id: 'finale',
    title: 'END OF TRAINING',
    fullscreen: true,
    lines: [
      'That is the job. Rest at the Safehouse when your Humanity runs thin. Keep the Malleus off your signal. Keep the clock in your head.',
      'The training clock is off now, {name}. London is real.'
    ],
    continueLabel: 'BEGIN OPERATION'
  }
];

export const fillTutorialText = (text: string, state: Pick<GameState, 'playerName' | 'agencyName'>) =>
  text.replace(/\{name\}/g, (state.playerName || 'OPERATIVE').toUpperCase()).replace(/\{agency\}/g, (state.agencyName || 'DARKWIRE').toUpperCase());
