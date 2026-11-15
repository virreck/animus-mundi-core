// src/ui/components/AppHeader.tsx
// Top bar: viewport tabs, vital stats and settings.
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { theme } from '../theme';

export function AppHeader() {
  const {
    state,
    viewport,
    setViewport,
    fontScale,
    setFontScale,
    controlMode,
    setControlMode,
    audioEnabled,
    setAudioEnabled,
    totalGlobalEntropy,
    handleLogout,
    activeSectorClueCount,
    activeReadingCount
  } = useSession();

  return (
    <header style={{ minHeight: '46px', flexShrink: 0, backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button className={`viewport-tab ${viewport === 'FIELD_OPS' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('FIELD_OPS'); }}>[F1] FIELD_OPS</button>
        <button
          className={`viewport-tab ${viewport === 'CODEX' ? 'active' : ''}`}
          onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('CODEX'); }}
          style={activeReadingCount >= 3 && viewport !== 'CODEX' ? { borderColor: theme.accentAmber, color: theme.accentAmber, boxShadow: '0 0 8px rgba(255,184,0,0.4)' } : undefined}
        >
          [F2] CODEX ({activeSectorClueCount})
        </button>
        <button className={`viewport-tab ${viewport === 'KAGE_NO_SHO' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('KAGE_NO_SHO'); }}>[F3] KAGE ({state.tetheredYokai.length}/2)</button>
        <button className={`viewport-tab ${viewport === 'SAFEHOUSE_ALTAR' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('SAFEHOUSE_ALTAR'); }}>[F4] SAFEHOUSE</button>
        <button className={`viewport-tab ${viewport === 'HORSEMEN' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('HORSEMEN'); }} style={viewport !== 'HORSEMEN' ? { borderColor: theme.accentRed, color: theme.accentRed } : undefined}>[F5] HORSEMEN</button>
        <button className={`viewport-tab ${viewport === 'DOSSIER' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('DOSSIER'); }}>[F6] DOSSIER</button>
        <button className={`viewport-tab ${viewport === 'MANUAL' ? 'active' : ''}`} onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('MANUAL'); }}>[F7] MANUAL</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, fontSize: '0.72rem' }}>
        <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentRed }}>
          ENTROPY: <strong>{totalGlobalEntropy.toFixed(2)}%</strong>
        </span>
        <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: state.humanity < 40 ? theme.accentRed : theme.textBright }}>
          HUM: <strong>{state.humanity}%</strong>
        </span>
        <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentAmber, fontWeight: 'bold' }}>
          OBOLS: {state.inventory.obols || 0}
        </span>
        <button
          onClick={() => { ThaumaturgicAudio.keyClick(); setControlMode(prev => prev === 'PALETTE' ? 'CLI' : 'PALETTE'); }}
          className={`macro-chip ${controlMode === 'PALETTE' ? 'macro-chip-amber' : ''}`}
          style={{ padding: '4px 7px' }}
        >
          MODE:{controlMode}
        </button>
        <button
          onClick={() => { ThaumaturgicAudio.keyClick(); setFontScale(prev => prev === 'SM' ? 'MD' : prev === 'MD' ? 'LG' : 'SM'); }}
          className="macro-chip"
          style={{ padding: '4px 7px' }}
        >
          TXT:{fontScale}
        </button>
        <button onClick={() => { ThaumaturgicAudio.enabled = !audioEnabled; setAudioEnabled(!audioEnabled); }} style={{ padding: '4px 7px', backgroundColor: 'transparent', border: `1px solid ${theme.borderTerminal}`, color: theme.textTerminal, cursor: 'pointer' }}>
          {audioEnabled ? '🔊' : '🔇'}
        </button>
        <button onClick={handleLogout} className="macro-chip macro-chip-danger" style={{ padding: '4px 7px' }}>
          LOG OUT
        </button>
      </div>
    </header>
  );
}
