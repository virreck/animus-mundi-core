// tests/world.test.ts
// The living map: ripening anchors, auto-manifestation, spread from loose demons, Grand Rite penalties.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer } from '../src/engine/reducer';
import { generateSectorContract, type SectorContract } from '../src/engine/sectorGenerator';
import { MACRO_SECTORS } from '../src/content/map';
import { allGoetia } from '../src/content/goetia';
import {
  WORLD_TUNING, WORLD_CLOCK_PAUSED_FLAG, getOpenSectors, getRipeness, getRipenRate,
  getBanishmentOdds, getBanishmentSeconds, isSectorUnlocked
} from '../src/engine/world';
import type { GameState } from '../src/engine/state';
import { newRun, apply } from './helpers';

/** A run with contracts for every sector, like the real game creates on first boot. */
function runWithContracts(): GameState {
  const contracts: Record<string, SectorContract> = {};
  const used: string[] = [];
  for (const sec of MACRO_SECTORS.filter(s => s.id !== 'safehouse')) {
    const c = generateSectorContract(sec.id, sec.label, [], used);
    used.push(c.targetGoetiaId);
    contracts[sec.id] = c;
  }
  return gameReducer(newRun(), { type: 'SET_CONTRACTS', payload: contracts });
}

const travel = (s: GameState, to: string) => gameReducer(s, { type: 'TRAVEL', payload: to });

test('only the three starting sectors are open at the beginning', () => {
  assert.deepEqual(getOpenSectors(newRun()).map(s => s.id).sort(), ['caterham_asylum', 'caterham_churchyard', 'chaldon_quarry']);
});

test('each trip ripens every open anchor except the one you are heading into', () => {
  const s = travel(runWithContracts(), 'caterham_churchyard');
  assert.equal(getRipeness(s, 'caterham_churchyard'), 0);
  assert.equal(getRipeness(s, 'caterham_asylum'), WORLD_TUNING.ripenBase);
  assert.equal(getRipeness(s, 'chaldon_quarry'), WORLD_TUNING.ripenBase);
  assert.equal(getRipeness(s, 'croydon_relay'), 0, 'locked sectors do not ripen');
});

test('resting at the Safehouse is one tick (two with Baku)', () => {
  const s = gameReducer(runWithContracts(), { type: 'REST_AT_SAFEHOUSE', payload: { heal: 30, time: 4 } });
  assert.equal(getRipeness(s, 'caterham_asylum'), WORLD_TUNING.ripenBase);
  const baku = apply(runWithContracts(),
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_baku', costs: {}, maxCharges: 2 } },
    { type: 'REST_AT_SAFEHOUSE', payload: { heal: 30, time: 4 } }
  );
  assert.equal(getRipeness(baku, 'caterham_asylum'), WORLD_TUNING.ripenBase * 2);
});

test('higher entropy ripens anchors faster', () => {
  const calm = runWithContracts();
  const frayed = gameReducer(calm, { type: 'MODIFY_GLOBAL_ENTROPY', payload: 60 });
  assert.equal(getRipenRate(frayed, 'caterham_asylum') - getRipenRate(calm, 'caterham_asylum'), 3);
});

test('warnings fire at 50 / 75 / 90 and a fully ripe anchor manifests on its own', () => {
  let s = runWithContracts();
  const target = s.contracts.caterham_asylum.targetGoetiaId;
  const warnings: string[] = [];
  for (let i = 0; i < 40 && !s.flags.sector_failed_caterham_asylum; i++) {
    s = travel(s, i % 2 ? 'safehouse' : 'caterham_churchyard');
    s.notices.forEach(n => warnings.push(`${n.kind}:${n.text}`));
    s = gameReducer(s, { type: 'ACK_NOTICES', payload: s.notices.map(n => n.id) });
  }
  assert.equal(s.flags.sector_failed_caterham_asylum, true);
  assert.ok(s.releasedGoetia.includes(target));
  assert.equal(s.manifestations[target], 'caterham_asylum');
  assert.equal(warnings.filter(w => w.startsWith('WARN') && w.includes('CATERHAM ASYLUM')).length, 3);
  assert.ok(warnings.some(w => w.startsWith('MANIFEST') && w.includes('CATERHAM ASYLUM')));
  assert.ok(s.globalEntropy >= WORLD_TUNING.autoManifestEntropy);
});

test('a lost sector opens its neighbours, which then start ripening', () => {
  const s = apply(runWithContracts(), { type: 'RELEASE_GOETIA', payload: { goetiaId: '01_bael', sectorId: 'caterham_asylum' } });
  const precinct = MACRO_SECTORS.find(x => x.id === 'malleus_precinct')!;
  assert.ok(isSectorUnlocked(s, precinct));
  assert.ok(getRipeness(travel(s, 'safehouse'), 'malleus_precinct') > 0);
});

test('manifested demons spread heat and entropy, and speed up their neighbours', () => {
  const base = runWithContracts();
  const haunted = apply(base, { type: 'RELEASE_GOETIA', payload: { goetiaId: '01_bael', sectorId: 'caterham_asylum' } });
  const before = haunted.sectorEntropy.croydon_relay || 0;
  const after = travel(haunted, 'safehouse');
  assert.equal((after.sectorEntropy.croydon_relay || 0) - before, WORLD_TUNING.spreadHeat);
  assert.ok(after.microEntropy > haunted.microEntropy);
  // croydon_relay borders the haunted asylum
  assert.equal(getRipenRate(haunted, 'croydon_relay') - getRipenRate(base, 'croydon_relay'), WORLD_TUNING.ripenPerAdjacentManifestation);
});

test('the world clock can be paused (guided first case)', () => {
  const s = travel(apply(runWithContracts(), { type: 'SET_FLAG', payload: { flagId: WORLD_CLOCK_PAUSED_FLAG, value: true } }), 'caterham_churchyard');
  assert.equal(getRipeness(s, 'caterham_asylum'), 0);
});

test('manifested lieutenants weaken the Grand Rite (but odds never drop below 5%)', () => {
  const death = allGoetia.filter(g => g.allegiance === 'DEATH');
  let s = newRun();
  assert.equal(getBanishmentOdds(s, 'DEATH'), 5);
  s = apply(s, ...death.slice(0, 4).map(g => ({ type: 'SEAL_GOETIA' as const, payload: g.id })));
  assert.equal(getBanishmentOdds(s, 'DEATH'), 25);
  s = apply(s, { type: 'RELEASE_GOETIA', payload: { goetiaId: death[10].id, sectorId: 'x' } });
  assert.equal(getBanishmentOdds(s, 'DEATH'), 20);
  assert.equal(getBanishmentSeconds(s, 'DEATH', false), 57);
  assert.equal(getBanishmentSeconds(s, 'DEATH', true), 72);
  s = apply(s, ...death.slice(11).map(g => ({ type: 'RELEASE_GOETIA' as const, payload: { goetiaId: g.id, sectorId: 'x' } })));
  assert.equal(getBanishmentOdds(s, 'DEATH'), 5);
  assert.equal(getBanishmentSeconds(s, 'DEATH', false), 36);
});

test('contracts are part of the saved state', () => {
  const s = runWithContracts();
  assert.equal(Object.keys(s.contracts).length, 16);
  const updated = gameReducer(s, { type: 'UPDATE_CONTRACTS', payload: prev => ({ ...prev, caterham_churchyard: { ...prev.caterham_churchyard, activeSubNodeId: 'x' } }) });
  assert.equal(updated.contracts.caterham_churchyard.activeSubNodeId, 'x');
});
