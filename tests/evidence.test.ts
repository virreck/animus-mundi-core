// tests/evidence.test.ts
// Deduction layer: scoring, redaction and overall solvability.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allGoetia } from '../src/content/goetia';
import { generateSectorContract, getUniqueGoetiaSigns } from '../src/engine/sectorGenerator';
import { AMBIGUITY_GROUPS, redactWitnessStatement, scoreSuspect, type EvidenceLog } from '../src/engine/evidence';

const fitsAll = (goetiaId: string, evidence: EvidenceLog[]) => {
  const g = allGoetia.find(x => x.id === goetiaId)!;
  return !scoreSuspect(g, getUniqueGoetiaSigns(g.id), evidence).contradicted;
};

function caseFile(contractTargetEvidence: ReturnType<typeof generateSectorContract>, withCourt: boolean, withRank: boolean): EvidenceLog[] {
  const target = allGoetia.find(g => g.id === contractTargetEvidence.targetGoetiaId)!;
  const ev: EvidenceLog[] = contractTargetEvidence.subNodes.filter(r => r.signTag).map(r => ({
    id: r.id, nodeLabel: r.label, text: '', channel: r.signalChannel!, kind: 'PHENOMENON',
    candidates: r.ambiguityGroupId ? AMBIGUITY_GROUPS.find(g => g.id === r.ambiguityGroupId)!.tags : [r.signTag!]
  }));
  if (withCourt) ev.push({ id: 'court', nodeLabel: '', text: '', channel: 'RESONANCE', kind: 'COURT', value: target.allegiance });
  if (withRank) ev.push({ id: 'rank', nodeLabel: '', text: '', channel: 'RESONANCE', kind: 'RANK', value: target.rank });
  return ev;
}

test('scoring: matches, contradictions and unscored witness notes', () => {
  const bael = allGoetia.find(g => g.id === '01_bael')!;
  const signs = getUniqueGoetiaSigns(bael.id);
  const ev: EvidenceLog[] = [
    { id: 'a', nodeLabel: '', text: '', channel: 'AUDIO', kind: 'PHENOMENON', candidates: [signs[0], 'not_a_tag'] },
    { id: 'b', nodeLabel: '', text: '', channel: 'RESONANCE', kind: 'COURT', value: bael.allegiance },
    { id: 'w', nodeLabel: '', text: 'something', channel: 'WITNESS', kind: 'WITNESS' }
  ];
  assert.deepEqual(scoreSuspect(bael, signs, ev), { matched: 2, total: 2, contradicted: false });
  ev.push({ id: 'c', nodeLabel: '', text: '', channel: 'RESONANCE', kind: 'RANK', value: 'Knight' });
  assert.equal(scoreSuspect(bael, signs, ev).contradicted, bael.rank !== 'Knight');
});

test('the true demon always fits its own evidence', () => {
  for (let i = 0; i < 500; i++) {
    const c = generateSectorContract('caterham_churchyard', 'X', [], []);
    assert.ok(fitsAll(c.targetGoetiaId, caseFile(c, true, true)));
  }
});

test('court and rank narrow the field to (almost) one suspect', () => {
  let total = 0;
  const RUNS = 1000;
  for (let i = 0; i < RUNS; i++) {
    const c = generateSectorContract('caterham_churchyard', 'X', [], []);
    const ev = caseFile(c, true, true);
    const left = allGoetia.filter(g => fitsAll(g.id, ev)).length;
    assert.ok(left <= 3, `${left} suspects left with full evidence`);
    total += left;
  }
  assert.ok(total / RUNS < 1.3, `average ${total / RUNS} suspects with full evidence`);
});

test('witness statements always hide the demon\'s name but stay readable', () => {
  for (const g of allGoetia) {
    const text = `${g.name} came at me. ${g.description}`;
    const { text: redacted, witness } = redactWitnessStatement(text, 0.55, [g.name]);
    assert.ok(witness.length > 0);
    assert.ok(!redacted.toLowerCase().includes(g.name.toLowerCase()), `${g.name} leaked: ${redacted}`);
    const visibleWords = redacted.split(/\s+/).filter(w => /[A-Za-z]{3,}/.test(w));
    assert.ok(visibleWords.length >= 2, `too redacted: ${redacted}`);
    assert.equal(redacted.length, text.length, 'redaction keeps word lengths');
  }
});
