// src/ui/viewports/SafehouseViewport.tsx
// [F4] SAFEHOUSE: altar crafting, rest and heat jamming.
import { ALTAR_RECIPES } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import { isBondThree } from '../../engine/kage';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, formatLabel, theme } from '../theme';

export function SafehouseViewport() {
  const {
    state,
    dispatch,
    fontScale,
    isSectorClosed,
    isSectorUnlocked,
    allSectors,
    addMicroEntropy,
    maxHumanity,
    addToast
  } = useSession();

  return (
    <main className="responsive-split" style={{ zoom: FONT_ZOOM_MAP[fontScale] }}>
      <section className="pane-left pane-w60" style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderTerminal}`, paddingBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <h2 style={{ margin: 0, color: theme.textBright, fontSize: '0.95rem' }}>&gt; SAFEHOUSE ALTAR // CATALYST SYNTHESIS</h2>
            <div style={{ fontSize: '0.72rem', color: '#a8ccaf' }}>
              RAW SALVAGE → PLANETARY CATALYSTS
              {state.tetheredYokai.includes('yokai_kameosa') && <span style={{ color: theme.accentAmber }}> [KAMEOSA.ALC ACTIVE: 0 Obol Cost, -2% HUM!]</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', backgroundColor: '#030504', padding: '5px 8px', border: `1px solid ${theme.borderTerminal}` }}>
            <span>Metal: <strong style={{ color: theme.textBright }}>{state.inventory.scrap_metal || 0}</strong></span>
            <span>Earth: <strong style={{ color: theme.textBright }}>{state.inventory.cursed_earth || 0}</strong></span>
            <span>Distillate: <strong style={{ color: theme.textBright }}>{state.inventory.alchemical_distillate || 0}</strong></span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
          {ALTAR_RECIPES.map(recipe => {
            const isKameosa = state.tetheredYokai.includes('yokai_kameosa');
            const effObolCost = isKameosa ? 0 : recipe.obolCost;
            const haveRaw = state.inventory[recipe.rawMaterialId] || 0;
            const haveObols = state.inventory.obols || 0;
            const kameosaHum = isBondThree(state, 'yokai_kameosa') ? 1 : 2;
            const canCraft = haveRaw >= recipe.rawAmount && haveObols >= effObolCost && (!isKameosa || state.humanity > kameosaHum);
            const ownedOutput = state.inventory[recipe.outputId] || 0;

            return (
              <div key={recipe.outputId} style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: theme.textBright, fontSize: '0.78rem' }}>{recipe.label.toUpperCase()}</strong>
                    <span style={{ color: theme.accentAmber, fontSize: '0.7rem' }}>x{ownedOutput}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#a8ccaf', margin: '4px 0 8px 0' }}>{recipe.desc}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.68rem', color: theme.textMuted }}>
                    {recipe.rawAmount}x {formatLabel(recipe.rawMaterialId)} + {isKameosa ? `${kameosaHum}% HUM` : `${effObolCost} Obols`}
                  </span>
                  <button
                    onClick={() => {
                      ThaumaturgicAudio.scryPing();
                      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: recipe.rawMaterialId, amount: -recipe.rawAmount } });
                      if (isKameosa) dispatch({ type: 'MODIFY_HUMANITY', payload: -kameosaHum });
                      else dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -effObolCost } });
                      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: recipe.outputId, amount: 1 } });
                      addToast(`Synthesized +1 ${recipe.label}`, 'ITEM');
                    }}
                    disabled={!canCraft}
                    className="macro-chip macro-chip-amber"
                  >
                    SYNTHESIZE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pane-right pane-w40" style={{ gap: '10px' }}>
        <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.88rem' }}>&gt; SAFEHOUSE HEARTH // TETHER RECOVERY</h3>
          <p style={{ fontSize: '0.74rem', color: '#a8ccaf', lineHeight: '1.5' }}>
            TETHER: {state.humanity}% / {maxHumanity}%
          </p>
          <button
            onClick={() => {
              ThaumaturgicAudio.sealSuccess();
              dispatch({ type: 'REST_AT_SAFEHOUSE', payload: { heal: 30, time: 4 } });
              addMicroEntropy(0.05);
              addToast(state.tetheredYokai.includes('yokai_baku')
                ? `Baku devoured your nightmares: Humanity fully restored (+0.05% Global Entropy).`
                : `Restored +30% Humanity (+0.05% Global Entropy).`, 'SEAL');
            }}
            disabled={state.humanity >= maxHumanity}
            className="macro-chip"
            style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
          >
            &gt; REST AT SAFEHOUSE (+30% HUM / +0.05% ENTROPY)
          </button>
        </div>

        <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 6px 0', color: theme.textBright, fontSize: '0.88rem' }}>&gt; INQUISITION COUNTER-INTELLIGENCE</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allSectors.filter(s => s.id !== 'safehouse' && isSectorUnlocked(s) && !isSectorClosed(s.id)).map(sec => {
              const heat = state.sectorEntropy[sec.id] || 0;
              return (
                <div key={sec.id} style={{ padding: '8px', backgroundColor: '#030504', border: `1px solid ${heat >= 100 ? theme.accentRed : theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: theme.textBright, fontSize: '0.74rem' }}>{sec.label}</strong>
                    <div style={{ fontSize: '0.68rem', color: heat >= 75 ? theme.accentRed : theme.accentAmber }}>HEAT: {heat}%</div>
                  </div>
                  <button
                    onClick={() => {
                      ThaumaturgicAudio.scryPing();
                      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -20 } });
                      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: sec.id, amount: -35 } });
                      addToast(`Suppressed -35% Heat in ${sec.label}`, 'SEAL');
                    }}
                    disabled={heat === 0 || (state.inventory.obols || 0) < 20}
                    className="macro-chip macro-chip-danger"
                  >
                    JAM (-20 OBOLS)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
