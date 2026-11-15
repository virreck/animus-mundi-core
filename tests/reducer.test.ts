// tests/reducer.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer } from '../src/engine/reducer';
import { initialGameState, normalizeLoadedState, getTotalGlobalEntropy, type GameState } from '../src/engine/state';
import { newRun, apply } from './helpers';

test('starting a run makes it ACTIVE', () => {
  assert.equal(newRun().gameStage, 'ACTIVE');
});

test('spending the last Yokai charge keeps the power\'s effect and unbinds the daemon', () => {
  let s = apply(newRun(),
    { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 100 } },
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_baku', costs: { obols: 15, humanity: 5 }, maxCharges: 1 } }
  );
  assert.equal(s.humanity, 95);
  assert.equal(s.yokaiCharges.yokai_baku, 1);
  s = apply(s,
    { type: 'MODIFY_HUMANITY', payload: -30 },
    { type: 'MODIFY_HUMANITY', payload: 20 },
    { type: 'CONSUME_YOKAI_CHARGE', payload: { yokaiId: 'yokai_baku', maxCharges: 1 } }
  );
  assert.equal(s.humanity, 85, 'heal survives the unbind; Baku does not full-heal outside rest');
  assert.deepEqual(s.tetheredYokai, []);
  assert.equal(s.yokaiCharges.yokai_baku, undefined);
});

test('the Rule of Two drops the oldest Yokai', () => {
  const s = apply(newRun(),
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_tengu', costs: {}, maxCharges: 2 } },
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_baku', costs: {}, maxCharges: 2 } },
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_kitsune', costs: {}, maxCharges: 2 } }
  );
  assert.deepEqual(s.tetheredYokai, ['yokai_baku', 'yokai_kitsune']);
  assert.equal(s.yokaiCharges.yokai_tengu, undefined);
});

test('Baku fully restores Humanity only when resting', () => {
  const s = apply(newRun(),
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_baku', costs: {}, maxCharges: 2 } },
    { type: 'MODIFY_HUMANITY', payload: -50 },
    { type: 'REST_AT_SAFEHOUSE', payload: { heal: 30, time: 4 } }
  );
  assert.equal(s.humanity, 100);
});

test('Zashiki caps Humanity at 85', () => {
  const s = apply(newRun(),
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_zashiki', costs: {}, maxCharges: 2 } },
    { type: 'REST_AT_SAFEHOUSE', payload: { heal: 30, time: 1 } }
  );
  assert.equal(s.humanity, 85);
});

test('a faction at 0 stays at 0', () => {
  const s = apply(newRun(),
    { type: 'MODIFY_FACTION', payload: { factionId: 'malleus', amount: -100 } },
    { type: 'MODIFY_FACTION', payload: { factionId: 'malleus', amount: 5 } }
  );
  assert.equal(s.factions.malleus, 5);
});

test('negative micro entropy drains into global entropy', () => {
  const s = apply(newRun(),
    { type: 'MODIFY_GLOBAL_ENTROPY', payload: 10 },
    { type: 'ADD_MICRO_ENTROPY', payload: 0.5 },
    { type: 'ADD_MICRO_ENTROPY', payload: -2.5 }
  );
  assert.equal(s.microEntropy, 0);
  assert.equal(s.globalEntropy, 8);
  assert.equal(getTotalGlobalEntropy(s), 8);
});

test('the run ends at 0% Humanity or 100% entropy', () => {
  assert.equal(gameReducer(newRun(), { type: 'MODIFY_HUMANITY', payload: -500 }).gameStage, 'GAME_OVER');
  assert.equal(gameReducer(newRun(), { type: 'MODIFY_GLOBAL_ENTROPY', payload: 100 }).gameStage, 'GAME_OVER');
  assert.equal(gameReducer(newRun(), { type: 'EXIT_TO_MENU' }).gameStage, 'START_SCREEN');
});

test('Amabie snaps the tether when its toll cannot be paid', () => {
  const s = apply(newRun(),
    { type: 'DRAFT_CONTRACT', payload: { yokaiId: 'yokai_amabie', costs: {}, maxCharges: 2 } },
    { type: 'MODIFY_GLOBAL_ENTROPY', payload: 5 }
  );
  assert.equal(s.gameStage, 'GAME_OVER');
});

test('a released demon can never be sealed and its sector is lost', () => {
  const s = apply(newRun(),
    { type: 'RELEASE_GOETIA', payload: { goetiaId: '01_bael', sectorId: 'caterham_churchyard' } },
    { type: 'SEAL_GOETIA', payload: '01_bael' }
  );
  assert.deepEqual(s.releasedGoetia, ['01_bael']);
  assert.deepEqual(s.sealedGoetia, []);
  assert.equal(s.flags.sector_failed_caterham_churchyard, true);
});

test('buying ink uses its own action', () => {
  assert.equal(gameReducer(newRun(), { type: 'MODIFY_INK', payload: 2 }).ink, 2);
});

test('old saves are filled in with every newer field', () => {
  const legacy = { ...initialGameState, gameStage: 'ACTIVE' as const, activeContracts: ['yokai_tengu'] } as Record<string, unknown>;
  for (const key of ['tetheredYokai', 'microEntropy', 'yokaiCharges', 'attunedSectors', 'deducedSigns', 'releasedGoetia']) delete legacy[key];
  const loaded = normalizeLoadedState(legacy as Partial<GameState>, 1.25);
  assert.deepEqual(loaded.tetheredYokai, ['yokai_tengu']);
  assert.equal(loaded.microEntropy, 1.25, 'legacy micro-entropy key is migrated');
  assert.deepEqual(loaded.yokaiCharges, {});
  assert.deepEqual(loaded.releasedGoetia, []);
});
