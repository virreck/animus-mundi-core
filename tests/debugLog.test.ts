// tests/debugLog.test.ts
// The playtest log and its passphrase hash.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex } from '../src/ui/debug/sha256';
import {
  DEBUG_LOG_KEY, MAX_ENTRIES, clearDebugLog, describeAction, getDebugLog, logDebug, resetDebugMemory,
  setDebugContext, snapshotOf, snapshotWorthy, summarise, toCSV
} from '../src/ui/debug/debugLog';
import { gameReducer } from '../src/engine/reducer';
import { newRun } from './helpers';

function memoryStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } };
}

beforeEach(() => resetDebugMemory());

test('sha256 matches known digests', () => {
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex('The quick brown fox jumps over the lazy dog'), 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
  // Crosses a 64-byte block boundary and uses multi-byte UTF-8
  assert.equal(sha256Hex('a'.repeat(64)), 'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb');
  assert.equal(sha256Hex('影の書'), 'cf78794bc519797cd6847b356f75bad783792c06588ec90f946673e373934952');
  assert.equal(sha256Hex('lesser-key'), 'b0b8da1582413035a39abf859629ceb415fb2f41f51dd2d63bf743924549ce75', 'default debug passphrase');
});

test('entries are stamped with slot and training, and capped', () => {
  const store = memoryStore();
  setDebugContext({ slot: 2, training: false });
  logDebug('SESSION', 'hello', undefined, store, 1);
  const [first] = getDebugLog(store);
  assert.equal(first.slot, 2);
  assert.equal(first.msg, 'hello');
  for (let i = 0; i < MAX_ENTRIES + 50; i++) logDebug('ACTION', `a${i}`, undefined, store, i);
  const log = getDebugLog(store);
  assert.equal(log.length, MAX_ENTRIES);
  assert.equal(log.at(-1)!.msg, `a${MAX_ENTRIES + 49}`);
  assert.equal(new Set(log.map(e => e.n)).size, log.length, 'running numbers are unique');
  clearDebugLog(store);
  assert.equal(getDebugLog(store).length, 0);
  assert.equal(store.getItem(DEBUG_LOG_KEY), null);
});

test('actions are described briefly, and noisy ones are skipped', () => {
  assert.equal(describeAction({ type: 'ACK_NOTICES', payload: [1] }), null);
  assert.equal(describeAction({ type: 'UPDATE_CONTRACTS', payload: c => c }), 'UPDATE_CONTRACTS (update)');
  assert.equal(describeAction({ type: 'LOAD_GAME', payload: newRun() }), 'LOAD_GAME (state)');
  assert.equal(describeAction({ type: 'TRAVEL', payload: 'caterham_asylum' }), 'TRAVEL caterham_asylum');
  assert.equal(describeAction({ type: 'RESET_GAME' }), 'RESET_GAME');
});

test('snapshots happen when the world clock moves or a spirit is sealed', () => {
  const s0 = newRun();
  const s1 = gameReducer(s0, { type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 5 } });
  assert.equal(snapshotWorthy(s0, s1), false);
  const s2 = gameReducer(s1, { type: 'TRAVEL', payload: 'caterham_asylum' });
  assert.equal(snapshotWorthy(s1, s2), true);
  const s3 = gameReducer(s2, { type: 'SEAL_GOETIA', payload: '01_bael' });
  assert.equal(snapshotWorthy(s2, s3), true);
  const snap = snapshotOf(s3);
  assert.equal(snap.sealed, 1);
  assert.equal(snap.tick, 1);
});

test('CSV export has a header and one row per entry, with snapshot columns', () => {
  const store = memoryStore();
  logDebug('SNAPSHOT', 'tick 1', { humanity: 90, entropy: 2.5 }, store, 0);
  logDebug('NOTICE', 'He said "hello", then left', undefined, store, 1);
  const csv = toCSV(getDebugLog(store)).split('\n');
  assert.equal(csv.length, 3);
  assert.ok(csv[0].endsWith('humanity,entropy'));
  assert.ok(csv[2].includes('"He said ""hello"", then left"'));
  const sum = summarise(getDebugLog(store));
  assert.equal(sum.entries, 2);
  assert.equal(sum.latest?.humanity, 90);
});
