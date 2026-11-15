// src/ui/components/AppHeader.tsx
// Top bar: viewport tabs, vital stats and settings.
import { useEffect, useRef, useState } from 'react';
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { theme, type FontScale } from '../theme';


const NEXT_FONT_SCALE: Record<FontScale, FontScale> = { SM: 'MD', MD: 'LG', LG: 'SM' };
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Publish the header's real height so fixed overlays (toasts, training panel) sit just under it
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="app-header" style={{ minHeight: '46px', flexShrink: 0, backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
      <nav className="header-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button className={`viewport-tab ${viewport === 'FIELD_OPS' ? 'active' : ''}`} data-tour="tab-FIELD_OPS" onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('FIELD_OPS'); }}><span className="fkey">[F1] </span>FIELD_OPS</button>
        <button
          className={`viewport-tab ${viewport === 'CODEX' ? 'active' : ''}`}
          data-tour="tab-CODEX"
          onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('CODEX'); }}
          style={activeReadingCount >= 3 && viewport !== 'CODEX' ? { borderColor: theme.accentAmber, color: theme.accentAmber, boxShadow: '0 0 8px rgba(255,184,0,0.4)' } : undefined}
        >
          <span className="fkey">[F2] </span>CODEX ({activeSectorClueCount})
        </button>
        <button className={`viewport-tab ${viewport === 'KAGE_NO_SHO' ? 'active' : ''}`} data-tour="tab-KAGE_NO_SHO" onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('KAGE_NO_SHO'); }}><span className="fkey">[F3] </span>KAGE_NO_SHO ({state.tetheredYokai.length}/2)</button>
        <button className={`viewport-tab ${viewport === 'SAFEHOUSE_ALTAR' ? 'active' : ''}`} data-tour="tab-SAFEHOUSE_ALTAR" onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('SAFEHOUSE_ALTAR'); }}><span className="fkey">[F4] </span>SAFEHOUSE</button>
        <button className={`viewport-tab ${viewport === 'HORSEMEN' ? 'active' : ''}`} data-tour="tab-HORSEMEN" onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('HORSEMEN'); }} style={viewport !== 'HORSEMEN' ? { borderColor: theme.accentRed, color: theme.accentRed } : undefined}><span className="fkey">[F5] </span>HORSEMEN</button>
        <button className={`viewport-tab ${viewport === 'DOSSIER' ? 'active' : ''}`} data-tour="tab-DOSSIER" onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('DOSSIER'); }}><span className="fkey">[F6] </span>DOSSIER</button>
        <button className={`viewport-tab ${viewport === 'MANUAL' ? 'active' : ''}`} data-tour="tab-MANUAL" onClick={() => { ThaumaturgicAudio.keyClick(); setViewport('MANUAL'); }}><span className="fkey">[F7] </span>MANUAL</button>
      </nav>

      <div className="header-vitals" style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, fontSize: '0.72rem' }}>
        <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentRed }}>
          ENTROPY: <strong>{totalGlobalEntropy.toFixed(2)}%</strong>
        </span>
        <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: state.humanity < 40 ? theme.accentRed : theme.textBright }}>
          HUM: <strong>{state.humanity}%</strong>
        </span>
        <span style={{ padding: '4px 6px', backgroundColor: '#090d0a', border: `1px solid ${theme.borderTerminal}`, color: theme.accentAmber, fontWeight: 'bold' }}>
          OBOLS: {state.inventory.obols || 0}
        </span>
        <button className="mobile-only macro-chip" style={{ padding: '4px 8px' }} onClick={() => setSettingsOpen(v => !v)} aria-label="Settings">
          ⚙
        </button>
        <span className={`header-settings ${settingsOpen ? 'open' : ''}`}>
        <button
          onClick={() => { ThaumaturgicAudio.keyClick(); setControlMode(prev => prev === 'PALETTE' ? 'CLI' : 'PALETTE'); }}
          className={`macro-chip ${controlMode === 'PALETTE' ? 'macro-chip-amber' : ''}`}
          style={{ padding: '4px 7px' }}
        >
          MODE:{controlMode}
        </button>
        <button
          onClick={() => { ThaumaturgicAudio.keyClick(); setFontScale(prev => NEXT_FONT_SCALE[prev]); }}
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
        </span>
      </div>
    </header>
  );
}
