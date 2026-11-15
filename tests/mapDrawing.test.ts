// tests/mapDrawing.test.ts
// Smoke tests for the map drawing helpers, against a recording fake canvas context.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSectorContract } from '../src/engine/sectorGenerator';
import { MACRO_SECTORS } from '../src/content/map';
import { drawBackdropGrid, drawRegionalMap, drawSonarRings, drawSubGrid, drawWaveform, heatColour, type VisualFx } from '../src/ui/session/mapDrawing';

/** Records every method call and property write; methods are no-ops. */
function fakeCtx() {
  const calls: string[] = [];
  const texts: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, key: string) => (...args: unknown[]) => {
      calls.push(key);
      if (key === 'fillText') texts.push(String(args[0]));
    },
    set: () => true
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, texts };
}

test('the sub-grid draws every room with its label and a start marker on a fresh case', () => {
  const contract = generateSectorContract('caterham_churchyard', 'ST. LAWRENCE CRYPT', []);
  const { ctx, texts } = fakeCtx();
  drawSubGrid(ctx, 800, 600, { contract, failed: false, closed: false, angle: 0, isReachable: () => true, entryCost: () => 5 });
  for (const n of contract.subNodes) assert.ok(texts.includes(n.label), `missing label ${n.label}`);
  assert.ok(texts.includes('START ->'));
  assert.ok(texts.some(t => t.includes('REACHABLE')));
});

test('a lost sector badges every room as lost', () => {
  const contract = generateSectorContract('caterham_asylum', 'CATERHAM ASYLUM', []);
  const { ctx, texts } = fakeCtx();
  drawSubGrid(ctx, 800, 600, { contract, failed: true, closed: true, angle: 0, isReachable: () => true, entryCost: () => 5 });
  assert.equal(texts.filter(t => t === '[LOST]').length, contract.subNodes.length);
  assert.ok(!texts.some(t => t.includes('REACHABLE')), 'nothing is reachable in a closed sector');
});

test('the regional map labels locked, secured and open sectors', () => {
  const { ctx, texts } = fakeCtx();
  drawRegionalMap(ctx, 800, 600, {
    sectors: MACRO_SECTORS,
    isUnlocked: s => s.id !== 'highgate_catacombs',
    statusOf: s => ({
      isCurrent: s.id === 'safehouse',
      secured: s.id === 'caterham_asylum',
      lost: false,
      unlocked: s.id !== 'highgate_catacombs',
      heat: 20,
      ripeness: 40,
      cycle: s.id === 'chaldon_quarry' ? 2 : 0,
      procedural: false
    })
  });
  assert.ok(texts.includes('??? [LOCKED]'));
  assert.ok(texts.includes('✓ SECURED'));
  assert.ok(texts.includes('[SAFEHOUSE]'));
  assert.ok(texts.includes('RE-INF 2 · HEAT:20% · RIPE:40%'));
});

test('sonar rings fade out and are removed', () => {
  const fx: VisualFx = { angle: 0, wavePhase: 0, sonarRings: [{ x: 0.5, y: 0.5, r: 6, alpha: 0.03 }] };
  const { ctx } = fakeCtx();
  drawSonarRings(ctx, fx, 100, 100);
  drawSonarRings(ctx, fx, 100, 100);
  assert.equal(fx.sonarRings.length, 0);
});

test('backdrop, waveform and heat colours', () => {
  const { ctx, calls } = fakeCtx();
  drawBackdropGrid(ctx, 64, 64);
  drawWaveform(ctx, 90, 20, 50, 0);
  assert.ok(calls.includes('stroke'));
  assert.equal(heatColour(10), '#62f080');
  assert.equal(heatColour(40), '#ffb800');
  assert.equal(heatColour(80), '#ff2a55');
});
