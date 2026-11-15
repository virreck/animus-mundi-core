// src/ui/components/TutorialOverlay.tsx
// The guided first case: full-screen story cards, and a small coach panel that
// points at the control to press next. The panel moves to whichever part of the
// screen the player is NOT using, and a pulsing ring marks the target.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  TUTORIAL_STEPS, fillTutorialText, getTutorialGuide, type TutorialContext, type TutorialGuide, type TutorialStep
} from '../../content/tutorial';
import type { SubGridNode } from '../../engine/sectorGenerator';
import { TUTORIAL_SECTOR_ID } from '../../engine/tutorial';
import { ThaumaturgicAudio } from '../audio';
import { usePointerKind } from '../hooks/usePointerKind';
import { useSession } from '../session/SessionContext';
import { theme } from '../theme';

interface Box { left: number; top: number; width: number; height: number }

const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1);

/** First on-screen element with this `data-tour` id. */
function findTarget(id: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`));
  return els.find(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

const isPhoneLayout = () => {
  const sw = document.querySelector<HTMLElement>('.field-ops-switch');
  return !!sw && getComputedStyle(sw).display !== 'none';
};

/**
 * On phones Field Ops shows one pane at a time: if the target is in the hidden one,
 * point at the pane switch instead.
 */
function resolveGuide(guide: TutorialGuide | null, mobilePane: string, viewport: string): TutorialGuide | null {
  if (!guide?.pane || viewport !== 'FIELD_OPS' || mobilePane === 'SPLIT' || mobilePane === guide.pane) return guide;
  if (!isPhoneLayout()) return guide;
  return { target: `pane-${guide.pane}`, hint: `Tap ${guide.pane} just above to show it.` };
}

/** Where the panel goes: away from the thing the player has to look at. */
function panelPosition(avoid: Box | null): CSSProperties {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const wide = w >= 900;
  const cx = avoid ? avoid.left + avoid.width / 2 : w;
  const cy = avoid ? avoid.top + avoid.height / 2 : 0;
  const pos: CSSProperties = {};
  // Vertical: opposite half of the screen to the target
  if (cy > h * 0.5) pos.top = 'calc(var(--header-h, 46px) + 6px)';
  else pos.bottom = 'calc(8px + env(safe-area-inset-bottom, 0px))';
  // Horizontal (wide screens only): opposite side too
  if (wide) {
    if (cx > w * 0.5) pos.left = '8px';
    else pos.right = '8px';
  } else {
    pos.left = '8px';
    pos.right = '8px';
  }
  return pos;
}

/** Screen boxes of the control to press and of the room to tap, tracked every frame. */
function useTourBoxes(
  targetId: string | undefined,
  roomNo: number | undefined,
  rooms: SubGridNode[] | undefined,
  canvas: HTMLCanvasElement | null,
  mapZoom: number,
  mapPan: { x: number; y: number }
) {
  const [targetBox, setTargetBox] = useState<Box | null>(null);
  const [roomBox, setRoomBox] = useState<Box | null>(null);
  const scrolledFor = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId && roomNo === undefined) {
      setTargetBox(null);
      setRoomBox(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const tb = targetId ? measureTarget(targetId, scrolledFor) : null;
      setTargetBox(prev => (sameBox(prev, tb) ? prev : tb));
      const node = roomNo === undefined ? undefined : rooms?.find(n => n.index === roomNo);
      const rb = canvas && node ? measureRoom(canvas, node, mapZoom, mapPan) : null;
      setRoomBox(prev => (sameBox(prev, rb) ? prev : rb));
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [targetId, roomNo, rooms, canvas, mapZoom, mapPan]);

  return { targetBox, roomBox };
}

/** Finds the target control (scrolling it into view the first time) and returns its box. */
function measureTarget(id: string, scrolledFor: { current: string | null }): Box | null {
  const el = findTarget(id);
  if (!el) return null;
  if (scrolledFor.current !== id) {
    scrolledFor.current = id;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/** Where a room is drawn on screen: the render loop's zoom-then-pan, then canvas px -> screen px. */
function measureRoom(canvas: HTMLCanvasElement, node: SubGridNode, zoom: number, pan: { x: number; y: number }): Box | null {
  const r = canvas.getBoundingClientRect();
  if (r.width <= 0) return null;
  const w = canvas.width || 1;
  const h = canvas.height || 1;
  const sx = ((node.x * w - w / 2) * zoom + w / 2 + pan.x) * (r.width / w);
  const sy = ((node.y * h - h / 2) * zoom + h / 2 + pan.y) * (r.height / h);
  const size = 56 * zoom * (r.width / w);
  return { left: r.left + sx - size / 2, top: r.top + sy - size / 2, width: size, height: size };
}

export function TutorialOverlay() {
  const {
    state, viewport, mapViewMode, selectedSuspectId, tutorialStep, setTutorialStep, finishTutorial,
    isTrainingRun, mobilePane, mapCanvasRef, mapZoom, mapPan
  } = useSession();
  const [minimised, setMinimised] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const pointer = usePointerKind();

  const step = TUTORIAL_STEPS[Math.min(tutorialStep, TUTORIAL_STEPS.length - 1)];
  const ctx: TutorialContext = { state, viewport, mapViewMode, selectedSuspectId };
  const complete = !!step?.done?.(ctx);
  const isLast = tutorialStep >= TUTORIAL_STEPS.length - 1;
  const guide = isTrainingRun && !step?.fullscreen ? resolveGuide(getTutorialGuide(step, ctx), mobilePane, viewport) : null;
  const targetId = complete ? undefined : guide?.target;
  const roomNo = complete || viewport !== 'FIELD_OPS' || mapViewMode !== 'SUB_GRID' ? undefined : guide?.room;

  const advance = () => {
    if (isLast) {
      finishTutorial();
      return;
    }
    setTutorialStep(tutorialStep + 1);
    setMinimised(false);
    setShowStory(false);
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

  const { targetBox, roomBox } = useTourBoxes(targetId, roomNo, state.contracts[TUTORIAL_SECTOR_ID]?.subNodes, mapCanvasRef.current, mapZoom, mapPan);

  if (!isTrainingRun || !step) return null;
  const fill = (text: string) => fillTutorialText(text, state, pointer);
  const progress = `${Math.min(tutorialStep + 1, TUTORIAL_STEPS.length)}/${TUTORIAL_STEPS.length}`;

  const skipControls = <SkipControls confirming={confirmSkip} setConfirming={setConfirmSkip} onSkip={finishTutorial} />;

  if (step.fullscreen) {
    return <StoryCard step={step} progress={progress} fill={fill} isLast={isLast} skipControls={skipControls} onContinue={advance} />;
  }

  const spot = targetBox ?? roomBox;
  const position = panelPosition(spot);
  const hint = complete ? 'Done.' : guide?.hint && fill(guide.hint);

  const marker = (
    <>
      {targetBox && <Highlight box={targetBox} label={fill('TAP HERE')} />}
      {roomBox && !targetBox && <Highlight box={roomBox} label={`ROOM ${roomNo}`} round />}
    </>
  );

  if (minimised) {
    return (
      <>
        {marker}
        <button
          onClick={() => setMinimised(false)}
          style={{ position: 'fixed', ...position, zIndex: 90, maxWidth: 'min(420px, calc(100vw - 16px))', padding: '7px 10px', backgroundColor: 'rgba(5,7,6,0.97)', border: `1px solid ${theme.accentAmber}`, color: theme.accentAmber, fontFamily: theme.fontMono, fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left' }}
        >
          ◆ {hint || (step.objective ? fill(step.objective) : fill(step.title))} <span style={{ color: theme.textMuted }}>{fill('(tap to open)')}</span>
        </button>
      </>
    );
  }

  return (
    <>
      {marker}
      <CoachPanel
        step={step}
        progress={progress}
        fill={fill}
        complete={complete}
        hint={hint}
        position={position}
        showStory={showStory}
        onToggleStory={() => setShowStory(v => !v)}
        onMinimise={() => setMinimised(true)}
        onContinue={advance}
        skipControls={skipControls}
      />
    </>
  );
}

function SkipControls({ confirming, setConfirming, onSkip }: Readonly<{ confirming: boolean; setConfirming: (v: boolean) => void; onSkip: () => void }>) {
  if (!confirming) {
    return <button className="macro-chip" style={{ opacity: 0.7 }} onClick={() => setConfirming(true)}>SKIP TRAINING</button>;
  }
  return (
    <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ color: theme.accentRed }}>END TRAINING?</span>
      <button className="macro-chip macro-chip-danger" onClick={() => { ThaumaturgicAudio.keyClick(); onSkip(); }}>YES</button>
      <button className="macro-chip" onClick={() => setConfirming(false)}>NO</button>
    </span>
  );
}

interface CardProps {
  step: TutorialStep;
  progress: string;
  fill: (text: string) => string;
  skipControls: ReactNode;
  onContinue: () => void;
}

/** Full-screen story card (opening and ending). */
function StoryCard({ step, progress, fill, isLast, skipControls, onContinue }: Readonly<CardProps & { isLast: boolean }>) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, backgroundColor: 'rgba(2,4,3,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: theme.fontMono, overflowY: 'auto' }}>
      <div key={step.id} style={{ width: '100%', maxWidth: '620px', animation: 'slideDownTop 0.4s ease-out' }}>
        <div style={{ color: theme.textMuted, fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '10px' }}>
          ▌VESPER {'//'} ENCRYPTED {'//'} {progress}
        </div>
        <h2 style={{ color: theme.textBright, letterSpacing: '4px', fontSize: '1.15rem', margin: '0 0 18px 0' }}>{fill(step.title)}</h2>
        {step.lines.map(line => (
          <p key={line} style={{ color: '#d6f5dc', fontSize: '0.92rem', lineHeight: '1.75', margin: '0 0 14px 0' }}>{fill(line)}</p>
        ))}
        {step.plain && (
          <p style={{ color: theme.accentAmber, fontSize: '0.88rem', lineHeight: '1.6', margin: '6px 0 0 0', padding: '10px 12px', border: `1px dashed ${theme.accentAmber}` }}>
            {fill(step.plain)}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '26px', gap: '10px', flexWrap: 'wrap' }}>
          {isLast ? <span /> : skipControls}
          <button
            onClick={() => { ThaumaturgicAudio.keyClick(); onContinue(); }}
            style={{ padding: '11px 22px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px' }}
          >
            &gt; {step.continueLabel || 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The small docked guide: summary, objective, what to press, and Vesper's lines on request. */
function CoachPanel({ step, progress, fill, complete, hint, position, showStory, onToggleStory, onMinimise, onContinue, skipControls }: Readonly<CardProps & {
  complete: boolean;
  hint?: string;
  position: CSSProperties;
  showStory: boolean;
  onToggleStory: () => void;
  onMinimise: () => void;
}>) {
  const stretched = position.right !== undefined && position.left !== undefined;
  const accent = complete ? theme.textBright : theme.accentAmber;
  return (
    <aside
      key={step.id}
      aria-label="Training guide"
      style={{
        position: 'fixed', ...position, zIndex: 90,
        width: stretched ? 'auto' : 'min(380px, calc(100vw - 16px))',
        maxHeight: '38vh', overflowY: 'auto',
        backgroundColor: 'rgba(5,7,6,0.97)', border: `1px solid ${accent}`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.85)', padding: '8px 11px', fontFamily: theme.fontMono, fontSize: '0.76rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: theme.textBright, fontWeight: 'bold', letterSpacing: '1px' }}>{fill(step.title)}</span>
        <span style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: theme.textMuted, fontSize: '0.64rem' }}>{progress}</span>
          <button onClick={onMinimise} className="macro-chip" style={{ padding: '0 7px' }} aria-label="Shrink the guide">_</button>
        </span>
      </div>

      {step.plain && <p style={{ color: '#d6f5dc', lineHeight: '1.5', margin: '0 0 6px 0' }}>{fill(step.plain)}</p>}

      {(step.objective || hint) && (
        <div style={{ padding: '6px 8px', border: `1px dashed ${accent}`, color: accent }}>
          {step.objective && <div>{complete ? '◆' : '◇'} {fill(step.objective)}</div>}
          {hint && !complete && <div style={{ color: '#ffffff', marginTop: step.objective ? '3px' : 0, fontWeight: 'bold' }}>→ {hint}</div>}
        </div>
      )}

      {showStory && step.lines.map(line => (
        <p key={line} style={{ color: '#a8ccaf', fontStyle: 'italic', lineHeight: '1.5', margin: '6px 0 0 0' }}>“{fill(line)}”</p>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {skipControls}
          {step.lines.length > 0 && (
            <button className="macro-chip" style={{ opacity: 0.8 }} onClick={onToggleStory}>
              {showStory ? 'HIDE VESPER' : 'VESPER SAYS…'}
            </button>
          )}
        </span>
        {!step.objective && (
          <button className="macro-chip macro-chip-amber" style={{ padding: '5px 12px', fontWeight: 'bold' }} onClick={() => { ThaumaturgicAudio.keyClick(); onContinue(); }}>
            &gt; {step.continueLabel || 'CONTINUE'}
          </button>
        )}
      </div>
    </aside>
  );
}

/** A pulsing ring around the thing to press. Clicks pass straight through it. */
function Highlight({ box, label, round }: Readonly<{ box: Box; label: string; round?: boolean }>) {
  const pad = 4;
  const labelAbove = box.top > 60;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', zIndex: 95, pointerEvents: 'none',
        left: box.left - pad, top: box.top - pad, width: box.width + pad * 2, height: box.height + pad * 2,
        border: `2px solid ${theme.accentAmber}`, borderRadius: round ? '50%' : '4px',
        animation: 'tourPulse 1.2s ease-in-out infinite'
      }}
    >
      <span
        style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          [labelAbove ? 'bottom' : 'top']: 'calc(100% + 4px)',
          backgroundColor: theme.accentAmber, color: '#000', fontFamily: theme.fontMono, fontWeight: 'bold',
          fontSize: '0.62rem', padding: '1px 6px', whiteSpace: 'nowrap', letterSpacing: '1px'
        }}
      >
        {labelAbove ? '▼' : '▲'} {label}
      </span>
    </div>
  );
}
