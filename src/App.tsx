// src/App.tsx
import React, { useState, useEffect } from 'react';
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

// Blending traditional parchment/wood with digital phosphor terminals
const theme = {
  bgDark: '#0a0908',
  bgWood: '#1a1614',
  bgParchment: '#d4c7b0',
  borderBronze: '#5c4b37',
  textParchment: '#eaddc3', 
  textInk: '#2b2621',
  accentRed: '#7a1919',
  accentGreen: '#4a7c59', // Terminal success green
  fontSerif: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  fontSans: '"Trebuchet MS", "Lucida Grande", sans-serif',
  fontMono: '"Courier New", Courier, monospace', // For the digital occult UI
};

export default function App() {
  const { state, dispatch, draftContract, advanceTime, resetGame, identifyGoetia, sealGoetia } = useEngine();
  const [currentTab, setCurrentTab] = useState<'MAP' | 'CODEX' | 'KAGE_NO_SHO' | 'JOURNAL' | 'INVENTORY'>('MAP');
  const [selectedGoetiaId, setSelectedGoetiaId] = useState<string | null>(null);
  
  // State for the new Sealing Mini-Game
  const [activeSealTarget, setActiveSealTarget] = useState<string | null>(null);
  
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const formatNode = (nodeId: string) => nodeId.replace(/_/g, ' ').toUpperCase();
  const availableChoices = caterhamChurchyard.choices as unknown as NarrativeChoice[];

  // --- THE SEALING MINI-GAME COMPONENT ---
  const SealingTerminal = ({ target, sealCost }: { target: any, sealCost: Record<string, number> }) => {
    const [phase, setPhase] = useState<'AUTH' | 'WARDING' | 'COMPLETE'>('AUTH');
    const [nameInput, setNameInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(8);
    const [wardSequence, setWardSequence] = useState<string[]>([]);
    
    const requiredSequence = ['☿', '♄', '♆']; // Mercury, Saturn, Neptune
    const keypad = ['☿', '♃', '♄', '♅', '♆']; // Options including dummy buttons

    useEffect(() => {
      if (phase === 'WARDING' && timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
      } else if (phase === 'WARDING' && timeLeft <= 0) {
        executeFinalSeal(false); // Failed the warding, messy seal
      }
    }, [phase, timeLeft]);

    const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (nameInput.trim().toUpperCase() === target.name.toUpperCase()) {
        setPhase('WARDING');
      } else {
        addToast("Signature mismatch. Connection unstable.", "ALERT");
        dispatch({ type: 'MODIFY_HUMANITY', payload: -2 }); // Penalty for wrong name
      }
    };

    const handleKeypadPress = (symbol: string) => {
      const newSequence = [...wardSequence, symbol];
      setWardSequence(newSequence);
      
      if (newSequence.length === requiredSequence.length) {
        if (newSequence.every((val, index) => val === requiredSequence[index])) {
          executeFinalSeal(true); // Perfect seal
        } else {
          setWardSequence([]); // Reset on wrong sequence
          dispatch({ type: 'MODIFY_HUMANITY', payload: -2 });
        }
      }
    };

    const executeFinalSeal = (isClean: boolean) => {
      setPhase('COMPLETE');
      
      // Consume the items
      (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) => {
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } });
      });
      
      sealGoetia(target.id);
      setActiveSealTarget(null);

      if (isClean) {
        addToast(`BANISHMENT SUCCESSFUL. Target ${target.name} sealed.`, 'SEAL');
      } else {
        addToast(`MESSY BANISHMENT. Backlash caused Sector Entropy spike.`, 'ALERT');
        dispatch({ type: 'ADVANCE_TIME', payload: 15 }); // 15% penalty for missing the timer!
      }
    };

    return (
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#050505', border: `1px solid ${theme.accentGreen}`, fontFamily: theme.fontMono, color: theme.accentGreen }}>
        <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.accentGreen}`, paddingBottom: '5px' }}>&gt; ROOT_ACCESS // BANISHMENT_PROTOCOL</h3>
        
        {phase === 'AUTH' && (
          <form onSubmit={handleAuthSubmit}>
            <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>TARGET LOCKED. INPUT TRUE NAME SIGNATURE TO AUTHORIZE CATALYST BURN:</p>
            <input 
              autoFocus
              type="text" 
              value={nameInput} 
              onChange={e => setNameInput(e.target.value)}
              placeholder="e.g. MURMUR"
              style={{ padding: '10px', width: '100%', backgroundColor: 'black', color: theme.accentGreen, border: `1px solid ${theme.accentGreen}`, fontFamily: theme.fontMono, outline: 'none', textTransform: 'uppercase' }}
            />
            <button type="submit" style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: theme.accentGreen, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}>
              &gt; EXECUTE
            </button>
            <button type="button" onClick={() => setActiveSealTarget(null)} style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono }}>
              &gt; ABORT
            </button>
          </form>
        )}

        {phase === 'WARDING' && (
          <div>
            <p style={{ color: theme.accentRed, fontWeight: 'bold', animation: 'blink 1s infinite' }}>WARNING: SECTOR INSTABILITY DETECTED.</p>
            <p style={{ fontSize: '0.85rem' }}>TIME TO CASCADE: <span style={{ fontSize: '1.2rem', color: timeLeft <= 3 ? theme.accentRed : theme.accentGreen }}>{timeLeft}s</span></p>
            <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>INPUT CRYPTOGRAPHIC WARDING SEQUENCE: [ ☿ ] [ ♄ ] [ ♆ ]</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              {keypad.map(sym => (
                <button 
                  key={sym} 
                  onClick={() => handleKeypadPress(sym)}
                  style={{ flex: 1, padding: '15px', fontSize: '1.5rem', backgroundColor: '#111', color: theme.accentGreen, border: `1px solid ${theme.accentGreen}`, cursor: 'pointer' }}
                >
                  {sym}
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#111', minHeight: '40px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {wardSequence.map((sym, i) => <span key={i} style={{ fontSize: '1.5rem' }}>{sym}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bgDark, color: theme.textParchment, fontFamily: theme.fontSerif }}>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
      
      {/* --- TOP BAR --- */}
      <div style={{ padding: '10px 20px', backgroundColor: theme.bgWood, borderBottom: `2px solid ${theme.borderBronze}`, fontSize: '0.9rem', fontFamily: theme.fontSans, letterSpacing: '1px' }}>
        <span>LOCATION: <strong>{formatNode(state.currentNode)}</strong></span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR --- */}
        <div style={{ width: '220px', backgroundColor: theme.bgWood, borderRight: `2px solid ${theme.borderBronze}`, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: `1px solid ${theme.borderBronze}`, paddingBottom: '20px', marginBottom: '20px' }}>
            {/* UPDATED TAB NAMES */}
            <NavBtn active={currentTab === 'KAGE_NO_SHO'} onClick={() => setCurrentTab('KAGE_NO_SHO')}>KAGE NO SHO</NavBtn>
            <NavBtn active={currentTab === 'CODEX'} onClick={() => setCurrentTab('CODEX')}>GOETIAN CODEX</NavBtn>
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

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: theme.fontSans, letterSpacing: '2px', color: theme.borderBronze }}>MALLEUS STANDING</span>
            <div style={{ fontSize: '1.2rem', color: (state.factions["malleus"] || 50) < 30 ? theme.accentRed : theme.textParchment }}>
              {state.factions["malleus"] || 50} / 100
            </div>
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

        {/* --- MAIN CONTENT --- */}
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

              {currentTab === 'CODEX' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px', letterSpacing: '2px' }}>GOETIAN CODEX</h2>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555', marginBottom: '20px' }}>Cross-reference field intel to identify the commanding lieutenants.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {allGoetia
                      .filter(goetia => {
                        const hasAnyIntel = goetia.requiredIntel && goetia.requiredIntel.length > 0 && 
                                            goetia.requiredIntel.some((tag: string) => state.intelLog.includes(tag));
                        const isIdentified = state.identifiedGoetia.includes(goetia.id);
                        const isSealed = state.sealedGoetia.includes(goetia.id);
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

                    {allGoetia.filter(g => g.requiredIntel?.some(tag => state.intelLog.includes(tag)) || state.identifiedGoetia.includes(g.id)).length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', border: `1px dashed ${theme.borderBronze}`, color: '#666', fontStyle: 'italic', fontFamily: theme.fontMono }}>
                            &gt; _NO SIGNATURES DETECTED. GATHER FIELD INTEL.
                        </div>
                    )}
                  </div>
                </>
              )}

              {currentTab === 'KAGE_NO_SHO' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>KAGE NO SHO</h2>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555' }}>Forge pacts through mutual exchange to bind spirits to your Tether.</p>
                  
                  {allYokai.filter(y => y.utilityClass === 'Shikigami').map(yokai => {
                    const cost = yokai.draftCost;
                    const canAfford = (
                      (!cost.obols || (state.inventory["obols"] || 0) >= cost.obols) &&
                      (!cost.humanity || state.humanity >= cost.humanity) &&
                      (!cost.ink || state.ink >= cost.ink) &&
                      (!cost.tributeItemId || (state.inventory[cost.tributeItemId] || 0) >= 1)
                    );

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
                        <p style={{ fontFamily: theme.fontMono, fontWeight: 'bold', fontSize: '0.85rem' }}>&gt; PACT REQ: <span style={{ color: theme.accentRed }}>{costDisplay}</span></p>
                        
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
                          {canAfford ? 'BIND TO TETHER' : 'UNMET DEMANDS'}
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
                               } else if (action.type === 'MODIFY_FACTION') {
                                 const amtStr = action.payload.amount > 0 ? `+${action.payload.amount}` : `${action.payload.amount}`;
                                 addToast(`Faction Standing updated: ${formatNode(action.payload.factionId)} ${amtStr}`, 'ALERT');
                               } else if (action.type === 'MODIFY_HUMANITY') {
                                 const amtStr = action.payload > 0 ? `+${action.payload}` : `${action.payload}`;
                                 addToast(`Humanity modified: ${amtStr}`, 'ALERT');
                               } else if (action.type === 'RESOLVE_LEAD') {
                                 addToast(`Lead Resolved.`, 'INTEL');
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

              {currentTab === 'CODEX' && (
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
                           <ul style={{ listStyleType: 'none', padding: 0 }}>
                             {target.requiredIntel && target.requiredIntel.length > 0 ? target.requiredIntel.map((tag: string) => {
                               const found = state.intelLog.includes(tag);
                               return (
                                 <li key={tag} style={{ color: found ? theme.accentGreen : '#888', marginBottom: '8px', fontFamily: theme.fontMono, fontSize: '0.85rem' }}>
                                   {found ? `> CONFIRMED: ${formatNode(tag)}` : `> [MISSING DATA COMPONENT]`}
                                 </li>
                               );
                             }) : (
                                <li style={{ color: '#888', fontStyle: 'italic' }}>No intel requirements defined for this entity.</li>
                             )}
                           </ul>
                         </div>

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

                         {/* THE NEW SEALING LOGIC INJECTION */}
                         {isIdentified && !isSealed && Object.keys(sealCost).length > 0 && (
                           <div style={{ marginTop: '30px', backgroundColor: theme.bgWood, padding: '20px', color: theme.textParchment, border: `1px solid ${theme.accentRed}` }}>
                             <h3 style={{ marginTop: 0, color: theme.accentRed }}>REQUIRED CATALYSTS</h3>
                             <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.9rem', fontFamily: theme.fontMono }}>
                               {(Object.entries(sealCost) as [string, number][]).map(([item, amount]) => (
                                 <li key={item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                   <span>{formatNode(item)} x{amount}</span>
                                   <span style={{ color: (state.inventory[item] || 0) >= amount ? theme.accentGreen : theme.accentRed }}>
                                     (Have: {state.inventory[item] || 0})
                                   </span>
                                 </li>
                               ))}
                             </ul>
                             
                             {/* Render either the button or the Terminal Component */}
                             {!activeSealTarget ? (
                               <button 
                                 onClick={() => setActiveSealTarget(target.id)}
                                 disabled={!canAffordSeal}
                                 style={{ padding: '10px', width: '100%', marginTop: '15px', backgroundColor: canAffordSeal ? '#3a0c0c' : '#222', color: canAffordSeal ? 'white' : '#555', border: 'none', cursor: canAffordSeal ? 'pointer' : 'not-allowed', fontFamily: theme.fontSerif }}
                               >
                                 {canAffordSeal ? "INITIATE RITUAL PROTOCOL" : "INSUFFICIENT MATERIALS"}
                               </button>
                             ) : (
                               activeSealTarget === target.id && <SealingTerminal target={target} sealCost={sealCost} />
                             )}
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

              {currentTab === 'KAGE_NO_SHO' && (
                <>
                  <h2 style={{ borderBottom: `2px solid ${theme.accentRed}`, paddingBottom: '10px' }}>ACTIVE TETHER</h2>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '20px' }}>Current spirits bound to your will. Use them wisely.</p>
                  {state.activeContracts.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>No contracts currently active.</p>
                  ) : (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      {state.activeContracts.map((id, i) => {
                        const boundYokai = allYokai.find(y => y.id === id);
                        return (
                          <li key={i} style={{ borderBottom: '1px dotted #a30000', padding: '10px 0', fontFamily: theme.fontSans, fontWeight: 'bold' }}>
                            封 {boundYokai ? boundYokai.nameEn : formatNode(id)}
                          </li>
                        )
                      })}
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
              borderLeft: `4px solid ${toast.type === 'INTEL' ? '#4a7c59' : toast.type === 'ITEM' ? '#b8860b' : toast.type === 'SEAL' ? theme.accentGreen : theme.accentRed}`,
              padding: '15px 20px', fontFamily: theme.fontSans, fontSize: '0.9rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.8)', maxWidth: '300px'
            }}
          >
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: theme.borderBronze, fontSize: '0.7rem', letterSpacing: '1px' }}>
              {toast.type === 'INTEL' ? 'NEW INTEL GATHERED' : toast.type === 'ITEM' ? 'INVENTORY UPDATED' : toast.type === 'SEAL' ? 'PROTOCOL SUCCESS' : 'SYSTEM ALERT'}
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
        padding: '12px 15px', 
        textAlign: 'left', 
        backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent', 
        color: active ? '#d4c7b0' : '#8c7b61', 
        border: 'none', 
        borderLeft: active ? '4px solid #a30000' : '4px solid transparent',
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
