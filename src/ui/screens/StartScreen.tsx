// src/ui/screens/StartScreen.tsx
// Boot / operative creation screen.
import { useRef, useState } from 'react';
import { normalizeLoadedState } from '../../engine/state';
import { getFullBodyPath } from '../assets';
import { ThaumaturgicAudio } from '../audio';
import { exportSlot, listSlots, parseSaveFile, writeSlot, type SlotSummary } from '../saves';
import { theme } from '../theme';

const formatSavedAt = (ms?: number) => {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

function SlotLabel({ summary }: Readonly<{ summary: SlotSummary }>) {
  if (summary.empty) return <span style={{ color: theme.textMuted, fontSize: '0.74rem', flex: 1 }}>— empty —</span>;
  const details = [
    `${summary.sealed}/72 sealed`,
    summary.released ? `${summary.released} loose` : '',
    formatSavedAt(summary.savedAt)
  ].filter(Boolean).join(' · ');
  return (
    <span style={{ flex: 1, minWidth: 0 }}>
      <strong style={{ color: summary.over ? theme.accentRed : theme.textBright, fontSize: '0.8rem' }}>
        {(summary.name || '').toUpperCase()}{summary.over ? ' · RUN OVER' : ''}
      </strong>
      <span style={{ display: 'block', color: '#a8ccaf', fontSize: '0.68rem' }}>{details}</span>
    </span>
  );
}

/** One save slot: what is in it, and what you can do with it. */
function SlotCard({ summary, selected, onSelect, onContinue, onDelete, onImport }: Readonly<{
  summary: SlotSummary;
  selected: boolean;
  onSelect: () => void;
  onContinue: () => void;
  onDelete: () => void;
  onImport: () => void;
}>) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const border = selected ? theme.textBright : theme.borderTerminal;
  return (
    <div style={{ border: `1px solid ${border}`, backgroundColor: selected ? '#0c170f' : theme.bgDark, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button type="button" className="row-btn" onClick={onSelect} aria-pressed={selected} style={{ color: 'inherit', display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ color: theme.textMuted, fontSize: '0.68rem', flexShrink: 0 }}>SLOT {summary.slot}</span>
        <SlotLabel summary={summary} />
      </button>
      {selected && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {!summary.empty && !summary.over && (
            <button onClick={onContinue} className="macro-chip" style={{ flex: 2, padding: '7px', fontWeight: 'bold', backgroundColor: theme.textBright, color: '#000' }}>
              &gt; CONTINUE
            </button>
          )}
          {!summary.empty && (
            <button onClick={() => { ThaumaturgicAudio.keyClick(); exportSlot(summary.slot); }} className="macro-chip macro-chip-cyan" style={{ flex: 1, padding: '7px' }}>
              EXPORT
            </button>
          )}
          <button onClick={onImport} className="macro-chip macro-chip-cyan" style={{ flex: 1, padding: '7px' }}>
            IMPORT
          </button>
          {!summary.empty && (confirmDelete ? (
            <>
              <button onClick={() => { setConfirmDelete(false); onDelete(); }} className="macro-chip macro-chip-danger" style={{ flex: 1, padding: '7px', fontWeight: 'bold' }}>DELETE?</button>
              <button onClick={() => setConfirmDelete(false)} className="macro-chip" style={{ padding: '7px' }}>KEEP</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="macro-chip macro-chip-danger" style={{ flex: 1, padding: '7px' }}>DELETE</button>
          ))}
        </div>
      )}
    </div>
  );
}

export const StartScreen = ({
  activeSlot,
  trainingSeen,
  onStart,
  onLoad,
  onOpenManual,
  onDeleteSlot,
  onSecretTap
}: {
  activeSlot: number;
  /** The guided case has been played (or skipped) on this device before. */
  trainingSeen: boolean;
  onStart: (name: string, portrait: string, agency: string, slot: number, withTraining: boolean) => void;
  onLoad: (slot: number) => void;
  onOpenManual: () => void;
  onDeleteSlot: (slot: number) => void;
  /** Taps on the version stamp (the hidden way into the debug log). */
  onSecretTap: () => void;
}) => {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [portrait, setPortrait] = useState('/portraits/thaumaturge_m1.png');
  const [showConfirm, setShowConfirm] = useState(false);
  const [withTraining, setWithTraining] = useState(!trainingSeen);
  const [slotsTick, setSlotsTick] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(activeSlot);
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // slotsTick forces a re-read after a slot is deleted or imported
  const slots = slotsTick >= 0 ? listSlots() : [];
  const chosen = slots.find(sl => sl.slot === selectedSlot) ?? slots[0];

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseSaveFile(await file.text());
    if (!parsed.ok) {
      ThaumaturgicAudio.errorBuzz();
      setNotice({ text: parsed.error, bad: true });
      return;
    }
    if (!chosen.empty && !window.confirm(`Replace ${chosen.name} in slot ${selectedSlot} with the imported save?`)) return;
    if (!writeSlot(selectedSlot, normalizeLoadedState(parsed.state))) {
      setNotice({ text: 'Could not save: browser storage is full or blocked.', bad: true });
      return;
    }
    ThaumaturgicAudio.sealSuccess();
    setNotice({ text: `Imported ${(parsed.state.playerName || 'operative').toUpperCase()} into slot ${selectedSlot}.` });
    setSlotsTick(t => t + 1);
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
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: theme.textBright, fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1.4 }}>
                  <input type="checkbox" checked={withTraining} onChange={e => setWithTraining(e.target.checked)} style={{ marginTop: '3px' }} />
                  <span>
                    Play the training case first
                    <span style={{ display: 'block', color: theme.textMuted, fontSize: '0.7rem' }}>A guided practice run that shows you how everything works. Recommended for your first game.</span>
                  </span>
                </label>
                {!chosen.empty && (
                  <div style={{ color: theme.accentRed, fontSize: '0.74rem' }}>
                    This replaces {(chosen.name || '').toUpperCase()} in slot {selectedSlot}.
                  </div>
                )}
                <button
                  onClick={() => {
                    ThaumaturgicAudio.scryPing();
                    onStart(name || 'VERGIL', portrait, agency || 'DARKWIRE', selectedSlot, withTraining);
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
            {/* The version stamp doubles as the hidden way into the debug log */}
            <button type="button" className="row-btn" onClick={onSecretTap} style={{ width: 'auto', fontSize: '0.68rem', color: theme.accentAmber, letterSpacing: '2px', cursor: 'default' }}>
              THAUMATURGIC OS {'//'} NET-OPS v4.14
            </button>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.74rem', color: theme.textBright }}>&gt; SAVE SLOTS</div>
            {slots.map(sl => (
              <SlotCard
                key={sl.slot}
                summary={sl}
                selected={sl.slot === selectedSlot}
                onSelect={() => { ThaumaturgicAudio.keyClick(); setSelectedSlot(sl.slot); setNotice(null); }}
                onContinue={() => { ThaumaturgicAudio.scryPing(); onLoad(sl.slot); }}
                onDelete={() => { ThaumaturgicAudio.errorBuzz(); onDeleteSlot(sl.slot); setSlotsTick(t => t + 1); }}
                onImport={() => fileRef.current?.click()}
              />
            ))}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              aria-label="Import a save file"
              style={{ display: 'none' }}
              onChange={e => { handleImportFile(e.target.files?.[0]); e.target.value = ''; }}
            />
            {notice && (
              <div role="status" style={{ fontSize: '0.74rem', color: notice.bad ? theme.accentRed : theme.textBright }}>{notice.text}</div>
            )}
          </div>

          <div style={{ fontSize: '0.74rem', color: theme.textBright, borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '8px' }}>
            &gt; NEW OPERATIVE IN SLOT {selectedSlot}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label htmlFor="operative-callsign" style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT OPERATIVE CALLSIGN:</label>
              <input id="operative-callsign" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VERGIL" style={{ width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <label htmlFor="operative-syndicate" style={{ display: 'block', marginBottom: '4px', fontSize: '0.74rem', color: theme.textBright }}>&gt; INPUT AFFILIATED SYNDICATE:</label>
              <input id="operative-syndicate" type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. DARKWIRE" style={{ width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none' }} />
            </div>

            <div>
              <div id="operative-portrait" style={{ display: 'block', marginBottom: '6px', fontSize: '0.74rem', color: theme.textBright }}>&gt; SELECT OPERATIVE DOSSIER PORTRAIT:</div>
              <div role="group" aria-labelledby="operative-portrait" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
