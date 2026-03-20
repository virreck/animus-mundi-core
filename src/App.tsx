// src/App.tsx
import { useState } from 'react';
import { useEngine } from './ui/hooks/useEngine';
import { katashiro } from './content/yokai/shikigami';
import { murmur } from './content/goetia/murmur';
import { caterhamChurchyard } from './content/narrative/caterham_churchyard';

const ALL_GOETIA = [murmur];

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
  const { state, dispatch, draftContract, advanceTime, resetGame, identifyGoetia, sealGoetia } = useEngine(); // Added identifyGoetia here
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
            <div style={{ flex: 1, padding: '40px', borderRight: '2px solid rgba(0,0,0,0.2)', boxShadow: 'inset -15px 0 15px -15px rgba(0,0,0,0.3)' }}>
              
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
                    {ALL_GOETIA.map(goetia => {
                      const hasAllIntel = goetia.requiredIntel.every(tag => state.intelLog.includes(tag));
                      const isIdentified = state.identifiedGoetia.includes(goetia.id);
                      const isSealed = state.sealedGoetia.includes(goetia.id);

                      // Visual cue if ready to identify
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
                  </div>
                </>
              )}

              {currentTab === 'YOROKU' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>AVAILABLE CONTRACTS</h2>
                  <div style={{ border: `1px solid ${theme.borderBronze}`, padding: '15px', marginTop: '20px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{katashiro.name}</h3>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>{katashiro.utility}</p>
                    <p style={{ fontFamily: theme.fontSans, fontWeight: 'bold' }}>COST: {katashiro.cost} OBOLS</p>
                    <button 
                      onClick={() => {
                        draftContract(katashiro.id, katashiro.cost);
                        if ((state.inventory["obols"] || 0) >= katashiro.cost) addToast(`Bound contract: ${katashiro.name}`, 'ALERT');
                      }} 
                      style={{ padding: '8px 15px', backgroundColor: theme.bgDark, color: theme.textParchment, border: 'none', cursor: 'pointer', fontFamily: theme.fontSerif, borderBottom: `2px solid ${theme.accentRed}` }}
                    >
                      BIND THE YOKAI
                    </button>
                  </div>
                </>
              )}

              {currentTab === 'INVENTORY' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>FORENSIC & RITUAL KIT</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                    {Object.entries(state.inventory)
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
            <div style={{ flex: 1, padding: '40px', boxShadow: 'inset 15px 0 15px -15px rgba(0,0,0,0.3)' }}>
              
              {currentTab === 'MAP' && (
                <>
                   <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>AVAILABLE ACTIONS</h2>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                     {caterhamChurchyard.choices
                       .filter(choice => !choice.condition || choice.condition(state))
                       .map(choice => (
                         <button 
                           key={choice.id}
                           onClick={() => {
                             choice.actions.forEach(action => {
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
                     const target = ALL_GOETIA.find(g => g.id === selectedGoetiaId)!;
                     const hasAllIntel = target.requiredIntel.every(tag => state.intelLog.includes(tag));
                     const isIdentified = state.identifiedGoetia.includes(target.id);
                     const isSealed = state.sealedGoetia.includes(target.id);
                     const canAffordSeal = Object.entries(target.sealCost).every(([item, amount]) => (state.inventory[item] || 0) >= amount);

                     return (
                       <div>
                         <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>
                           {isIdentified ? target.name.toUpperCase() : "TARGET OBSCURED"}
                         </h2>

                         {/* Only show the lore once they've manually identified it */}
                         {isIdentified ? (
                           <>
                             <p style={{ fontStyle: 'italic', color: theme.accentRed, fontWeight: 'bold' }}>{target.title}</p>
                             <p style={{ lineHeight: '1.6' }}>{target.description}</p>
                           </>
                         ) : (
                           <p style={{ lineHeight: '1.6', color: '#666', fontStyle: 'italic' }}>Identity hidden. Compile required intel to reveal the lieutenant's true nature.</p>
                         )}

                         <div style={{ marginTop: '30px', padding: '15px', border: `1px dashed ${theme.borderBronze}` }}>
                           <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>REQUIRED INTEL</h3>
                           <ul style={{ listStyleType: 'none', padding: 0 }}>
                             {target.requiredIntel.map(tag => {
                               const found = state.intelLog.includes(tag);
                               return (
                                 <li key={tag} style={{ color: found ? '#4a7c59' : '#888', marginBottom: '8px', fontFamily: theme.fontSans, fontSize: '0.9rem' }}>
                                   {found ? `✓ CONFIRMED: ${formatNode(tag)}` : `[ MISSING DATA COMPONENT ]`}
                                 </li>
                               );
                             })}
                           </ul>
                         </div>

                         {/* The Big Identify Button */}
                         {hasAllIntel && !isIdentified && (
                           <div style={{ marginTop: '40px', textAlign: 'center' }}>
                             <p style={{ color: theme.accentRed, fontStyle: 'italic', marginBottom: '15px' }}>Data sufficient. A pattern emerges...</p>
                             <button 
                               onClick={() => {
                                 identifyGoetia(target.id);
                                 addToast(`Target Identity Confirmed: ${target.name}`, 'ALERT');
                               }}
                               style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#3a0c0c', color: 'white', border: `2px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontSerif, letterSpacing: '2px', boxShadow: '0 4px 15px rgba(122, 25, 25, 0.4)' }}
                             >
                               IDENTIFY ENTITY
                             </button>
                           </div>
                         )}

                         {/* The Sealing Ritual Interface (Only appears after identification) */}
                         {isIdentified && !isSealed && (
                           <div style={{ marginTop: '30px', backgroundColor: theme.bgWood, padding: '20px', color: theme.textParchment, border: `1px solid ${theme.accentRed}` }}>
                             <h3 style={{ marginTop: 0, color: theme.accentRed }}>INITIATE BANISHMENT</h3>
                             <p style={{ fontSize: '0.85rem', fontFamily: theme.fontSans, marginBottom: '15px' }}>Required Catalysts:</p>
                             <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.85rem', fontFamily: theme.fontSans }}>
                               {Object.entries(target.sealCost).map(([item, amount]) => (
                                 <li key={item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                   <span>{formatNode(item)} x{amount}</span>
                                   <span style={{ color: (state.inventory[item] || 0) >= amount ? '#4a7c59' : theme.accentRed }}>
                                     (Have: {state.inventory[item] || 0})
                                   </span>
                                 </li>
                               ))}
                             </ul>
                             
                             <button 
                               onClick={() => {
                                 Object.entries(target.sealCost).forEach(([item, amount]) => {
                                   dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } });
                                 });
                                 sealGoetia(target.id);
                                 addToast(`${target.name} has been banished.`, 'ALERT');
                               }}
                               disabled={!canAffordSeal}
                               style={{ padding: '10px', width: '100%', marginTop: '15px', backgroundColor: canAffordSeal ? '#3a0c0c' : '#222', color: canAffordSeal ? 'white' : '#555', border: 'none', cursor: canAffordSeal ? 'pointer' : 'not-allowed', fontFamily: theme.fontSerif }}
                             >
                               {canAffordSeal ? "EXECUTE RITUAL" : "INSUFFICIENT MATERIALS"}
                             </button>
                           </div>
                         )}

                         {isSealed && (
                           <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', color: theme.accentRed, border: `2px solid ${theme.accentRed}`, fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '4px' }}>
                             SEALED
                           </div>
                         )}
                       </div>
                     );
                   })() : (
                     <p style={{ fontStyle: 'italic', color: '#666', textAlign: 'center', marginTop: '100px' }}>Select a target from the index to view deduction parameters.</p>
                   )}
                </>
              )}

              {currentTab === 'YOROKU' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>ACTIVE TETHER</h2>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '20px' }}>Current spirits bound to your will. Use them wisely.</p>
                  {state.activeContracts.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>No contracts currently active.</p>
                  ) : (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      {state.activeContracts.map((id, i) => (
                        <li key={i} style={{ borderBottom: '1px dotted #a30000', padding: '10px 0', fontFamily: theme.fontSans, fontWeight: 'bold' }}>
                          封 {formatNode(id)}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {currentTab === 'INVENTORY' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>ITEM ANALYSIS</h2>
                  <p style={{ fontStyle: 'italic', color: '#666' }}>Select an item from the left page to view its esoteric properties and crafting applications...</p>
                </>
              )}

              {currentTab === 'JOURNAL' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>FIELD NOTES</h2>
                  <p style={{ fontStyle: 'italic', color: '#666' }}>Log entries will populate here as the investigation progresses...</p>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
      
      {/* --- TOAST RENDERER --- */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            style={{ 
              backgroundColor: theme.bgDark, color: theme.textParchment, 
              border: `1px solid ${theme.borderBronze}`, 
              borderLeft: `4px solid ${toast.type === 'INTEL' ? '#4a7c59' : toast.type === 'ITEM' ? '#b8860b' : theme.accentRed}`,
              padding: '15px 20px', fontFamily: theme.fontSans, fontSize: '0.9rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.8)', maxWidth: '300px'
            }}
          >
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: theme.borderBronze, fontSize: '0.7rem', letterSpacing: '1px' }}>
              {toast.type === 'INTEL' ? 'NEW INTEL GATHERED' : toast.type === 'ITEM' ? 'INVENTORY UPDATED' : 'SYSTEM ALERT'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        padding: '12px 15px', textAlign: 'left', backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent', 
        color: active ? '#d4c7b0' : '#8c7b61', border: 'none', borderLeft: active ? `4px solid #a30000` : '4px solid transparent',
        cursor: 'pointer', fontFamily: '"Trebuchet MS", sans-serif', letterSpacing: '2px', fontSize: '0.9rem', transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
}