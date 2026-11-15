// tests/tutorial.test.ts
// The guided first case must be completable, self-contained and harmless to the real run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer } from '../src/engine/reducer';
import { allGoetia } from '../src/content/goetia';
import { allYokai } from '../src/content/yokai';
import { ALTAR_RECIPES, getUniqueGoetiaSigns } from '../src/engine/sectorGenerator';
import { AMBIGUITY_GROUPS, scoreSuspect, type EvidenceLog } from '../src/engine/evidence';
import { getRipeness } from '../src/engine/world';
import {
  buildTutorialContract, createTutorialState, isTraining,
  TUTORIAL_ROOMS, TUTORIAL_SECTOR_ID, TUTORIAL_TARGET_ID, TUTORIAL_YOKAI_ID, TUTORIAL_RESUME_FLAG
} from '../src/engine/tutorial';
import { TUTORIAL_STEPS, fillTutorialText, type TutorialContext } from '../src/content/tutorial';

const identity = { name: 'Vergil', portrait: '/portraits/thaumaturge_m1.png', agency: 'Darkwire' };
const target = allGoetia.find(g => g.id === TUTORIAL_TARGET_ID)!;

test('the crypt is a seven-room chain with one of every room type', () => {
  const c = buildTutorialContract();
  assert.equal(c.subNodes.length, 7);
  c.subNodes.forEach((r, i) => {
    const expected = [c.subNodes[i - 1]?.id, c.subNodes[i + 1]?.id].filter(Boolean);
    assert.deepEqual(r.connections.sort(), expected.sort(), r.label);
  });
  assert.deepEqual(c.subNodes.map(r => r.nodeType), ['ANOMALY', 'ANOMALY', 'PATROL', 'WITNESS', 'SHRINE', 'ANOMALY', 'ANCHOR']);
  assert.equal(c.subNodes.find(r => r.id === TUTORIAL_ROOMS.nave)!.hazard, 'STATIC', 'room 2 teaches degauss');
  assert.equal(c.subNodes.find(r => r.id === TUTORIAL_ROOMS.ossuary)!.shrineYokaiId, TUTORIAL_YOKAI_ID);
});

test('the crypt carries Amon\'s real fingerprint, one clue per instrument', () => {
  const c = buildTutorialContract();
  const clues = c.subNodes.filter(r => r.signTag);
  assert.deepEqual(clues.map(r => r.signTag).sort(), [...getUniqueGoetiaSigns(TUTORIAL_TARGET_ID)].sort());
  assert.deepEqual(clues.map(r => r.signalChannel).sort(), ['ASTRAL', 'AUDIO', 'MATTER']);
  assert.equal(clues[0].ambiguityGroupId, undefined, 'first reading is clean');
  assert.ok(clues[1].ambiguityGroupId && clues[2].ambiguityGroupId, 'second and third readings are degraded');
});

test('the evidence the script gathers identifies exactly one suspect: Amon', () => {
  const c = buildTutorialContract();
  const [clean, refined, degraded] = c.subNodes.filter(r => r.signTag);
  const ev: EvidenceLog[] = [
    { id: 'a', nodeLabel: '', text: '', channel: 'AUDIO', kind: 'PHENOMENON', candidates: [clean.signTag!] },
    { id: 'b', nodeLabel: '', text: '', channel: 'MATTER', kind: 'PHENOMENON', candidates: [refined.signTag!] },
    { id: 'c', nodeLabel: '', text: '', channel: 'ASTRAL', kind: 'PHENOMENON', candidates: AMBIGUITY_GROUPS.find(g => g.id === degraded.ambiguityGroupId)!.tags },
    { id: 'd', nodeLabel: '', text: '', channel: 'RESONANCE', kind: 'COURT', value: target.allegiance },
    { id: 'e', nodeLabel: '', text: '', channel: 'RESONANCE', kind: 'RANK', value: target.rank }
  ];
  const fits = allGoetia.filter(g => !scoreSuspect(g, getUniqueGoetiaSigns(g.id), ev).contradicted).map(g => g.id);
  assert.deepEqual(fits, [TUTORIAL_TARGET_ID]);
});

test('the witness statement is consistent with Amon\'s description', () => {
  const w = buildTutorialContract().subNodes.find(r => r.nodeType === 'WITNESS')!;
  assert.match(w.witnessText!, /wolf/);
  assert.match(target.description || '', /wolf/i);
  assert.ok(!w.witnessText!.toLowerCase().includes('amon'));
});

test('the starting kit plus salvage covers the Kitsune contract and Amon\'s catalysts', () => {
  const s = createTutorialState(identity, 'NEW_RUN');
  const salvage: Record<string, number> = { ...s.inventory };
  for (const r of s.contracts[TUTORIAL_SECTOR_ID].subNodes) {
    if (!r.salvageDrop) continue;
    salvage[r.salvageDrop.itemId] = (salvage[r.salvageDrop.itemId] || 0) + r.salvageDrop.amount;
    salvage.obols += r.salvageDrop.obols;
  }
  const kitsune = allYokai.find(y => y.id === TUTORIAL_YOKAI_ID)!;
  let obols = salvage.obols - (kitsune.draftCost.obols || 0);
  const raw: Record<string, number> = { ...salvage };
  for (const [item, amount] of Object.entries(target.sealCost || {})) {
    const recipe = ALTAR_RECIPES.find(r => r.outputId === item)!;
    raw[recipe.rawMaterialId] -= recipe.rawAmount * amount;
    obols -= recipe.obolCost * amount;
    assert.ok(raw[recipe.rawMaterialId] >= 0, `not enough ${recipe.rawMaterialId} for ${item}`);
  }
  assert.ok(obols >= 40, `only ${obols} Obols left for spoof/bribe after the essentials`);
  assert.ok(!kitsune.draftCost.ink, 'the tutorial Yokai must not need ink');
});

test('training is sandboxed: clock paused and the run can never end', () => {
  let s = createTutorialState(identity, 'RESUME_RUN');
  assert.ok(isTraining(s));
  assert.equal(s.flags[TUTORIAL_RESUME_FLAG], true);
  s = gameReducer(s, { type: 'TRAVEL', payload: TUTORIAL_SECTOR_ID });
  assert.equal(getRipeness(s, 'caterham_asylum'), 0, 'world clock paused');
  assert.equal(gameReducer(s, { type: 'MODIFY_HUMANITY', payload: -500 }).gameStage, 'ACTIVE');
  assert.equal(gameReducer(s, { type: 'MODIFY_GLOBAL_ENTROPY', payload: 100 }).gameStage, 'ACTIVE');
});

test('every step either waits for CONTINUE or has an objective with a check', () => {
  const ids = new Set<string>();
  for (const step of TUTORIAL_STEPS) {
    assert.ok(!ids.has(step.id), `duplicate step ${step.id}`); ids.add(step.id);
    assert.ok(step.lines.length > 0);
    if (step.objective) assert.ok(step.done, `${step.id} has an objective but no check`);
    if (step.done) assert.ok(step.objective, `${step.id} has a check but no objective`);
  }
  assert.ok(TUTORIAL_STEPS[0].fullscreen && TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].fullscreen);
});

test('no objective is already complete at the moment the run starts', () => {
  const ctx: TutorialContext = { state: createTutorialState(identity, 'NEW_RUN'), viewport: 'FIELD_OPS', mapViewMode: 'SUB_GRID', selectedSuspectId: '01_bael' };
  for (const step of TUTORIAL_STEPS) if (step.done) assert.equal(step.done(ctx), false, `${step.id} would skip itself`);
});

test('steps complete as the crypt is worked through', () => {
  const s = createTutorialState(identity, 'NEW_RUN');
  const step = (id: string) => TUTORIAL_STEPS.find(x => x.id === id)!;
  const ctx = (patch: Partial<TutorialContext> = {}): TutorialContext => ({ state: s, viewport: 'FIELD_OPS', mapViewMode: 'SUB_GRID', selectedSuspectId: '01_bael', ...patch });
  const crypt = s.contracts[TUTORIAL_SECTOR_ID];
  crypt.subNodes[0].status = 'SCANNED';
  assert.ok(step('scan_1').done!(ctx()));
  crypt.activeSubNodeId = TUTORIAL_ROOMS.lychgate;
  assert.ok(step('enter_1').done!(ctx()));
  assert.ok(step('codex').done!(ctx({ viewport: 'CODEX', selectedSuspectId: TUTORIAL_TARGET_ID })));
  assert.ok(!step('codex').done!(ctx({ viewport: 'CODEX', selectedSuspectId: '01_bael' })));
  assert.ok(step('map').done!(ctx({ mapViewMode: 'GEO_TRACKER' })));
});

test('text placeholders are filled with the operative\'s details', () => {
  assert.equal(fillTutorialText('{name} of {agency}', { playerName: 'vergil', agencyName: 'darkwire' }), 'VERGIL of DARKWIRE');
});
