// src/ui/screens/VictoryScreen.tsx
// All four Horsemen banished: debrief and service rating.
import { ThaumaturgicAudio } from '../audio';
import { HorsemanSigilSvg } from '../components/HorsemanSigilSvg';
import { useSession } from '../session/SessionContext';
import { theme } from '../theme';
import { TOTAL_GOETIA } from '../../engine/state';

export function VictoryScreen() {
  const {
    state,
    lostSectorsCount,
    securedSectorsCount,
    handleFullReset,
    totalGlobalEntropy
  } = useSession();

  const manifested = (state.releasedGoetia || []).length;
  const lesserKey = state.sealedGoetia.length >= TOTAL_GOETIA;
  const campaign = state.campaign;
  const rating =
    lesserKey ? { title: 'KEEPER OF THE LESSER KEY', note: 'All seventy-two in the Vessel before the Four fell. It has not been done since Solomon.' }
    : lostSectorsCount === 0 && totalGlobalEntropy < 25 ? { title: 'ARCHON OF THE BRASS VESSEL', note: 'A flawless working. Solomon himself would have taken notes.' }
    : lostSectorsCount <= 2 && totalGlobalEntropy < 50 ? { title: 'MAGISTER TEMPLI', note: 'The city will never know how close it came.' }
    : totalGlobalEntropy < 75 ? { title: 'ADEPTUS MINOR', note: 'Reality held. Mostly. The seams will show for a generation.' }
    : { title: 'PYRRHIC SURVIVOR', note: 'You won, and London will be paying for it for the rest of the century.' };
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#020403', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', fontFamily: theme.fontMono, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '560px', padding: '28px', border: `2px solid ${theme.textBright}`, backgroundColor: theme.bgPanel, textAlign: 'center', color: '#a8ccaf', boxShadow: '0 0 60px rgba(98, 240, 128, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
          {(['CONQUEST', 'WAR', 'FAMINE', 'DEATH'] as const).map(h => (
            <HorsemanSigilSvg key={h} horseman={h} color={theme.textBright} size={44} />
          ))}
        </div>
        <h1 style={{ color: theme.textBright, letterSpacing: '5px', fontSize: '1.5rem', margin: '0 0 6px 0' }}>{lesserKey ? 'THE LESSER KEY IS CLOSED' : 'THE FOUR ARE BANISHED'}</h1>
        <div style={{ color: theme.accentAmber, fontSize: '0.78rem', letterSpacing: '2px', marginBottom: '16px' }}>OPERATION CLOSED // {state.agencyName.toUpperCase() || 'DARKWIRE'}</div>
        <p style={{ fontSize: '0.84rem', lineHeight: '1.65', margin: '0 0 14px 0', color: '#ffffff' }}>
          Conquest, War, Famine and Death have been severed from the mundane world. The ley-lines under London go quiet for the first time in a decade.
          {lesserKey
            ? ' Every one of the seventy-two is bound in the Brass Vessel. There was no one left to answer them when they called.'
            : manifested > 0
            ? ` But ${manifested} spirit${manifested === 1 ? '' : 's'} you failed to bind still walk${manifested === 1 ? 's' : ''} the city, unanswerable to any Horseman now — and unanswerable to you.`
            : ' Every spirit you hunted is accounted for in the Brass Vessel.'}
        </p>
        <div style={{ fontSize: '0.78rem', lineHeight: '1.8', marginBottom: '16px', padding: '10px', border: `1px dashed ${theme.borderTerminal}`, backgroundColor: '#030504', textAlign: 'left' }}>
          OPERATIVE: <strong style={{ color: theme.textBright }}>{state.playerName.toUpperCase() || 'UNKNOWN'}</strong><br/>
          GOETIA SEALED: <strong style={{ color: theme.textBright }}>{state.sealedGoetia.length}/72</strong><br/>
          CASES CLOSED: <strong style={{ color: theme.textBright }}>{campaign?.casesClosed || securedSectorsCount}</strong> · NEW SITES: <strong style={{ color: theme.textBright }}>{campaign?.sites.length || 0}</strong> · RE-INFESTATIONS: <strong style={{ color: theme.textBright }}>{Object.values(campaign?.cycles || {}).reduce((a, b) => a + b, 0)}</strong><br/>
          SECTORS SECURED / LOST: <strong style={{ color: theme.textBright }}>{securedSectorsCount}</strong> / <strong style={{ color: lostSectorsCount ? theme.accentRed : theme.textBright }}>{lostSectorsCount}</strong><br/>
          SPIRITS MANIFESTED: <strong style={{ color: manifested ? theme.accentRed : theme.textBright }}>{manifested}</strong><br/>
          FINAL GLOBAL ENTROPY: <strong style={{ color: theme.accentAmber }}>{totalGlobalEntropy.toFixed(2)}%</strong><br/>
          HUMANITY REMAINING: <strong style={{ color: theme.textBright }}>{state.humanity}%</strong>
        </div>
        <div style={{ fontSize: '0.7rem', color: theme.accentAmber, letterSpacing: '2px' }}>SERVICE RATING</div>
        <div style={{ fontSize: '1.15rem', color: theme.textBright, fontWeight: 'bold', letterSpacing: '3px', margin: '4px 0' }}>{rating.title}</div>
        <p style={{ fontSize: '0.78rem', margin: '0 0 18px 0' }}>{rating.note}</p>
        <button
          onClick={() => { ThaumaturgicAudio.keyClick(); handleFullReset(); }}
          style={{ width: '100%', padding: '12px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: theme.fontMono, letterSpacing: '2px' }}
        >
          &gt; ARCHIVE OPERATIVE &amp; BEGIN A NEW RUN
        </button>
      </div>
    </div>
  );
}
