// src/ui/rituals/BanishmentTerminal.tsx
// Grand Rite of Banishment overlay.
import { useState, useEffect, type Dispatch as ReactDispatch } from 'react';
import { allGoetia } from '../../content/goetia';
import { HORSEMAN_LORE } from '../../content/horsemen';
import type { GameAction } from '../../engine/reducer';
import { generateSealMatrix } from '../../engine/sealMatrix';
import type { GameState } from '../../engine/state';
import { ThaumaturgicAudio } from '../audio';
import { HorsemanSigilSvg } from '../components/HorsemanSigilSvg';
import { SigilTracingBoard } from '../components/SigilTracingBoard';
import { theme } from '../theme';

export interface BanishmentTerminalProps {
  horseman: 'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH';
  state: GameState;
  dispatch: ReactDispatch<GameAction>;
  onClose: () => void;
  addToast: (msg: string, type: 'INTEL'|'ITEM'|'ALERT'|'SEAL') => void;
  tetheredYokai: string[];
}

export const BanishmentTerminal = ({ horseman, state, dispatch, onClose, addToast, tetheredYokai }: BanishmentTerminalProps) => {
  const [phase, setPhase] = useState<'LEDGER' | 'RITUAL' | 'RESOLUTION'>('LEDGER');
  const [matrices] = useState(() => [generateSealMatrix(), generateSealMatrix(), generateSealMatrix()]);
  const [currentMatrixIdx, setCurrentMatrixIdx] = useState(0);
  const hasTimeBuff = tetheredYokai.includes('yokai_kamaitachi');
  const [timeLeft, setTimeLeft] = useState(60 + (hasTimeBuff ? 15 : 0));
  const [path, setPath] = useState<number[]>([]);
  const [isVictory, setIsVictory] = useState(false);

  const lieutenants = allGoetia.filter(g => g.allegiance === horseman);
  const sealedCount = lieutenants.filter(g => state.sealedGoetia.includes(g.id)).length;
  const winProbability = Math.min(95, 5 + (sealedCount * 5));

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'RITUAL' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (phase === 'RITUAL' && timeLeft <= 0) {
      executeResolution(false);
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'RITUAL' && path.length === matrices[currentMatrixIdx].sequence.length) {
      if (currentMatrixIdx < 2) {
        ThaumaturgicAudio.scryPing();
        setCurrentMatrixIdx(prev => prev + 1);
        setPath([]);
        addToast(`MATRIX ${currentMatrixIdx + 1}/3 LOCKED.`, 'SEAL');
      } else {
        executeResolution(Math.random() * 100 <= winProbability);
      }
    }
  }, [path.length, phase, currentMatrixIdx, matrices, winProbability]);

  const executeResolution = (success: boolean) => {
    setIsVictory(success);
    setPhase('RESOLUTION');
    if (success) {
      ThaumaturgicAudio.heavyStampImpact();
      dispatch({ type: 'SET_FLAG', payload: { flagId: `banished_${horseman.toLowerCase()}`, value: true } });
      addToast(`BANISHMENT SUCCESSFUL. ${horseman} severed from reality!`, 'SEAL');
    } else {
      ThaumaturgicAudio.errorBuzz();
      addToast(`RITUAL FRACTURE. GLOBAL ENTROPY +25%.`, 'ALERT');
      dispatch({ type: 'MODIFY_GLOBAL_ENTROPY', payload: 25 });
    }
  };

  const handleNodeHit = (nodeId: number) => {
    setPath(prev => {
      if (matrices[currentMatrixIdx].sequence[prev.length] !== nodeId) return prev;
      ThaumaturgicAudio.keyClick();
      return [...prev, nodeId];
    });
  };

  const overrideTheme = { bg: '#0f0202', border: '#ff3333', text: '#ff6666', bright: '#ffb3b3' };
  const activeMatrix = matrices[currentMatrixIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '12px' }}>
      <div style={{ width: '100%', maxWidth: '560px', padding: '28px', backgroundColor: overrideTheme.bg, border: `2px solid ${overrideTheme.border}`, boxShadow: `0 0 50px rgba(255, 51, 51, 0.2)`, fontFamily: theme.fontMono, color: overrideTheme.text, animation: isVictory ? 'heavyImpactShake 0.38s ease-out both' : 'none' }}>
        {phase === 'LEDGER' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: `1px solid ${overrideTheme.border}`, paddingBottom: '10px', marginBottom: '12px' }}>
              <HorsemanSigilSvg horseman={horseman} color={overrideTheme.bright} size={52} />
              <div>
                <h3 style={{ color: overrideTheme.bright, margin: 0 }}>&gt; GRAND RITE OF BANISHMENT // {horseman}</h3>
                <div style={{ fontSize: '0.74rem', color: overrideTheme.text }}>{HORSEMAN_LORE[horseman].riderTitle}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Each sealed Goetia Lieutenant of {horseman} adds +5% to your Grand Rite stabilization roll (5% Base + {sealedCount} × 5%).</p>
            <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '0.76rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', backgroundColor: 'black', padding: '10px', border: `1px solid ${overrideTheme.border}` }}>
              {lieutenants.map(g => {
                const isSealed = state.sealedGoetia.includes(g.id);
                const released = (state.releasedGoetia || []).includes(g.id);
                return (
                  <div key={g.id} style={{ color: isSealed ? '#62f080' : released ? '#ff2a55' : overrideTheme.text, textDecoration: released ? 'line-through' : 'none' }}>
                    #{g.manifestId.toString().padStart(2, '0')} {g.name.toUpperCase()} {isSealed ? '[SEALED]' : released ? '[MANIFESTED]' : '[ACTIVE]'}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'black', border: `1px dashed ${overrideTheme.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: overrideTheme.text }}>CALCULATED BANISHMENT PROBABILITY</div>
              <div style={{ fontSize: '2rem', color: overrideTheme.bright, fontWeight: 'bold' }}>{winProbability}%</div>
            </div>
            <button onClick={() => setPhase('RITUAL')} style={{ width: '100%', padding: '14px', marginTop: '14px', backgroundColor: overrideTheme.bright, color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px' }}>&gt; COMMENCE TRIPLE-MATRIX ENDURANCE RITE</button>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', marginTop: '8px', backgroundColor: 'transparent', color: overrideTheme.text, border: `1px solid ${overrideTheme.text}`, cursor: 'pointer' }}>&gt; ABORT</button>
          </div>
        )}
        {phase === 'RITUAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <span style={{ color: overrideTheme.bright }}>MATRIX: {currentMatrixIdx + 1}/3 (STEP {path.length}/{activeMatrix.sequence.length})</span>
              <span style={{ color: overrideTheme.bright }}>T-MINUS: {timeLeft}s</span>
            </div>
            <div style={{ position: 'relative', width: '290px', height: '290px', border: `2px solid ${overrideTheme.border}`, backgroundColor: 'black', borderRadius: '50%' }}>
              <SigilTracingBoard
                key={currentMatrixIdx}
                matrix={activeMatrix}
                path={path}
                onNodeHit={handleNodeHit}
                enabled={phase === 'RITUAL'}
                palette={{
                  guide: overrideTheme.border,
                  guideWidth: 0.9,
                  guideOpacity: 0.7,
                  trace: '#ffffff',
                  traceWidth: 2.2,
                  pointer: overrideTheme.bright,
                  pointerWidth: 1.5,
                  activeNode: '#ffffff',
                  idleNode: 'black',
                  idleStroke: overrideTheme.border,
                  nextStroke: '#ffffff'
                }}
              />
            </div>
          </div>
        )}
        {phase === 'RESOLUTION' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h1 style={{ color: isVictory ? 'white' : overrideTheme.bright, letterSpacing: '6px', fontSize: '1.8rem', margin: '0 0 15px 0' }}>
              {isVictory ? 'HORSEMAN BANISHED' : 'TETHER RUPTURE'}
            </h1>
            <p style={{ color: overrideTheme.text, lineHeight: '1.6', fontSize: '0.88rem' }}>
              {isVictory
                ? `The conceptual apex of ${horseman} has been permanently severed from mundane reality.`
                : `The Grand Rite fractured (${winProbability}% roll failed or timed out). Global Entropy spiked by +25%.`}
            </p>
            <button onClick={onClose} style={{ padding: '12px 24px', marginTop: '20px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>&gt; RETURN TO OS</button>
          </div>
        )}
      </div>
    </div>
  );
};
