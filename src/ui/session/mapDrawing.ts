// src/ui/session/mapDrawing.ts
// Pure canvas drawing for the Field Ops map: backdrop, sonar rings, the sector sub-grid,
// the regional map and the heat waveform. Each helper does one job so the render loop stays readable.
import type { MacroSectorDef } from '../../content/map';
import type { SectorContract, SubGridNode } from '../../engine/sectorGenerator';

type Ctx = CanvasRenderingContext2D;

export interface VisualFx {
  angle: number;
  wavePhase: number;
  sonarRings: Array<{ x: number; y: number; r: number; alpha: number }>;
}

const FONT = '"Courier New", monospace';
const GREEN = '#62f080';
const RED = '#ff2a55';
const AMBER = '#ffb800';
const CYAN = '#00f3ff';
const PALE = '#a8ccaf';

// ---------------------------------------------------------------------------
// SHARED
// ---------------------------------------------------------------------------
export function drawBackdropGrid(ctx: Ctx, w: number, h: number) {
  ctx.strokeStyle = 'rgba(74, 124, 89, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

/** Expands and fades each sonar ring; finished rings are removed. */
export function drawSonarRings(ctx: Ctx, fx: VisualFx, w: number, h: number) {
  for (let i = fx.sonarRings.length - 1; i >= 0; i--) {
    const sr = fx.sonarRings[i];
    sr.r += 4;
    sr.alpha -= 0.02;
    if (sr.alpha <= 0) {
      fx.sonarRings.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(sr.x * w, sr.y * h, sr.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(98, 240, 128, ${sr.alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function heatColour(heat: number): string {
  if (heat >= 75) return RED;
  return heat >= 35 ? AMBER : GREEN;
}

export function drawWaveform(ctx: Ctx, w: number, h: number, heat: number, phase: number) {
  ctx.clearRect(0, 0, w, h);
  const amp = Math.min(h / 2 - 2, 3 + heat / 10);
  ctx.beginPath();
  ctx.strokeStyle = heatColour(heat);
  ctx.lineWidth = 1.5;
  for (let x = 0; x < w; x++) {
    const y = h / 2 + Math.sin(x * 0.22 + phase) * amp * Math.sin(x * 0.05);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// SECTOR SUB-GRID
// ---------------------------------------------------------------------------
export interface SubGridView {
  contract: SectorContract;
  /** The anchor broke free here. */
  failed: boolean;
  /** Secured or lost: nothing left to do in the sector. */
  closed: boolean;
  angle: number;
  isReachable: (node: SubGridNode) => boolean;
  entryCost: (node: SubGridNode) => number;
}

function drawStartMarker(ctx: Ctx, w: number, h: number, first: SubGridNode) {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([5, 4]);
  ctx.moveTo(0.03 * w, first.y * h);
  ctx.lineTo(first.x * w, first.y * h);
  ctx.strokeStyle = 'rgba(98, 240, 128, 0.85)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.font = `bold 10px ${FONT}`;
  ctx.fillText('START ->', 0.06 * w, first.y * h - 8);
  ctx.restore();
}

function idleLinkColour(view: SubGridView, a: SubGridNode, b: SubGridNode): string {
  if (view.failed) return 'rgba(255, 42, 85, 0.45)';
  if (view.closed) return 'rgba(98, 240, 128, 0.55)';
  if (a.status !== 'LOCKED' && b.status !== 'LOCKED') return 'rgba(98, 240, 128, 0.35)';
  return 'rgba(74, 124, 89, 0.18)';
}

function drawRoomLink(ctx: Ctx, w: number, h: number, view: SubGridView, a: SubGridNode, b: SubGridNode) {
  const active = view.contract.activeSubNodeId === a.id || view.contract.activeSubNodeId === b.id;
  ctx.save();
  ctx.beginPath();
  if (active && !view.closed) {
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(98, 240, 128, 0.85)';
    ctx.lineWidth = 2.6;
  } else {
    ctx.strokeStyle = idleLinkColour(view, a, b);
    ctx.lineWidth = 1.4;
  }
  ctx.moveTo(a.x * w, a.y * h);
  ctx.lineTo(b.x * w, b.y * h);
  ctx.stroke();
  ctx.restore();
}

function roomColour(view: SubGridView, node: SubGridNode): string {
  if (view.failed) return RED;
  if (view.closed || node.status === 'CLEARED') return GREEN;
  if (node.status === 'SCANNED') {
    if (node.patrolActive) return RED;
    return node.nodeType === 'SHRINE' ? CYAN : AMBER;
  }
  return node.status === 'ENTERED' ? AMBER : RED;
}

const SCANNED_TYPE_TAG: Partial<Record<SubGridNode['nodeType'], string>> = { SHRINE: 'SHRINE', ANCHOR: 'ANCHOR', WITNESS: 'WITNESS' };

function roomBadge(view: SubGridView, node: SubGridNode, isCurrent: boolean): string {
  if (view.failed) return '[LOST]';
  if (view.closed) return '[SECURED]';
  if (isCurrent) return '[YOU ARE HERE]';
  const entryHeat = view.entryCost(node);
  if (node.status !== 'SCANNED') return `[${node.status} // +${entryHeat}% HEAT]`;
  const typeTag = node.patrolActive ? '! PATROL !' : SCANNED_TYPE_TAG[node.nodeType] ?? 'CLUE';
  return `[${typeTag} // +${entryHeat}% HEAT]`;
}

function drawHexagon(ctx: Ctx, nx: number, ny: number, radius: number, rotation: number, stroke: string, width: number) {
  ctx.save();
  ctx.translate(nx, ny);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    if (i === 0) ctx.moveTo(radius * Math.cos(a), radius * Math.sin(a));
    else ctx.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

/** Warning above a known room: a patrol, or the trap on its threshold. */
function threatLabel(node: SubGridNode): { text: string; colour: string } | null {
  if (node.patrolActive) return { text: '! PATROL !', colour: RED };
  if (node.hazard !== 'NONE') return { text: `! TRAP: ${node.hazard} !`, colour: CYAN };
  return null;
}

function drawRoom(ctx: Ctx, w: number, h: number, view: SubGridView, node: SubGridNode) {
  const nx = node.x * w;
  const ny = node.y * h;
  const isCurrent = node.id === view.contract.activeSubNodeId;
  const isSelected = node.id === view.contract.selectedSubNodeId;
  const reachable = !view.closed && !isCurrent && view.isReachable(node);
  const colour = roomColour(view, node);

  if (reachable) {
    ctx.beginPath();
    ctx.arc(nx, ny, 23, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(98, 240, 128, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  drawHexagon(ctx, nx, ny, isCurrent ? 21 : 16, isCurrent ? view.angle : -view.angle * 0.5, isSelected ? '#ffffff' : colour, isSelected ? 2.5 : 1.6);

  ctx.beginPath();
  ctx.arc(nx, ny, 5, 0, Math.PI * 2);
  ctx.fillStyle = isCurrent ? GREEN : '#050706';
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = isSelected ? '#ffffff' : PALE;
  ctx.fillText(node.label, nx, ny + 30);

  ctx.font = `10px ${FONT}`;
  ctx.fillStyle = isCurrent ? GREEN : colour;
  ctx.fillText(roomBadge(view, node, isCurrent), nx, ny + 42);

  if (reachable) {
    ctx.fillStyle = GREEN;
    ctx.font = `bold 9px ${FONT}`;
    ctx.fillText('● REACHABLE', nx, ny + 53);
  }

  const threat = node.status !== 'LOCKED' && !view.closed ? threatLabel(node) : null;
  if (threat) {
    ctx.fillStyle = threat.colour;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillText(threat.text, nx, ny - 23);
  }
}

export function drawSubGrid(ctx: Ctx, w: number, h: number, view: SubGridView) {
  const rooms = view.contract.subNodes;
  if (!view.contract.activeSubNodeId && rooms[0]) drawStartMarker(ctx, w, h, rooms[0]);
  const byId = new Map(rooms.map(n => [n.id, n]));
  for (const a of rooms) {
    for (const id of a.connections) {
      const b = byId.get(id);
      if (b && a.index <= b.index) drawRoomLink(ctx, w, h, view, a, b);
    }
  }
  rooms.forEach(node => drawRoom(ctx, w, h, view, node));
}

// ---------------------------------------------------------------------------
// REGIONAL MAP
// ---------------------------------------------------------------------------
export interface SectorStatus {
  isCurrent: boolean;
  secured: boolean;
  lost: boolean;
  unlocked: boolean;
  heat: number;
  ripeness: number;
  /** Times this sector has re-infested. */
  cycle: number;
  procedural: boolean;
}

export interface RegionalView {
  sectors: MacroSectorDef[];
  isUnlocked: (sec: MacroSectorDef) => boolean;
  statusOf: (sec: MacroSectorDef) => SectorStatus;
}

function drawSectorLinks(ctx: Ctx, w: number, h: number, view: RegionalView) {
  const byId = new Map(view.sectors.map(n => [n.id, n]));
  for (const a of view.sectors) {
    const openA = view.isUnlocked(a);
    for (const id of a.connections) {
      const b = byId.get(id);
      if (!b) continue;
      const lit = openA && view.isUnlocked(b);
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.strokeStyle = lit ? 'rgba(98, 240, 128, 0.35)' : 'rgba(42, 82, 51, 0.15)';
      ctx.lineWidth = lit ? 1.5 : 0.9;
      ctx.stroke();
    }
  }
}

function sectorColour(sec: MacroSectorDef, st: SectorStatus): string {
  if (sec.id === 'safehouse') return CYAN;
  if (st.secured) return GREEN;
  if (st.lost) return RED;
  if (!st.unlocked) return '#2a5233';
  return st.heat >= 75 ? RED : AMBER;
}

function sectorFill(st: SectorStatus): string {
  if (st.secured) return 'rgba(98, 240, 128, 0.25)';
  return st.lost ? 'rgba(255, 42, 85, 0.3)' : '#050706';
}

function nodeRadius(st: SectorStatus): number {
  if (st.isCurrent) return 13;
  return st.unlocked ? 9 : 5;
}

function ripenessColour(ripeness: number): string {
  if (ripeness >= 75) return RED;
  return ripeness >= 50 ? AMBER : PALE;
}

function sectorStatusText(sec: MacroSectorDef, st: SectorStatus): string {
  if (sec.id === 'safehouse') return '[SAFEHOUSE]';
  if (st.secured) return '✓ SECURED';
  if (st.lost) return '☠ LOST';
  const prefix = st.cycle > 0 ? `RE-INF ${st.cycle} · ` : '';
  return `${prefix}HEAT:${st.heat}% · RIPE:${st.ripeness}%`;
}

function drawSector(ctx: Ctx, w: number, h: number, sec: MacroSectorDef, st: SectorStatus) {
  const nx = sec.x * w;
  const ny = sec.y * h;
  const colour = sectorColour(sec, st);
  const ringBase = st.isCurrent ? 13 : 9;

  ctx.beginPath();
  ctx.arc(nx, ny, nodeRadius(st), 0, Math.PI * 2);
  ctx.fillStyle = sectorFill(st);
  ctx.fill();
  ctx.strokeStyle = st.isCurrent ? '#ffffff' : colour;
  ctx.lineWidth = st.isCurrent ? 2.5 : 1.8;
  ctx.stroke();

  // Sites the campaign opened later get a dashed halo so they read as new ground
  if (st.procedural) {
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.arc(nx, ny, ringBase + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ripeness ring: how close this anchor is to manifesting on its own
  const live = st.unlocked && !st.secured && !st.lost && sec.id !== 'safehouse';
  if (live && st.ripeness > 0) {
    ctx.beginPath();
    ctx.arc(nx, ny, ringBase + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * st.ripeness) / 100);
    ctx.strokeStyle = ripenessColour(st.ripeness);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  if (!st.unlocked) {
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = st.isCurrent ? '#ffffff' : '#2a5233';
    ctx.fillText('??? [LOCKED]', nx, ny + 23);
    return;
  }
  ctx.font = `bold 10px ${FONT}`;
  ctx.fillStyle = st.isCurrent ? '#ffffff' : PALE;
  ctx.fillText(sec.short, nx, ny + 23);
  ctx.font = `9px ${FONT}`;
  ctx.fillStyle = colour;
  ctx.fillText(sectorStatusText(sec, st), nx, ny + 34);
}

export function drawRegionalMap(ctx: Ctx, w: number, h: number, view: RegionalView) {
  drawSectorLinks(ctx, w, h, view);
  view.sectors.forEach(sec => drawSector(ctx, w, h, sec, view.statusOf(sec)));
}
