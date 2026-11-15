// src/ui/screens/StartScreen.tsx
// Boot / operative creation screen.
import { useState } from 'react';
import { getFullBodyPath } from '../assets';
import { ThaumaturgicAudio } from '../audio';
import { peekSavedOperative } from '../hooks/useEngine';
import { theme } from '../theme';

export const StartScreen = ({
  onStart,
  onLoad,
  onOpenManual,
  onFullReset
}: {
  onStart: (name: string, portrait: string, agency: string) => void;
  onLoad: () => void;
  onOpenManual: () => void;
  onFullReset: () => void;
}) => {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [portrait, setPortrait] = useState('/portraits/thaumaturge_m1.png');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveTick, setSaveTick] = useState(0);

  // saveTick forces a re-read after the save is wiped
  const savedOperative: string | null = saveTick >= 0 ? peekSavedOperative() : null;

  const handleWipeSave = () => {
    if (window.confirm('PURGE LOCAL TETHER DATA? This will erase your current operative save and reset all 72 Goetia seals.')) {
      ThaumaturgicAudio.errorBuzz();
      onFullReset();
      setSaveTick(prev => prev + 1);
    }
  };

  const handleInitiateClick = () => {
    ThaumaturgicAudio.keyClick();
    if (!name.trim()) setName('VERGIL');
    if (!agency.trim()) setAgency('DARKWIRE');
    setShowConfirm(true);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100dvh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, margin: 0, padding: '8px', overflow: 'hidden' }}>
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', maxWidth: '820px', maxHeight: '95dvh', overflowY: 'auto', backgroundColor: theme.bgPanel, border: `2px solid ${theme.textBright}`, boxShadow: `0 0 40px rgba(98, 240, 128, 0.15)` }}>
            <div style={{ flex: '1 1 280px', borderRight: `1px dashed ${theme.borderTerminal}`, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#030503' }}>
              <h2 style={{ margin: '0 0 12px 0', color: theme.textBright, letterSpacing: '4px', textTransform: 'uppercase' }}>{name || 'VERGIL'}</h2>
              <img src={getFullBodyPath(portrait)} alt="Full Body Operative" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(74,124,89,0.35))' }} />
            </div>
            <div style={{ flex: '1 1 320px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: theme.accentRed, borderBottom: `1px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px', margin: 0 }}>&gt; CONFIRM OPERATIVE TETHER</h3>
              <div style={{ marginTop: '18px', lineHeight: '2.0', fontSize: '0.86rem' }}>
                <div><span style={{ color: theme.textMuted }}>CALLSIGN:</span> <strong style={{ color: theme.textBright }}>{(name || 'VERGIL').toUpperCase()}</strong></div>
                <div><span style={{ color: theme.textMuted }}>SYNDICATE:</span> <strong style={{ color: theme.textBright }}>{(agency || 'DARKWIRE').toUpperCase()}</strong></div>
                <div><span style={{ color: theme.textMuted }}>STARTING HUMANITY:</span> <span style={{ color: theme.textBright }}>100% (STABLE)</span></div>
                <div><span style={{ color: theme.textMuted }}>DIRECTIVE:</span> <span style={{ color: theme.accentAmber }}>SEVER THE 72 GOETIAN ANCHORS &amp; BANISH THE FOUR HORSEMEN</span></div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    ThaumaturgicAudio.scryPing();
                    onFullReset();
                    onStart(name || 'VERGIL', portrait, agency || 'DARKWIRE');
                  }}
                  style={{ padding: '13px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '2px' }}
                >
                  &gt; FINALIZE TETHER &amp; DEPLOY
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{ padding: '10px', backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono }}
                >
                  &gt; REVISE OPERATIVE DOSSIER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '620px', maxHeight: '96dvh', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgPanel, boxShadow: `0 0 30px rgba(98, 240, 128, 0.12)`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', position: 'relative', borderBottom: `1px solid ${theme.borderTerminal}`, backgroundColor: '#020403', flexShrink: 0 }}>
          <img
            src="/title_art.jpg"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith('/title_art.jpg')) target.src = '/title_art.png';
              else if (target.src.endsWith('/title_art.png')) target.src = '/branding/animus_mundi_start_banner.png';
            }}
            alt="Animus Mundi: Seals of the 4"
            style={{ width: '100%', height: 'auto', maxHeight: '240px', display: 'block', objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,13,10,1) 0%, rgba(9,13,10,0) 20%)', pointerEvents: 'none' }} />
        </div>

        <div style={{ padding: '16px 24px 22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: theme.accentAmber, letterSpacing: '2px' }}>THAUMATURGIC OS // NET-OPS v4.14</span>
            <button
              onClick={onOpenManual}
              style={{
                backgroundColor: 'rgba(255, 184, 0, 0.09)',
                border: '1px solid rgba(255, 184, 0, 0.45)',
                color: theme.accentAmber,
                padding: '4px 10px',
                fontFamily: theme.fontMono,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              [? FIELD MANUAL &amp; LORE]
            </button>
          </div>
          <h2 style={{ margin: 0, borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '6px', letterSpacing: '3px', color: theme.textBright, fontSize: '1.1rem' }}>
            INITIATING DATA-TETHER
          </h2>

          {savedOperative && (
            <div style={{ padding: '10px', border: `1px solid ${theme.textBright}`, backgroundColor: theme.bgDark, textAlign: 'center' }}>
              <div style={{ color: theme.textMuted, fontSize: '0.68rem', marginBottom: '6px' }}>EXISTING OPERATIVE TETHER FOUND:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { ThaumaturgicAudio.scryPing(); onLoad(); }} style={{ flex: 2, padding: '9px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '1px' }}>
                  &gt; RESUME: OP_{savedOperative.toUpperCase()}
                </button>
                <button onClick={handleWipeSave} style={{ flex: 1, padding: '9px', backgroundColor: '#2a0808', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.72rem' }}>
                  WIPE SAVE
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT OPERATIVE CALLSIGN:</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VERGIL" style={{ width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT AFFILIATED SYNDICATE:</label>
              <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. DARKWIRE" style={{ width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.74rem', color: theme.textBright }}>&gt; SELECT OPERATIVE DOSSIER PORTRAIT:</label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { id: 'thaumaturge_m1', src: '/portraits/thaumaturge_m1.png' },
                  { id: 'thaumaturge_m2', src: '/portraits/thaumaturge_m2.png' },
                  { id: 'thaumaturge_f1', src: '/portraits/thaumaturge_f1.png' },
                  { id: 'thaumaturge_f2', src: '/portraits/thaumaturge_f2.png' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => { ThaumaturgicAudio.keyClick(); setPortrait(p.src); }}
                    style={{
                      padding: '3px', cursor: 'pointer',
                      backgroundColor: portrait === p.src ? theme.textTerminal : 'transparent',
                      border: `2px solid ${portrait === p.src ? theme.textBright : theme.borderTerminal}`,
                      borderRadius: '50%'
                    }}
                  >
                    <img
                      src={p.src}
                      alt="Operative"
                      style={{
                        width: '54px', height: '54px', objectFit: 'cover', borderRadius: '50%',
                        opacity: portrait === p.src ? 1 : 0.45,
                        filter: portrait === p.src ? 'none' : 'grayscale(100%) sepia(20%) hue-rotate(80deg)'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleInitiateClick} style={{ width: '100%', padding: '11px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px' }}>
              INITIALIZE TETHER PROTOCOL //
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
