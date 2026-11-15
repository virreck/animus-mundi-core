// tests/campaign.test.ts
// The long campaign: re-infestation, procedural sites, and a full 72-seal run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer, type GameAction } from '../src/engine/reducer';
import { generateSectorContract, type SectorContract } from '../src/engine/sectorGenerator';
import { MACRO_SECTORS } from '../src/content/map';
import { allGoetia } from '../src/content/goetia';
import {
  CAMPAIGN_TUNING, LESSER_KEY_COMPLETE_FLAG, getOpenSectors, getUnhousedGoetia, getReinfestThreshold,
  getSectorDef, isCampaignExhausted, isSectorSecured, pickCascadeVassals, stepCampaign
} from '../src/engine/world';
import { generateSite, getAllSectors, MAX_PROCEDURAL_SITES, SITE_TUNING } from '../src/engine/sites';
import { normalizeLoadedState, TOTAL_GOETIA, type GameState } from '../src/engine/state';
import { newRun } from './helpers';

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

const act = (s: GameState, ...actions: GameAction[]) => actions.reduce((acc, a) => gameReducer(acc, a), s);
const flag = (flagId: string, value = true): GameAction => ({ type: 'SET_FLAG', payload: { flagId, value } });

/** What a successful Sealing Rite does (mirrors ActiveRituals.onSuccessSeal). */
function sealHere(s: GameState): GameState {
  const sectorId = s.currentNode;
  const target = s.contracts[sectorId].targetGoetiaId;
  const cascade = pickCascadeVassals(s, target, sectorId);
  const def = getSectorDef(s, sectorId)!;
  return act(
    s,
    { type: 'SEAL_GOETIA', payload: target },
    { type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: sectorId, amount: -100 } },
    flag(`sector_secured_${sectorId}`),
    ...def.connections.map(c => flag(`sector_unlocked_${c}`)),
    ...cascade.map((id): GameAction => ({ type: 'SEAL_GOETIA', payload: id }))
  );
}

const secure = (s: GameState, sectorId: string) => sealHere(act(s, { type: 'TRAVEL', payload: sectorId }));

test('a new run starts at tick 0 with no generated sites', () => {
  const s = runWithContracts();
  assert.equal(s.campaign.tick, 0);
  assert.deepEqual(s.campaign.sites, []);
  assert.equal(getAllSectors(s), MACRO_SECTORS);
});

test('old saves load with an empty campaign', () => {
  const raw = { ...runWithContracts() } as Partial<GameState>;
  delete raw.campaign;
  const loaded = normalizeLoadedState(raw);
  assert.equal(loaded.campaign.tick, 0);
  assert.deepEqual(loaded.campaign.sites, []);
});

test('every trip advances the campaign clock', () => {
  const s = act(runWithContracts(), { type: 'TRAVEL', payload: 'caterham_asylum' }, { type: 'TRAVEL', payload: 'safehouse' });
  assert.equal(s.campaign.tick, 2);
});

test('generated sites sit inside the map, clear of other nodes, linked both ways', () => {
  let s = runWithContracts();
  for (let i = 0; i < MAX_PROCEDURAL_SITES; i++) {
    const site = generateSite(s);
    assert.ok(site, `site ${i} should fit`);
    const { bounds, minSpacing } = SITE_TUNING;
    assert.ok(site.x >= bounds.x0 && site.x <= bounds.x1 && site.y >= bounds.y0 && site.y <= bounds.y1);
    for (const n of getAllSectors(s)) assert.ok(Math.hypot(n.x - site.x, n.y - site.y) >= minSpacing - 1e-9, `${site.id} too close to ${n.id}`);
    assert.equal(site.rooms.length, 8);
    s = { ...s, campaign: { ...s.campaign, sites: [...s.campaign.sites, site] } };
    for (const c of site.connections) assert.ok(getSectorDef(s, c)!.connections.includes(site.id), 'back-link missing');
  }
  assert.equal(new Set(s.campaign.sites.map(x => x.label)).size, MAX_PROCEDURAL_SITES, 'site names are unique');
  assert.equal(generateSite(s), null, 'one of each kind at most');
});

test('no new site breaks open before the first-site tick', () => {
  let s = runWithContracts();
  for (let t = 0; t < CAMPAIGN_TUNING.firstSiteTick - 1; t++) s = stepCampaign(s);
  assert.equal(s.campaign.sites.length, 0);
  s = stepCampaign(s);
  assert.equal(s.campaign.sites.length, 1);
  const site = s.campaign.sites[0];
  assert.ok(getOpenSectors(s).some(x => x.id === site.id), 'the new site is open');
  const target = s.contracts[site.id].targetGoetiaId;
  assert.ok(!Object.values(s.contracts).some(c => c.sectorId !== site.id && c.targetGoetiaId === target), 'target is not anchored elsewhere');
  assert.ok(s.contracts[site.id].subNodes.some(n => site.rooms.some(r => n.label.includes(r))), 'the case file uses the site rooms');
  assert.ok(s.notices.some(n => n.kind === 'CAMPAIGN'));
});

test('no new cases arrive while the map is already full of open sectors', () => {
  let s = runWithContracts();
  ['croydon_relay', 'malleus_precinct', 'waddon_marsh'].forEach(id => { s = act(s, flag(`sector_unlocked_${id}`)); });
  assert.ok(getOpenSectors(s).length >= CAMPAIGN_TUNING.maxOpenCases);
  for (let t = 0; t < 30; t++) s = stepCampaign(s);
  assert.equal(s.campaign.sites.length, 0);
});

test('a secured sector re-infests after lying dormant, around a spirit with no home', () => {
  let s = secure(runWithContracts(), 'caterham_churchyard');
  s = act(s, { type: 'TRAVEL', payload: 'safehouse' });
  const sealedBefore = s.contracts.caterham_churchyard.targetGoetiaId;
  s = { ...s, attunedSectors: { caterham_churchyard: true }, campaign: { ...s.campaign, nextSiteAt: 9999 } };
  const threshold = getReinfestThreshold(s, 'caterham_churchyard');
  for (let t = 0; t < threshold - 2; t++) s = stepCampaign(s);
  assert.ok(isSectorSecured(s, 'caterham_churchyard'), 'still dormant');
  s = stepCampaign(stepCampaign(s));
  assert.ok(!isSectorSecured(s, 'caterham_churchyard'), 're-infested');
  assert.ok(getOpenSectors(s).some(x => x.id === 'caterham_churchyard'));
  const fresh = s.contracts.caterham_churchyard;
  assert.notEqual(fresh.targetGoetiaId, sealedBefore);
  assert.ok(!s.sealedGoetia.includes(fresh.targetGoetiaId));
  assert.equal(fresh.discoveredLogs.length, 0);
  assert.equal(s.campaign.cycles.caterham_churchyard, 1);
  assert.equal(s.sectorRipeness.caterham_churchyard, 0);
  assert.ok(!s.attunedSectors.caterham_churchyard, 'attunement does not carry over');
});

test('the sector you are standing in never re-infests under you', () => {
  let s = secure(runWithContracts(), 'caterham_churchyard');
  s = { ...s, campaign: { ...s.campaign, nextSiteAt: 9999 } };
  for (let t = 0; t < 40; t++) s = stepCampaign(s);
  assert.ok(isSectorSecured(s, 'caterham_churchyard'));
});

test('lost sectors stay lost', () => {
  let s = runWithContracts();
  s = act(s, { type: 'RELEASE_GOETIA', payload: { goetiaId: s.contracts.chaldon_quarry.targetGoetiaId, sectorId: 'chaldon_quarry' } });
  s = { ...s, campaign: { ...s.campaign, nextSiteAt: 9999 } };
  for (let t = 0; t < 60; t++) s = stepCampaign(s);
  assert.ok(s.flags.sector_failed_chaldon_quarry);
  assert.ok(!getOpenSectors(s).some(x => x.id === 'chaldon_quarry'));
});

test('closing a case is counted, and all 72 sealed completes the Lesser Key', () => {
  let s = secure(runWithContracts(), 'caterham_asylum');
  assert.equal(s.campaign.casesClosed, 1);
  assert.ok(!s.flags[LESSER_KEY_COMPLETE_FLAG]);
  s = allGoetia.reduce((acc, g) => gameReducer(acc, { type: 'SEAL_GOETIA', payload: g.id }), s);
  assert.ok(s.flags[LESSER_KEY_COMPLETE_FLAG]);
  assert.ok(s.notices.some(n => n.text.includes('LESSER KEY')));
});

test('a flawless operative can seal all 72 over one long campaign', () => {
  let s = runWithContracts();
  let trips = 0;
  for (; trips < 2000 && !isCampaignExhausted(s); trips++) {
    const open = getOpenSectors(s);
    if (open.length === 0) {
      // Nothing to work: rest at the Safehouse and let the world turn
      s = act(s, { type: 'TRAVEL', payload: 'safehouse' }, { type: 'ADVANCE_TIME', payload: 4 });
      continue;
    }
    // Work the ripest anchor first
    const next = [...open].sort((a, b) => (s.sectorRipeness[b.id] || 0) - (s.sectorRipeness[a.id] || 0))[0];
    s = secure(s, next.id);
    assert.equal(s.gameStage, 'ACTIVE', `run ended at trip ${trips}`);
  }
  assert.equal(s.releasedGoetia.length, 0, 'nothing manifested');
  assert.equal(s.sealedGoetia.length, TOTAL_GOETIA);
  assert.equal(getUnhousedGoetia(s).length, 0);
  assert.ok(s.flags[LESSER_KEY_COMPLETE_FLAG]);
  assert.ok(s.campaign.sites.length > 0, 'the map grew');
  assert.ok(Object.values(s.campaign.cycles).some(c => c > 0), 'some sectors re-infested');
  assert.ok(s.campaign.casesClosed >= 30, `a long campaign (${s.campaign.casesClosed} cases)`);
});
