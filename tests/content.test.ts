// tests/content.test.ts
// Guards the hand-written content files against the kinds of mistakes that broke deduction before.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allGoetia } from '../src/content/goetia';
import { PHENOMENON_CATALOG, ALTAR_RECIPES, getUniqueGoetiaSigns } from '../src/engine/sectorGenerator';
import { AMBIGUITY_GROUPS } from '../src/engine/evidence';

const phenomenonTags = new Set(PHENOMENON_CATALOG.map(p => p.tag));

test('there are 72 Goetia with unique ids and manifest numbers 1-72', () => {
  assert.equal(allGoetia.length, 72);
  assert.equal(new Set(allGoetia.map(g => g.id)).size, 72);
  assert.deepEqual(allGoetia.map(g => g.manifestId).sort((a, b) => a - b), Array.from({ length: 72 }, (_, i) => i + 1));
});

test('every Horseman court has exactly 18 lieutenants', () => {
  for (const court of ['CONQUEST', 'WAR', 'FAMINE', 'DEATH']) {
    assert.equal(allGoetia.filter(g => g.allegiance === court).length, 18, court);
  }
});

test('every required clue is a real phenomenon', () => {
  for (const g of allGoetia) {
    for (const tag of g.requiredIntel || []) assert.ok(phenomenonTags.has(tag), `${g.id} requires unknown phenomenon "${tag}"`);
  }
});

test('every demon has a unique 3-sign fingerprint', () => {
  const keys = allGoetia.map(g => getUniqueGoetiaSigns(g.id).slice().sort().join('|'));
  assert.equal(new Set(keys).size, 72);
  for (const g of allGoetia) assert.equal(getUniqueGoetiaSigns(g.id).length, 3, g.id);
});

test('every demon has a description for witness statements', () => {
  for (const g of allGoetia) assert.ok((g.description || '').split(/\s+/).length >= 6, `${g.id} needs a longer description`);
});

test('every seal cost item can be crafted at the altar (Obols are currency)', () => {
  const craftable = new Set([...ALTAR_RECIPES.map(r => r.outputId), 'obols']);
  for (const g of allGoetia) {
    for (const item of Object.keys(g.sealCost || {})) assert.ok(craftable.has(item), `${g.id} needs uncraftable "${item}"`);
  }
});

test('ambiguity groups cover every phenomenon exactly once, on its own channel', () => {
  const seen = new Map<string, string>();
  for (const group of AMBIGUITY_GROUPS) {
    assert.ok(group.tags.length >= 2, `${group.id} must hold at least two phenomena`);
    for (const tag of group.tags) {
      assert.ok(!seen.has(tag), `${tag} is in both ${seen.get(tag)} and ${group.id}`);
      seen.set(tag, group.id);
      const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
      assert.ok(def, `${group.id} lists unknown phenomenon ${tag}`);
      assert.equal(def.channel, group.channel, `${tag} is on ${def.channel}, but ${group.id} is ${group.channel}`);
    }
  }
  assert.deepEqual([...seen.keys()].sort(), [...phenomenonTags].sort());
});
