// tests/sectorGenerator.test.ts
// Procedural sectors: every generated layout must be playable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSectorContract, type SectorContract } from '../src/engine/sectorGenerator';
import { allGoetia } from '../src/content/goetia';

const SECTORS = ['caterham_churchyard', 'croydon_relay', 'brixton_morgue', 'highgate_catacombs', 'malleus_precinct', 'unknown_sector'];
const RUNS = 600;

function generateMany(): SectorContract[] {
  return Array.from({ length: RUNS }, (_, i) => generateSectorContract(SECTORS[i % SECTORS.length], 'TEST', [], []));
}
const contracts = generateMany();

test('sectors have 5-8 rooms: entry first, anchor last', () => {
  for (const c of contracts) {
    const n = c.subNodes;
    assert.ok(n.length >= 5 && n.length <= 8, `${n.length} rooms`);
    assert.equal(n[0].index, 1);
    assert.equal(n.at(-1)!.nodeType, 'ANCHOR');
    assert.equal(n.filter(r => r.nodeType === 'ANCHOR').length, 1);
  }
});

test('every sector has exactly 3 clue rooms and one witness', () => {
  for (const c of contracts) {
    assert.equal(c.subNodes.filter(r => r.signTag).length, 3);
    const witnesses = c.subNodes.filter(r => r.nodeType === 'WITNESS');
    assert.equal(witnesses.length, 1);
    assert.ok(witnesses[0].witnessText && witnesses[0].witnessName);
  }
});

test('the clue rooms carry the target demon\'s fingerprint', () => {
  for (const c of contracts) {
    const target = allGoetia.find(g => g.id === c.targetGoetiaId)!;
    const tags = c.subNodes.filter(r => r.signTag).map(r => r.signTag).sort();
    assert.deepEqual(tags, [...(target.requiredIntel || [])].sort());
  }
});

test('corridors are two-way, every room is reachable, and the anchor is never next to the entry', () => {
  for (const c of contracts) {
    const byId = new Map(c.subNodes.map(r => [r.id, r]));
    for (const r of c.subNodes) for (const id of r.connections) assert.ok(byId.get(id)?.connections.includes(r.id), `${r.id} -> ${id} is one-way`);
    const seen = new Set([c.subNodes[0].id]);
    const queue = [c.subNodes[0].id];
    while (queue.length) for (const id of byId.get(queue.shift()!)!.connections) if (!seen.has(id)) { seen.add(id); queue.push(id); }
    assert.equal(seen.size, c.subNodes.length, 'unreachable room');
    assert.ok(!c.subNodes[0].connections.includes(c.subNodes.at(-1)!.id));
  }
});

test('room names never repeat within a sector', () => {
  for (const c of contracts) {
    const names = c.subNodes.map(r => r.label.replace(/^\d+: /, '').replace(' [ANCHOR]', ''));
    assert.equal(new Set(names).size, names.length, names.join(', '));
  }
});

test('patrol rooms are never trapped; Heavily Warded traps every room past the entrance', () => {
  for (const c of contracts) {
    for (const r of c.subNodes.filter(r => r.nodeType === 'PATROL')) assert.equal(r.hazard, 'NONE');
    if (c.quirk === 'WARDED') {
      for (const r of c.subNodes.slice(1).filter(r => r.nodeType !== 'PATROL')) assert.notEqual(r.hazard, 'NONE', r.label);
    }
    if (c.quirk === 'STATIC_STORM') {
      for (const r of c.subNodes.filter(r => r.signTag)) assert.ok(r.ambiguityGroupId, 'storm clue should be degraded');
    }
  }
});

test('at least one clue per sector is degraded', () => {
  for (const c of contracts) assert.ok(c.subNodes.some(r => r.ambiguityGroupId));
});

test('a forced target is kept (used to upgrade old saves)', () => {
  assert.equal(generateSectorContract('caterham_churchyard', 'X', [], [], '13_beleth').targetGoetiaId, '13_beleth');
});

test('sealed demons are never assigned as targets', () => {
  const sealed = allGoetia.slice(0, 70).map(g => g.id);
  for (let i = 0; i < 50; i++) assert.ok(!sealed.includes(generateSectorContract('caterham_churchyard', 'X', sealed, []).targetGoetiaId));
});
