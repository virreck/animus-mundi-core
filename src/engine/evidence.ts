// src/engine/evidence.ts
// Deduction layer: ambiguous forensic readings, anchor resonance, redacted witness
// statements and suspect scoring. Everything here is generated from data every
// demon already has (clue tags, court, rank, description) — no per-demon writing.
import type { GoeticRank, HorsemanAllegiance, GoetiaLieutenant } from '../content/goetia/types';
import type { ForensicChannel } from './sectorGenerator';

// ---------------------------------------------------------------------------
// 1. AMBIGUITY GROUPS — phenomena an instrument can't always tell apart
// ---------------------------------------------------------------------------
export interface AmbiguityGroup {
  id: string;
  channel: ForensicChannel;
  tags: string[];
  /** Room symptom shown before decoding (replaces the precise per-tag symptom). */
  symptom: string;
  /** Decoded-but-unresolved forensic report. */
  report: string;
}

export const AMBIGUITY_GROUPS: AmbiguityGroup[] = [
  {
    id: 'VOCAL', channel: 'AUDIO',
    tags: ['hoarse_voice', 'cryptic_whispers', 'avian_screeches'],
    symptom: 'Broken mid-band vocalisations bleeding through the walls — too compressed to tell what is making them.',
    report: 'VOX LOG [DEGRADED]: A layered vocal presence in the 1–4 kHz band. Profile fits a rasping voice, a chorus of whispers, or bird-like shrieks. Signal too smeared to separate.'
  },
  {
    id: 'LOW_FREQ', channel: 'AUDIO',
    tags: ['earthquake_tremors', 'wolf_howls', 'tempest_winds'],
    symptom: 'A sub-bass rumble you feel in your teeth before you hear it.',
    report: 'VOX LOG [DEGRADED]: Sustained infrasound under 40 Hz. Could be seismic pounding, a lupine howl pitched down, or a trapped cyclonic gale. Waveform envelope inconclusive.'
  },
  {
    id: 'OPTICAL', channel: 'ASTRAL',
    tags: ['sudden_invisibility', 'illusory_terrain', 'astral_projection'],
    symptom: 'Light and distance behave wrongly here; your torch beam keeps arriving late.',
    report: 'AUSPEX LOG [DEGRADED]: Optical-spatial distortion field. Consistent with photon refraction around an unseen body, non-Euclidean geometry, or an ectoplasmic tether. Cannot isolate the source.'
  },
  {
    id: 'PSYCHIC', channel: 'ASTRAL',
    tags: ['mind_fog', 'temporal_distortion', 'lost_languages'],
    symptom: 'Your notes from thirty seconds ago are in a hand you don’t recognise.',
    report: 'AUSPEX LOG [DEGRADED]: Cognitive-linguistic static. Readings fit memory erosion, chronometric drift, or xenoglossic script bleed. The sensor itself is losing track of time.'
  },
  {
    id: 'RADIANT', channel: 'ASTRAL',
    tags: ['star_alignment', 'necrotic_stasis', 'thermal_scorching'],
    symptom: 'Patterned marks on every surface — burnt in, or frozen in, it is hard to say which.',
    report: 'AUSPEX LOG [DEGRADED]: Extreme radiant imprinting on stone and glass. Could be a celestial burn-map, necrotic hoarfrost, or pyroclastic vitrification. Thermal baseline unreadable.'
  },
  {
    id: 'ORGANIC', channel: 'MATTER',
    tags: ['amphibian_tracks', 'serpent_scales', 'water_corruption'],
    symptom: 'Cold, wet organic residue slicks the floor and lower walls.',
    report: 'ASSAY LOG [DEGRADED]: Wet organic contamination. Assay fits amphibian mucus, ophidian scale-slough, or abyssal brine. Sample too diluted to type.'
  },
  {
    id: 'PUTRID', channel: 'MATTER',
    tags: ['corpse_theft', 'plague_vectors', 'sulfur_stench'],
    symptom: 'A reek of rot and something chemical underneath it.',
    report: 'ASSAY LOG [DEGRADED]: Putrefactive compounds detected. Profile fits disturbed cadavers, pestilent spores, or brimstone off-gassing. Volatiles have cross-contaminated.'
  },
  {
    id: 'FERROUS', channel: 'MATTER',
    tags: ['metal_transmutation', 'weapon_decay', 'blood_frenzy'],
    symptom: 'Everything here tastes of iron.',
    report: 'ASSAY LOG [DEGRADED]: Heavy iron signature. Could be transmuted metal, flash-oxidised steel, or a great deal of spilled blood. The assay can’t tell rust from haemoglobin at this concentration.'
  }
];

const GROUP_BY_TAG: Record<string, AmbiguityGroup> = Object.fromEntries(
  AMBIGUITY_GROUPS.flatMap(g => g.tags.map(t => [t, g] as const))
);

export const getAmbiguityGroup = (tag: string): AmbiguityGroup | undefined => GROUP_BY_TAG[tag];

/** Humanity & heat cost of `refine` (re-processing a degraded reading). */
export const REFINE_COST = { humanity: 4, heat: 8 };
/** Cost of the second, deeper anchor attunement that reveals rank. */
export const DEEP_ATTUNE_COST = { humanity: 8, heat: 10 };

// ---------------------------------------------------------------------------
// 2. ANCHOR RESONANCE — court and rank
// ---------------------------------------------------------------------------
export const COURT_RESONANCE: Record<HorsemanAllegiance, string> = {
  CONQUEST: 'The vessel turns cold and bright, ringing in sympathy with the Crowned Bow. This anchor answers to CONQUEST.',
  WAR: 'The vessel grows hot enough to blister and hums like a struck blade. This anchor answers to WAR.',
  FAMINE: 'The vessel goes hollow and light, its brass dulling like an empty scale-pan. This anchor answers to FAMINE.',
  DEATH: 'The vessel frosts over and falls utterly silent. This anchor answers to DEATH.'
};

export const RANK_RESONANCE: Record<GoeticRank, string> = {
  King: 'The seal pulls hard toward GOLD — solar authority. You are hunting a KING.',
  Prince: 'The seal drinks in SACRED SAND — a jovian, princely bearing. You are hunting a PRINCE.',
  Duke: 'The seal crawls along COPPER — venusian, ducal. You are hunting a DUKE.',
  Marquis: 'The seal shimmers toward SILVER — lunar, a Marquis of the night. You are hunting a MARQUIS.',
  President: 'The seal runs like QUICKSILVER — mercurial, presidential. You are hunting a PRESIDENT.',
  Earl: 'The seal bites at COLD IRON — martial, comital. You are hunting an EARL.',
  Knight: 'The seal sinks toward LEAD — saturnine, a lone Knight. You are hunting a KNIGHT.'
};

// ---------------------------------------------------------------------------
// 3. WITNESS STATEMENTS — redacted from the demon's existing description
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'as', 'at', 'by', 'for', 'with', 'from', 'into', 'his', 'her',
  'he', 'she', 'it', 'its', 'is', 'are', 'was', 'be', 'that', 'this', 'who', 'whom', 'which', 'men', 'man', 'him',
  'appears', 'appear', 'also', 'can', 'will', 'all', 'any', 'their', 'them', 'they', 'but', 'not', 'when', 'then'
]);

const WITNESSES = [
  'Night porter, still shaking', 'Off-duty constable, refuses to give a name', 'Choir volunteer, sedated',
  'Rough sleeper, lucid for a moment', 'Delivery driver, statement taken at the cordon', 'Retired verger, very calm, too calm',
  'Security guard, hasn’t blinked in an hour', 'Student, recording on a cracked phone'
];

export interface WitnessStatement {
  witness: string;
  text: string;
}

/**
 * Redacts a share of the meaningful words in `description`. Stop words are left alone so the
 * sentence still reads; any word matching `forbidden` (the demon's own name) is always redacted.
 */
export function redactWitnessStatement(
  description: string,
  ratio: number,
  forbidden: string[] = [],
  rng: () => number = Math.random
): WitnessStatement {
  const tokens = description.split(/(\s+)/);
  const lowerForbidden = forbidden.map(f => f.toLowerCase());
  const contentIdx: number[] = [];
  tokens.forEach((tok, i) => {
    const bare = tok.replace(/[^A-Za-zÀ-ɏ'-]/g, '').toLowerCase();
    if (bare.length >= 3 && !STOP_WORDS.has(bare)) contentIdx.push(i);
  });

  const toRedact = new Set<number>();
  // Always hide the demon's own name
  contentIdx.forEach(i => {
    const bare = tokens[i].replace(/[^A-Za-z'-]/g, '').toLowerCase();
    if (lowerForbidden.some(f => bare.includes(f))) toRedact.add(i);
  });
  // Shuffle the rest and redact `ratio` of them, but always leave at least two words readable
  const pool = contentIdx.filter(i => !toRedact.has(i));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const target = Math.min(Math.round(pool.length * ratio), Math.max(0, pool.length - 2));
  pool.slice(0, target).forEach(i => toRedact.add(i));

  const text = tokens
    .map((tok, i) => (toRedact.has(i) ? tok.replace(/[A-Za-zÀ-ɏ'-]/g, '█') : tok))
    .join('');

  return { witness: WITNESSES[Math.floor(rng() * WITNESSES.length)], text };
}

// ---------------------------------------------------------------------------
// 4. EVIDENCE & SUSPECT SCORING
// ---------------------------------------------------------------------------
export type EvidenceKind = 'PHENOMENON' | 'WITNESS' | 'COURT' | 'RANK';

export interface EvidenceLog {
  id: string;
  nodeLabel: string;
  text: string;
  channel: string;
  /** Missing on logs from older saves — treated as an unscored note. */
  kind?: EvidenceKind;
  /** PHENOMENON: tags this reading could be. One tag = resolved. */
  candidates?: string[];
  /** PHENOMENON: the true tag (used by `refine`). Never shown to the player. */
  trueTag?: string;
  /** COURT / RANK value. */
  value?: string;
  /** WITNESS: who gave the statement. */
  witness?: string;
}

export const isAmbiguous = (log: EvidenceLog) => log.kind === 'PHENOMENON' && (log.candidates?.length || 0) > 1;

export interface SuspectFit {
  matched: number;
  /** Number of scorable evidence entries (witness statements are judged by the player). */
  total: number;
  contradicted: boolean;
}

export function scoreSuspect(goetia: GoetiaLieutenant, signs: string[], evidence: EvidenceLog[]): SuspectFit {
  let matched = 0;
  let total = 0;
  let contradicted = false;
  evidence.forEach(ev => {
    let fits: boolean | null = null;
    if (ev.kind === 'PHENOMENON' && ev.candidates?.length) fits = ev.candidates.some(t => signs.includes(t));
    else if (ev.kind === 'COURT' && ev.value) fits = goetia.allegiance === ev.value;
    else if (ev.kind === 'RANK' && ev.value) fits = goetia.rank === ev.value;
    if (fits === null) return;
    total++;
    if (fits) matched++;
    else contradicted = true;
  });
  return { matched, total, contradicted };
}
