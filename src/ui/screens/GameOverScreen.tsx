// src/ui/screens/GameOverScreen.tsx
// Run ended: Humanity lost or reality unravelled.
import { ThaumaturgicAudio } from '../audio';
import { useSession } from '../session/SessionContext';
import { theme } from '../theme';

export function GameOverScreen() {
  const {
    state,
    lostSectorsCount,
    securedSectorsCount,
    handleFullReset,
    totalGlobalEntropy
  } = useSession();

  const tetherSevered = state.humanity <= 0;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#050000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', fontFamily: theme.fontMono }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '28px', border: `2px solid ${theme.accentRed}`, backgroundColor: '#0f0202', textAlign: 'center', color: '#ffb3b3', boxShadow: '0 0 50px rgba(255, 42, 85, 0.25)' }}>
        <h1 style={{ color: theme.accentRed, letterSpacing: '5px', fontSize: '1.6rem', margin: '0 0 12px 0' }}>
          {tetherSevered ? 'TETHER SEVERED' : 'REALITY UNRAVELLED'}
        </h1>
        <p style={{ fontSize: '0.84rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          {tetherSevered
            ? `Operative ${state.playerName.toUpperCase() || 'UNKNOWN'} lost the last of their Humanity. The remote link has gone dark.`
            : `Global Entropy reached ${totalGlobalEntropy.toFixed(2)}%. The mundane world has frayed beyond repair.`}
        </p>
        <div style={{ fontSize: '0.78rem', color: '#a8ccaf', lineHeight: '1.7', marginBottom: '18px' }}>
          GOETIA SEALED: <strong>{state.sealedGoetia.length}/72</strong><br/>
          SECTORS SECURED: <strong>{securedSectorsCount}</strong><br/>
          SECTORS LOST: <strong>{lostSectorsCount}</strong> ({(state.releasedGoetia || []).length} demons manifested)<br/>
          HORSEMEN BANISHED: <strong>{(['conquest', 'war', 'famine', 'death'] as const).filter(h => state.flags[`banished_${h}`]).length}/4</strong>
        </div>
        <button
          onClick={() => { ThaumaturgicAudio.keyClick(); handleFullReset(); }}
          style={{ width: '100%', padding: '12px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: theme.fontMono, letterSpacing: '2px' }}
        >
          &gt; PURGE TETHER &amp; START A NEW OPERATIVE
        </button>
      </div>
    </div>
  );
}
