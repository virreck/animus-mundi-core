// src/ui/viewports/CodexViewport.tsx
// [F2] CODEX: case evidence, phenomenon filter and suspect dossiers.
import { isAmbiguous, type EvidenceLog } from '../../engine/evidence';
import { PHENOMENON_CATALOG, getUniqueGoetiaSigns, type SectorContract } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import { SmartGoetiaSigil } from '../components/SmartGoetiaSigil';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, formatLabel, theme } from '../theme';

/** How a phenomenon looks in the filter: required, excluded, or neither. */
function filterLook(isRequired: boolean, isExcluded: boolean) {
  if (isRequired) return { tint: theme.textBright, background: 'rgba(98, 240, 128, 0.2)', border: theme.textBright, mark: '✓' };
  if (isExcluded) return { tint: theme.accentRed, background: 'rgba(255, 42, 85, 0.12)', border: theme.accentRed, mark: '✗' };
  return { tint: '#a8ccaf', background: '#030504', border: theme.borderTerminal, mark: ' ' };
}

function EvidenceEntry({ log, readingNo, onRefine }: Readonly<{ log: EvidenceLog; readingNo: number; onRefine: (n: number) => void }>) {
  if (log.kind === 'WITNESS') {
    return (
      <div style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.accentCyan}` }}>
        <div style={{ color: theme.accentCyan, fontWeight: 'bold', fontSize: '0.7rem' }}>WITNESS {'//'} {log.witness || 'UNNAMED'} {'//'} {log.nodeLabel}</div>
        <div style={{ color: '#ffffff', marginTop: '3px', fontStyle: 'italic' }}>"{log.text}"</div>
      </div>
    );
  }
  if (log.kind === 'COURT' || log.kind === 'RANK') {
    return (
      <div style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${theme.accentAmber}` }}>
        <div style={{ color: theme.accentAmber, fontWeight: 'bold', fontSize: '0.7rem' }}>ANCHOR RESONANCE {'//'} {log.kind}: {String(log.value).toUpperCase()}</div>
        <div style={{ color: '#ffffff', marginTop: '3px' }}>{log.text}</div>
      </div>
    );
  }
  const degraded = isAmbiguous(log);
  const colour = degraded ? theme.accentAmber : theme.textBright;
  const labels = (log.candidates || []).map(t => PHENOMENON_CATALOG.find(p => p.tag === t)?.label || formatLabel(t));
  return (
    <div style={{ padding: '8px', backgroundColor: '#030504', borderLeft: `3px solid ${colour}` }}>
      <div style={{ color: colour, fontWeight: 'bold', fontSize: '0.7rem' }}>
        READING #{readingNo} [{log.channel}] {'//'} {log.nodeLabel}{degraded ? ' // DEGRADED' : ''}
      </div>
      {labels.length > 0 && (
        <div style={{ color: colour, marginTop: '2px', fontSize: '0.72rem' }}>
          {degraded ? `≈ ${labels.join(' / ')}` : `✓ ${labels[0]}`}
        </div>
      )}
      <div style={{ color: '#ffffff', marginTop: '3px' }}>"{log.text}"</div>
      {degraded && (
        <button onClick={() => onRefine(readingNo)} className="macro-chip macro-chip-amber" style={{ marginTop: '5px', padding: '2px 8px' }}>
          ≈ refine {readingNo}
        </button>
      )}
    </div>
  );
}

function EvidenceList({ contract, lost, secured, onRefine }: Readonly<{
  contract: SectorContract | null | undefined;
  lost: boolean;
  secured: boolean;
  onRefine: (n: number) => void;
}>) {
  if (lost) return <div style={{ color: theme.accentRed }}>✗ SECTOR LOST. Anchor manifested.</div>;
  if (!contract || secured) return <div style={{ color: theme.textBright }}>✓ SECTOR SECURED.</div>;
  if (contract.discoveredLogs.length === 0) {
    return <div style={{ color: theme.textMuted, fontStyle: 'italic' }}>NO EVIDENCE ON FILE.</div>;
  }
  const readings = contract.discoveredLogs.filter(l => l.kind === 'PHENOMENON' || !l.kind);
  return (
    <>
      {contract.discoveredLogs.map(log => (
        <EvidenceEntry key={log.id} log={log} readingNo={readings.indexOf(log) + 1} onRefine={onRefine} />
      ))}
    </>
  );
}

function SealAction({ sealed, released, name, hasCatalysts, inLiveSector, onSeal }: Readonly<{
  sealed: boolean;
  released: boolean;
  name: string;
  hasCatalysts: boolean;
  inLiveSector: boolean;
  onSeal: () => void;
}>) {
  if (sealed) {
    return (
      <div style={{ padding: '10px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold' }}>
        [ ENTITY SEALED IN VESSEL ]
      </div>
    );
  }
  if (released) {
    return (
      <div style={{ padding: '10px', textAlign: 'center', border: `1px solid ${theme.accentRed}`, color: theme.accentRed, fontWeight: 'bold' }}>
        [ ENTITY MANIFESTED — BEYOND SEALING ]
      </div>
    );
  }
  const canAfford = hasCatalysts && inLiveSector;
  let label = `> ENGAGE SEALING RITE: ${name.toUpperCase()}`;
  if (!inLiveSector) label = '> NO LIVE ANCHOR IN SECTOR';
  else if (!hasCatalysts) label = '> CATALYSTS MISSING';
  return (
    <button
      onClick={onSeal}
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
      {label}
    </button>
  );
}

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
    codexRankFilter,
    setCodexRankFilter,
    hideStruck,
    setHideStruck,
    requiredSigns,
    excludedSigns,
    cycleSignFilter,
    struckSuspects,
    toggleStruckSuspect,
    setActiveSealSuspectId,
    isSectorSecured,
    isSectorLost,
    isSectorClosed,
    isReleased,
    currentContract,
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
            <EvidenceList
              contract={currentContract}
              lost={!!currentContract && isSectorLost(currentContract.sectorId)}
              secured={!currentContract || isSectorSecured(currentContract.sectorId)}
              onRefine={n => processCliCommand(`refine ${n}`)}
            />
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>2. FILTER PHENOMENA ({requiredSigns.length} ✓ · {excludedSigns.length} ✗)</span>
            {deducedSigns.length > 0 && (
              <button onClick={() => setDeducedSigns([])} className="macro-chip macro-chip-danger" style={{ padding: '2px 8px' }}>CLEAR</button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            {PHENOMENON_CATALOG.map(phenom => {
              const isExcluded = excludedSigns.includes(phenom.tag);
              const look = filterLook(requiredSigns.includes(phenom.tag), isExcluded);
              return (
                <button
                  key={phenom.tag}
                  onClick={() => { ThaumaturgicAudio.keyClick(); cycleSignFilter(phenom.tag); }}
                  style={{
                    padding: '6px 8px', textAlign: 'left',
                    backgroundColor: look.background,
                    border: `1px solid ${look.border}`,
                    color: look.tint,
                    textDecoration: isExcluded ? 'line-through' : 'none',
                    cursor: 'pointer', fontFamily: theme.fontMono, fontSize: '0.72rem'
                  }}
                >
                  [{look.mark}] {phenom.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="codex-col" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '6px', marginBottom: '8px' }}>
          <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>
            3. SUSPECTS ({filteredCodexGoetia.length}/72)
          </span>
          {struckSuspects.length > 0 && (
            <button onClick={() => setHideStruck(v => !v)} className={`macro-chip ${hideStruck ? 'macro-chip-danger' : ''}`} style={{ padding: '2px 5px', fontSize: '0.66rem' }}>
              {hideStruck ? `SHOW STRUCK (${struckSuspects.length})` : `HIDE STRUCK (${struckSuspects.length})`}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.62rem', color: theme.textMuted, alignSelf: 'center', width: '42px' }}>COURT</span>
          {(['ALL', 'CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => (
            <button key={h} onClick={() => setCodexHorsemanFilter(h)} className={`macro-chip ${codexHorsemanFilter === h ? 'macro-chip-amber' : ''}`} style={{ padding: '2px 5px', fontSize: '0.66rem' }}>
              {h === 'ALL' ? 'ALL' : h.slice(0, 3)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.62rem', color: theme.textMuted, alignSelf: 'center', width: '42px' }}>RANK</span>
          {(['ALL', 'King', 'Prince', 'Duke', 'Marquis', 'President', 'Earl', 'Knight'] as const).map(r => (
            <button key={r} onClick={() => setCodexRankFilter(r)} className={`macro-chip ${codexRankFilter === r ? 'macro-chip-amber' : ''}`} style={{ padding: '2px 5px', fontSize: '0.66rem' }}>
              {r === 'ALL' ? 'ALL' : r.slice(0, 4).toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {filteredCodexGoetia.map(g => {
            const isSealed = state.sealedGoetia.includes(g.id);
            const isSelected = g.id === selectedSuspectId;
            const isStruck = struckSuspects.includes(g.id);
            const released = isReleased(g.id);
            let status = '';
            if (isSealed) status = 'SEALED';
            else if (released) status = '☠ MANIFESTED';
            return (
              <div
                key={g.id}
                style={{
                  padding: '7px 10px',
                  backgroundColor: isSelected ? '#112217' : '#030504',
                  border: `1px solid ${isSelected ? theme.textBright : theme.borderTerminal}`,
                  color: isSealed || isStruck ? theme.textMuted : theme.textBright,
                  opacity: isStruck ? 0.55 : 1,
                  fontFamily: theme.fontMono,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px'
                }}
              >
                <button
                  type="button"
                  className="row-btn"
                  aria-pressed={isSelected}
                  onClick={() => { ThaumaturgicAudio.keyClick(); setSelectedSuspectId(g.id); }}
                  style={{ color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}
                >
                  <div style={{ textDecoration: isStruck ? 'line-through' : 'none' }}>
                    <strong>#{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()}</strong>
                    <div style={{ fontSize: '0.68rem', color: '#a8ccaf' }}>{g.rank} of {g.allegiance}</div>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: isSealed || released ? theme.accentRed : theme.accentAmber, fontWeight: 'bold', flexShrink: 0 }}>
                    {status}
                  </span>
                </button>
                {currentContract && !isSectorClosed(currentContract.sectorId) && !isSealed && !released && (
                  <button
                    type="button"
                    onClick={() => { ThaumaturgicAudio.keyClick(); toggleStruckSuspect(g.id); }}
                    className={`macro-chip ${isStruck ? '' : 'macro-chip-danger'}`}
                    style={{ padding: '1px 6px', fontSize: '0.64rem', flexShrink: 0 }}
                  >
                    {isStruck ? 'RESTORE' : 'STRIKE'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="codex-col" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: theme.accentAmber }}>ARS GOETIA DOSSIER {'//'} #{selectedSuspect.manifestId.toString().padStart(2, '0')} ({selectedSuspect.allegiance})</div>
            <h2 style={{ margin: '2px 0', color: theme.textBright }}>{selectedSuspect.name.toUpperCase()}</h2>
            <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 'bold' }}>{selectedSuspect.rank} — "{selectedSuspect.title}"</div>
          </div>

          <SealAction
            sealed={state.sealedGoetia.includes(selectedSuspect.id)}
            released={isReleased(selectedSuspect.id)}
            name={selectedSuspect.name}
            hasCatalysts={Object.entries(selectedSuspect.sealCost || {}).every(([item, amt]) => (state.inventory[item] || 0) >= amt)}
            // Sealing must happen inside a live sector (previously the Safehouse let you seal anything)
            inLiveSector={!!currentContract && !isSectorClosed(currentContract.sectorId)}
            onSeal={() => setActiveSealSuspectId(selectedSuspect.id)}
          />

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
                    {'// SIGIL ENCRYPTED //'}
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
              const look = filterLook(requiredSigns.includes(tag), excludedSigns.includes(tag));
              return (
                <div key={tag} style={{ fontSize: '0.72rem', color: look.tint }}>
                  {look.mark === ' ' ? '•' : look.mark} <strong>{def?.label || formatLabel(tag)}</strong>
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
