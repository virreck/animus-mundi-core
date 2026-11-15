// src/engine/kage.ts
// KAGE NO SHO — the Book of Shadows. Rules for discovering Yokai pages, growing bonds,
// renewing pacts with Esoteric Ink, and the consequences of breaking them.
import { allYokai } from '../content/yokai';
import { YOKAI_DAEMON_SPECS } from '../content/yokaiSpecs';
import type { GameState, YokaiId, EngineNotice } from './state';

// ---------------------------------------------------------------------------
// TUNING
// ---------------------------------------------------------------------------
export const KAGE_TUNING = {
  /** Bond points needed for Bond II and Bond III. */
  bondThresholds: [3, 7] as const,
  /** Bond points per active invocation, per sector secured while bound, per renewal, per revisited shrine. */
  bondPerInvocation: 1,
  bondPerSecuredSector: 2,
  bondPerRenewal: 1,
  bondPerShrineRevisit: 1,
  /** Spending the last charge: the daemon leaves, offended for this many closed sectors, and loses this much bond. */
  burnedDryOffense: 1,
  burnedDryBondLoss: 1,
  /** Breaking a pact by hand while it still has charges. */
  brokenPactOffense: 3,
  brokenPactBondLoss: 3,
  /** Missing a tribute: bond lost; if bond would go negative the daemon walks out, offended. */
  missedTributeBondLoss: 2,
  missedTributeOffense: 2,
  /** Renewal rite: Esoteric Ink spent (plus the spirit's favoured offering). */
  renewalInk: 1
} as const;

/** Each spirit's favoured offering, used for renewal rites (and tribute, for the hungry ones). */
export const YOKAI_OFFERINGS: Record<YokaiId, { itemId: string; amount: number; label: string; hungry: boolean }> = {
  yokai_kitsune: { itemId: 'alchemical_distillate', amount: 1, label: 'a saucer of distillate, as if it were sake', hungry: false },
  yokai_tengu: { itemId: 'scrap_metal', amount: 1, label: 'a bright scrap of metal for its nest', hungry: false },
  yokai_baku: { itemId: 'alchemical_distillate', amount: 1, label: 'one dream, bottled', hungry: true },
  yokai_zashiki: { itemId: 'obols', amount: 10, label: 'sweets, paid in Obols', hungry: true },
  yokai_kameosa: { itemId: 'cursed_earth', amount: 1, label: 'grave-soil to keep its jar full', hungry: true },
  yokai_kamaitachi: { itemId: 'scrap_metal', amount: 1, label: 'steel to whet its sickles', hungry: true },
  yokai_amabie: { itemId: 'alchemical_distillate', amount: 1, label: 'clean water, distilled', hungry: false },
  yokai_noppera: { itemId: 'cursed_earth', amount: 1, label: 'a handful of earth to wear as a face', hungry: false }
};

/** What Bond III softens for each daemon (shown on its page). */
export const BOND_THREE_EASE: Record<YokaiId, string> = {
  yokai_kitsune: 'Masking drains 1% Humanity instead of 2%.',
  yokai_tengu: 'The wind\u2019s toll falls to 2 Obols per trip.',
  yokai_baku: 'Resting costs 5 Obols instead of 10.',
  yokai_zashiki: 'Maximum Humanity rises to 92%.',
  yokai_kameosa: 'Each synthesis costs 1% Humanity instead of 2%.',
  yokai_kamaitachi: 'A failed Grand Rite costs ×1.5 entropy instead of ×2.',
  yokai_amabie: 'Its toll falls to 10 Obols.',
  yokai_noppera: 'The faceless illusion only adds 2% Heat.'
};

// ---------------------------------------------------------------------------
// SELECTORS
// ---------------------------------------------------------------------------
type KageState = Pick<GameState, 'kage' | 'flags' | 'tetheredYokai'>;

export const getYokaiDef = (id: YokaiId) => allYokai.find(y => y.id === id);

/** A page is written once its shrine has been woken (or the daemon is already bound from an older save). */
export function isPageWritten(state: KageState, id: YokaiId): boolean {
  const flag = getYokaiDef(id)?.unlockFlag;
  return state.tetheredYokai.includes(id) || (!!flag && !!state.flags[flag]);
}

export const countWrittenPages = (state: KageState) => allYokai.filter(y => isPageWritten(state, y.id)).length;

export const getBondPoints = (state: Pick<GameState, 'kage'>, id: YokaiId) => state.kage?.bond?.[id] || 0;

/** 1, 2 or 3. */
export function getBondLevel(state: Pick<GameState, 'kage'>, id: YokaiId): 1 | 2 | 3 {
  const points = getBondPoints(state, id);
  const [two, three] = KAGE_TUNING.bondThresholds;
  return points >= three ? 3 : points >= two ? 2 : 1;
}

/** Bond III softens the daemon's passive drawback. */
export const isBondThree = (state: Pick<GameState, 'kage'>, id: YokaiId) => getBondLevel(state, id) === 3;

/** Base charges, +1 at Bond II, +1 more at Bond III. */
export const getMaxCharges = (state: Pick<GameState, 'kage'>, id: YokaiId) =>
  (YOKAI_DAEMON_SPECS[id]?.maxCharges || 1) + (getBondLevel(state, id) - 1);

/** Sectors that must still close before an offended spirit will deal with you again. */
export const getOffense = (state: Pick<GameState, 'kage'>, id: YokaiId) => state.kage?.offended?.[id] || 0;

export type BindBlock = 'UNWRITTEN' | 'OFFENDED' | 'BOUND' | 'SATURATED' | null;

export function whyCannotBind(state: KageState, id: YokaiId): BindBlock {
  if (state.tetheredYokai.includes(id)) return 'BOUND';
  if (!isPageWritten(state, id)) return 'UNWRITTEN';
  if (getOffense(state, id) > 0) return 'OFFENDED';
  if (state.tetheredYokai.length >= 2) return 'SATURATED';
  return null;
}

export function canRenew(state: GameState, id: YokaiId): boolean {
  if (!state.tetheredYokai.includes(id)) return false;
  const offering = YOKAI_OFFERINGS[id];
  const charges = state.yokaiCharges[id] ?? getMaxCharges(state, id);
  return (
    charges < getMaxCharges(state, id) &&
    (state.ink || 0) >= KAGE_TUNING.renewalInk &&
    (!offering || (state.inventory[offering.itemId] || 0) >= offering.amount)
  );
}

// ---------------------------------------------------------------------------
// STATE CHANGES (pure; called from the reducer)
// ---------------------------------------------------------------------------
let noticeSeq = 0;
const notice = (text: string): EngineNotice => ({ id: Date.now() * 1000 + 500 + (noticeSeq++ % 500), kind: 'KAGE', text });
const nameOf = (id: YokaiId) => getYokaiDef(id)?.nameEn.toUpperCase() || id;

export function addBond(state: GameState, id: YokaiId, amount: number): GameState {
  const before = getBondLevel(state, id);
  const bond = { ...state.kage.bond, [id]: Math.max(0, getBondPoints(state, id) + amount) };
  const next = { ...state, kage: { ...state.kage, bond } };
  const after = getBondLevel(next, id);
  if (after > before) {
    return { ...next, notices: [...next.notices, notice(`BOND ${['I', 'II', 'III'][after - 1]}: ${nameOf(id)} draws closer to you.`)] };
  }
  return next;
}

/** Removes a daemon from the tether and marks it offended for `sectors` closed sectors. */
export function departOffended(state: GameState, id: YokaiId, sectors: number, bondLoss: number): GameState {
  const tether = state.tetheredYokai.filter(y => y !== id);
  const yokaiCharges = { ...state.yokaiCharges };
  delete yokaiCharges[id];
  const withBond = addBond(state, id, -bondLoss);
  return {
    ...withBond,
    tetheredYokai: tether,
    activeContracts: tether,
    yokaiCharges,
    kage: { ...withBond.kage, offended: { ...withBond.kage.offended, [id]: Math.max(getOffense(withBond, id), sectors) } }
  };
}

/** Renewal rite: ink + offering restores every charge and deepens the bond. */
export function renewPact(state: GameState, id: YokaiId): GameState {
  if (!canRenew(state, id)) return state;
  const offering = YOKAI_OFFERINGS[id];
  const inventory = { ...state.inventory };
  if (offering) inventory[offering.itemId] = (inventory[offering.itemId] || 0) - offering.amount;
  const renewed: GameState = {
    ...state,
    inventory,
    ink: (state.ink || 0) - KAGE_TUNING.renewalInk,
    yokaiCharges: { ...state.yokaiCharges, [id]: getMaxCharges(state, id) }
  };
  return addBond(renewed, id, KAGE_TUNING.bondPerRenewal);
}

const closedSectors = (state: Pick<GameState, 'flags'>) =>
  Object.keys(state.flags).filter(f => (f.startsWith('sector_secured_') || f.startsWith('sector_failed_')) && state.flags[f]);

/**
 * Runs whenever a sector closes (secured or lost): offended spirits cool off, bound daemons
 * gain bond for secured sectors, and hungry daemons take their tribute.
 */
export function applySectorClosures(prev: GameState, next: GameState): GameState {
  const before = new Set(closedSectors(prev));
  const newly = closedSectors(next).filter(f => !before.has(f));
  if (newly.length === 0 || !next.kage) return next;
  let s = next;
  for (const flag of newly) {
    const secured = flag.startsWith('sector_secured_');

    // Offended spirits cool off
    const offended = { ...s.kage.offended };
    Object.keys(offended).forEach(id => {
      offended[id] -= 1;
      if (offended[id] <= 0) {
        delete offended[id];
        s = { ...s, notices: [...s.notices, notice(`${nameOf(id)} will deal with you again.`)] };
      }
    });
    s = { ...s, kage: { ...s.kage, offended } };

    for (const id of [...s.tetheredYokai]) {
      if (secured) s = addBond(s, id, KAGE_TUNING.bondPerSecuredSector);
      const offering = YOKAI_OFFERINGS[id];
      if (!offering?.hungry) continue;
      if ((s.inventory[offering.itemId] || 0) >= offering.amount) {
        s = {
          ...s,
          inventory: { ...s.inventory, [offering.itemId]: (s.inventory[offering.itemId] || 0) - offering.amount },
          notices: [...s.notices, notice(`TRIBUTE: ${nameOf(id)} takes ${offering.label}.`)]
        };
      } else if (getBondPoints(s, id) >= KAGE_TUNING.missedTributeBondLoss) {
        s = addBond(s, id, -KAGE_TUNING.missedTributeBondLoss);
        s = { ...s, notices: [...s.notices, notice(`TRIBUTE MISSED: ${nameOf(id)} goes hungry. Its bond weakens.`)] };
      } else {
        s = departOffended(s, id, KAGE_TUNING.missedTributeOffense, 0);
        s = { ...s, notices: [...s.notices, notice(`PACT BROKEN: ${nameOf(id)} was owed ${offering.label} and has left you.`)] };
      }
    }
  }
  return s;
}
