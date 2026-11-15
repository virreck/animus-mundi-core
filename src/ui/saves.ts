// src/ui/saves.ts
// Save slots and save files. Three slots live in browser storage. Slot 1 keeps the
// original save key, so saves from before slots existed load as slot 1. A save can be
// exported to a .json file and imported back into any slot, on any device.
import type { GameState } from '../engine/state';

export const SLOT_COUNT = 3;
/** Slot 1 reuses the pre-slots key. */
export const LEGACY_SAVE_KEY = 'thaumaturgic_os_save_v1';
export const ACTIVE_SLOT_KEY = 'thaumaturgic_os_active_slot';
/** Older saves kept micro entropy and contracts in their own keys (slot 1 only). */
export const LEGACY_MICRO_ENTROPY_KEY = 'thaumaturgic_os_micro_entropy_v2';
export const LEGACY_CONTRACTS_KEY = 'thaumaturgic_os_contracts_v2';

export const SAVE_FILE_FORMAT = 'kage-no-sho-save';
export const SAVE_FILE_VERSION = 1;

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const browserStore = (): Store => globalThis.localStorage;

export const slotKey = (slot: number) => (slot === 1 ? LEGACY_SAVE_KEY : `thaumaturgic_os_save_slot${slot}_v1`);
const metaKey = (slot: number) => `${slotKey(slot)}_meta`;

const clampSlot = (slot: number) => (Number.isInteger(slot) && slot >= 1 && slot <= SLOT_COUNT ? slot : 1);

export function getActiveSlot(store: Store = browserStore()): number {
  try {
    return clampSlot(Number(store.getItem(ACTIVE_SLOT_KEY) || 1));
  } catch {
    return 1;
  }
}

export function setActiveSlot(slot: number, store: Store = browserStore()) {
  try {
    store.setItem(ACTIVE_SLOT_KEY, String(clampSlot(slot)));
  } catch { /* storage unavailable: stays in memory only */ }
}

export function readSlot(slot: number, store: Store = browserStore()): Partial<GameState> | null {
  try {
    const raw = store.getItem(slotKey(slot));
    return raw ? (JSON.parse(raw) as Partial<GameState>) : null;
  } catch {
    return null;
  }
}

/** Writes a run into a slot. Returns false if storage is full or unavailable. */
export function writeSlot(slot: number, state: GameState, store: Store = browserStore(), now = Date.now()): boolean {
  try {
    store.setItem(slotKey(slot), JSON.stringify(state));
    store.setItem(metaKey(slot), JSON.stringify({ savedAt: now }));
    return true;
  } catch {
    return false;
  }
}

export function deleteSlot(slot: number, store: Store = browserStore()) {
  try {
    store.removeItem(slotKey(slot));
    store.removeItem(metaKey(slot));
    if (slot === 1) {
      store.removeItem(LEGACY_MICRO_ENTROPY_KEY);
      store.removeItem(LEGACY_CONTRACTS_KEY);
    }
  } catch { /* nothing to delete */ }
}

export interface SlotSummary {
  slot: number;
  empty: boolean;
  name?: string;
  agency?: string;
  portrait?: string;
  sealed?: number;
  released?: number;
  casesClosed?: number;
  over?: boolean;
  /** ms since epoch, if known. */
  savedAt?: number;
}

export function summariseSlot(slot: number, store: Store = browserStore()): SlotSummary {
  const s = readSlot(slot, store);
  if (!s) return { slot, empty: true };
  let savedAt: number | undefined;
  try {
    savedAt = JSON.parse(store.getItem(metaKey(slot)) || '{}').savedAt;
  } catch { /* no timestamp */ }
  return {
    slot,
    empty: false,
    name: s.playerName || 'OPERATIVE',
    agency: s.agencyName,
    portrait: s.playerPortrait,
    sealed: (s.sealedGoetia || []).length,
    released: (s.releasedGoetia || []).length,
    casesClosed: s.campaign?.casesClosed,
    over: s.gameStage === 'GAME_OVER',
    savedAt
  };
}

export const listSlots = (store: Store = browserStore()) =>
  Array.from({ length: SLOT_COUNT }, (_, i) => summariseSlot(i + 1, store));

// ---------------------------------------------------------------------------
// SAVE FILES
// ---------------------------------------------------------------------------
export interface SaveFile {
  format: typeof SAVE_FILE_FORMAT;
  version: number;
  exportedAt: string;
  operative: string;
  state: Partial<GameState>;
}

export function buildSaveFile(state: Partial<GameState>, now = new Date()): SaveFile {
  return {
    format: SAVE_FILE_FORMAT,
    version: SAVE_FILE_VERSION,
    exportedAt: now.toISOString(),
    operative: state.playerName || 'OPERATIVE',
    state
  };
}

export function saveFileName(state: Partial<GameState>, now = new Date()): string {
  const who = (state.playerName || 'operative').toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-+)|(-+$)/g, '') || 'operative';
  return `kage-save-${who}-${now.toISOString().slice(0, 10)}.json`;
}

/** Does this look like a run we can load? */
function looksLikeRun(s: unknown): s is Partial<GameState> {
  if (!s || typeof s !== 'object') return false;
  const r = s as Record<string, unknown>;
  return typeof r.gameStage === 'string' && Array.isArray(r.sealedGoetia) && typeof r.flags === 'object' && r.flags !== null;
}

export type ParsedSave = { ok: true; state: Partial<GameState> } | { ok: false; error: string };

/** Reads an exported save file. Also accepts a bare run (a raw copy of a slot). */
export function parseSaveFile(text: string): ParsedSave {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not a save file (it could not be read).' };
  }
  if (data && typeof data === 'object' && (data as SaveFile).format === SAVE_FILE_FORMAT) {
    const file = data as SaveFile;
    if (typeof file.version !== 'number' || file.version > SAVE_FILE_VERSION) {
      return { ok: false, error: 'That save was made by a newer version of the game.' };
    }
    if (!looksLikeRun(file.state)) return { ok: false, error: 'That save file is damaged.' };
    return { ok: true, state: file.state };
  }
  if (looksLikeRun(data)) return { ok: true, state: data };
  return { ok: false, error: 'That file is not a save file for this game.' };
}

/** Starts a browser download of `text` as `fileName`. */
export function downloadText(fileName: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSlot(slot: number, store: Store = browserStore()): boolean {
  const s = readSlot(slot, store);
  if (!s) return false;
  downloadText(saveFileName(s), JSON.stringify(buildSaveFile(s), null, 1));
  return true;
}
