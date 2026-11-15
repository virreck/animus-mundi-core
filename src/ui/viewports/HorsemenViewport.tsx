// src/ui/viewports/HorsemenViewport.tsx
// [F5] HORSEMEN: war room and Grand Rite of Banishment.
import { allGoetia } from '../../content/goetia';
import { HORSEMAN_LORE } from '../../content/horsemen';
import { countManifestedOfCourt, getBanishmentOdds } from '../../engine/world';
import { HorsemanSigilSvg } from '../components/HorsemanSigilSvg';
import { useSession } from '../session/SessionContext';
import { FONT_ZOOM_MAP, theme } from '../theme';

export function HorsemenViewport() {
  const {
    state,
    setViewport,
    fontScale,
    setSelectedSuspectId,
    setActiveBanishmentTarget,
    isReleased
  } = useSession();

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
      <div className="grid-4col" style={{ flex: 1, overflowY: 'auto' }}>
        {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => {
          const info = HORSEMAN_LORE[h];
          const lieutenants = allGoetia.filter(g => g.allegiance === h);
          const sealedCount = lieutenants.filter(g => state.sealedGoetia.includes(g.id)).length;
          const winProb = getBanishmentOdds(state, h);
          const manifestedCount = countManifestedOfCourt(state, h);
          const isBanished = !!state.flags[`banished_${h.toLowerCase()}`];

          return (
            <div key={h} style={{ backgroundColor: theme.bgPanel, border: `1px solid ${isBanished ? theme.textBright : info.color}`, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: info.color }}>
                  <span>{info.sealName}</span>
                  <span>{isBanished ? '[BANISHED]' : `[${18 - sealedCount} ACTIVE]`}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                  <HorsemanSigilSvg horseman={h} color={info.color} size={50} />
                  <div>
                    <h2 style={{ margin: 0, color: '#ffffff', letterSpacing: '2px', fontSize: '1.2rem' }}>{h}</h2>
                    <div style={{ fontSize: '0.66rem', color: info.color, fontWeight: 'bold' }}>{info.riderTitle}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#a8ccaf', lineHeight: '1.4' }}>{info.omenDesc}</p>
                <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '7px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '4px' }}>
                    <span>
                      ANCHORS: <strong>{sealedCount}/18</strong>
                      {manifestedCount > 0 && <span style={{ color: theme.accentRed }}> · ☠ {manifestedCount} LOOSE</span>}
                    </span>
                    <span style={{ color: info.color, fontWeight: 'bold' }}>ODDS: {winProb}%</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#000', border: `1px solid ${theme.borderTerminal}` }}>
                    <div style={{ width: `${(sealedCount / 18) * 100}%`, height: '100%', backgroundColor: info.color }} />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '6px' }}>
                  {lieutenants.map(g => {
                    const isSealed = state.sealedGoetia.includes(g.id);
                    const released = isReleased(g.id);
                    return (
                      <div key={g.id} onClick={() => { setSelectedSuspectId(g.id); setViewport('CODEX'); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '0.68rem', cursor: 'pointer', color: isSealed ? theme.textBright : released ? theme.accentRed : '#a8ccaf', textDecoration: isSealed ? 'line-through' : 'none' }}>
                        <span>#{g.manifestId.toString().padStart(2, '0')} {g.name} ({g.rank})</span>
                        <span style={{ color: isSealed ? theme.textBright : theme.accentRed }}>{isSealed ? 'SEALED' : released ? 'MANIFESTED' : 'ACTIVE'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                {isBanished ? (
                  <div style={{ padding: '10px', textAlign: 'center', border: `1px solid ${theme.textBright}`, color: theme.textBright, fontWeight: 'bold', fontSize: '0.74rem' }}>✓ {h} BANISHED</div>
                ) : (
                  <button onClick={() => setActiveBanishmentTarget(h)} style={{ width: '100%', padding: '11px', backgroundColor: '#2a0808', color: '#ffffff', border: `1px solid ${info.color}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.73rem' }}>
                    &gt; INITIATE {h} RITE ({winProb}%)
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
