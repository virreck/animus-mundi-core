// src/ui/viewports/FieldOpsViewport.tsx
// [F1] FIELD_OPS: sub-grid map, terminal and command palette.
import { allYokai } from '../../content/yokai';
import { YOKAI_DAEMON_SPECS } from '../../content/yokaiSpecs';
import { isAmbiguous } from '../../engine/evidence';
import { HAZARD_MANIFEST, SECTOR_QUIRKS, type SubGridNode } from '../../engine/sectorGenerator';

import { useState } from 'react';
import { getRipeness } from '../../engine/world';
import { getMaxCharges } from '../../engine/kage';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, theme } from '../theme';

const HUD_FLASH_BG: Record<string, string> = { DAMAGE: 'rgba(255,42,85,0.18)', DECODE: 'rgba(98,240,128,0.12)' };

function heatColour(heat: number): string {
  if (heat >= 75) return theme.accentRed;
  return heat >= 35 ? theme.accentAmber : theme.textBright;
}

/** One-line read-out of the room the operative is standing in. */
function describeRoom(node: SubGridNode): { colour: string; text: string } {
  if (node.hazard !== 'NONE') return { colour: theme.accentCyan, text: `⚠️ THRESHOLD ANOMALY: "${HAZARD_MANIFEST[node.hazard].symptom}"` };
  if (node.status === 'CLEARED') return { colour: theme.textBright, text: '✓ Cleared.' };
  if (node.nodeType === 'WITNESS') return { colour: '#ffffff', text: '🗣 LIFE SIGNS: one civilian.' };
  if (node.nodeType === 'ANCHOR') return { colour: '#ffffff', text: '⚡ CONDUIT ANCHOR.' };
  if (node.rawSignalSymptom) return { colour: '#ffffff', text: `🔎 SIGNAL: "${node.rawSignalSymptom}"` };
  if (node.nodeType === 'SHRINE') return { colour: '#ffffff', text: '⛩️ SHRINE.' };
  return { colour: '#ffffff', text: '📦 SALVAGE.' };
}

/** What a scan revealed about the selected room's threshold. */
function describeScan(node: SubGridNode, heatCost: number): { colour: string; text: string } {
  if (node.patrolActive) return { colour: theme.accentRed, text: '⚠️ MALLEUS PATROL INSIDE!' };
  if (node.hazard !== 'NONE') return { colour: theme.accentCyan, text: `⚠️ THRESHOLD TRAP: "${HAZARD_MANIFEST[node.hazard].symptom}"` };
  return { colour: theme.textBright, text: `✓ Threshold clear (+${heatCost}% Heat).` };
}

function DaemonCard({ yokaiId, name, spec, charges, maxCharges, confirming, onInvoke, onSeverTap, onSeverBlur }: Readonly<{
  yokaiId: string;
  name?: string;
  spec?: { activeLabel: string; activeDesc: string };
  charges: number;
  maxCharges: number;
  confirming: boolean;
  onInvoke: () => void;
  onSeverTap: () => void;
  onSeverBlur: () => void;
}>) {
  return (
    <div style={{ flex: 1, padding: '5px 7px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: theme.textBright, fontSize: '0.7rem' }}>{name}</strong>
        <span style={{ color: theme.accentAmber, fontSize: '0.65rem' }}>{charges}/{maxCharges}</span>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button data-tour={`invoke-${yokaiId}`} onClick={onInvoke} title={spec?.activeDesc} className="macro-chip macro-chip-amber" style={{ flex: 1, padding: '3px 5px', fontSize: '0.65rem' }}>
          ⚡ {spec?.activeLabel}
        </button>
        {/* Severing offends the spirit, so it takes a second tap */}
        <button onClick={onSeverTap} onBlur={onSeverBlur} className="macro-chip macro-chip-danger" style={{ padding: '3px 6px', fontSize: '0.65rem' }}>
          {confirming ? 'SEVER?' : '✕'}
        </button>
      </div>
    </div>
  );
}

/** Read-out under the map: selected room, case progress, current room and the last scan. */
function MapFooter() {
  const {
    state, isSectorClosed, currentContract, currentSubNode, selectedSubNode, isAdjacentOrEntry,
    currentQuirk, activeSectorClueCount, activeReadingCount, selectedRoomHeatCost
  } = useSession();
  const ripeness = currentContract && !isSectorClosed(currentContract.sectorId) ? getRipeness(state, currentContract.sectorId) : 0;
  const selectedElsewhere = selectedSubNode && selectedSubNode.id !== currentSubNode?.id ? selectedSubNode : null;
  const reachable = !!selectedElsewhere && isAdjacentOrEntry(selectedElsewhere);
  return (
      <div style={{ backgroundColor: 'rgba(5,7,6,0.96)', borderTop: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', zIndex: 10, fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          <span>
            SELECTED TARGET: <strong style={{ color: theme.textBright }}>{selectedSubNode?.label || 'NONE'}</strong> [{selectedSubNode?.status}]
            {selectedElsewhere && (
              <span style={{ color: reachable ? theme.accentAmber : theme.accentRed, marginLeft: '6px' }}>
                ({reachable ? `REACHABLE // +${selectedRoomHeatCost}% HEAT` : 'NOT ADJACENT'})
              </span>
            )}
          </span>
          <span style={{ color: theme.accentAmber }}>
              READINGS: <strong>{activeReadingCount}/3</strong> · EVIDENCE: <strong>{activeSectorClueCount}</strong>
              {currentQuirk !== 'NONE' && <> · <span style={{ color: theme.accentCyan }}>{SECTOR_QUIRKS[currentQuirk].label}</span></>}
              {ripeness > 0 && (
                <> · <span style={{ color: ripeness >= 75 ? theme.accentRed : theme.accentAmber }}>RIPENESS: <strong>{ripeness}%</strong></span></>
              )}
            </span>
        </div>

        {currentSubNode ? (
          <div style={{ color: describeRoom(currentSubNode).colour }}>
            <strong>CURRENT ROOM ({currentSubNode.label}): </strong>
            {describeRoom(currentSubNode).text}
          </div>
        ) : (
          <div style={{ color: '#a8ccaf' }}>
            <strong>CURRENT POS:</strong> Perimeter Tether.
          </div>
        )}

        {selectedElsewhere?.status === 'SCANNED' && (
          <div style={{ color: describeScan(selectedElsewhere, selectedRoomHeatCost).colour }}>
            <strong>SCANNED TARGET ({selectedElsewhere.label}): </strong>
            {describeScan(selectedElsewhere, selectedRoomHeatCost).text}
          </div>
        )}
      </div>
  );
}

/** Tap-to-run command buttons (shown when the control mode is PALETTE). */
function CommandPalette() {
  const { processCliCommand, currentContract, currentSubNode, selectedSubNode } = useSession();
  /** Room number the commands act on: the selected room, else room 1. */
  const targetIdx = selectedSubNode?.index || 1;
  return (
      <div style={{ backgroundColor: '#060a07', borderTop: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.66rem', color: theme.accentAmber, fontWeight: 'bold', width: '74px' }}>RECON</span>
          <button data-tour="palette-scan" onClick={() => processCliCommand(`scan ${targetIdx}`)} className="macro-chip">📡 scan {targetIdx}</button>
          <button data-tour="palette-enter" onClick={() => processCliCommand(`enter ${targetIdx}`)} className="macro-chip macro-chip-amber">⚡ enter {targetIdx}</button>
          <button data-tour="palette-loot" onClick={() => processCliCommand('loot')} className="macro-chip">📦 loot</button>
          {currentSubNode?.nodeType === 'ANCHOR' && (
            <button data-tour="palette-attune" onClick={() => processCliCommand('attune')} className="macro-chip macro-chip-amber">
              ⚡ attune
            </button>
          )}
          {currentSubNode?.nodeType === 'WITNESS' && currentSubNode.status !== 'CLEARED' && (
            <button data-tour="palette-interview" onClick={() => processCliCommand('interview')} className="macro-chip macro-chip-cyan">🗣 interview</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.66rem', color: theme.accentCyan, fontWeight: 'bold', width: '74px' }}>COUNTER</span>
          <button data-tour="palette-decoy" onClick={() => processCliCommand(`decoy ${targetIdx}`)} className="macro-chip macro-chip-danger">🐕 decoy {targetIdx}</button>
          <button data-tour="palette-degauss" onClick={() => processCliCommand(`degauss ${targetIdx}`)} className="macro-chip macro-chip-cyan">degauss {targetIdx}</button>
          <button onClick={() => processCliCommand(`bypass ${targetIdx}`)} className="macro-chip macro-chip-cyan">bypass {targetIdx}</button>
          <button onClick={() => processCliCommand(`purge ${targetIdx}`)} className="macro-chip macro-chip-cyan">purge {targetIdx}</button>
          <button onClick={() => processCliCommand(`dispel ${targetIdx}`)} className="macro-chip macro-chip-cyan">dispel {targetIdx}</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.66rem', color: theme.textBright, fontWeight: 'bold', width: '74px' }}>FORENSIC</span>
          <span data-tour="palette-forensic" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <button onClick={() => processCliCommand('vox')} className="macro-chip">🎙️ vox</button>
            <button onClick={() => processCliCommand('assay')} className="macro-chip">🧪 assay</button>
            <button onClick={() => processCliCommand('auspex')} className="macro-chip">👁️ auspex</button>
          </span>
          {(currentContract?.discoveredLogs || []).some(isAmbiguous) && (
            <button data-tour="palette-refine" onClick={() => processCliCommand('refine')} className="macro-chip macro-chip-amber">≈ refine</button>
          )}
          <button onClick={() => processCliCommand('spoof')} className="macro-chip macro-chip-danger">📡 spoof</button>
          <button onClick={() => processCliCommand('bribe')} className="macro-chip macro-chip-danger">🪙 bribe</button>
        </div>
      </div>
  );
}

export function FieldOpsViewport() {
  const {
    state,
    mapViewMode,
    setMapViewMode,
    fontScale,
    controlMode,
    hudFlash,
    mapZoom,
    setMapZoom,
    setMapPan,
    yokaiCharges,
    terminalLines,
    cliInput,
    setCliInput,
    mapCanvasRef,
    waveformCanvasRef,
    consoleScrollRef,
    terminalEndRef,
    cliInputRef,
    securedSectorsCount,
    allSectors,
    currentContract,
    currentSubNode,
    currentHeat,
    handleUnbindYokai,
    handleInvokeYokaiPower,
    processCliCommand,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    mapWrapRef,
    mobilePane,
    setMobilePane,
    handleCanvasClick
  } = useSession();
  const [confirmSever, setConfirmSever] = useState<string | null>(null);
  return (
    <main
      className="responsive-split field-ops"
      data-pane={mobilePane}
      style={{
        backgroundColor: HUD_FLASH_BG[hudFlash] ?? 'transparent',
        transition: 'background-color 0.25s'
      }}
    >
      {/* Compact screens only: choose map + wire together, or either one full height */}
      <div className="mobile-only field-ops-switch">
        {(['SPLIT', 'MAP', 'WIRE'] as const).map(p => (
          <button key={p} data-tour={`pane-${p}`} onClick={() => setMobilePane(p)} className={`macro-chip ${mobilePane === p ? 'macro-chip-amber' : ''}`} style={{ flex: 1, padding: '6px' }}>
            {p === 'SPLIT' ? 'MAP + WIRE' : p}
          </button>
        ))}
      </div>

      <section className="pane-left">
        <div style={{ backgroundColor: currentHeat >= 75 ? '#1f050a' : theme.bgPanel, border: `1px solid ${currentHeat >= 75 ? theme.accentRed : theme.borderTerminal}`, padding: '9px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '5px', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ color: theme.textBright, fontWeight: 'bold' }}>
              {currentContract?.sectorLabel} {'//'} POS: {currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}
            </span>
            <span style={{ color: currentHeat >= 75 ? theme.accentRed : theme.accentAmber, fontWeight: 'bold' }}>
              INQUISITION HEAT: {currentHeat}% {currentHeat >= 100 ? '[LOCKDOWN!]' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '9px', backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, padding: '1px' }}>
              <div style={{ width: `${currentHeat}%`, height: '100%', backgroundColor: heatColour(currentHeat), transition: 'width 0.25s' }} />
            </div>
            <canvas ref={waveformCanvasRef} width={90} height={20} style={{ backgroundColor: '#020302', border: `1px solid ${theme.borderTerminal}`, flexShrink: 0 }} />
          </div>
        </div>

        <div className="map-panel" style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 6, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, fontSize: '0.7rem', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button data-tour="map-local" onClick={() => { setMapViewMode('SUB_GRID'); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className={`macro-chip ${mapViewMode === 'SUB_GRID' ? 'macro-chip-amber' : ''}`}>LOCAL SUB-GRID</button>
              <button data-tour="map-regional" onClick={() => { setMapViewMode('GEO_TRACKER'); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className={`macro-chip ${mapViewMode === 'GEO_TRACKER' ? 'macro-chip-amber' : ''}`}>REGIONAL MAP ({securedSectorsCount}/{allSectors.length - 1})</button>
            </div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', backgroundColor: 'rgba(5,7,6,0.9)', padding: '2px 5px', border: `1px solid ${theme.borderTerminal}` }}>
              <span style={{ color: theme.textMuted }}>{Math.round(mapZoom * 100)}%</span>
              <button onClick={() => setMapZoom(z => Math.min(2.8, +(z + 0.25).toFixed(2)))} className="macro-chip" style={{ padding: '1px 6px' }}>+</button>
              <button onClick={() => setMapZoom(z => Math.max(0.6, +(z - 0.25).toFixed(2)))} className="macro-chip" style={{ padding: '1px 6px' }}>-</button>
              <button onClick={() => { setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} className="macro-chip" style={{ padding: '1px 6px' }}>RST</button>
            </div>
          </div>

          {/* The canvas sits absolutely inside its own box, so it can never stretch the layout */}
          <div ref={mapWrapRef} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <canvas
              ref={mapCanvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onClick={handleCanvasClick}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' }}
            />
          </div>

          <MapFooter />
        </div>

        <div style={{ minHeight: '90px', flexShrink: 0, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.73rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ color: theme.textBright, fontWeight: 'bold', marginBottom: '4px' }}>ACTIVE SHIKIGAMI DAEMONS ({state.tetheredYokai.length}/2)</div>
            {state.tetheredYokai.length === 0 ? (
              <div style={{ color: theme.textMuted }}>No Daemons bound in <strong style={{ color: theme.textBright }}>[F3] KAGE NO SHO</strong>.</div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                {state.tetheredYokai.map(yid => (
                  <DaemonCard
                    key={yid}
                    yokaiId={yid}
                    name={allYokai.find(item => item.id === yid)?.nameEn}
                    spec={YOKAI_DAEMON_SPECS[yid]}
                    charges={yokaiCharges[yid] ?? getMaxCharges(state, yid)}
                    maxCharges={getMaxCharges(state, yid)}
                    confirming={confirmSever === yid}
                    onInvoke={() => handleInvokeYokaiPower(yid)}
                    onSeverTap={() => {
                      if (confirmSever === yid) {
                        setConfirmSever(null);
                        handleUnbindYokai(yid);
                      } else {
                        setConfirmSever(yid);
                      }
                    }}
                    onSeverBlur={() => setConfirmSever(null)}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{ width: '190px', borderLeft: `1px dashed ${theme.borderTerminal}`, paddingLeft: '10px' }}>
            <div style={{ color: theme.accentAmber, fontWeight: 'bold', marginBottom: '3px' }}>RAW SALVAGE</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scrap Metal:</span> <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cursed Earth:</span> <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Distillate:</span> <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></div>
          </div>
        </div>
      </section>

      <section className="pane-right" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, zoom: FONT_ZOOM_MAP[fontScale] }}>
        <div style={{ height: '30px', backgroundColor: '#040805', borderBottom: `1px solid ${theme.borderTerminal}`, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', flexShrink: 0 }}>
          <span><strong style={{ color: theme.textBright }}>● TTY1 CONSOLE</strong> {'//'} {currentContract?.sectorLabel}</span>
          <span style={{ color: theme.accentAmber }}>VESSEL: {state.sealedGoetia.length}/72 SEALED</span>
        </div>

        <div
          ref={consoleScrollRef}
          role="log"
          aria-live="polite"
          style={{ flex: 1, padding: '12px', overflowY: 'auto', fontSize: '0.8rem', lineHeight: '1.55', backgroundColor: '#030504', userSelect: 'text', cursor: 'text' }}
        >
          {terminalLines.map(line => {
            const colorMap = { normal: '#a8ccaf', info: '#62f080', system: '#4a7c59', success: '#62f080', warn: '#ffb800', error: '#ff2a55', command: '#ffffff' };
            return <div key={line.id} style={{ color: colorMap[line.type], marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: line.html }} />;
          })}
          <div ref={terminalEndRef} />
        </div>

        {controlMode === 'PALETTE' && <CommandPalette />}

        <form
          onSubmit={e => {
            e.preventDefault();
            if (!cliInput.trim()) return;
            processCliCommand(cliInput);
            setCliInput('');
          }}
          style={{ height: '40px', backgroundColor: '#000', borderTop: `1px solid ${theme.borderTerminal}`, padding: '0 10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>root@os:~#</span>
          <input
            ref={cliInputRef}
            value={cliInput}
            onChange={e => setCliInput(e.target.value)}
            placeholder="_"
            className="cli-input"
            style={{ flex: 1, backgroundColor: 'transparent', color: theme.textBright, border: 'none', outline: 'none', fontFamily: theme.fontMono }}
          />
          <button type="submit" className="macro-chip">EXEC</button>
        </form>
      </section>
    </main>
  );
}
