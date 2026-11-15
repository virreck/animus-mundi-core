// src/ui/debug/DebugPanel.tsx
// The hidden playtest log viewer. Locked behind a passphrase so players don't stumble into it.
// This is a curtain, not security: anyone reading the game's code can get past it.
import { useEffect, useRef, useState } from 'react';
import { downloadText } from '../saves';
import { theme } from '../theme';
import { clearDebugLog, getDebugLog, summarise, toCSV, type DebugEntry, type DebugKind } from './debugLog';
import { sha256Hex } from './sha256';

/** SHA-256 of the passphrase. Override at build time with VITE_DEBUG_PASSPHRASE_SHA256 (see README). */
const DEFAULT_PASSPHRASE_SHA256 = 'b0b8da1582413035a39abf859629ceb415fb2f41f51dd2d63bf743924549ce75';
const PASSPHRASE_SHA256 = (import.meta.env?.VITE_DEBUG_PASSPHRASE_SHA256 as string | undefined)?.toLowerCase() || DEFAULT_PASSPHRASE_SHA256;
const UNLOCK_KEY = 'thaumaturgic_os_debug_unlocked';

const isUnlocked = () => {
  try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
};

const FILTERS: Array<'ALL' | DebugKind> = ['ALL', 'SNAPSHOT', 'ACTION', 'NOTICE', 'ERROR', 'SESSION'];
const KIND_COLOUR: Record<DebugKind, string> = {
  SNAPSHOT: theme.accentCyan,
  ACTION: '#a8ccaf',
  NOTICE: theme.accentAmber,
  ERROR: theme.accentRed,
  SESSION: theme.textBright
};

const time = (t?: number) => (t ? new Date(t).toLocaleString() : '—');
const stamp = () => new Date().toISOString().slice(0, 16).replace(':', '');

function LockScreen({ onUnlock, onClose }: Readonly<{ onUnlock: () => void; onClose: () => void }>) {
  const [pass, setPass] = useState('');
  const [wrong, setWrong] = useState(false);
  const tryUnlock = () => {
    if (sha256Hex(pass.trim()) === PASSPHRASE_SHA256) {
      try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch { /* unlocked for this view only */ }
      onUnlock();
    } else {
      setWrong(true);
      setPass('');
    }
  };
  return (
    <form
      onSubmit={e => { e.preventDefault(); tryUnlock(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '15vh auto 0 auto', width: '100%' }}
    >
      <label htmlFor="debug-pass" style={{ color: theme.textBright, letterSpacing: '2px' }}>&gt; MAINTENANCE ACCESS</label>
      <input
        id="debug-pass"
        type="password"
        value={pass}
        onChange={e => { setPass(e.target.value); setWrong(false); }}
        autoComplete="off"
        style={{ padding: '9px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${wrong ? theme.accentRed : theme.borderTerminal}`, fontFamily: theme.fontMono }}
      />
      {wrong && <div role="alert" style={{ color: theme.accentRed, fontSize: '0.76rem' }}>ACCESS DENIED.</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="macro-chip" style={{ flex: 1, padding: '8px', fontWeight: 'bold' }}>UNLOCK</button>
        <button type="button" onClick={onClose} className="macro-chip macro-chip-danger" style={{ padding: '8px' }}>CLOSE</button>
      </div>
    </form>
  );
}

function EntryRow({ e }: Readonly<{ e: DebugEntry }>) {
  return (
    <div style={{ borderBottom: `1px dashed ${theme.borderTerminal}`, padding: '3px 0', fontSize: '0.7rem', wordBreak: 'break-word' }}>
      <span style={{ color: theme.textMuted }}>{new Date(e.t).toLocaleTimeString()} </span>
      <span style={{ color: KIND_COLOUR[e.kind], fontWeight: 'bold' }}>{e.kind}</span>
      {e.slot !== undefined && <span style={{ color: theme.textMuted }}> s{e.slot}</span>}
      {e.training && <span style={{ color: theme.textMuted }}> [training]</span>}
      <span style={{ color: '#d6f5dc' }}> {e.msg}</span>
      {e.data && (
        <div style={{ color: '#a8ccaf', paddingLeft: '10px' }}>
          {Object.entries(e.data).map(([k, v]) => `${k}=${String(v)}`).join(' · ')}
        </div>
      )}
    </div>
  );
}

export function DebugPanel({ onClose }: Readonly<{ onClose: () => void }>) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [filter, setFilter] = useState<'ALL' | DebugKind>('ALL');
  const [tick, setTick] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open as a modal so focus stays inside and Escape closes it
  useEffect(() => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
  }, []);

  const entries = tick >= 0 ? getDebugLog() : [];
  const sum = summarise(entries);
  const shown = entries.filter(e => filter === 'ALL' || e.kind === filter).slice(-300).reverse();

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entries));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Debug log"
      onCancel={e => { e.preventDefault(); onClose(); }}
      style={{
        position: 'fixed', inset: 0, margin: 0, width: '100vw', height: '100dvh', maxWidth: 'none', maxHeight: 'none', border: 'none',
        zIndex: 3000, backgroundColor: 'rgba(2,4,3,0.98)', fontFamily: theme.fontMono, color: theme.textTerminal,
        display: 'flex', flexDirection: 'column', padding: '10px 12px', boxSizing: 'border-box'
      }}
    >
      {unlocked ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <strong style={{ color: theme.textBright, letterSpacing: '2px' }}>PLAYTEST LOG</strong>
            <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="macro-chip macro-chip-cyan" onClick={() => downloadText(`kage-debug-${stamp()}.json`, JSON.stringify(entries, null, 1))}>EXPORT JSON</button>
              <button className="macro-chip macro-chip-cyan" onClick={() => downloadText(`kage-debug-${stamp()}.csv`, toCSV(entries), 'text/csv')}>EXPORT CSV</button>
              <button className="macro-chip" onClick={copyAll}>{copied ? 'COPIED' : 'COPY'}</button>
              <button className="macro-chip" onClick={() => setTick(t => t + 1)}>REFRESH</button>
              {confirmClear ? (
                <button className="macro-chip macro-chip-danger" onClick={() => { clearDebugLog(); setConfirmClear(false); setTick(t => t + 1); }}>CLEAR ALL?</button>
              ) : (
                <button className="macro-chip macro-chip-danger" onClick={() => setConfirmClear(true)}>CLEAR</button>
              )}
              <button className="macro-chip" onClick={() => { try { sessionStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ } setUnlocked(false); }}>LOCK</button>
              <button className="macro-chip macro-chip-danger" onClick={onClose}>CLOSE</button>
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#a8ccaf', lineHeight: 1.6, marginBottom: '6px' }}>
            {sum.entries} entries · {sum.actions} actions · {sum.manifestations} manifestations · <span style={{ color: sum.errors ? theme.accentRed : 'inherit' }}>{sum.errors} errors</span>
            <br />
            {time(sum.first)} → {time(sum.last)}
            {sum.latest && (
              <div style={{ color: theme.accentCyan }}>
                LATEST: {Object.entries(sum.latest).map(([k, v]) => `${k}=${String(v)}`).join(' · ')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`macro-chip ${filter === f ? 'macro-chip-amber' : ''}`} aria-pressed={filter === f}>{f}</button>
            ))}
            <span style={{ fontSize: '0.66rem', color: theme.textMuted, alignSelf: 'center' }}>newest first · last 300 shown · exports include everything</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {shown.length === 0 ? <div style={{ color: theme.textMuted }}>Nothing logged yet.</div> : shown.map(e => <EntryRow key={e.n ?? `${e.t}-${e.msg}`} e={e} />)}
          </div>
        </>
      ) : (
        <LockScreen onUnlock={() => setUnlocked(true)} onClose={onClose} />
      )}
    </dialog>
  );
}
