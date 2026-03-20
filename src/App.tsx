// src/App.tsx
import { useState } from 'react';
import { useEngine } from './ui/hooks/useEngine';
import { katashiro } from './content/yokai/shikigami';

// --- CUSTOM STYLES ---
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
  const { state, draftContract, travelTo, advanceTime, resetGame } = useEngine();
  
  // Added 'INVENTORY' to the allowed tabs
  const [currentTab, setCurrentTab] = useState<'MAP' | 'GRIMOIRE' | 'YOROKU' | 'JOURNAL' | 'INVENTORY'>('INVENTORY');

  const formatNode = (nodeId: string) => nodeId.replace(/_/g, ' ').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bgDark, color: theme.textParchment, fontFamily: theme.fontSerif }}>
      
      {/* --- TOP BAR: FORENSIC STATUS --- */}
      <div style={{ padding: '10px 20px', backgroundColor: theme.bgWood, borderBottom: `2px solid ${theme.borderBronze}`, fontSize: '0.9rem', fontFamily: theme.fontSans, letterSpacing: '1px' }}>
        <span>LOCATION: <strong>{formatNode(state.currentNode)}</strong></span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR: NAVIGATION & VITALS --- */}
        <div style={{ width: '220px', backgroundColor: theme.bgWood, borderRight: `2px solid ${theme.borderBronze}`, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          
          {/* NAVIGATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: `1px solid ${theme.borderBronze}`, paddingBottom: '20px', marginBottom: '20px' }}>
            <NavBtn active={currentTab === 'YOROKU'} onClick={() => setCurrentTab('YOROKU')}>YŌROKU</NavBtn>
            <NavBtn active={currentTab === 'GRIMOIRE'} onClick={() => setCurrentTab('GRIMOIRE')}>GRIMOIRE</NavBtn>
            <NavBtn active={currentTab === 'MAP'} onClick={() => setCurrentTab('MAP')}>MAP</NavBtn>
            <NavBtn active={currentTab === 'INVENTORY'} onClick={() => setCurrentTab('INVENTORY')}>INVENTORY</NavBtn>
            <NavBtn active={currentTab === 'JOURNAL'} onClick={() => setCurrentTab('JOURNAL')}>FIELD NOTES</NavBtn>
          </div>

          <div style={{ flexGrow: 1 }}></div>
          
          {/* VITALS HUD */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>GLOBAL CHAOS</span>
            <div style={{ height: '10px', backgroundColor: '#000', border: `1px solid ${theme.borderBronze}`, marginTop: '5px', position: 'relative' }}>
              <div style={{ width: `${state.globalChaos}%`, height: '100%', backgroundColor: theme.accentRed, transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>{state.globalChaos}%</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>HUMANITY</span>
            <div style={{ fontSize: '1.5rem', color: state.humanity < 50 ? theme.accentRed : theme.textParchment }}>{state.humanity} / 100</div>
          </div>

          {/* NEW: PERMANENT OBOLS DISPLAY */}
          <div style={{ textAlign: 'center', marginBottom: '30px', borderTop: `1px solid ${theme.borderBronze}`, paddingTop: '15px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>OBOLS (WEALTH)</span>
            <div style={{ fontSize: '1.5rem', color: '#ffb347' }}>{state.inventory["obols"] || 0}</div>
          </div>

          {/* ENGINE CONTROLS */}
          <button onClick={() => advanceTime(0.5)} style={{ padding: '10px', backgroundColor: theme.bgDark, color: theme.textParchment, border: `1px solid ${theme.borderBronze}`, cursor: 'pointer', fontFamily: theme.fontSans, marginBottom: '10px' }}>
            ⏳ WAIT (+0.5 CHAOS)
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
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>LOCALITY MAP</h2>
                  <p>Current Sector: <strong>{formatNode(state.currentNode)}</strong></p>
                  <button onClick={() => travelTo('westminster_abbey')} style={{ padding: '10px', marginTop: '20px', cursor: 'pointer', fontFamily: theme.fontSerif, backgroundColor: theme.bgDark, color: theme.textParchment, border: 'none' }}>
                    Travel to Westminster Abbey
                  </button>
                </>
              )}

              {currentTab === 'GRIMOIRE' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>KNOWN GOETIA</h2>
                  {state.sealedGoetia.length === 0 ? <p style={{ fontStyle: 'italic', color: '#666' }}>No infernal lieutenants have been sealed yet.</p> : <ul>{state.sealedGoetia.map((g, i) => <li key={i}>{g}</li>)}</ul>}
                </>
              )}

              {currentTab === 'YOROKU' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>AVAILABLE CONTRACTS</h2>
                  <div style={{ border: `1px solid ${theme.borderBronze}`, padding: '15px', marginTop: '20px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{katashiro.name}</h3>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>{katashiro.utility}</p>
                    <p style={{ fontFamily: theme.fontSans, fontWeight: 'bold' }}>COST: {katashiro.cost} OBOLS</p>
                    <button onClick={() => draftContract(katashiro.id, katashiro.cost)} style={{ padding: '8px 15px', backgroundColor: theme.bgDark, color: theme.textParchment, border: 'none', cursor: 'pointer', fontFamily: theme.fontSerif, borderBottom: `2px solid ${theme.accentRed}` }}>
                      BIND THE YOKAI
                    </button>
                  </div>
                </>
              )}

              {/* NEW: INVENTORY TAB - LEFT PAGE (THE GRID) */}
              {currentTab === 'INVENTORY' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>FORENSIC & RITUAL KIT</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                    {/* We map through the inventory, but filter out 'obols' since it's on the sidebar now */}
                    {Object.entries(state.inventory)
                      .filter(([key]) => key !== 'obols')
                      .map(([key, amount]) => (
                        <div key={key} style={{ border: `1px solid ${theme.borderBronze}`, padding: '15px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏺</div> {/* Placeholder icon */}
                          <div style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, fontWeight: 'bold' }}>
                            {formatNode(key)}
                          </div>
                          <div style={{ marginTop: '5px', color: theme.accentRed, fontWeight: 'bold' }}>
                            x {amount}
                          </div>
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
                   <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>SECTOR INTEL</h2>
                   <p style={{ fontStyle: 'italic', color: '#666' }}>Awaiting localized sensor data...</p>
                </>
              )}

              {currentTab === 'GRIMOIRE' && (
                <>
                   <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>COMPILED INTEL LOGS</h2>
                   {state.intelLog.length === 0 ? <p style={{ fontStyle: 'italic', color: '#666' }}>No esoteric evidence gathered.</p> : <ul>{state.intelLog.map((intel, i) => <li key={i}>{intel}</li>)}</ul>}
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

              {/* NEW: INVENTORY TAB - RIGHT PAGE */}
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
    </div>
  );
}

// --- Helper Component ---
function NavBtn({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        padding: '12px 15px', 
        textAlign: 'left', 
        backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent', 
        color: active ? '#d4c7b0' : '#8c7b61', 
        border: 'none', 
        borderLeft: active ? `4px solid #a30000` : '4px solid transparent',
        cursor: 'pointer',
        fontFamily: '"Trebuchet MS", sans-serif',
        letterSpacing: '2px',
        fontSize: '0.9rem',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
}