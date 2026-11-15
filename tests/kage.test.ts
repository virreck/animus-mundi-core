// tests/kage.test.ts
// KAGE NO SHO: shrine-gated pages, bonds, renewal rites and pacts with consequences.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer } from '../src/engine/reducer';
import { getMaxHumanity, type GameState } from '../src/engine/state';
import {
  KAGE_TUNING, YOKAI_OFFERINGS, BOND_THREE_EASE, getBondLevel, getMaxCharges, getOffense, isPageWritten, whyCannotBind, canRenew
} from '../src/engine/kage';
import { allYokai } from '../src/content/yokai';
import { YOKAI_DAEMON_SPECS } from '../src/content/yokaiSpecs';
import { newRun, blankRun, apply } from './helpers';

const bind = (s: GameState, yokaiId: string) => gameReducer(s, { type: 'DRAFT_CONTRACT', payload: { yokaiId, costs: {} } });
const secure = (s: GameState, sectorId: string) => gameReducer(s, { type: 'SET_FLAG', payload: { flagId: `sector_secured_${sectorId}`, value: true } });
const bonded = (s: GameState, yokaiId: string, points: number) => ({ ...s, kage: { ...s.kage, bond: { ...s.kage.bond, [yokaiId]: points } } });

test('every Yokai has a spec, an offering and a Bond III effect', () => {
  for (const y of allYokai) {
    assert.ok(YOKAI_DAEMON_SPECS[y.id], `${y.id} spec`);
    assert.ok(YOKAI_OFFERINGS[y.id], `${y.id} offering`);
    assert.ok(BOND_THREE_EASE[y.id], `${y.id} Bond III text`);
    assert.ok(y.unlockFlag, `${y.id} needs a shrine flag`);
  }
});

test('pages stay unwritten — and unbindable — until the shrine is woken', () => {
  let s = blankRun();
  assert.equal(isPageWritten(s, 'yokai_tengu'), false);
  assert.equal(whyCannotBind(s, 'yokai_tengu'), 'UNWRITTEN');
  assert.deepEqual(bind(s, 'yokai_tengu').tetheredYokai, []);
  s = gameReducer(s, { type: 'SET_FLAG', payload: { flagId: 'tengu_feather_found', value: true } });
  assert.deepEqual(bind(s, 'yokai_tengu').tetheredYokai, ['yokai_tengu']);
});

test('bond grows with invocations and secured sectors, and adds charges', () => {
  let s = bind(newRun(), 'yokai_kitsune');
  const base = YOKAI_DAEMON_SPECS.yokai_kitsune.maxCharges;
  assert.equal(getMaxCharges(s, 'yokai_kitsune'), base);
  s = gameReducer(s, { type: 'CONSUME_YOKAI_CHARGE', payload: { yokaiId: 'yokai_kitsune' } });
  s = secure(s, 'caterham_churchyard');
  assert.equal(s.kage.bond.yokai_kitsune, KAGE_TUNING.bondPerInvocation + KAGE_TUNING.bondPerSecuredSector);
  assert.equal(getBondLevel(s, 'yokai_kitsune'), 2);
  assert.equal(getMaxCharges(s, 'yokai_kitsune'), base + 1);
  assert.ok(s.notices.some(n => n.kind === 'KAGE' && n.text.includes('BOND II')));
  s = bonded(s, 'yokai_kitsune', KAGE_TUNING.bondThresholds[1]);
  assert.equal(getMaxCharges(s, 'yokai_kitsune'), base + 2);
});

test('burning a daemon dry sends it away, offended for one sector', () => {
  let s = bind(newRun(), 'yokai_kitsune');
  for (let i = 0; i < YOKAI_DAEMON_SPECS.yokai_kitsune.maxCharges; i++) s = gameReducer(s, { type: 'CONSUME_YOKAI_CHARGE', payload: { yokaiId: 'yokai_kitsune' } });
  assert.deepEqual(s.tetheredYokai, []);
  assert.equal(getOffense(s, 'yokai_kitsune'), KAGE_TUNING.burnedDryOffense);
  assert.equal(whyCannotBind(s, 'yokai_kitsune'), 'OFFENDED');
  assert.deepEqual(bind(s, 'yokai_kitsune').tetheredYokai, [], 'offended spirits refuse');
  s = secure(s, 'caterham_churchyard');
  assert.equal(getOffense(s, 'yokai_kitsune'), 0, 'one closed sector later it will deal with you again');
  assert.deepEqual(bind(s, 'yokai_kitsune').tetheredYokai, ['yokai_kitsune']);
});

test('severing a pact by hand offends for three sectors and costs bond', () => {
  let s = bonded(bind(newRun(), 'yokai_tengu'), 'yokai_tengu', 5);
  s = gameReducer(s, { type: 'BREAK_PACT', payload: 'yokai_tengu' });
  assert.deepEqual(s.tetheredYokai, []);
  assert.equal(getOffense(s, 'yokai_tengu'), KAGE_TUNING.brokenPactOffense);
  assert.equal(s.kage.bond.yokai_tengu, 5 - KAGE_TUNING.brokenPactBondLoss);
  s = gameReducer(secure(secure(s, 'a'), 'b'), { type: 'SET_FLAG', payload: { flagId: 'sector_failed_c', value: true } });
  assert.equal(getOffense(s, 'yokai_tengu'), 0, 'lost sectors count too');
});

test('renewal rites spend ink and the favoured offering to restore every charge', () => {
  let s = bind(newRun(), 'yokai_kitsune');
  s = gameReducer(s, { type: 'CONSUME_YOKAI_CHARGE', payload: { yokaiId: 'yokai_kitsune' } });
  assert.equal(canRenew(s, 'yokai_kitsune'), false, 'no ink yet');
  const offering = YOKAI_OFFERINGS.yokai_kitsune;
  s = apply(s, { type: 'MODIFY_INK', payload: 1 }, { type: 'MODIFY_INVENTORY', payload: { itemId: offering.itemId, amount: offering.amount } });
  assert.ok(canRenew(s, 'yokai_kitsune'));
  s = gameReducer(s, { type: 'RENEW_PACT', payload: 'yokai_kitsune' });
  assert.equal(s.yokaiCharges.yokai_kitsune, getMaxCharges(s, 'yokai_kitsune'));
  assert.equal(s.ink, 0);
  assert.equal(s.inventory[offering.itemId] || 0, 0);
  assert.equal(s.kage.bond.yokai_kitsune, KAGE_TUNING.bondPerInvocation + KAGE_TUNING.bondPerRenewal);
});

test('hungry daemons take tribute when a sector closes — or weaken, then leave', () => {
  const offering = YOKAI_OFFERINGS.yokai_kamaitachi;
  assert.ok(offering.hungry);
  let s = apply(bind(newRun(), 'yokai_kamaitachi'), { type: 'MODIFY_INVENTORY', payload: { itemId: offering.itemId, amount: 1 } });
  s = secure(s, 'one');
  assert.equal(s.inventory[offering.itemId], 0, 'tribute paid');
  assert.ok(s.tetheredYokai.includes('yokai_kamaitachi'));
  // bond is now 2 (secured sector): a missed tribute costs 2 bond
  s = secure(s, 'two');
  assert.ok(s.tetheredYokai.includes('yokai_kamaitachi'));
  assert.equal(s.kage.bond.yokai_kamaitachi, 2, '+2 for the sector, -2 for the missed tribute');
  s = bonded(s, 'yokai_kamaitachi', 0);
  s = gameReducer(s, { type: 'SET_FLAG', payload: { flagId: 'sector_failed_three', value: true } });
  assert.deepEqual(s.tetheredYokai, [], 'with no bond left to lose it walks out');
  assert.equal(getOffense(s, 'yokai_kamaitachi'), KAGE_TUNING.missedTributeOffense);
});

test('Bond III softens drawbacks', () => {
  const zashiki = bind(newRun(), 'yokai_zashiki');
  assert.equal(getMaxHumanity(zashiki), 85);
  assert.equal(getMaxHumanity(bonded(zashiki, 'yokai_zashiki', 7)), 92);
  const tengu = bind(gameReducer(newRun(), { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 50 } }), 'yokai_tengu');
  assert.equal(gameReducer(tengu, { type: 'TRAVEL', payload: 'caterham_asylum' }).inventory.obols, 45);
  assert.equal(gameReducer(bonded(tengu, 'yokai_tengu', 7), { type: 'TRAVEL', payload: 'caterham_asylum' }).inventory.obols, 48);
});

test("old saves keep their bound daemons' pages", () => {
  const s = { ...blankRun(), tetheredYokai: ['yokai_baku'] };
  assert.ok(isPageWritten(s, 'yokai_baku'));
});
