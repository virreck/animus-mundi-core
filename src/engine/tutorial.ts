// src/engine/tutorial.ts
// The guided first case: a hand-built sector and a sandboxed game state.
// Nothing here is saved; finishing or skipping returns to the real run.
import { initialGameState, type GameState } from './state';
import type { SectorContract, SubGridNode } from './sectorGenerator';
import { getAmbiguityGroup } from './evidence';
import { WORLD_CLOCK_PAUSED_FLAG } from './world';

/** Marks the sandboxed training state. Autosave, travel and failure consequences are suspended. */
export const TUTORIAL_FLAG = 'tutorial_active';
/** After the tutorial: resume the saved run instead of starting a new one. */
export const TUTORIAL_RESUME_FLAG = 'tutorial_resume_run';
/** After the tutorial: go back to the title screen (replayed from the title manual). */
export const TUTORIAL_TITLE_FLAG = 'tutorial_return_title';
/** localStorage key remembering that the guided case has been seen (kept across save wipes). */
export const TUTORIAL_DONE_KEY = 'animus_mundi_tutorial_done_v1';

export const TUTORIAL_SECTOR_ID = 'caterham_churchyard';
export const TUTORIAL_SECTOR_LABEL = 'ST. LAWRENCE CRYPT';
export const TUTORIAL_TARGET_ID = '07_amon';
export const TUTORIAL_YOKAI_ID = 'yokai_kitsune';
export const TUTORIAL_SEAL_BONUS_SECONDS = 10;

export type TutorialReturn = 'NEW_RUN' | 'RESUME_RUN' | 'TITLE';

const room = (n: number) => `${TUTORIAL_SECTOR_ID}_t${n}`;
/** Room ids by tutorial role, for the step checks. */
export const TUTORIAL_ROOMS = {
  lychgate: room(1),
  nave: room(2),
  belfry: room(3),
  vestry: room(4),
  ossuary: room(5),
  sacristy: room(6),
  undercroft: room(7)
} as const;

/**
 * A fixed seven-room crypt that shows every mechanic exactly once:
 * a clean reading, a warded room with a degraded reading, a patrol, a witness,
 * a shrine, a second degraded reading left for deduction, and the anchor.
 */
export function buildTutorialContract(): SectorContract {
  const chain = [1, 2, 3, 4, 5, 6, 7];
  const coords: Record<number, [number, number]> = {
    1: [0.12, 0.5], 2: [0.26, 0.3], 3: [0.4, 0.58], 4: [0.53, 0.3], 5: [0.63, 0.72], 6: [0.75, 0.38], 7: [0.88, 0.6]
  };
  const base = (n: number, label: string, nodeType: SubGridNode['nodeType']): SubGridNode => ({
    id: room(n),
    index: n,
    label: `${n}: ${label}`,
    x: coords[n][0],
    y: coords[n][1],
    connections: chain.filter(m => Math.abs(m - n) === 1).map(room),
    wardLevel: 1,
    status: 'LOCKED',
    nodeType,
    hazard: 'NONE'
  });
  const organic = getAmbiguityGroup('serpent_scales')!;
  const radiant = getAmbiguityGroup('thermal_scorching')!;

  const subNodes: SubGridNode[] = [
    {
      ...base(1, 'LYCHGATE', 'ANOMALY'),
      signalChannel: 'AUDIO',
      signTag: 'wolf_howls',
      rawSignalSymptom: 'Deep, predatory lupine howls vibrating through the sub-bass spectrum.',
      forensicText: 'VOX LOG: Resonant wolf howls vibrate through the sub-bass band alongside massive claw gouges in oak doors.',
      salvageDrop: { itemId: 'scrap_metal', amount: 1, obols: 10 }
    },
    {
      ...base(2, 'NAVE', 'ANOMALY'),
      hazard: 'STATIC',
      signalChannel: 'MATTER',
      signTag: 'serpent_scales',
      ambiguityGroupId: organic.id,
      rawSignalSymptom: organic.symptom,
      forensicText: 'ASSAY LOG: Palm-sized iridescent serpent scales and neurotoxic venom residue coat the threshold.',
      salvageDrop: { itemId: 'alchemical_distillate', amount: 1, obols: 10 }
    },
    { ...base(3, 'BELFRY', 'PATROL'), patrolActive: true, salvageDrop: { itemId: 'alchemical_distillate', amount: 1, obols: 12 } },
    {
      ...base(4, 'VESTRY', 'WITNESS'),
      witnessName: 'Retired verger, very calm, too calm',
      witnessText: 'It came up out of the dark like a wolf. But wrong — its tail was a ███████’s, and when it opened its mouth it was vomiting ██████.',
      salvageDrop: { itemId: 'scrap_metal', amount: 1, obols: 8 }
    },
    { ...base(5, 'OSSUARY', 'SHRINE'), shrineYokaiId: TUTORIAL_YOKAI_ID, salvageDrop: { itemId: 'alchemical_distillate', amount: 1, obols: 15 } },
    {
      ...base(6, 'SACRISTY', 'ANOMALY'),
      signalChannel: 'ASTRAL',
      signTag: 'thermal_scorching',
      ambiguityGroupId: radiant.id,
      rawSignalSymptom: radiant.symptom,
      forensicText: 'AUSPEX LOG: Vitrified brick indicates a localized 1,200°C thermal spike with zero smoke or fuel source.',
      salvageDrop: { itemId: 'cursed_earth', amount: 1, obols: 10 }
    },
    { ...base(7, 'UNDERCROFT [ANCHOR]', 'ANCHOR'), salvageDrop: { itemId: 'cursed_earth', amount: 2, obols: 20 } }
  ];

  return {
    sectorId: TUTORIAL_SECTOR_ID,
    sectorLabel: TUTORIAL_SECTOR_LABEL,
    targetGoetiaId: TUTORIAL_TARGET_ID,
    activeSubNodeId: null,
    selectedSubNodeId: room(1),
    subNodes,
    discoveredLogs: [],
    quirk: 'NONE'
  };
}

export interface OperativeIdentity {
  name: string;
  portrait: string;
  agency: string;
}

/** A fresh, sandboxed run sitting at the tutorial crypt with everything the lesson needs. */
export function createTutorialState(identity: OperativeIdentity, returnTo: TutorialReturn): GameState {
  return {
    ...initialGameState,
    gameStage: 'ACTIVE',
    playerName: identity.name,
    playerPortrait: identity.portrait,
    agencyName: identity.agency,
    currentNode: TUTORIAL_SECTOR_ID,
    inventory: { obols: 120, scrap_metal: 1, cursed_earth: 1, alchemical_distillate: 2 },
    contracts: { [TUTORIAL_SECTOR_ID]: buildTutorialContract() },
    flags: {
      [TUTORIAL_FLAG]: true,
      [WORLD_CLOCK_PAUSED_FLAG]: true,
      ...(returnTo === 'RESUME_RUN' ? { [TUTORIAL_RESUME_FLAG]: true } : {}),
      ...(returnTo === 'TITLE' ? { [TUTORIAL_TITLE_FLAG]: true } : {})
    }
  };
}

export const isTraining = (state: Pick<GameState, 'flags'>) => !!state.flags[TUTORIAL_FLAG];
