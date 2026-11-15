// src/ui/viewports/KageViewport.tsx
// [F3] KAGE NO SHO — the Book of Shadows. One page per Yokai: unwritten until its shrine is
// woken, then a living record of the pact — bond, charges, offering, and any offence given.
import { useState } from 'react';
import { allYokai } from '../../content/yokai';
import { YOKAI_DAEMON_SPECS } from '../../content/yokaiSpecs';
import {
  BOND_THREE_EASE, KAGE_TUNING, YOKAI_OFFERINGS,
  canRenew, countWrittenPages, getBondLevel, getBondPoints, getMaxCharges, getOffense, whyCannotBind
} from '../../engine/kage';
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, formatLabel, theme } from '../theme';

const ROMAN = ['I', 'II', 'III'] as const;

export function KageViewport() {
  const { state, dispatch, draftContract, fontScale, yokaiCharges, addToast, handleUnbindYokai } = useSession();
  const [confirmSever, setConfirmSever] = useState<string | null>(null);
  const written = countWrittenPages(state);
  const [two, three] = KAGE_TUNING.bondThresholds;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
      <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '2rem', color: theme.textBright, lineHeight: 1, textShadow: '0 0 12px rgba(98,240,128,0.4)' }}>影の書</span>
          <div>
            <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.88rem', letterSpacing: '2px' }}>KAGE NO SHO // BOOK OF SHADOWS</div>
            <div style={{ color: '#a8ccaf', fontSize: '0.74rem', marginTop: '2px' }}>
              PAGES WRITTEN: {written}/{allYokai.length} · TETHER: {state.tetheredYokai.length}/2
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: theme.accentCyan, fontSize: '0.8rem', fontWeight: 'bold' }}>ESOTERIC INK: {state.ink || 0}</span>
          <button
            onClick={() => {
              if ((state.inventory.obols || 0) >= 10) {
                ThaumaturgicAudio.keyClick();
                dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } });
                dispatch({ type: 'MODIFY_INK', payload: 1 });
                addToast(`Distilled +1 Esoteric Ink`, 'ITEM');
              } else {
                addToast(`INSUFFICIENT OBOLS`, 'ALERT');
              }
            }}
            className="macro-chip macro-chip-amber"
          >
            + DISTILL INK · 10 OB
          </button>
        </div>
      </div>

      <div className="grid-4col" style={{ flex: 1, overflowY: 'auto', alignContent: 'start' }}>
        {allYokai.map(yokai => {
          const block = whyCannotBind(state, yokai.id);
          const isBound = block === 'BOUND';

          // ----------------------------------------------------- UNWRITTEN PAGE
          if (block === 'UNWRITTEN') {
            return (
              <div key={yokai.id} style={{ backgroundColor: '#030504', border: `1px dashed ${theme.borderTerminal}`, padding: '12px', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.6 }}>
                <span style={{ fontSize: '3rem', color: theme.textMuted, filter: 'blur(3px)' }}>{yokai.kanji}</span>
                <span style={{ fontSize: '0.7rem', color: theme.textMuted, letterSpacing: '3px' }}>— UNWRITTEN —</span>
              </div>
            );
          }

          const spec = YOKAI_DAEMON_SPECS[yokai.id];
          const bondLevel = getBondLevel(state, yokai.id);
          const bondPoints = getBondPoints(state, yokai.id);
          const nextAt = bondLevel === 1 ? two : bondLevel === 2 ? three : null;
          const maxCharges = getMaxCharges(state, yokai.id);
          const chargesLeft = yokaiCharges[yokai.id] ?? maxCharges;
          const offense = getOffense(state, yokai.id);
          const offering = YOKAI_OFFERINGS[yokai.id];
          const cost = yokai.draftCost;
          const canAfford = (!cost.obols || (state.inventory.obols || 0) >= cost.obols) && (!cost.humanity || state.humanity > cost.humanity) && (!cost.ink || (state.ink || 0) >= cost.ink);
          const costStr = [cost.obols ? `${cost.obols} OB` : '', cost.humanity ? `${cost.humanity}% HUM` : '', cost.ink ? `${cost.ink} INK` : ''].filter(Boolean).join(' · ');
          const renewable = canRenew(state, yokai.id);

          return (
            <div key={yokai.id} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBound ? theme.textBright : offense ? theme.accentRed : theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px', boxShadow: isBound ? '0 0 14px rgba(98,240,128,0.15)' : 'none' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.64rem', color: theme.accentAmber, letterSpacing: '1px' }}>{spec?.classTag}</div>
                    <h3 style={{ margin: '2px 0 0 0', color: theme.textBright, fontSize: '0.9rem' }}>{yokai.nameEn.toUpperCase()}</h3>
                    <div style={{ fontSize: '0.64rem', color: theme.textMuted }}>{spec?.codeName}</div>
                  </div>
                  <span style={{ fontSize: '2.2rem', lineHeight: 1, color: isBound ? theme.textBright : '#a8ccaf', textShadow: isBound ? '0 0 10px rgba(98,240,128,0.6)' : 'none' }}>{yokai.kanji}</span>
                </div>

                {/* Bond */}
                <div style={{ margin: '8px 0 6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#a8ccaf' }}>
                    <span>BOND <strong style={{ color: theme.textBright }}>{ROMAN[bondLevel - 1]}</strong></span>
                    <span>{nextAt ? `${bondPoints}/${nextAt}` : 'MAX'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                    {[1, 2, 3].map(l => (
                      <div key={l} style={{ flex: 1, height: '5px', backgroundColor: l <= bondLevel ? theme.textBright : '#0c1a10', border: `1px solid ${theme.borderTerminal}` }} />
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: theme.accentCyan, marginBottom: '4px' }}>{spec?.passiveHook}</div>
                <div style={{ fontSize: '0.68rem', color: bondLevel === 3 ? theme.textBright : theme.textMuted, marginBottom: '6px' }}>
                  {bondLevel === 3 ? '✓ ' : 'III · '}{BOND_THREE_EASE[yokai.id]}
                </div>
                <div style={{ padding: '6px', backgroundColor: '#030504', border: `1px dashed ${theme.borderTerminal}`, fontSize: '0.7rem', color: '#ffffff' }}>
                  <strong style={{ color: theme.accentAmber }}>{spec?.activeLabel} · {maxCharges} CHARGES</strong><br/>
                  {spec?.activeDesc}
                </div>
                {offering && (
                  <div style={{ fontSize: '0.66rem', color: offering.hungry ? theme.accentAmber : '#a8ccaf', marginTop: '6px' }}>
                    {offering.hungry ? 'DEMANDS EACH SECTOR' : 'FAVOURED OFFERING'}: {offering.label} ({offering.amount} {formatLabel(offering.itemId)})
                  </div>
                )}
                <p style={{ fontSize: '0.66rem', color: '#a8ccaf', fontStyle: 'italic', margin: '6px 0 0 0' }}>{spec?.loreNote}</p>
              </div>

              <div style={{ borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {isBound ? (
                  <>
                    <div style={{ fontSize: '0.7rem', color: theme.textBright, fontWeight: 'bold' }}>
                      BOUND · CHARGES {chargesLeft}/{maxCharges}
                    </div>
                    <button
                      disabled={!renewable}
                      onClick={() => {
                        ThaumaturgicAudio.sealSuccess();
                        dispatch({ type: 'RENEW_PACT', payload: yokai.id });
                        addToast(`Pact renewed: ${yokai.nameEn}`, 'SEAL');
                      }}
                      className="macro-chip macro-chip-cyan"
                      style={{ width: '100%', padding: '7px', fontWeight: 'bold', opacity: renewable ? 1 : 0.45 }}
                    >
                      &gt; RENEW · {KAGE_TUNING.renewalInk} INK + {offering?.amount} {formatLabel(offering?.itemId || '')}
                    </button>
                    {confirmSever === yokai.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => { setConfirmSever(null); handleUnbindYokai(yokai.id); }} className="macro-chip macro-chip-danger" style={{ flex: 1, padding: '7px', fontWeight: 'bold' }}>
                          SEVER · OFFENDS {KAGE_TUNING.brokenPactOffense}
                        </button>
                        <button onClick={() => setConfirmSever(null)} className="macro-chip" style={{ padding: '7px' }}>KEEP</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmSever(yokai.id)} className="macro-chip macro-chip-danger" style={{ width: '100%', padding: '7px' }}>
                        &gt; SEVER PACT
                      </button>
                    )}
                  </>
                ) : offense > 0 ? (
                  <div style={{ fontSize: '0.7rem', color: theme.accentRed, fontWeight: 'bold', textAlign: 'center', padding: '8px', border: `1px solid ${theme.accentRed}` }}>
                    OFFENDED · RETURNS IN {offense} SECTOR{offense === 1 ? '' : 'S'}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '0.7rem', color: theme.accentAmber, fontWeight: 'bold' }}>PACT TRIBUTE: {costStr}</div>
                    <button
                      onClick={() => {
                        if (block === 'SATURATED') {
                          addToast('TETHER SATURATED (2/2)', 'ALERT');
                          return;
                        }
                        ThaumaturgicAudio.sealSuccess();
                        draftContract(yokai.id, yokai.draftCost, maxCharges);
                        addToast(`Pact sealed: ${yokai.nameEn}`, 'SEAL');
                      }}
                      disabled={!canAfford}
                      className="macro-chip"
                      style={{ width: '100%', padding: '7px', fontWeight: 'bold', opacity: canAfford ? 1 : 0.45 }}
                    >
                      &gt; BIND
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
