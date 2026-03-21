// src/App.tsx
import { useState } from 'react';
import { useEngine } from './ui/hooks/useEngine';
import { caterhamChurchyard } from './content/narrative/caterham_churchyard';
import { allGoetia } from './content/goetia';
import { allYokai } from './content/yokai';
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
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>SECTOR ENTROPY</span>
            <div style={{ height: '10px', backgroundColor: '#000', border: `1px solid ${theme.borderBronze}`, marginTop: '5px', position: 'relative' }}>
              <div style={{ width: `${state.globalChaos}%`, height: '100%', backgroundColor: theme.accentRed, transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>{state.globalChaos}%</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>HUMANITY</span>
            <div style={{ fontSize: '1.5rem', color: state.humanity < 50 ? theme.accentRed : theme.textParchment }}>{state.humanity} / 100</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px', borderTop: `1px solid ${theme.borderBronze}`, paddingTop: '15px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>OBOLS (WEALTH)</span>
            <div style={{ fontSize: '1.5rem', color: '#ffb347' }}>{state.inventory["obols"] || 0}</div>
          </div>

          <button onClick={() => { advanceTime(5); addToast('Time advances. Entropy increases by 5%.', 'ALERT'); }} style={{ padding: '10px', backgroundColor: theme.bgDark, color: theme.textParchment, border: `1px solid ${theme.borderBronze}`, cursor: 'pointer', fontFamily: theme.fontSans, marginBottom: '10px' }}>
            ⏳ WAIT (+5 CHAOS)
          </button>
          <button onClick={resetGame} style={{ padding: '10px', backgroundColor: '#3a0c0c', color: theme.textParchment, border: 'none', cursor: 'pointer', fontFamily: theme.fontSans }}>
            RESET SIMULATION
          </button>
        </div>

        {/* --- MAIN CONTENT: THE OPEN TOME --- */}
        <div style={{ flexGrow: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: theme.bgParchment, color: theme.textInk, display: 'flex', minHeight: '600px', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.8)', borderRadius: '5px' }}>
            
            {/* --- LEFT PAGE --- */}
            <div style={{ flex: 1, padding: '40px', borderRight: '2px solid rgba(0,0,0,0.2)', boxShadow: 'inset -15px 0 15px -15px rgba(0,0,0,0.3)', overflowY: 'auto', maxHeight: '75vh' }}>
              
              {currentTab === 'MAP' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {caterhamChurchyard.title}
                  </h2>
                  <p style={{ lineHeight: '1.8', fontSize: '1.05rem', marginTop: '20px' }}>
                    {caterhamChurchyard.text}
                  </p>
                </>
              )}

              {currentTab === 'GRIMOIRE' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>ARS GOETIA INDEX</h2>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555', marginBottom: '20px' }}>Cross-reference field intel to identify the commanding lieutenants.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {allGoetia
                      // --- THE LOGIC FOG LAYER ---
                      .filter(goetia => {
                        // 1. Do we have at least ONE piece of required intel?
                        const hasAnyIntel = goetia.requiredIntel && goetia.requiredIntel.length > 0 && 
                                            goetia.requiredIntel.some((tag: string) => state.intelLog.includes(tag));
                        
                        // 2. Is it already identified or sealed?
                        const isIdentified = state.identifiedGoetia.includes(goetia.id);
                        const isSealed = state.sealedGoetia.includes(goetia.id);
                        
                        // Only let them pass the fog if one of these is true
                        return hasAnyIntel || isIdentified || isSealed;
                      })
                      .map(goetia => {
                      const hasAllIntel = goetia.requiredIntel && goetia.requiredIntel.length > 0 && goetia.requiredIntel.every((tag: string) => state.intelLog.includes(tag));
                      const isIdentified = state.identifiedGoetia.includes(goetia.id);
                      const isSealed = state.sealedGoetia.includes(goetia.id);

                      let indexLabel = `UNKNOWN ENTITY (#${goetia.id.substring(0,4).toUpperCase()})`;
                      if (isSealed) indexLabel = `封 ${goetia.name} (SEALED)`;
                      else if (isIdentified) indexLabel = goetia.name;
                      else if (hasAllIntel) indexLabel = `[!] TARGET DATA ACQUIRED`;

                      return (
                        <button 
                          key={goetia.id}
                          onClick={() => setSelectedGoetiaId(goetia.id)}
                          style={{
                            padding: '12px',
                            backgroundColor: selectedGoetiaId === goetia.id ? 'rgba(122, 25, 25, 0.1)' : 'transparent',
                            color: hasAllIntel && !isIdentified ? theme.accentRed : theme.textInk,
                            border: `1px solid ${selectedGoetiaId === goetia.id ? theme.accentRed : theme.borderBronze}`,
                            textAlign: 'left', cursor: 'pointer', fontFamily: theme.fontSerif, fontWeight: 'bold'
                          }}
                        >
                          {indexLabel}
                        </button>
                      );
                    })}

                    {/* Hint if the fog is hiding everything */}
                    {allGoetia.filter(g => g.requiredIntel?.some(tag => state.intelLog.includes(tag)) || state.identifiedGoetia.includes(g.id)).length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', border: `1px dashed ${theme.borderBronze}`, color: '#666', fontStyle: 'italic' }}>
                            The index remains blank. Gather field intel to detect Goetic signatures.
                        </div>
                    )}
                  </div>
                </>
              )}

              {currentTab === 'YOROKU' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>AVAILABLE CONTRACTS</h2>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555' }}>Forge pacts through mutual exchange to bind spirits to your Tether.</p>
                  
                  {allYokai.filter(y => y.utilityClass === 'Shikigami').map(yokai => {
                    const cost = yokai.draftCost;
                    
                    // Validation Check
                    const canAfford = (
                      (!cost.obols || (state.inventory["obols"] || 0) >= cost.obols) &&
                      (!cost.humanity || state.humanity >= cost.humanity) &&
                      (!cost.ink || state.ink >= cost.ink) &&
                      (!cost.tributeItemId || (state.inventory[cost.tributeItemId] || 0) >= 1)
                    );

                    // Dynamic String Builder for Display
                    const costStrings = [];
                    if (cost.obols) costStrings.push(`${cost.obols} Obols`);
                    if (cost.humanity) costStrings.push(`${cost.humanity} Humanity`);
                    if (cost.ink) costStrings.push(`${cost.ink} Ink`);
                    if (cost.tributeItemId) costStrings.push(`1x ${formatNode(cost.tributeItemId)}`);
                    const costDisplay = costStrings.join(' + ') || 'Free';

                    return (
                      <div key={yokai.id} style={{ border: `1px solid ${theme.borderBronze}`, padding: '15px', marginTop: '20px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>{yokai.nameEn}</h3>
                        <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>{yokai.gameUtility}</p>
                        <p style={{ fontFamily: theme.fontSans, fontWeight: 'bold' }}>PACT REQUIREMENT: <span style={{ color: theme.accentRed }}>{costDisplay}</span></p>
                        
                        <button 
                          onClick={() => {
                            if (canAfford) {
                              draftContract(yokai.id, yokai.draftCost);
                              addToast(`Forged pact: ${yokai.nameEn}`, 'ALERT');
                            }
                          }} 
                          disabled={!canAfford}
                          style={{ 
                            padding: '8px 15px', marginTop: '10px', width: '100%',
                            backgroundColor: canAfford ? theme.bgDark : '#222', 
                            color: canAfford ? theme.textParchment : '#555', 
                            border: 'none', borderBottom: canAfford ? `2px solid ${theme.accentRed}` : 'none',
                            cursor: canAfford ? 'pointer' : 'not-allowed', 
                            fontFamily: theme.fontSerif 
                          }}
                        >
                          {canAfford ? 'BIND THE YOKAI' : 'UNMET DEMANDS'}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {currentTab === 'INVENTORY' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>FORENSIC & RITUAL KIT</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                    {(Object.entries(state.inventory) as [string, number][])
                      .filter(([key]) => key !== 'obols')
                      .map(([key, amount]) => (
                        <div key={key} style={{ border: `1px solid ${theme.borderBronze}`, padding: '15px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏺</div>
                          <div style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, fontWeight: 'bold' }}>{formatNode(key)}</div>
                          <div style={{ marginTop: '5px', color: theme.accentRed, fontWeight: 'bold' }}>x {amount}</div>
                        </div>
                    ))}
                  </div>
                </>
              )}

              {currentTab === 'JOURNAL' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>ACTIVE LEADS</h2>
                  {state.activeLeads.length === 0 ? <p>No current leads.</p> : (
                    <ul style={{ listStyleType: 'square', paddingLeft: '20px', lineHeight: '1.8' }}>
                      {state.activeLeads.map(lead => (
                        <li key={lead.id} style={{ marginBottom: '15px', color: lead.resolved ? '#666' : theme.textInk, textDecoration: lead.resolved ? 'line-through' : 'none' }}>
                          <strong>&gt;</strong> {lead.text.toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* --- RIGHT PAGE --- */}
            <div style={{ flex: 1, padding: '40px', boxShadow: 'inset 15px 0 15px -15px rgba(0,0,0,0.3)', overflowY: 'auto', maxHeight: '75vh' }}>
              
              {currentTab === 'MAP' && (
                <>
                   <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>AVAILABLE ACTIONS</h2>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                     {availableChoices
                       .filter((choice: NarrativeChoice) => !choice.condition || choice.condition(state))
                       .map((choice: NarrativeChoice) => (
                         <button 
                           key={choice.id}
                           onClick={() => {
                             choice.actions.forEach((action: GameAction) => {
                               dispatch(action);
                               if (action.type === 'GATHER_INTEL') {
                                 addToast(`Log updated: ${formatNode(action.payload)}`, 'INTEL');
                               } else if (action.type === 'MODIFY_INVENTORY') {
                                 const amountStr = action.payload.amount > 0 ? `+${action.payload.amount}` : `${action.payload.amount}`;
                                 addToast(`Received ${amountStr} ${formatNode(action.payload.itemId)}`, 'ITEM');
                               } else if (action.type === 'ADD_LEAD') {
                                 addToast(`New Active Lead Added.`, 'ALERT');
                               } else if (action.type === 'ADVANCE_TIME') {
                                 addToast(`Time advances. Entropy increases by ${action.payload}%.`, 'ALERT');
                               }
                             });
                           }}
                           style={{ padding: '15px', backgroundColor: theme.bgWood, color: theme.textParchment, border: `1px solid ${theme.borderBronze}`, cursor: 'pointer', fontFamily: theme.fontSerif, textAlign: 'left', fontSize: '1rem', transition: 'background-color 0.2s' }}
                           onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2421'}
                           onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.bgWood}
                         >
                           <span style={{ color: theme.accentRed, marginRight: '10px' }}>&gt;</span> {choice.label}
                         </button>
                     ))}
                   </div>
                </>
              )}

              {currentTab === 'GRIMOIRE' && (
                <>
                   {selectedGoetiaId ? (() => {
                     const target = allGoetia.find(g => g.id === selectedGoetiaId)!;
                     const hasAllIntel = target.requiredIntel && target.requiredIntel.length > 0 && target.requiredIntel.every((tag: string) => state.intelLog.includes(tag));
                     const isIdentified = state.identifiedGoetia.includes(target.id);
                     const isSealed = state.sealedGoetia.includes(target.id);
                     const sealCost = target.sealCost || {};
                     const canAffordSeal = Object.keys(sealCost).length > 0 && (Object.entries(sealCost) as [string, number][]).every(([item, amount]) => (state.inventory[item] || 0) >= amount);

                     return (
                       <div>
                         <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>
                           {isIdentified ? target.name.toUpperCase() : "TARGET OBSCURED"}
                         </h2>

                         {isIdentified ? (
                           <>
                             <p style={{ fontStyle: 'italic', color: theme.accentRed, fontWeight: 'bold' }}>{target.title || "Classification Pending"}</p>
                             <p style={{ lineHeight: '1.6' }}>{target.description || "No archival data available for this entity yet."}</p>
                           </>
                         ) : (
                           <p style={{ lineHeight: '1.6', color: '#666', fontStyle: 'italic' }}>Identity hidden. Compile required intel to reveal the lieutenant's true nature.</p>
                         )}

                         <div style={{ marginTop: '30px', padding: '15px', border: `1px dashed ${theme.borderBronze}` }}>
                           <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>REQUIRED INTEL</h3>
                           <ul style={{ listStyleType: