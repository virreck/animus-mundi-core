// src/ui/debug/debugLog.ts
// Playtest log: every action, a world snapshot whenever the campaign clock moves or a spirit is
// sealed or lost, engine notices, and script errors. Kept in browser storage (newest MAX_ENTRIES)
// so a playtest can be exported afterwards and the numbers tuned from real play.
import type { GameAction } from '../../engine/reducer';
import { getTotalGlobalEntropy, type GameState } from '../../engine/state';
import { getOpenSectors, getRipeness } from '../../engine/world';

export const DEBUG_LOG_KEY = 'thaumaturgic_os_debug_log_v1';
export const MAX_ENTRIES = 4000;

export type DebugKind = 'ACTION' | 'SNAPSHOT' | 'NOTICE' | 'ERROR' | 'SESSION';

export interface DebugEntry {
  /** Running number, unique within the log. */
  n?: number;
  /** ms since epoch */
  t: number;
  kind: DebugKind;
  msg: string;
  slot?: number;
  training?: boolean;
  data?: Record<string, unknown>;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const browserStore = (): Store | undefined => globalThis.localStorage;

let buffer: DebugEntry[] | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let context: { slot?: number; training?: boolean } = {};

function load(store: Store | undefined): DebugEntry[] {
  if (buffer) return buffer;
  try {
    buffer = JSON.parse(store?.getItem(DEBUG_LOG_KEY) || '[]');
    if (!Array.isArray(buffer)) buffer = [];
  } catch {
    buffer = [];
  }
  return buffer;
}

function persist(store: Store | undefined) {
  if (!store || !buffer) return;
  try {
    store.setItem(DEBUG_LOG_KEY, JSON.stringify(buffer));
  } catch {
    // Storage full: drop the oldest half and try once more
    buffer = buffer.slice(Math.floor(buffer.length / 2));
    try { store.setItem(DEBUG_LOG_KEY, JSON.stringify(buffer)); } catch { /* give up quietly */ }
  }
}

/** Writes are batched: storage is updated at most once a second. */
function scheduleFlush(store: Store | undefined) {
  if (flushTimer || !store) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    persist(store);
  }, 1000);
}

/** Which slot / whether it is the training run; stamped on every entry. */
export function setDebugContext(next: { slot?: number; training?: boolean }) {
  context = { ...context, ...next };
}

export function logDebug(kind: DebugKind, msg: string, data?: Record<string, unknown>, store: Store | undefined = browserStore(), now = Date.now()) {
  const log = load(store);
  const n = (log.at(-1)?.n ?? 0) + 1;
  log.push({ n, t: now, kind, msg, ...context, ...(data ? { data } : {}) });
  if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
  scheduleFlush(store);
}

export const getDebugLog = (store: Store | undefined = browserStore()): DebugEntry[] => [...load(store)];

export function clearDebugLog(store: Store | undefined = browserStore()) {
  buffer = [];
  try { store?.removeItem(DEBUG_LOG_KEY); } catch { /* ignore */ }
}

/** For tests: forget the in-memory copy so the next call reads from storage again. */
export function resetDebugMemory() {
  buffer = null;
  context = {};
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
}

// ---------------------------------------------------------------------------
// WHAT GETS LOGGED
// ---------------------------------------------------------------------------
/** Actions too frequent or too bulky to be worth a line each. */
const QUIET_ACTIONS = new Set<GameAction['type']>(['ACK_NOTICES', 'SET_DEDUCED_SIGNS']);

/** A one-line description of an action, or null to skip it. */
export function describeAction(action: GameAction): string | null {
  if (QUIET_ACTIONS.has(action.type)) return null;
  if (!('payload' in action)) return action.type;
  const p: unknown = action.payload;
  if (typeof p === 'function') return `${action.type} (update)`;
  if (action.type === 'LOAD_GAME' || action.type === 'SET_CONTRACTS') return `${action.type} (state)`;
  const text = typeof p === 'object' ? JSON.stringify(p) : String(p);
  return `${action.type} ${text.length > 140 ? text.slice(0, 140) + '…' : text}`;
}

/** The numbers worth tuning from. */
export function snapshotOf(state: GameState): Record<string, unknown> {
  const open = state.gameStage === 'ACTIVE' ? getOpenSectors(state) : [];
  const ripeness = open.map(s => getRipeness(state, s.id));
  return {
    stage: state.gameStage,
    tick: state.campaign?.tick ?? 0,
    node: state.currentNode,
    humanity: state.humanity,
    entropy: +getTotalGlobalEntropy(state).toFixed(2),
    heatHere: state.sectorEntropy[state.currentNode] || 0,
    obols: state.inventory.obols || 0,
    open: open.length,
    maxRipeness: ripeness.length ? Math.max(...ripeness) : 0,
    sealed: state.sealedGoetia.length,
    released: (state.releasedGoetia || []).length,
    lostSectors: Object.keys(state.flags).filter(f => f.startsWith('sector_failed_') && state.flags[f]).length,
    casesClosed: state.campaign?.casesClosed ?? 0,
    sites: state.campaign?.sites.length ?? 0,
    pacts: state.tetheredYokai.join(',')
  };
}

/** True when the campaign clock moved, or a spirit was sealed or lost, or the run started or ended. */
export function snapshotWorthy(prev: GameState | null, next: GameState): boolean {
  if (!prev) return next.gameStage === 'ACTIVE';
  return (
    prev.gameStage !== next.gameStage ||
    (prev.campaign?.tick ?? 0) !== (next.campaign?.tick ?? 0) ||
    prev.sealedGoetia.length !== next.sealedGoetia.length ||
    (prev.releasedGoetia || []).length !== (next.releasedGoetia || []).length
  );
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------
const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** Flat table: one row per entry, snapshot numbers in their own columns. */
export function toCSV(entries: DebugEntry[]): string {
  const dataKeys = [...new Set(entries.flatMap(e => Object.keys(e.data || {})))];
  const header = ['time', 'kind', 'slot', 'training', 'message', ...dataKeys];
  const rows = entries.map(e => [
    new Date(e.t).toISOString(), e.kind, e.slot ?? '', e.training ? 'yes' : '', e.msg,
    ...dataKeys.map(k => (e.data ? e.data[k] : ''))
  ].map(csvCell).join(','));
  return [header.join(','), ...rows].join('\n');
}

/** Headline numbers for the viewer. */
export function summarise(entries: DebugEntry[]) {
  const snaps = entries.filter(e => e.kind === 'SNAPSHOT' && !e.training);
  const last = snaps.at(-1)?.data;
  return {
    entries: entries.length,
    actions: entries.filter(e => e.kind === 'ACTION').length,
    errors: entries.filter(e => e.kind === 'ERROR').length,
    manifestations: entries.filter(e => e.kind === 'NOTICE' && /manifest/i.test(e.msg)).length,
    first: entries[0]?.t,
    last: entries.at(-1)?.t,
    latest: last
  };
}

let errorCaptureInstalled = false;
/** Logs uncaught script errors and rejected promises. */
export function installErrorCapture() {
  if (errorCaptureInstalled || typeof window === 'undefined') return;
  errorCaptureInstalled = true;
  window.addEventListener('error', e => logDebug('ERROR', String(e.message || 'Script error'), { source: e.filename, line: e.lineno }));
  window.addEventListener('unhandledrejection', e => logDebug('ERROR', `Unhandled promise: ${String((e.reason as Error)?.message ?? e.reason)}`));
}
