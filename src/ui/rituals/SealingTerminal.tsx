// src/ui/rituals/SealingTerminal.tsx
// Sealing Rite overlay: True Name entry and sigil tracing.
import { useState, useEffect, type Dispatch as ReactDispatch, type FormEvent as ReactFormEvent } from 'react';
import { allGoetia } from '../../content/goetia';
import type { GameAction } from '../../engine/reducer';
import { generateSealMatrix } from '../../engine/sealMatrix';
import { ThaumaturgicAudio } from '../audio';
import { SigilTracingBoard } from '../components/SigilTracingBoard';
import { SmartGoetiaSigil } from '../components/SmartGoetiaSigil';
import { theme } from '../theme';

export interface SealingTerminalProps {
  suspect: typeof allGoetia[0];
  actualAnchorId: string;
  sealCost: Record<string, number>;
  attunedBonusSeconds: number;
  onClose: () => void;
  onSuccessSeal: (goetiaId: string) => string[];
  /** Sector being worked; a failed rite loses it permanently. */
  sectorId: string;
  dispatch: ReactDispatch<GameAction>;
  sealGoetia: (id: string) => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
  tetheredYokai: string[];
  /** Guided first case: failures refund the catalysts instead of being permanent. */
  isTraining?: boolean;
}

export const SealingTerminal = ({
  suspect,
  actualAnchorId,
  sealCost,
  attunedBonusSeconds,
  onClose,
  onSuccessSeal,
  sectorId,
  dispatch,
  sealGoetia,
  addToast,
  tetheredYokai,
  isTraining = false
}: SealingTerminalProps) => {
  const [matrix] = useState(() => generateSealMatrix());
  const [phase, setPhase] = useState<'AUTH' | 'WARDING' | 'COMPLETE' | 'MISIDENTIFIED' | 'FAILED'>('AUTH');
  const [nameInput, setNameInput] = useState('');
  const hasTimeBuff = tetheredYokai.includes('yokai_kamaitachi');
  const [timeLeft, setTimeLeft] = useState(matrix.timeLimit + (hasTimeBuff ? 5 : 0) + attunedBonusSeconds);
  const [path, setPath] = useState<number[]>([]);
  const [typedName, setTypedName] = useState('');
  const [showSealed, setShowSealed] = useState(false);
  const [cascadedNames, setCascadedNames] = useState<string[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'WARDING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (phase === 'WARDING' && timeLeft <= 0) {
      failSeal();
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'COMPLETE') {
      const fullName = suspect.name.toUpperCase();
      let i = 0;
      setTypedName('');
      setShowSealed(false);
      const interval = setInterval(() => {
        setTypedName(fullName.substring(0, i + 1));
        ThaumaturgicAudio.typewriterClack();
        i++;
        if (i >= fullName.length) {
          clearInterval(interval);
          setTimeout(() => {
            ThaumaturgicAudio.heavyStampImpact();
            setShowSealed(true);
          }, 650);
        }
      }, 220);
      return () => clearInterval(interval);
    }
  }, [phase, suspect.name]);

  useEffect(() => {
    if (phase === 'WARDING' && path.length === matrix.sequence.length) completeSeal();
  }, [path.length, phase, matrix.sequence.length]);

  const handleNodeHit = (nodeId: number) => {
    setPath(prev => {
      if (matrix.sequence[prev.length] !== nodeId) return prev;
      ThaumaturgicAudio.keyClick();
      return [...prev, nodeId];
    });
  };

  const handleAuthSubmit = (e: ReactFormEvent) => {
    e.preventDefault();
    if (nameInput.trim().toUpperCase() !== suspect.name.toUpperCase()) {
      ThaumaturgicAudio.errorBuzz();
      addToast("VOCALIZATION MISMATCH", "ALERT");
      dispatch({ type: 'MODIFY_HUMANITY', payload: -5 });
      return;
    }
    (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) =>
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } })
    );
    if (suspect.id !== actualAnchorId) {
      ThaumaturgicAudio.errorBuzz();
      if (isTraining) {
        refundCatalysts();
        setPhase('MISIDENTIFIED');
        addToast(`FALSE DEDUCTION. Training refund issued.`, 'ALERT');
        return;
      }
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 15 });
      dispatch({ type: 'MODIFY_HUMANITY', payload: -20 });
      setPhase('MISIDENTIFIED');
      addToast(`FALSE DEDUCTION! Entity rejected the seal of ${suspect.name}!`, 'ALERT');
      return;
    }
    ThaumaturgicAudio.scryPing();
    setPhase('WARDING');
  };

  const completeSeal = () => {
    setPhase('COMPLETE');
    sealGoetia(suspect.id);
    setCascadedNames(onSuccessSeal(suspect.id));
    addToast(`SEALING SUCCESSFUL. Target ${suspect.name} bound to the brass vessel.`, 'SEAL');
  };

  // Running out of time is permanent: the demon manifests, can never be sealed,
  // and this sector is lost for the rest of the run.
  const refundCatalysts = () =>
    (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) =>
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount } })
    );

  const failSeal = () => {
    setPhase('FAILED');
    ThaumaturgicAudio.errorBuzz();
    if (isTraining) {
      refundCatalysts();
      addToast(`RITUAL FRACTURE. Training tether caught the spirit — try again.`, 'ALERT');
      return;
    }
    addToast(`RITUAL FRACTURE. ${suspect.name} has MANIFESTED! Sector lost. Global Entropy +10%.`, 'ALERT');
    dispatch({ type: 'RELEASE_GOETIA', payload: { goetiaId: suspect.id, sectorId } });
    dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 10 });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '12px' }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '26px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, boxShadow: `0 0 30px rgba(98, 240, 128, 0.2)`, fontFamily: theme.fontMono, color: theme.textTerminal, animation: showSealed ? 'heavyImpactShake 0.34s ease-out both' : 'none' }}>
        {phase !== 'COMPLETE' && (
          <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '8px', color: theme.textBright }}>
            &gt; ROOT_ACCESS // VESSEL_SEALING_PROTOCOL
          </h3>
        )}
        {phase === 'AUTH' && (
          <form onSubmit={handleAuthSubmit}>
            <p style={{ fontSize: '0.8rem', marginBottom: '10px', lineHeight: '1.5' }}>
              HYPOTHESIS LOCKED: <strong style={{ color: theme.textBright }}>{suspect.name.toUpperCase()}</strong> ({suspect.rank} of {suspect.allegiance}).<br/>
              <span style={{ color: theme.accentAmber }}>WARNING: MISIDENTIFICATION BURNS CATALYSTS · +15% GLOBAL ENTROPY</span>
            </p>
            <input autoFocus type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="TRUE NAME" style={{ padding: '10px', width: '100%', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', textTransform: 'uppercase' }} />
            <button type="submit" style={{ marginTop: '12px', padding: '10px', width: '100%', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&gt; BURN CATALYSTS &amp; START SEALING RITE</button>
            <button type="button" onClick={onClose} style={{ marginTop: '8px', padding: '10px', width: '100%', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </form>
        )}
        {phase === 'MISIDENTIFIED' && (
          <div style={{ textAlign: 'center', padding: '15px 0' }}>
            <h2 style={{ color: theme.accentRed, letterSpacing: '3px', margin: '0 0 10px 0' }}>! FALSE TRUE-NAME BACKLASH !</h2>
            <p style={{ fontSize: '0.82rem', color: '#ffb3b3', lineHeight: '1.6' }}>
              You inscribed the seal of <strong>{suspect.name}</strong>, but the entity haunting this sector rejected the binding.<br/><br/>
              <strong>PENALTY:</strong> -20 Humanity | +15.00% Global Entropy.
            </p>
            <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: theme.fontMono }}>
              &gt; EMERGENCY DISCONNECT
            </button>
          </div>
        )}
        {phase === 'FAILED' && (
          <div style={{ textAlign: 'center', padding: '15px 0' }}>
            <h2 style={{ color: theme.accentRed, letterSpacing: '3px', margin: '0 0 10px 0' }}>! {suspect.name.toUpperCase()} {isTraining ? 'BROKE THE BINDING' : 'HAS MANIFESTED'} !</h2>
            {isTraining ? (
              <p style={{ fontSize: '0.82rem', color: '#ffb3b3', lineHeight: '1.6' }}>
                The binding geometry was not completed in time. The training tether held it — catalysts refunded.<br/><br/>
                In a live operation <strong>{suspect.name}</strong> would now be loose for good, and this sector lost.
              </p>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#ffb3b3', lineHeight: '1.6' }}>
                The binding geometry was not completed in time and <strong>{suspect.name}</strong> tore free of the vessel, anchoring itself permanently in the mundane world.<br/><br/>
                <strong>PENALTY:</strong> Catalysts burned | +10.00% Global Entropy<br/>
                <strong>{suspect.name}</strong> can never be sealed, and this sector is <strong>LOST</strong> for the rest of the run.
              </p>
            )}
            <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: theme.fontMono }}>
              &gt; EMERGENCY DISCONNECT
            </button>
          </div>
        )}
        {phase === 'WARDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold' }}>STEP {path.length}/{matrix.sequence.length}</span>
              <span style={{ color: timeLeft <= 5 ? theme.accentRed : theme.textBright, fontWeight: 'bold' }}>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <div style={{ position: 'relative', width: '280px', height: '280px', border: `1px solid ${theme.borderTerminal}`, backgroundColor: theme.bgDark, borderRadius: '50%', overflow: 'hidden' }}>
              {/* The True Name is known: the sigil burns in full and pulses faster as the binding closes */}
              <div
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, pointerEvents: 'none',
                  animation: `sigilBindPulse ${Math.max(0.55, 1.8 - (1.25 * path.length) / matrix.sequence.length).toFixed(2)}s ease-in-out infinite`
                }}
              >
                <SmartGoetiaSigil goetia={suspect} isRevealed={true} size={175} />
              </div>
              <SigilTracingBoard
                matrix={matrix}
                path={path}
                onNodeHit={handleNodeHit}
                enabled={phase === 'WARDING'}
                palette={{
                  guide: theme.borderTerminal,
                  trace: theme.textBright,
                  pointer: theme.textBright,
                  activeNode: theme.textBright,
                  idleNode: theme.bgDark,
                  idleStroke: theme.textTerminal,
                  nextStroke: '#ffffff',
                  pulse: theme.textBright
                }}
              />
            </div>
          </div>
        )}
        {phase === 'COMPLETE' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <SmartGoetiaSigil goetia={suspect} isRevealed={true} size={175} style={{ marginBottom: '14px' }} />
            <h2 style={{ color: theme.textBright, letterSpacing: '6px', minHeight: '35px', margin: '0' }}>{typedName}</h2>
            {showSealed && (
              <>
                <div style={{ color: theme.accentRed, border: `3px solid ${theme.accentRed}`, padding: '4px 16px', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '8px', marginTop: '10px', animation: 'stampSlam 0.22s ease-out forwards', boxShadow: '0 0 25px rgba(255,42,85,0.6)' }}>
                  [SEALED]
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a8ccaf', marginTop: '12px' }}>
                  +5% Banishment Probability toward <strong>{suspect.allegiance}</strong> | Sector Secured!
                </p>
                {cascadedNames.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(255, 184, 0, 0.12)', border: `1px solid ${theme.accentAmber}`, color: theme.accentAmber, fontSize: '0.75rem', lineHeight: '1.45' }}>
                    <strong>⚡ FEUDAL RESONANCE CASCADE:</strong><br/>
                    Binding <strong>{suspect.rank} {suspect.name}</strong> automatically collapsed and sealed their vassal spirit(s) in the Codex: <strong>{cascadedNames.join(' & ')}</strong>!
                  </div>
                )}
                <button onClick={onClose} style={{ marginTop: '18px', padding: '10px 20px', width: '100%', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.textBright}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}>
                  &gt; ACKNOWLEDGE_CONTAINMENT
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
