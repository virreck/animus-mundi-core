// src/content/tutorial.ts
// Script for the guided first case. Each step is a transmission from the handler, Vesper,
// a plain-English summary, and (optionally) an objective that completes when `done` returns true.
// `guide` says what to press right now, so the overlay can point at it.
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

/** Where the player should look and tap next. */
export interface TutorialGuide {
  /** `data-tour` id of the control to press next. */
  target?: string;
  /** Room number to mark on the map. */
  room?: number;
  /** Which Field Ops pane the target is in (phones show one pane at a time). */
  pane?: 'MAP' | 'WIRE';
  /** One plain sentence: what to do right now. */
  hint: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  /** Vesper's transmission (flavour), one paragraph per entry. Folded away by default in the docked panel. */
  lines: string[];
  /** Plain-English summary, always shown. */
  plain?: string;
  /** Shown as the current objective. Steps without one wait for CONTINUE. */
  objective?: string;
  done?: (ctx: TutorialContext) => boolean;
  /** What to press right now. */
  guide?: (ctx: TutorialContext) => TutorialGuide;
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
const roomId = (n: number) => `${TUTORIAL_SECTOR_ID}_t${n}`;

const TAB_NAMES: Record<string, string> = {
  FIELD_OPS: 'FIELD OPS',
  CODEX: 'CODEX',
  KAGE_NO_SHO: 'KAGE NO SHO',
  SAFEHOUSE_ALTAR: 'SAFEHOUSE',
  HORSEMEN: 'HORSEMEN'
};

/** Points at a screen tab if the player is on another screen; otherwise null. */
function needTab(ctx: TutorialContext, viewport: string): TutorialGuide | null {
  if (ctx.viewport === viewport) return null;
  return { target: `tab-${viewport}`, hint: `Tap ${TAB_NAMES[viewport]} at the top of the screen.` };
}

/** Field Ops, showing the rooms of the crypt. */
function needRooms(ctx: TutorialContext): TutorialGuide | null {
  const tab = needTab(ctx, 'FIELD_OPS');
  if (tab) return tab;
  if (ctx.mapViewMode !== 'SUB_GRID') return { target: 'map-local', pane: 'MAP', hint: 'Tap LOCAL SUB-GRID to see the rooms again.' };
  return null;
}

/** Select room `n` on the map, then press a control that acts on it. */
function onRoom(ctx: TutorialContext, n: number, target: string, label: string): TutorialGuide {
  const first = needRooms(ctx);
  if (first) return first;
  if (crypt(ctx)?.selectedSubNodeId !== roomId(n)) return { room: n, pane: 'MAP', hint: `Tap Room ${n} on the map to select it.` };
  return { room: n, target, pane: 'WIRE', hint: `Room ${n} is selected. Now tap ${label}.` };
}

/** Be inside room `n` (walking in if needed), then do `then`. */
function inRoom(ctx: TutorialContext, n: number, then: TutorialGuide): TutorialGuide {
  const first = needRooms(ctx);
  if (first) return first;
  if (!at(ctx, roomId(n))) return onRoom(ctx, n, 'palette-enter', 'ENTER');
  return { pane: 'WIRE', ...then };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ---------------------------------------------------------------- OPENING
  {
    id: 'intro_1',
    title: 'INCOMING TRANSMISSION // {agency} SECURE RELAY',
    fullscreen: true,
    lines: [
      'Operative {name}. Vesper here. If you can read this, the rig booted and you are still you. Mostly.',
      'Three weeks ago the old seals failed. Seventy-two spirits that King Solomon locked away in a brass vessel got loose at once, and something larger came through behind them.'
    ],
    continueLabel: 'CONTINUE'
  },
  {
    id: 'intro_2',
    title: 'THE FOUR HORSEMEN',
    fullscreen: true,
    lines: [
      'Conquest. War. Famine. Death. The Horsemen cannot walk here yet. Each loose spirit they pin to a place in London is another nail holding the door open for them. Pull the nails out and the door shuts.',
      'The Ordo Malleus, a band of witch-hunters, think the cure is fire. If they catch your signal, they will burn the place down with you inside. Stay off their radar.'
    ],
    continueLabel: 'CONTINUE'
  },
  {
    id: 'intro_3',
    title: 'YOUR KIT',
    fullscreen: true,
    lines: [
      'You go in on foot. The terminal on your wrist reads what your senses cannot, and it keeps a thin thread of protection between you and whatever is in there. That thread is your Humanity.',
      'Every scan, every trap and every hour in places that should not exist wears it down. Rest at the Safehouse to get it back.',
      'Tonight is practice. St. Lawrence Crypt, Caterham. Something has been howling under the church. Nothing else can go wrong while we train. Learn the tools, then we go to work.'
    ],
    plain: 'In short: you hunt spirits. You search rooms for clues, work out which spirit it is, and seal it away, without getting caught. This practice run shows you every step, and nothing you do here can go wrong.',
    continueLabel: 'START TRAINING'
  },

  // ---------------------------------------------------------------- FIELD OPS
  {
    id: 'interface',
    title: 'FIELD OPS',
    lines: [
      'This is Field Ops. The grid is the crypt as your rig maps it, and you are standing at the gate in the rain.'
    ],
    plain: 'The map shows the rooms of the crypt. The control panel is your buttons, and the log is where everything that happens is written down. Along the top: ENTROPY is how close the world is to falling apart (if it fills up, you lose). HUM is your Humanity, which works like health. OBOLS are your money.',
    continueLabel: 'GOT IT'
  },
  {
    id: 'scan_1',
    title: 'LOOK BEFORE YOU GO IN',
    lines: ['Never walk into a room blind. A scan tells you what is inside, what guards the door and what it will cost to go through.'],
    plain: 'SCAN looks through a door before you open it. It costs a little Humanity.',
    objective: 'Scan Room 1.',
    done: ctx => scanned(ctx, TUTORIAL_ROOMS.lychgate),
    guide: ctx => onRoom(ctx, 1, 'palette-scan', 'SCAN')
  },
  {
    id: 'enter_1',
    title: 'GO IN',
    lines: ['Clear threshold. Go in. Opening doors is what the Malleus track.'],
    plain: 'ENTER walks you into the selected room. Every room you enter makes the witch-hunters more likely to find you. That is HEAT, shown above the map. At 100% they lock the place down.',
    objective: 'Enter Room 1.',
    done: ctx => at(ctx, TUTORIAL_ROOMS.lychgate),
    guide: ctx => onRoom(ctx, 1, 'palette-enter', 'ENTER')
  },
  {
    id: 'decode_1',
    title: 'READ THE CLUE',
    lines: ['Read the signal in the log. Pick the wrong instrument and you just make noise. Noise is Heat.'],
    plain: 'Rooms with clues give off a strange signal, described in the log. Pick the matching instrument: VOX for sounds, ASSAY for things you could touch, AUSPEX for light, heat, time or the mind.',
    objective: 'Read the clue in Room 1 with the right instrument.',
    done: ctx => evidence(ctx, 'PHENOMENON').length >= 1,
    guide: ctx => inRoom(ctx, 1, { target: 'palette-forensic', hint: 'The signal is howling, which is a sound. Tap VOX.' })
  },
  {
    id: 'scan_2',
    title: 'TRAPPED DOORS',
    lines: ['Clean reading. They will not all be. The door to Room 2 feels wrong.'],
    plain: 'Always scan a room before you go in. Some doors are trapped.',
    objective: 'Scan Room 2.',
    done: ctx => scanned(ctx, TUTORIAL_ROOMS.nave),
    guide: ctx => onRoom(ctx, 2, 'palette-scan', 'SCAN')
  },
  {
    id: 'disarm_2',
    title: 'DISARM THE TRAP',
    lines: ['The OS only ever gives you the symptom. You name the counter.'],
    plain: 'Room 2 is trapped. The scan describes the trap. Static that makes your teeth ache is an electrical trap, and DEGAUSS removes it. There are four kinds of trap; the MANUAL lists them all. Walking through a live trap hurts.',
    objective: 'Disarm Room 2 with DEGAUSS.',
    done: ctx => roomOf(ctx, TUTORIAL_ROOMS.nave)?.hazard === 'NONE',
    guide: ctx => onRoom(ctx, 2, 'palette-degauss', 'DEGAUSS')
  },
  {
    id: 'decode_2',
    title: 'SECOND CLUE',
    lines: ['Now go in and read it.'],
    plain: 'Same as before: go in, then use the instrument that matches the signal.',
    objective: 'Enter Room 2 and read its clue.',
    done: ctx => evidence(ctx, 'PHENOMENON').length >= 2,
    guide: ctx => inRoom(ctx, 2, { target: 'palette-forensic', hint: 'Slime and residue are things you could touch. Tap ASSAY.' })
  },
  {
    id: 'refine_2',
    title: 'AN UNCLEAR CLUE',
    lines: ['At this concentration the assay cannot tell scale from slime from brine. Most field readings come back like this.'],
    plain: 'Amber means the clue is unclear: it could be one of a few things. REFINE makes it clear, but costs Humanity and Heat. You will not always need it. This time, refine it.',
    objective: 'Refine the Room 2 clue.',
    done: ctx => (evidence(ctx, 'PHENOMENON').find(l => l.id === `${TUTORIAL_ROOMS.nave}_log`)?.candidates?.length || 0) === 1,
    guide: ctx => needRooms(ctx) ?? { target: 'palette-refine', pane: 'WIRE', hint: 'Tap REFINE.' }
  },
  {
    id: 'patrol_3',
    title: 'GUARDS',
    lines: ['If the scan shows Malleus witch-hounds, do not walk in. They will take you apart.'],
    plain: 'Room 3 has guards in it. If a scan shows a PATROL, do not go in yet. Tap DECOY to lure them away, then enter.',
    objective: 'Scan Room 3, decoy the patrol, then enter.',
    done: ctx => at(ctx, TUTORIAL_ROOMS.belfry) && roomOf(ctx, TUTORIAL_ROOMS.belfry)?.patrolActive === false,
    guide: ctx => {
      if (!scanned(ctx, TUTORIAL_ROOMS.belfry)) return onRoom(ctx, 3, 'palette-scan', 'SCAN');
      if (roomOf(ctx, TUTORIAL_ROOMS.belfry)?.patrolActive) return onRoom(ctx, 3, 'palette-decoy', 'DECOY');
      return onRoom(ctx, 3, 'palette-enter', 'ENTER');
    }
  },
  {
    id: 'witness_4',
    title: 'THE WITNESS',
    lines: ['Civilians see what instruments cannot. But fear eats memory, and what they give you will have holes in it.'],
    plain: 'Someone is hiding in Room 4. Talking to them gets you a description of the spirit, with gaps in it because they were terrified.',
    objective: 'Go into Room 4 and interview the witness.',
    done: ctx => evidence(ctx, 'WITNESS').length >= 1,
    guide: ctx => inRoom(ctx, 4, { target: 'palette-interview', hint: 'Tap INTERVIEW.' })
  },
  {
    id: 'shrine_5',
    title: 'THE SHRINE',
    lines: ['Someone has been leaving offerings at a Japanese spirit shrine in a Surrey crypt. That tells you how strange this year has been.'],
    plain: 'Room 5 is a shrine. Searching it wakes the spirit who lives there, and it will offer to help you.',
    objective: 'Go into Room 5 and search the shrine.',
    done: ctx => !!ctx.state.flags.kitsune_mask_found,
    guide: ctx => inRoom(ctx, 5, { target: 'palette-loot', hint: 'Tap LOOT to search the room.' })
  },
  {
    id: 'kage',
    title: 'HELPER SPIRITS',
    lines: ['Work with a spirit and the bond deepens. Burn it dry, or cut it loose, and it leaves you offended.'],
    plain: 'The shrine spirit is now written in your KAGE NO SHO, the Book of Shadows. Binding it gives you a helper with a power you can use a few times. You can carry two. The fox mask hides you from the witch-hunters.',
    objective: 'Open KAGE NO SHO and bind the Kitsune Mask.',
    done: ctx => ctx.state.tetheredYokai.includes(TUTORIAL_YOKAI_ID),
    guide: ctx => needTab(ctx, 'KAGE_NO_SHO') ?? { target: `bind-${TUTORIAL_YOKAI_ID}`, hint: 'Tap BIND on the Kitsune Mask page.' }
  },
  {
    id: 'invoke',
    title: 'USE A POWER',
    lines: ['Your Heat has been climbing all night. Burn one of the fox’s charges.'],
    plain: 'Your bound spirit now sits under the map on Field Ops. Its power, FOXFIRE SHROUD, lowers your Heat.',
    objective: 'Use the Kitsune’s power on Field Ops.',
    // Done once a charge is spent (or the daemon is gone, so the step can't strand the player)
    done: ctx =>
      !!ctx.state.flags.kitsune_mask_found &&
      (!ctx.state.tetheredYokai.includes(TUTORIAL_YOKAI_ID) ||
        (ctx.state.yokaiCharges[TUTORIAL_YOKAI_ID] ?? YOKAI_DAEMON_SPECS[TUTORIAL_YOKAI_ID].maxCharges) < YOKAI_DAEMON_SPECS[TUTORIAL_YOKAI_ID].maxCharges),
    guide: ctx => needTab(ctx, 'FIELD_OPS') ?? { target: `invoke-${TUTORIAL_YOKAI_ID}`, pane: 'MAP', hint: 'Tap the ⚡ FOXFIRE SHROUD button.' }
  },
  {
    id: 'decode_6',
    title: 'LAST CLUE',
    lines: ['Leave this one unclear. Let us see whether you can do without.'],
    plain: 'Room 6 has the last clue. Read it, but do not refine it. You will work it out anyway.',
    objective: 'Go into Room 6 and read its clue.',
    done: ctx => evidence(ctx, 'PHENOMENON').length >= 3,
    guide: ctx => inRoom(ctx, 6, { target: 'palette-forensic', hint: 'This one is about light and heat. Tap AUSPEX.' })
  },
  {
    id: 'anchor_7',
    title: 'THE ANCHOR',
    lines: ['The anchor is the place the thing is nailed to the world. Calibrating to it buys you time on the seal.'],
    plain: 'Room 7 holds the ANCHOR, the thing that ties the spirit to this place. ATTUNE to it once to learn which Horseman the spirit serves, and again to learn its rank. The second time hurts.',
    objective: 'Go into Room 7 and attune twice.',
    done: ctx => evidence(ctx, 'COURT').length > 0 && evidence(ctx, 'RANK').length > 0,
    guide: ctx => inRoom(ctx, 7, { target: 'palette-attune', hint: evidence(ctx, 'COURT').length ? 'Once more: tap ATTUNE again.' : 'Tap ATTUNE.' })
  },
  {
    id: 'codex',
    title: 'WHO IS IT?',
    lines: [
      'Nobody narrows the Lemegeton for you. A degraded reading is still evidence: the right spirit has one of its possibilities.',
      'Name the wrong spirit in a live operation and your materials burn for nothing.'
    ],
    plain: 'The CODEX lists all 72 spirits. Tap the clues you found to tick them (tap twice to rule one out). Use the anchor’s Horseman and rank, and compare with what the witness said. Strike out anyone who does not fit, then pick the spirit you think it is.',
    objective: 'Open the CODEX and select the spirit you think is here.',
    done: ctx => ctx.viewport === 'CODEX' && ctx.selectedSuspectId === TUTORIAL_TARGET_ID,
    guide: ctx => {
      const tab = needTab(ctx, 'CODEX');
      if (tab) return tab;
      if (ctx.state.deducedSigns.length === 0) return { target: 'codex-filters', hint: 'Tap the clues you found to tick them.' };
      return { target: 'codex-suspects', hint: 'Now tap the spirit in the SUSPECTS list that fits best.' };
    }
  },
  {
    id: 'catalysts',
    title: 'MATERIALS',
    lines: ['Every spirit is bound with its own planetary materials. Its dossier lists them.'],
    plain: 'Sealing a spirit needs special materials. You make them at the SAFEHOUSE from the scrap you picked up. Amon needs 3 Brimstone Ash and 1 Silver Shavings.',
    objective: 'Make 3 Brimstone Ash and 1 Silver Shavings at the SAFEHOUSE.',
    done: ctx => (ctx.state.inventory.brimstone_ash || 0) >= 3 && (ctx.state.inventory.silver_shavings || 0) >= 1,
    guide: ctx => {
      const tab = needTab(ctx, 'SAFEHOUSE_ALTAR');
      if (tab) return tab;
      const ash = ctx.state.inventory.brimstone_ash || 0;
      if (ash < 3) return { target: 'craft-brimstone_ash', hint: `Tap SYNTHESIZE on Brimstone Ash (${ash} of 3 made).` };
      return { target: 'craft-silver_shavings', hint: 'Now tap SYNTHESIZE on Silver Shavings.' };
    }
  },
  {
    id: 'seal',
    title: 'SEAL IT AWAY',
    lines: ['In a live operation, failure is permanent. The spirit walks free, the place is lost, and it does not stay put. Tonight, I will catch you if you fall.'],
    plain: 'Back in the CODEX, start the SEALING RITE. Type the spirit’s name, then trace the star by tapping the points in order before time runs out.',
    objective: 'Start the Sealing Rite and seal Amon.',
    done: ctx => ctx.state.sealedGoetia.includes(TUTORIAL_TARGET_ID),
    guide: ctx => {
      const tab = needTab(ctx, 'CODEX');
      if (tab) return tab;
      if (ctx.selectedSuspectId !== TUTORIAL_TARGET_ID) return { target: 'codex-suspects', hint: 'Select Amon in the SUSPECTS list.' };
      return { target: 'codex-seal', hint: 'Tap ENGAGE SEALING RITE.' };
    }
  },
  {
    id: 'map',
    title: 'THE BIGGER PICTURE',
    lines: ['Sixteen places to begin with. They will not be the last.'],
    plain: 'The REGIONAL MAP shows every place you can go. Spirits you leave alone grow stronger over time. The ring around each place shows how close it is to breaking loose, and when it does, that place is lost.',
    objective: 'Open the Regional Map.',
    done: ctx => ctx.viewport === 'FIELD_OPS' && ctx.mapViewMode === 'GEO_TRACKER',
    guide: ctx => needTab(ctx, 'FIELD_OPS') ?? { target: 'map-regional', pane: 'MAP', hint: 'Tap REGIONAL MAP above the map.' }
  },
  {
    id: 'horsemen',
    title: 'THE HORSEMEN',
    lines: ['When you are ready, the Grand Rite of Banishment severs a Horseman for good. I cannot train you for that one. Read the MANUAL before you try.'],
    plain: 'This screen shows the four Horsemen. Every spirit you seal weakens one of them, and every one that escapes makes it stronger. To win, you banish all four. The MANUAL explains how.',
    objective: 'Open HORSEMEN.',
    done: ctx => ctx.viewport === 'HORSEMEN',
    guide: ctx => needTab(ctx, 'HORSEMEN') ?? { hint: 'Have a look around.' }
  },
  {
    id: 'finale',
    title: 'END OF TRAINING',
    fullscreen: true,
    lines: [
      'That is the job. Rest at the Safehouse when your Humanity runs thin. Keep the witch-hunters off your signal. Keep the clock in your head.',
      'Training is over, {name}. London is real.'
    ],
    plain: 'From now on, mistakes count. If you forget something, the MANUAL explains everything, and you can replay this training from there.',
    continueLabel: 'BEGIN OPERATION'
  }
];

/** What to press right now for `step`, if it has a guide. */
export const getTutorialGuide = (step: TutorialStep | undefined, ctx: TutorialContext): TutorialGuide | null =>
  step?.guide ? step.guide(ctx) : null;

/** How the player points at things: guidance says "tap" on touch screens and "click" with a mouse. */
export type PointerKind = 'touch' | 'mouse';

const CLICK_FORMS: Record<string, string> = { tap: 'click', taps: 'clicks', tapped: 'clicked', tapping: 'clicking' };

/** Script text is written for touch ("tap"); with a mouse every form of "tap" becomes "click", keeping its case. */
export function adaptVerbs(text: string, pointer: PointerKind): string {
  if (pointer === 'touch') return text;
  return text.replaceAll(/\b(tap|taps|tapped|tapping)\b/gi, word => {
    const click = CLICK_FORMS[word.toLowerCase()];
    if (word === word.toUpperCase()) return click.toUpperCase();
    return word[0] === word[0].toUpperCase() ? click[0].toUpperCase() + click.slice(1) : click;
  });
}

export const fillTutorialText = (text: string, state: Pick<GameState, 'playerName' | 'agencyName'>, pointer: PointerKind = 'touch') =>
  adaptVerbs(text.replaceAll('{name}', (state.playerName || 'OPERATIVE').toUpperCase()).replaceAll('{agency}', (state.agencyName || 'DARKWIRE').toUpperCase()), pointer);
