// src/App.tsx
// Thaumaturgic OS shell: wires the session hooks together and lays out the active viewport.
// Game logic lives in src/engine, field operations in src/ui/session, screens in src/ui/viewports.
import { AppHeader } from './ui/components/AppHeader';
import { ToastStack } from './ui/components/ToastStack';
import { ActiveRituals } from './ui/rituals/ActiveRituals';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { StartScreen } from './ui/screens/StartScreen';
import { VictoryScreen } from './ui/screens/VictoryScreen';
import { type Session, SessionContext } from './ui/session/SessionContext';
import { useFieldOps } from './ui/session/useFieldOps';
import { useMapCanvas } from './ui/session/useMapCanvas';
import { useSessionCore } from './ui/session/useSessionCore';
import { theme } from './ui/theme';
import { CodexViewport } from './ui/viewports/CodexViewport';
import { DossierViewport } from './ui/viewports/DossierViewport';
import { FieldOpsViewport } from './ui/viewports/FieldOpsViewport';
import { HorsemenViewport } from './ui/viewports/HorsemenViewport';
import { KageViewport } from './ui/viewports/KageViewport';
import { ManualViewport } from './ui/viewports/ManualViewport';
import { SafehouseViewport } from './ui/viewports/SafehouseViewport';
import './ui/styles.css';

export default function App() {
  const core = useSessionCore();
  const ops = useFieldOps(core);
  const canvas = useMapCanvas({ ...core, ...ops });
  const session: Session = { ...core, ...ops, ...canvas };
  const {
    state,
    startInvestigation,
    loadGame,
    viewport,
    fontScale,
    showManual,
    setShowManual,
    hudFlash,
    activeBanishmentTarget,
    handleFullReset,
    currentHeat
  } = session;

  const HORSEMEN = ['conquest', 'war', 'famine', 'death'] as const;
  const allBanished = HORSEMEN.every(h => state.flags[`banished_${h}`]);

  if (state.gameStage === 'GAME_OVER') {
    return <SessionContext.Provider value={session}><GameOverScreen /></SessionContext.Provider>;
  }

  if (state.gameStage === 'ACTIVE' && allBanished && !activeBanishmentTarget) {
    return <SessionContext.Provider value={session}><VictoryScreen /></SessionContext.Provider>;
  }

  if (state.gameStage === 'START_SCREEN') {
    return (
      <>
        {showManual && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: theme.bgDark, zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#030504', borderBottom: `1px solid ${theme.borderTerminal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.textBright, fontWeight: 'bold', fontSize: '0.8rem' }}>SYNDICATE FIELD MANUAL // PRE-DEPLOYMENT BRIEFING</span>
              <button onClick={() => setShowManual(false)} style={{ padding: '5px 12px', backgroundColor: '#2a0808', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.74rem' }}>
                [X] RETURN TO LOGIN
              </button>
            </div>
            <ManualViewport fontScale={fontScale} />
          </div>
        )}
        <StartScreen
          onStart={startInvestigation}
          onLoad={loadGame}
          onOpenManual={() => setShowManual(true)}
          onFullReset={handleFullReset}
        />
      </>
    );
  }


  return (
    <SessionContext.Provider value={session}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          width: '100vw',
          backgroundColor: theme.bgDark,
          color: theme.textTerminal,
          fontFamily: theme.fontMono,
          overflow: 'hidden',
          userSelect: 'none',
          animation: hudFlash === 'DAMAGE' ? 'screenShake 0.36s cubic-bezier(.36,.07,.19,.97) both' : 'none'
        }}
      >
        <div className={`crt-scanlines ${currentHeat >= 75 ? 'crt-critical' : ''} ${hudFlash === 'DAMAGE' ? 'crt-glitch' : ''}`} />
        <AppHeader />

        {viewport === 'FIELD_OPS' && <FieldOpsViewport />}
        {viewport === 'CODEX' && <CodexViewport />}
        {viewport === 'KAGE_NO_SHO' && <KageViewport />}
        {viewport === 'SAFEHOUSE_ALTAR' && <SafehouseViewport />}
        {viewport === 'HORSEMEN' && <HorsemenViewport />}
        {viewport === 'DOSSIER' && <DossierViewport />}
        {viewport === 'MANUAL' && <ManualViewport fontScale={fontScale} />}

        <ActiveRituals />
        <ToastStack />
      </div>
    </SessionContext.Provider>
  );
}
