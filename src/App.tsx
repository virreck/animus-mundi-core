// src/App.tsx
import { useState } from 'react';
import { useEngine } from './ui/hooks/useEngine';
import { allYokai } from './content/yokai/index';
import { allGoetia } from './content/goetia/index';
import { caterhamChurchyard } from './content/narrative/caterham_churchyard';
import type { GameAction } from './engine/reducer';
import type { GameState } from './engine/state';

interface NarrativeChoice {
  id: string;
  label: string;
  condition?: (state: GameState) => boolean;
  actions: GameAction[];
}

const theme = {
  bgDark: '#0a0908',
  bgWood: '#1a1614',
  bgParchment: '#d4c7b0',
  borderBronze: '#5c4b37',
  textParchment: '#eaddc3', 
  textInk: '#2b2621',
  accentRed: '#7a1919',
  fontSerif: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  fontSans: '"Trebuchet MS", "Lucida Grande", sans-serif',
};

export default function App() {
  const { state, dispatch, draftContract, advanceTime, resetGame, identifyGoetia, sealGoetia } = useEngine();
  const [currentTab, setCurrentTab] = useState<'MAP' | 'GRIMOIRE' | 'YOROKU' | 'JOURNAL' | 'INVENTORY'>('MAP');
  const [selectedGoetiaId, setSelectedGoetiaId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' = 'ALERT') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const formatNode = (nodeId: string) => nodeId.replace(/_/g, ' ').toUpperCase();
  const availableChoices = caterhamChurchyard.choices as unknown as NarrativeChoice[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bgDark, color: theme.textParchment, fontFamily: theme.fontSerif }}>
      
      {/* --- TOP BAR --- */}
      <div style={{ padding: '10px 20px', backgroundColor: theme.bgWood, borderBottom: `2px solid ${theme.borderBronze}`, fontSize: '0.9rem', fontFamily: theme.fontSans, letterSpacing: '1px' }}>
        <span>LOCATION: <strong>{formatNode(state.currentNode)}</strong></span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR --- */}
        <div style={{ width: '220px', backgroundColor: theme.bgWood, borderRight: `2px solid ${theme.borderBronze}`, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: `1px solid ${theme.borderBronze}`, paddingBottom: '20px', marginBottom: '20px' }}>
            <NavBtn active={currentTab === 'YOROKU'} onClick={() => setCurrentTab('YOROKU')}>YŌROKU</NavBtn>
            <NavBtn active={currentTab === 'GRIMOIRE'} onClick={() => setCurrentTab('GRIMOIRE')}>GRIMOIRE</NavBtn>
            <NavBtn active={currentTab === 'MAP'} onClick={() => setCurrentTab('MAP')}>MAP</NavBtn>
            <NavBtn active={currentTab === 'INVENTORY'} onClick={() => setCurrentTab('INVENTORY')}>INVENTORY</NavBtn>
            <NavBtn active={currentTab === 'JOURNAL'} onClick={() => setCurrentTab('JOURNAL')}>FIELD NOTES</NavBtn>
          </div>

          <div style={{ flexGrow: 1 }}></div>

          <div style={{ textAlign: 'center', marginBottom: '30px', borderTop: `1px solid ${theme.borderBronze}`, paddingTop: '15px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>OBOLS</span>
            <div style={{ fontSize: '1.5rem', color: '#ffb347' }}>{state.inventory["obols"] || 0}</div>
          </div>

          <button onClick={() => { advanceTime(5); addToast('Time advances.', 'ALERT'); }} style={{ padding: '10px', backgroundColor: theme.bgDark, color: theme.textParchment, border: `1px solid ${theme.borderBronze}`, cursor: 'pointer', fontFamily: theme.fontSans, marginBottom: '10px' }}>
            ⏳ WAIT (+5 CHAOS)
          </button>
          <button onClick={resetGame} style={{ padding: '10px', backgroundColor: '#3a0c0c', color: theme.textParchment, border: 'none', cursor: 'pointer', fontFamily: theme.fontSans }}>
            RESET SIMULATION
          </button>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div style={{ flexGrow: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: theme.bgParchment, color: theme.textInk, display: 'flex', minHeight: '600px', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.8)', borderRadius: '5px' }}>
            
            {/* --- LEFT PAGE --- */}
            <div style={{ flex: 1, padding: '40px', borderRight: '2px solid rgba(0,0,0,0.2)', boxShadow: 'inset -15px 0 15px -15px rgba(0,0,0,0.3)' }}>
              
              {currentTab === 'MAP' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>{caterhamChurchyard.title}</h2>
                  <p style={{ lineHeight: '1.8', fontSize: '1.05rem', marginTop: '20px' }}>{caterhamChurchyard.text}</p>
                </>
              )}

              {currentTab === 'GRIMOIRE' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>ARS GOETIA INDEX</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {allGoetia.map(goetia => {
                      const hasAllIntel = goetia.requiredIntel.every(tag => state.intelLog.includes(tag));
                      const isIdentified = state.identifiedGoetia.includes(goetia.id);
                      const isSealed = state.sealedGoetia.includes(goetia.id);

                      let label = `UNKNOWN (#${goetia.id.split('_')[0]})`;
                      if (isSealed) label = `封 ${goetia.name} (SEALED)`;
                      else if (isIdentified) label = goetia.name;
                      else if (hasAllIntel) label = `[!] TARGET REVEALED`;

                      return (
                        <button key={goetia.id} onClick={() => setSelectedGoetiaId(goetia.id)}
                          style={{ padding: '12px', border: `1px solid ${selectedGoetiaId === goetia.id ? theme.accentRed : theme.borderBronze}`, textAlign: 'left', cursor: 'pointer', fontFamily: theme.fontSerif }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {currentTab === 'YOROKU' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>AVAILABLE CONTRACTS</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    {allYokai.map(yokai => (
                      <div key={yokai.id} style={{ border: `1px solid ${theme.borderBronze}`, padding: '15px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: 0 }}>{yokai.nameEn}</h3>
                        <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>{yokai.gameUtility}</p>
                        <button onClick={() => { 
                          draftContract(yokai.id, yokai.draftCost);
                          addToast(`Bound contract: ${yokai.nameEn}`, 'ALERT');
                        }} 
                          style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: theme.bgDark, color: 'white', cursor: 'pointer' }}>
                          BIND ({yokai.draftCost} OBOLS)
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* --- RIGHT PAGE --- */}
            <div style={{ flex: 1, padding: '40px', boxShadow: 'inset 15px 0 15px -15px rgba(0,0,0,0.3)' }}>
              
              {currentTab === 'MAP' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>AVAILABLE ACTIONS</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    {availableChoices
                      .filter((choice: NarrativeChoice) => !choice.condition || choice.condition(state))
                      .map((choice: NarrativeChoice) => (
                        <button key={choice.id} onClick={() => {
                            choice.actions.forEach((action: GameAction) => {
                              dispatch(action);
                              if (action.type === 'GATHER_INTEL') addToast(`Log updated: ${formatNode(action.payload)}`, 'INTEL');
                            });
                          }}
                          style={{ padding: '15px', backgroundColor: theme.bgWood, color: theme.textParchment, border: `1px solid ${theme.borderBronze}`, cursor: 'pointer', fontFamily: theme.fontSerif, textAlign: 'left' }}>
                          <span style={{ color: theme.accentRed, marginRight: '10px' }}>&gt;</span> {choice.label}
                        </button>
                    ))}
                  </div>
                </>
              )}

              {currentTab === 'GRIMOIRE' && selectedGoetiaId && (() => {
                const target = allGoetia.find(g => g.id === selectedGoetiaId)!;
                const hasAllIntel = target.requiredIntel.every(tag => state.intelLog.includes(tag));
                const isIdentified = state.identifiedGoetia.includes(target.id);
                const isSealed = state.sealedGoetia.includes(target.id);
                
                return (
                  <div>
                    <h2 style={{ borderBottom: `2px solid ${theme.accentRed}` }}>{isIdentified ? target.name.toUpperCase() : "TARGET OBSCURED"}</h2>
                    {!isIdentified && hasAllIntel && (
                      <button onClick={() => { identifyGoetia(target.id); addToast(`Identified: ${target.name}`, 'ALERT'); }}
                        style={{ padding: '15px', backgroundColor: '#3a0c0c', color: 'white', cursor: 'pointer', width: '100%' }}>
                        IDENTIFY ENTITY
                      </button>
                    )}
                    {isIdentified && !isSealed && (
                      <button onClick={() => sealGoetia(target.id)} style={{ marginTop: '20px', padding: '10px', width: '100%', cursor: 'pointer' }}>
                        EXECUTE BANISHMENT RITUAL
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      
      {/* --- TOAST RENDERER (Uses 'toasts' variable) --- */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ backgroundColor: theme.bgDark, color: theme.textParchment, border: `1px solid ${theme.borderBronze}`, padding: '15px 20px' }}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ 
        padding: '12px 15px', textAlign: 'left', backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent', 
        color: active ? '#d4c7b0' : '#8c7b61', border: 'none', borderLeft: active ? '4px solid #a30000' : '4px solid transparent',
        cursor: 'pointer', fontFamily: '"Trebuchet MS", sans-serif', letterSpacing: '2px', fontSize: '0.9rem'
      }}>
      {children}
    </button>
  );
}