// src/ui/viewports/DossierViewport.tsx
// [F6] DOSSIER: operative record and session controls.
import { allGoetia } from '../../content/goetia';
import { getFullBodyPath } from '../assets';
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, theme } from '../theme';

export function DossierViewport() {
  const {
    state,
    fontScale,
    securedSectorsCount,
    handleFullReset,
    totalGlobalEntropy,
    handleLogout
  } = useSession();

  return (
    <main className="responsive-split" style={{ zoom: FONT_ZOOM_MAP[fontScale] }}>
      <section className="pane-left pane-w38" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '18px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', fontSize: '0.74rem' }}>
          <span style={{ color: theme.textBright, fontWeight: 'bold' }}>BIOMETRIC TETHER FEED</span>
          <span style={{ color: theme.accentAmber }}>LOCKED</span>
        </div>
        <img src={getFullBodyPath(state.playerPortrait)} alt="Operative" style={{ maxHeight: '78%', maxWidth: '100%', objectFit: 'contain' }} />
        <div style={{ width: '100%', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '8px', textAlign: 'center', fontSize: '0.72rem' }}>
          OPERATIVE: <strong style={{ color: theme.textBright }}>{state.playerName.toUpperCase()}</strong>
        </div>
      </section>

      <section className="pane-right pane-w62" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '20px', justifyContent: 'space-between', overflowY: 'auto' }}>
        <div>
          <h1 style={{ margin: '0 0 14px 0', color: theme.textBright, fontSize: '1.4rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px' }}>
            OPERATIVE {state.playerName.toUpperCase()} {'//'} {state.agencyName.toUpperCase()}
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>GOETIA SEALED</div>
              <div style={{ fontSize: '1.5rem', color: theme.textBright, fontWeight: 'bold' }}>{state.sealedGoetia.length} / 72</div>
            </div>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>SECTORS SECURED</div>
              <div style={{ fontSize: '1.5rem', color: theme.accentAmber, fontWeight: 'bold' }}>{securedSectorsCount} / 16</div>
            </div>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>GLOBAL ENTROPY</div>
              <div style={{ fontSize: '1.5rem', color: theme.accentRed, fontWeight: 'bold' }}>{totalGlobalEntropy.toFixed(2)}%</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
            <div style={{ fontSize: '0.76rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '6px' }}>SOLOMONIC BRASS VESSEL ({state.sealedGoetia.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {state.sealedGoetia.map(gid => {
                const g = allGoetia.find(item => item.id === gid);
                return (
                  <span key={gid} style={{ padding: '3px 7px', backgroundColor: '#112217', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontSize: '0.7rem' }}>
                    ✓ #{g?.manifestId} {g?.name.toUpperCase()}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px dashed ${theme.accentRed}`, paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={handleLogout} className="macro-chip macro-chip-amber" style={{ padding: '10px 14px', fontWeight: 'bold' }}>&gt; LOG OUT TO TITLE</button>
          <button
            onClick={() => {
              if (window.confirm('TERMINATE SESSION & WIPE LOCAL SAVE DATA?')) {
                ThaumaturgicAudio.errorBuzz();
                handleFullReset();
              }
            }}
            style={{ padding: '10px 16px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}
          >
            &gt; WIPE SAVE &amp; RESET
          </button>
        </div>
      </section>
    </main>
  );
}
