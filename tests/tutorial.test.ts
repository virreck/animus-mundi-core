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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TUTORIAL_STEPS, fillTutorialText, getTutorialGuide, type TutorialContext } from '../src/content/tutorial';

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
  assert.ok(TUTORIAL_STEPS[0].fullscreen && TUTORIAL_STEPS.at(-1)!.fullscreen);
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

// ---------------------------------------------------------------------------
// Guides: the overlay points at real controls
// ---------------------------------------------------------------------------

/** Every `data-tour` id in the UI: exact ids, plus prefixes of templated ones (`tab-${...}`). */
function tourIds() {
  const exact = new Set<string>();
  const prefixes = new Set<string>();
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.tsx')) {
        const src = readFileSync(p, 'utf8');
        for (const m of src.matchAll(/data-tour="([^"]+)"/g)) exact.add(m[1]);
        for (const m of src.matchAll(/data-tour=\{`([^$`]*)\$\{/g)) prefixes.add(m[1]);
      }
    }
  };
  walk(join(process.cwd(), 'src'));
  return { exact, prefixes };
}

const TAB_IDS = ['FIELD_OPS', 'CODEX', 'KAGE_NO_SHO', 'SAFEHOUSE_ALTAR', 'HORSEMEN'];

test('every guide points at a control that exists, in every screen the player might be on', () => {
  const { exact, prefixes } = tourIds();
  const known = (id: string) => exact.has(id) || [...prefixes].some(p => id.startsWith(p));
  const base = createTutorialState(identity, 'NEW_RUN');
  for (const step of TUTORIAL_STEPS.filter(s => !s.fullscreen && s.objective)) {
    assert.ok(step.guide, `${step.id} has an objective but no guide`);
    for (const viewport of TAB_IDS) {
      for (const mapViewMode of ['SUB_GRID', 'GEO_TRACKER']) {
        const g = getTutorialGuide(step, { state: base, viewport, mapViewMode, selectedSuspectId: '01_bael' })!;
        assert.ok(g.hint.length > 5, `${step.id}: empty hint`);
        if (g.target) assert.ok(known(g.target), `${step.id} on ${viewport}: unknown target ${g.target}`);
      }
    }
  }
  for (const tab of TAB_IDS) assert.ok(known(`tab-${tab}`), `tab ${tab} is not tagged`);
});

test('room steps first ask you to select the room on the map, then point at the button', () => {
  const s = createTutorialState(identity, 'NEW_RUN');
  const ctx = (state = s, patch: Partial<TutorialContext> = {}): TutorialContext => ({ state, viewport: 'FIELD_OPS', mapViewMode: 'SUB_GRID', selectedSuspectId: '01_bael', ...patch });
  const scan1 = TUTORIAL_STEPS.find(x => x.id === 'scan_1')!;
  // Room 1 is selected at the start
  assert.deepEqual(getTutorialGuide(scan1, ctx()), { room: 1, target: 'palette-scan', pane: 'WIRE', hint: 'Room 1 is selected. Now tap SCAN.' });
  // On another screen: go back to Field Ops first
  assert.equal(getTutorialGuide(scan1, ctx(s, { viewport: 'CODEX' }))!.target, 'tab-FIELD_OPS');
  // Regional map open: back to the rooms
  assert.equal(getTutorialGuide(scan1, ctx(s, { mapViewMode: 'GEO_TRACKER' }))!.target, 'map-local');

  const scan2 = TUTORIAL_STEPS.find(x => x.id === 'scan_2')!;
  const g = getTutorialGuide(scan2, ctx())!;
  assert.equal(g.room, 2);
  assert.equal(g.target, undefined, 'nothing to press until Room 2 is selected');
  const selected = { ...s, contracts: { [TUTORIAL_SECTOR_ID]: { ...s.contracts[TUTORIAL_SECTOR_ID], selectedSubNodeId: TUTORIAL_ROOMS.nave } } };
  assert.equal(getTutorialGuide(scan2, ctx(selected))!.target, 'palette-scan');
});

test('tasks inside a room walk you in first', () => {
  const s = createTutorialState(identity, 'NEW_RUN');
  const witness = TUTORIAL_STEPS.find(x => x.id === 'witness_4')!;
  const ctx = (state = s): TutorialContext => ({ state, viewport: 'FIELD_OPS', mapViewMode: 'SUB_GRID', selectedSuspectId: '01_bael' });
  assert.equal(getTutorialGuide(witness, ctx())!.room, 4);
  const inside = { ...s, contracts: { [TUTORIAL_SECTOR_ID]: { ...s.contracts[TUTORIAL_SECTOR_ID], activeSubNodeId: TUTORIAL_ROOMS.vestry, selectedSubNodeId: TUTORIAL_ROOMS.vestry } } };
  assert.equal(getTutorialGuide(witness, ctx(inside))!.target, 'palette-interview');
});

test('every docked step has a plain-English summary', () => {
  for (const step of TUTORIAL_STEPS.filter(s => !s.fullscreen)) assert.ok(step.plain && step.plain.length > 20, `${step.id} has no plain summary`);
});
