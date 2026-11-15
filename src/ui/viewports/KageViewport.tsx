// src/ui/viewports/KageViewport.tsx
// [F3] KAGE NO SHO: Yokai contracts and invocations.
import { allYokai } from '../../content/yokai';
import { YOKAI_DAEMON_SPECS } from '../../content/yokaiSpecs';
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, theme } from '../theme';

export function KageViewport() {
  const {
    state,
    dispatch,
    draftContract,
    fontScale,
    yokaiCharges,
    addToast,
    handleUnbindYokai
  } = useSession();

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
      <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.88rem' }}>KAGE-NO-SHO // SHIKIGAMI KERNEL INTERCEPTORS</div>
          <div style={{ color: '#a8ccaf', fontSize: '0.74rem', marginTop: '2px' }}>
            TETHER SLOTS: {state.tetheredYokai.length}/2
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
            + DISTILL INK (-10 OBOLS)
          </button>
        </div>
      </div>

      <div className="grid-4col" style={{ flex: 1, overflowY: 'auto' }}>
        {allYokai.map(yokai => {
          const isBound = state.tetheredYokai.includes(yokai.id);
          const spec = YOKAI_DAEMON_SPECS[yokai.id] || {
            codeName: yokai.nameEn.toUpperCase(),
            classTag: 'SHIKIGAMI DAEMON',
            passiveHook: 'PASSIVE HOOK: Stabilizes operative tether.',
            activeLabel: 'INVOKE',
            maxCharges: 1,
            activeDesc: yokai.gameUtility,
            loreNote: ''
          };
          const cost = yokai.draftCost;
          const canAfford = (!cost.obols || (state.inventory.obols || 0) >= cost.obols) && (!cost.humanity || state.humanity > cost.humanity) && (!cost.ink || (state.ink || 0) >= cost.ink);
          const costStr = [cost.obols ? `${cost.obols} Obols` : '', cost.humanity ? `${cost.humanity}% HUM` : '', cost.ink ? `${cost.ink} Ink` : ''].filter(Boolean).join(' + ');
          const chargesLeft = yokaiCharges[yokai.id] ?? spec.maxCharges;

          return (
            <div key={yokai.id} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBound ? theme.textBright : theme.borderTerminal}`, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.66rem', color: theme.accentAmber, letterSpacing: '1px' }}>{spec.classTag}</span>
                  {isBound && <span style={{ fontSize: '0.66rem', backgroundColor: theme.textBright, color: 'black', padding: '1px 6px', fontWeight: 'bold' }}>BOUND</span>}
                </div>
                <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.9rem' }}>{spec.codeName}</h3>
                <div style={{ fontSize: '0.72rem', color: theme.accentCyan, marginBottom: '6px' }}>{spec.passiveHook}</div>
                <div style={{ padding: '6px', backgroundColor: '#030504', border: `1px dashed ${theme.borderTerminal}`, fontSize: '0.7rem', color: '#ffffff' }}>
                  <strong style={{ color: theme.accentAmber }}>ACTIVE ({spec.maxCharges} USES): {spec.activeLabel}</strong><br/>
                  {spec.activeDesc}
                </div>
                <p style={{ fontSize: '0.68rem', color: '#a8ccaf', fontStyle: 'italic', marginTop: '6px' }}>{spec.loreNote}</p>
              </div>

              <div style={{ marginTop: '8px', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: isBound ? theme.textBright : theme.accentRed, fontWeight: 'bold', marginBottom: '6px' }}>
                  {isBound ? `CHARGES: ${chargesLeft}/${spec.maxCharges}` : `BIND TRIBUTE: ${costStr}`}
                </div>
                {isBound ? (
                  <button onClick={() => handleUnbindYokai(yokai.id, 'Manually severed')} className="macro-chip macro-chip-danger" style={{ width: '100%', padding: '7px', fontWeight: 'bold' }}>
                    &gt; UNBIND DAEMON
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (state.tetheredYokai.length >= 2) {
                        addToast('TETHER SATURATED (2/2)', 'ALERT');
                        return;
                      }
                      ThaumaturgicAudio.sealSuccess();
                      draftContract(yokai.id, yokai.draftCost, spec.maxCharges);
                      addToast(`Bound ${yokai.nameEn}!`, 'SEAL');
                    }}
                    disabled={!canAfford}
                    className="macro-chip"
                    style={{ width: '100%', padding: '7px', fontWeight: 'bold' }}
                  >
                    {canAfford ? '> COMPILE & BIND PACT' : '> INSUFFICIENT TRIBUTE'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
