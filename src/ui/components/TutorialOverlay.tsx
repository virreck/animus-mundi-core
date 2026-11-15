// src/ui/components/TutorialOverlay.tsx
// The guided first case: full-screen story cards and a docked handler transmission that
// tracks the current objective and advances on its own when the objective is met.
import { useEffect, useState } from 'react';
import { TUTORIAL_STEPS, fillTutorialText, type TutorialContext } from '../../content/tutorial';
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { theme } from '../theme';

export function TutorialOverlay() {
  const { state, viewport, mapViewMode, selectedSuspectId, tutorialStep, setTutorialStep, finishTutorial, isTrainingRun } = useSession();
  const [minimised, setMinimised] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const step = TUTORIAL_STEPS[Math.min(tutorialStep, TUTORIAL_STEPS.length - 1)];
  const ctx: TutorialContext = { state, viewport, mapViewMode, selectedSuspectId };
  const complete = !!step?.done?.(ctx);
  const isLast = tutorialStep >= TUTORIAL_STEPS.length - 1;

  const advance = () => {
    if (isLast) {
      finishTutorial();
      return;
    }
    setTutorialStep(tutorialStep + 1);
    setMinimised(false);
  };

  // Objectives advance on their own a beat after they are met
  useEffect(() => {
    if (!isTrainingRun || !complete) return;
    const t = setTimeout(() => {
      ThaumaturgicAudio.scryPing();
      advance();
    }, 900);
    return () => clearTimeout(t);
  }, [isTrainingRun, complete, tutorialStep]);

  if (!isTrainingRun || !step) return null;
  const fill = (text: string) => fillTutorialText(text, state);
  const progress = `${Math.min(tutorialStep + 1, TUTORIAL_STEPS.length)}/${TUTORIAL_STEPS.length}`;

  const skipControls = confirmSkip ? (
    <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ color: theme.accentRed }}>END TRAINING?</span>
      <button className="macro-chip macro-chip-danger" onClick={() => { ThaumaturgicAudio.keyClick(); finishTutorial(); }}>YES</button>
      <button className="macro-chip" onClick={() => setConfirmSkip(false)}>NO</button>
    </span>
  ) : (
    <button className="macro-chip" style={{ opacity: 0.7 }} onClick={() => setConfirmSkip(true)}>SKIP TRAINING</button>
  );

  if (step.fullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 950, backgroundColor: 'rgba(2,4,3,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: theme.fontMono }}>
        <div key={step.id} style={{ width: '100%', maxWidth: '620px', animation: 'slideDownTop 0.4s ease-out' }}>
          <div style={{ color: theme.textMuted, fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '10px' }}>
            ▌VESPER // ENCRYPTED // {progress}
          </div>
          <h2 style={{ color: theme.textBright, letterSpacing: '4px', fontSize: '1.15rem', margin: '0 0 18px 0' }}>{fill(step.title)}</h2>
          {step.lines.map((line, i) => (
            <p key={i} style={{ color: '#d6f5dc', fontSize: '0.92rem', lineHeight: '1.75', margin: '0 0 14px 0' }}>{fill(line)}</p>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '26px', gap: '10px', flexWrap: 'wrap' }}>
            {!isLast ? skipControls : <span />}
            <button
              onClick={() => { ThaumaturgicAudio.keyClick(); advance(); }}
              style={{ padding: '11px 22px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px' }}
            >
              &gt; {step.continueLabel || 'CONTINUE'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (minimised) {
    return (
      <button
        onClick={() => setMinimised(false)}
        style={{ position: 'fixed', top: '52px', right: '8px', zIndex: 90, maxWidth: 'min(340px, calc(100vw - 16px))', padding: '6px 10px', backgroundColor: 'rgba(5,7,6,0.97)', border: `1px solid ${theme.accentAmber}`, color: theme.accentAmber, fontFamily: theme.fontMono, fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left' }}
      >
        ◆ {step.objective ? fill(step.objective) : fill(step.title)}
      </button>
    );
  }

  return (
    <div
      key={step.id}
      style={{
        position: 'fixed', top: '52px', right: '8px', zIndex: 90,
        width: 'min(360px, calc(100vw - 16px))', maxHeight: '46vh', overflowY: 'auto',
        backgroundColor: 'rgba(5,7,6,0.97)', border: `1px solid ${complete ? theme.textBright : theme.accentAmber}`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.85)', padding: '10px 12px', fontFamily: theme.fontMono, fontSize: '0.74rem',
        animation: 'slideDownTop 0.25s ease-out'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: theme.textMuted, fontSize: '0.64rem', letterSpacing: '2px' }}>▌VESPER // TRAINING {progress}</span>
        <button onClick={() => setMinimised(true)} className="macro-chip" style={{ padding: '0 6px' }}>_</button>
      </div>
      <div style={{ color: theme.textBright, fontWeight: 'bold', letterSpacing: '2px', marginBottom: '6px' }}>{fill(step.title)}</div>
      {step.lines.map((line, i) => (
        <p key={i} style={{ color: '#d6f5dc', lineHeight: '1.55', margin: '0 0 7px 0' }}>{fill(line)}</p>
      ))}
      {step.objective && (
        <div style={{ marginTop: '8px', padding: '6px 8px', border: `1px dashed ${complete ? theme.textBright : theme.accentAmber}`, color: complete ? theme.textBright : theme.accentAmber }}>
          {complete ? '◆' : '◇'} {fill(step.objective)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '6px', flexWrap: 'wrap' }}>
        {skipControls}
        {!step.objective && (
          <button className="macro-chip macro-chip-amber" onClick={() => { ThaumaturgicAudio.keyClick(); advance(); }}>
            &gt; {step.continueLabel || 'CONTINUE'}
          </button>
        )}
      </div>
    </div>
  );
}
