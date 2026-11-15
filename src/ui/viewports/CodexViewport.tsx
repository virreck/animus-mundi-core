// src/ui/viewports/CodexViewport.tsx
// [F2] CODEX: case evidence, phenomenon filter and suspect dossiers.
import {  isAmbiguous } from '../../engine/evidence';
import { PHENOMENON_CATALOG, getUniqueGoetiaSigns } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import { SmartGoetiaSigil } from '../components/SmartGoetiaSigil';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, formatLabel, theme } from '../theme';

export function CodexViewport() {
  const {
    state,
    fontScale,
    deducedSigns,
    setDeducedSigns,
    codexHorsemanFilter,
    setCodexHorsemanFilter,
    selectedSuspectId,
    setSelectedSuspectId,
    showRuledOut,
    setShowRuledOut,
    setActiveSealSuspectId,
    isSectorSecured,
    isSectorLost,
    isSectorClosed,
    isReleased,
    currentContract,
    caseEvidence,
    suspectFit,
    consistentCount,
    filteredCodexGoetia,
    processCliCommand,
    activeSectorClueCount,
    selectedSuspect
  } = useSession();

  return (
    <main className="responsive-split" style={{ zoom: FONT_ZOOM_MAP[fontScale] }}>
      <section className="codex-col">
        <div style={{ height: '40%', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>1. CASE EVIDENCE ({activeSectorClueCount})</span>
            <span style={{ color: theme.accentAmber }}>{currentContract?.sectorLabel}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.76rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentContract && isSectorLost(currentContract.sectorId) ? (
              <div style={{ color: theme.accentRed }}>✗ SECTOR LOST. Anchor manifested.</div>
            ) : (!currentContract || isSectorSecured(currentContract.sectorId)) ? (
              <div style={{ color: theme.textBright }}>✓ SECTOR SECURED.</div>
            ) : currentContract.discoveredLogs.length === 0 ? (
              <div style={{ color: theme.textMuted, fontStyle: 'italic' }}>
                NO EVIDENCE ON FILE.
              </div>
            ) : (
              (() => {
                const readings = currentContract.discoveredLogs.filter(l => l.kind === 'PHENOMENON' || !l.kind);
                return currentContract.discoveredLogs.map(log => {
                  if (log.kind === 'WITNESS') {
                    return (
                      <div key={log.id} style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.accentCyan}` }}>
                        <div style={{ color: theme.accentCyan, fontWeight: 'bold', fontSize: '0.7rem' }}>WITNESS // {log.witness || 'UNNAMED'} // {log.nodeLabel}</div>
                        <div style={{ color: '#ffffff', marginTop: '3px', fontStyle: 'italic' }}>"{log.text}"</div>
                      </div>
                    );
                  }
                  if (log.kind === 'COURT' || log.kind === 'RANK') {
                    return (
                      <div key={log.id} style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.accentAmber}` }}>
                        <div style={{ color: theme.accentAmber, fontWeight: 'bold', fontSize: '0.7rem' }}>ANCHOR RESONANCE // {log.kind}: {String(log.value).toUpperCase()}</div>
                        <div style={{ color: '#ffffff', marginTop: '3px' }}>{log.text}</div>
                      </div>
                    );
                  }
                  const n = readings.indexOf(log) + 1;
                  const degraded = isAmbiguous(log);
                  const labels = (log.candidates || []).map(t => PHENOMENON_CATALOG.find(p => p.tag === t)?.label || formatLabel(t));
                  return (
                    <div key={log.id} style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${degraded ? theme.accentAmber : theme.textBright}` }}>
                      <div style={{ color: degraded ? theme.accentAmber : theme.textBright, fontWeight: 'bold', fontSize: '0.7rem' }}>
                        READING #{n} [{log.channel}] // {log.nodeLabel}{degraded ? ' // DEGRADED' : ''}
                      </div>
                      {labels.length > 0 && (
                        <div style={{ color: degraded ? theme.accentAmber : theme.textBright, marginTop: '2px', fontSize: '0.72rem' }}>
                          {degraded ? `≈ ${labels.join(' / ')}` : `✓ ${labels[0]}`}
                        </div>
                      )}
                      <div style={{ color: '#ffffff', marginTop: '3px' }}>"{log.text}"</div>
                      {degraded && (
                        <button onClick={() => processCliCommand(`refine ${n}`)} className="macro-chip macro-chip-amber" style={{ marginTop: '5px', padding: '2px 8px' }}>
                          ≈ refine {n}
                        </button>
                      )}
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>2. FILTER PHENOMENA ({deducedSigns.length}/3)</span>
            {deducedSigns.length > 0 && (
              <button onClick={() => setDeducedSigns([])} className="macro-chip macro-chip-danger" style={{ padding: '2px 8px' }}>CLEAR</button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            {PHENOMENON_CATALOG.map(phenom => {
              const isChecked = deducedSigns.includes(phenom.tag);
              return (
                <button
                  key={phenom.tag}
                  onClick={() => {
                    ThaumaturgicAudio.keyClick();
                    setDeducedSigns(prev => prev.includes(phenom.tag) ? prev.filter(t => t !== phenom.tag) : [...prev, phenom.tag]);
                  }}
                  style={{
                    padding: '6px 8px', textAlign: 'left',
                    backgroundColor: isChecked ? 'rgba(98, 240, 128, 0.2)' : '#030504',
                    border: `1px solid ${isChecked ? theme.textBright : theme.borderTerminal}`,
                    color: isChecked ? theme.textBright : '#a8ccaf',
                    cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.72rem'
                  }}
                >
                  {isChecked ? '[X] ' : '[ ] '} {phenom.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="codex-col" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
          <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>
            3. SUSPECTS {caseEvidence.length > 0 ? `(${consistentCount} FIT EVIDENCE)` : `(${filteredCodexGoetia.length}/72)`}
          </span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {(['ALL', 'CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => (
              <button key={h} onClick={() => setCodexHorsemanFilter(h)} className={`macro-chip ${codexHorsemanFilter === h ? 'macro-chip-amber' : ''}`} style={{ padding: '2px 5px', fontSize: '0.66rem' }}>
                {h === 'ALL' ? 'ALL' : h.slice(0, 3)}
              </button>
            ))}
            {caseEvidence.length > 0 && (
              <button onClick={() => setShowRuledOut(v => !v)} className={`macro-chip ${showRuledOut ? 'macro-chip-danger' : ''}`} style={{ padding: '2px 5px', fontSize: '0.66rem' }}>
                {showRuledOut ? 'HIDE ✗' : 'SHOW ✗'}
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {filteredCodexGoetia.map(g => {
            const isSealed = state.sealedGoetia.includes(g.id);
            const isSelected = g.id === selectedSuspectId;
            const fit = suspectFit(g);
            return (
              <button
                key={g.id}
                onClick={() => { ThaumaturgicAudio.keyClick(); setSelectedSuspectId(g.id); }}
                style={{
                  padding: '7px 10px', textAlign: 'left',
                  backgroundColor: isSelected ? '#112217' : '#030504',
                  border: `1px solid ${isSelected ? theme.textBright : theme.borderTerminal}`,
                  color: isSealed ? theme.textMuted : theme.textBright,
                  cursor: 'pointer', fontFamily: theme.fontMono,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <strong>#{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()}</strong>
                  <div style={{ fontSize: '0.68rem', color: '#a8ccaf' }}>{g.rank} of {g.allegiance}</div>
                  {fit.total > 0 && (
                    <div style={{ fontSize: '0.64rem', color: fit.contradicted ? theme.accentRed : theme.textBright }}>
                      {fit.contradicted ? `✗ RULED OUT (${fit.matched}/${fit.total})` : `✓ FITS ${fit.matched}/${fit.total}`}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.66rem', color: isSealed || isReleased(g.id) ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>
                  {isSealed ? '✗ SEALED' : isReleased(g.id) ? '☠ MANIFESTED' : '[INSPECT]'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="codex-col" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: theme.accentAmber }}>ARS GOETIA DOSSIER // #{selectedSuspect.manifestId.toString().padStart(2, '0')} ({selectedSuspect.allegiance})</div>
            <h2 style={{ margin: '2px 0', color: theme.textBright }}>{selectedSuspect.name.toUpperCase()}</h2>
            <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 'bold' }}>{selectedSuspect.rank} — "{selectedSuspect.title}"</div>
          </div>

          {state.sealedGoetia.includes(selectedSuspect.id) ? (
            <div style={{ padding: '10px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold' }}>
              [ ENTITY SEALED IN VESSEL ]
            </div>
          ) : isReleased(selectedSuspect.id) ? (
            <div style={{ padding: '10px', textAlign: 'center', border: `1px solid ${theme.accentRed}`, color: theme.accentRed, fontWeight: 'bold' }}>
              [ ENTITY MANIFESTED — BEYOND SEALING ]
            </div>
          ) : (
            (() => {
              const sealCost = selectedSuspect.sealCost || {};
              const hasCatalysts = Object.entries(sealCost).every(([item, amt]) => (state.inventory[item] || 0) >= amt);
              // Sealing must happen inside a live sector (previously the Safehouse let you seal anything)
              const inLiveSector = !!currentContract && !isSectorClosed(currentContract.sectorId);
              const canAfford = hasCatalysts && inLiveSector;
              return (
                <button
                  onClick={() => setActiveSealSuspectId(selectedSuspect.id)}
                  disabled={!canAfford}
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: canAfford ? theme.accentRed : '#1a1a1a',
                    color: canAfford ? 'white' : theme.textMuted,
                    border: `1px solid ${canAfford ? '#ff6680' : theme.borderTerminal}`,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.8rem',
                    boxShadow: canAfford ? '0 0 15px rgba(255, 42, 85, 0.35)' : 'none'
                  }}
                >
                  {!inLiveSector
                    ? `> NO LIVE ANCHOR IN SECTOR`
                    : hasCatalysts
                      ? `> ENGAGE SEALING RITE: ${selectedSuspect.name.toUpperCase()}`
                      : `> CATALYSTS MISSING`}
                </button>
              );
            })()
          )}

          {/* GLITCHED/OBSCURED WHEN UNSEALED; CRISP REVEAL + STAMP WHEN SEALED */}
          {(() => {
            const isTargetSealed = state.sealedGoetia.includes(selectedSuspect.id);
            return (
              <div
                style={{
                  position: 'relative',
                  width: '150px',
                  height: '150px',
                  margin: '0 auto',
                  flexShrink: 0,
                  backgroundColor: '#030504',
                  border: `1px solid ${isTargetSealed ? theme.accentRed : theme.borderTerminal}`,
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  boxShadow: isTargetSealed ? 'inset 0 0 20px rgba(255, 42, 85, 0.25)' : 'inset 0 0 18px rgba(0, 0, 0, 0.8)'
                }}
              >
                <SmartGoetiaSigil goetia={selectedSuspect} isRevealed={isTargetSealed} size={126} />
                {!isTargetSealed && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      left: '6px',
                      right: '6px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(5, 7, 6, 0.85)',
                      border: `1px dashed ${theme.borderTerminal}`,
                      color: theme.textMuted,
                      fontSize: '0.6rem',
                      padding: '2px 0',
                      letterSpacing: '1px',
                      pointerEvents: 'none'
                    }}
                  >
                    // SIGIL ENCRYPTED //
                  </div>
                )}
                {isTargetSealed && (
                  <div style={{ position: 'absolute', transform: 'rotate(-12deg)', border: `2px solid ${theme.accentRed}`, backgroundColor: 'rgba(15, 2, 2, 0.92)', color: theme.accentRed, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,42,85,0.5)' }}>
                    [SEALED]
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ padding: '8px', border: `1px solid ${theme.accentRed}`, backgroundColor: '#030504' }}>
            <div style={{ fontSize: '0.72rem', color: theme.accentRed, fontWeight: 'bold', marginBottom: '4px' }}>REQUIRED BINDING CATALYSTS:</div>
            {Object.entries(selectedSuspect.sealCost || {}).map(([item, amt]) => {
              const have = state.inventory[item] || 0;
              return (
                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: '#ffffff' }}>{formatLabel(item)} x{amt}</span>
                  <span style={{ color: have >= amt ? theme.textBright : theme.accentRed, fontWeight: 'bold' }}>(Have: {have}/{amt})</span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '8px', border: `1px dashed ${theme.borderTerminal}`, backgroundColor: '#030504' }}>
            <div style={{ fontSize: '0.72rem', color: theme.textBright, fontWeight: 'bold', marginBottom: '4px' }}>UNIQUE 3-SIGN FINGERPRINT:</div>
            {getUniqueGoetiaSigns(selectedSuspect.id).map(tag => {
              const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
              const isToggled = deducedSigns.includes(tag);
              const supported = caseEvidence.some(l => l.kind === 'PHENOMENON' && l.candidates?.includes(tag));
              return (
                <div key={tag} style={{ fontSize: '0.72rem', color: isToggled || supported ? theme.textBright : '#a8ccaf' }}>
                  {isToggled || supported ? '✓ ' : '• '} <strong>{def?.label || formatLabel(tag)}</strong>{supported ? ' (in evidence)' : ''}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '0.76rem', color: '#a8ccaf', lineHeight: '1.5', margin: 0, padding: '8px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}` }}>
            <div style={{ fontSize: '0.68rem', color: theme.accentCyan, fontWeight: 'bold', marginBottom: '3px' }}>LEMEGETON ENTRY</div>
            {selectedSuspect.description}
          </div>
        </div>
      </section>
    </main>
  );
}
