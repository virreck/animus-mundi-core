// tests/saves.test.ts
// Save slots, save files, and the old single save showing up as slot 1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_SLOT_KEY, LEGACY_SAVE_KEY, SAVE_FILE_FORMAT, SLOT_COUNT, buildSaveFile, deleteSlot, getActiveSlot,
  listSlots, parseSaveFile, readSlot, saveFileName, setActiveSlot, slotKey, writeSlot
} from '../src/ui/saves';
import { normalizeLoadedState } from '../src/engine/state';
import { newRun } from './helpers';

/** In-memory stand-in for localStorage. */
function memoryStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    keys: () => [...m.keys()]
  };
}

test('slot 1 is the old single save, so existing saves carry over', () => {
  const store = memoryStore();
  store.setItem(LEGACY_SAVE_KEY, JSON.stringify(newRun()));
  assert.equal(slotKey(1), LEGACY_SAVE_KEY);
  assert.ok(readSlot(1, store));
  const [one, two] = listSlots(store);
  assert.equal(one.empty, false);
  assert.equal(two.empty, true);
});

test('slots are independent', () => {
  const store = memoryStore();
  const a = { ...newRun(), playerName: 'ALPHA' };
  const b = { ...newRun(), playerName: 'BRAVO', sealedGoetia: ['01_bael'] };
  assert.ok(writeSlot(1, a, store, 1000));
  assert.ok(writeSlot(3, b, store, 2000));
  const slots = listSlots(store);
  assert.equal(slots.length, SLOT_COUNT);
  assert.deepEqual(slots.map(s => s.empty), [false, true, false]);
  assert.equal(slots[2].name, 'BRAVO');
  assert.equal(slots[2].sealed, 1);
  assert.equal(slots[2].savedAt, 2000);
  deleteSlot(3, store);
  assert.equal(readSlot(3, store), null);
  assert.equal(readSlot(1, store)?.playerName, 'ALPHA', 'deleting one slot keeps the others');
});

test('the active slot is remembered and kept in range', () => {
  const store = memoryStore();
  assert.equal(getActiveSlot(store), 1);
  setActiveSlot(2, store);
  assert.equal(getActiveSlot(store), 2);
  store.setItem(ACTIVE_SLOT_KEY, '9');
  assert.equal(getActiveSlot(store), 1);
});

test('a run survives export and import', () => {
  const run = { ...newRun(), playerName: 'Vergil Kane', sealedGoetia: ['01_bael', '07_amon'] };
  const text = JSON.stringify(buildSaveFile(run, new Date('2026-11-15T10:00:00Z')));
  const parsed = parseSaveFile(text);
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const loaded = normalizeLoadedState(parsed.state);
  assert.equal(loaded.playerName, 'Vergil Kane');
  assert.deepEqual(loaded.sealedGoetia, ['01_bael', '07_amon']);
  assert.equal(JSON.parse(text).format, SAVE_FILE_FORMAT);
  assert.equal(saveFileName(run, new Date('2026-11-15T10:00:00Z')), 'kage-save-vergil-kane-2026-11-15.json');
});

test('a raw copy of a slot can be imported too', () => {
  const parsed = parseSaveFile(JSON.stringify(newRun()));
  assert.ok(parsed.ok);
});

test('bad files are refused with a plain explanation', () => {
  for (const text of ['not json', '{"hello":1}', JSON.stringify({ format: SAVE_FILE_FORMAT, version: 1, state: { nope: true } })]) {
    const parsed = parseSaveFile(text);
    assert.equal(parsed.ok, false, text);
    if (!parsed.ok) assert.ok(parsed.error.length > 10);
  }
  const future = parseSaveFile(JSON.stringify({ ...buildSaveFile(newRun()), version: 99 }));
  assert.equal(future.ok, false);
});

test('a full storage is reported, not thrown', () => {
  const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => undefined };
  assert.equal(writeSlot(2, newRun(), full), false);
});
