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

// --- THE NEW NEO-NOIR TERMINAL THEME ---
const theme = {
  bgDark: '#020202',          
  bgPanel: '#080a08',         
  borderTerminal: '#1f3d26',  
  textTerminal: '#4a7c59',    
  textBright: '#62f080',      
  textMuted: '#2a5233',       
  accentRed: '#a82c2c',       
  fontMono: '"Courier New", Courier, monospace', 
};

// --- THE TERMINAL BOOT SCREEN ---
const StartScreen = ({ onStart }: { onStart: (name: string, portrait: string, agency: string) => void }) => {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [portrait, setPortrait] = useState('☿'); 

  const sigils = ['☿', '♄', '♆', '♅', '♃'];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono }}>
      <div style={{ width: '500px', border: `2px solid ${theme.textTerminal}`, padding: '40px', backgroundColor: theme.bgPanel, boxShadow: `0 0 20px rgba(74, 124, 89, 0.2)` }}>
        <h1 style={{ textAlign: 'center', borderBottom: `1px dashed ${theme.textTerminal}`, paddingBottom: '20px', letterSpacing: '4px', color: theme.textBright }}>THAUMATURGIC_OS v3.1</h1>
        
        <div style={{ marginTop: '30px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>&gt; INPUT OPERATIVE DESIGNATION:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vergil" 
            style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, marginBottom: '20px', outline: 'none' }}
          />

          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>&gt; INPUT AFFILIATED AGENCY:</label>
          <input 
            type="text" 
            value={agency} 
            onChange={(e) => setAgency(e.target.value)}
            placeholder="e.g. Independent Consultations" 
            style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, marginBottom: '20px', outline: 'none' }}
          />

          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>&gt; SELECT TETHER SIGIL (PORTRAIT PROFILE):</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            {sigils.map(sigil => (
              <button
                key={sigil}
                onClick={() => setPortrait(sigil)}
                style={{
                  flex: 1, padding: '15px', fontSize: '1.5rem', cursor: 'pointer',
                  backgroundColor: portrait === sigil ? theme.textTerminal : 'black',
                  color: portrait === sigil ? 'black' : theme.textTerminal,
                  border: `1px solid ${theme.borderTerminal}`
                }}
              >
                {sigil}
              </button>
            ))}
          </div>

          <button 
            onClick={() => onStart(name, portrait, agency)}
            style={{ width: '100%', padding: '15px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold', letterSpacing: '2px' }}
          >
            INITIALIZE TETHER PROTOCOL
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { state, dispatch, draftContract, advanceTime, resetGame, identifyGoetia, sealGoetia, startInvestigation } = useEngine();
  const [currentTab, setCurrentTab] = useState<'MAP' | 'CODEX' | 'KAGE_NO_SHO' | 'JOURNAL' | 'INVENTORY'>('MAP');
  const [selectedGoetiaId, setSelectedGoetiaId] = useState<string | null>(null);
  const [activeSealTarget, setActiveSealTarget] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const injectNarrative = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\{playerName\}/g, state.playerName)
      .replace(/\{agencyName\}/g, state.agencyName);
  };

  const addToast = (message: string, type: 'INTEL' | 'ITEM' | 'ALERT' | 'SEAL' = 'ALERT') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  };

  const formatNode = (nodeId: string) => nodeId.replace(/_/g, ' ').toUpperCase();
  const availableChoices = caterhamChurchyard.choices as unknown as NarrativeChoice[];

  if (state.gameStage === 'START_SCREEN') {
    return <StartScreen onStart={startInvestigation} />;
  }

  // --- THE SEALING MINI-GAME MODAL COMPONENT ---
  const SealingTerminal = ({ target, sealCost, onClose }: { target: any, sealCost: Record<string, number>, onClose: () => void }) => {
    const [phase, setPhase] = useState<'AUTH' | 'WARDING' | 'COMPLETE'>('AUTH');
    const [nameInput, setNameInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(8);
    const [wardSequence, setWardSequence] = useState<string[]>([]);
    
    const requiredSequence = ['☿', '♄', '♆']; 
    const keypad = ['☿', '♃', '♄', '♅', '♆']; 

    useEffect(() => {
      if (phase === 'WARDING' && timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
      } else if (phase === 'WARDING' && timeLeft <= 0) {
        executeFinalSeal(false); 
      }
    }, [phase, timeLeft]);

    const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (nameInput.trim().toUpperCase() === target.name.toUpperCase()) {
        setPhase('WARDING');
      } else {
        addToast("Signature mismatch. Connection unstable.", "ALERT");
        dispatch({ type: 'MODIFY_HUMANITY', payload: -2 }); 
      }
    };

    const handleKeypadPress = (symbol: string) => {
      const newSequence = [...wardSequence, symbol];
      setWardSequence(newSequence);
      
      if (newSequence.length === requiredSequence.length) {
        if (newSequence.every((val, index) => val === requiredSequence[index])) {
          executeFinalSeal(true); 
        } else {
          setWardSequence([]); 
          dispatch({ type: 'MODIFY_HUMANITY', payload: -2 });
        }
      }
    };

    const executeFinalSeal = (isClean: boolean) => {
      setPhase('COMPLETE');
      (Object.entries(sealCost) as [string, number][]).forEach(([item, amount]) => {
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: item, amount: -amount } });
      });
      sealGoetia(target.id);
      onClose();

      if (isClean) {
        addToast(`SEALING SUCCESSFUL. Target ${target.name} bound to the brass vessel.`, 'SEAL');
      } else {
        addToast(`MESSY SEALING. Backlash caused Sector Entropy spike.`, 'ALERT');
        dispatch({ type: 'ADVANCE_TIME', payload: 15 }); 
      }
    };

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
        <div style={{ width: '500px', padding: '30px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.textTerminal}`, boxShadow: `0 0 30px rgba(74, 124, 89, 0.2)`, fontFamily: theme.fontMono, color: theme.textTerminal }}>
          <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px dashed ${theme.textTerminal}`, paddingBottom: '5px', color: theme.textBright }}>&gt; ROOT_ACCESS // VESSEL_SEALING_PROTOCOL</h3>
          
          {phase === 'AUTH' && (
            <form onSubmit={handleAuthSubmit}>
              <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>TARGET LOCKED. INPUT TRUE NAME SIGNATURE TO AUTHORIZE CATALYST BURN:</p>
              <input 
                autoFocus
                type="text" 
                value={nameInput} 
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. MURMUR"
                style={{ padding: '10px', width: '100%', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', textTransform: 'uppercase' }}
              />
              <button type="submit" style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: theme.textTerminal, color: 'black', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold' }}>
                &gt; EXECUTE
              </button>
              <button type="button" onClick={onClose} style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontFamily: theme.fontMono }}>
                &gt; ABORT
              </button>
            </form>
          )}

          {phase === 'WARDING' && (
            <div>
              <p style={{ color: theme.accentRed, fontWeight: 'bold', animation: 'blink 1s infinite' }}>WARNING: SECTOR INSTABILITY DETECTED.</p>
              <p style={{ fontSize: '0.85rem' }}>TIME TO CASCADE: <span style={{ fontSize: '1.2rem', color: timeLeft <= 3 ? theme.accentRed : theme.textBright }}>{timeLeft}s</span></p>
              <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>INPUT CRYPTOGRAPHIC WARDING SEQUENCE: [ ☿ ] [ ♄ ] [ ♆ ]</p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                {keypad.map(sym => (
                  <button 
                    key={sym} 
                    onClick={() => handleKeypadPress(sym)}
                    style={{ flex: 1, padding: '15px', fontSize: '1.5rem', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer' }}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: theme.bgDark, minHeight: '40px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {wardSequence.map((sym, i) => <span key={i} style={{ fontSize: '1.5rem', color: theme.textBright }}>{sym}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono }}>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
      
      {/* --- TOP BAR --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.borderTerminal}`, fontSize: '0.9rem', letterSpacing: '1px' }}>
        <span>ACTIVE_NODE: <strong style={{color: theme.accentRed}}>{formatNode(state.currentNode)}</strong></span>
        
        <span style={{ color: theme.textTerminal }}>
          AUTH_USER: <strong style={{ color: theme.textBright }}>{state.playerName.toUpperCase()}</strong> 
          <span style={{ margin: '0 10px', color: theme.borderTerminal }}>//</span> 
          AGENCY: <strong style={{ color: theme.textBright }}>{state.agencyName.toUpperCase()}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR --- */}
        <div style={{ width: '220px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.borderTerminal}`, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '20px' }}>
             <div style={{ fontSize: '3rem', color: theme.textBright, marginBottom: '10px' }}>{state.playerPortrait}</div>
             <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>OP_DESIGNATION</div>
             <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: theme.textBright }}>{state.playerName}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: `1px dashed ${theme.borderTerminal}`, paddingBottom: '20px', marginBottom: '20px' }}>
            <NavBtn active={currentTab === 'KAGE_NO_SHO'} onClick={() => setCurrentTab('KAGE_NO_SHO')}>KAGE_NO_SHO</NavBtn>
            <NavBtn active={currentTab === 'CODEX'} onClick={() => setCurrentTab('CODEX')}>GOETIAN_CODEX</NavBtn>
            <NavBtn active={currentTab === 'MAP'} onClick={() => setCurrentTab('MAP')}>NODE_MAP</NavBtn>
            <NavBtn active={currentTab === 'INVENTORY'} onClick={() => setCurrentTab('INVENTORY')}>LOCAL_STORAGE</NavBtn>
            <NavBtn active={currentTab === 'JOURNAL'} onClick={() => setCurrentTab('JOURNAL')}>FIELD_LOG</NavBtn>
          </div>

          <div style={{ flexGrow: 1 }}></div>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>SECTOR ENTROPY</span>
            <div style={{ height: '10px', backgroundColor: theme.bgDark, border: `1px solid ${theme.borderTerminal}`, marginTop: '5px', position: 'relative' }}>
              <div style={{ width: `${state.globalChaos}%`, height: '100%', backgroundColor: theme.accentRed, transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>{state.globalChaos}%</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>HUMANITY</span>
            <div style={{ fontSize: '1.5rem', color: state.humanity < 50 ? theme.accentRed : theme.textBright }}>{state.humanity} / 100</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>MALLEUS STANDING</span>
            <div style={{ fontSize: '1.2rem', color: (state.factions["malleus"] || 50) < 30 ? theme.accentRed : theme.textBright }}>
              {state.factions["malleus"] || 50} / 100
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px', borderTop: `1px dashed ${theme.borderTerminal}`, paddingTop: '15px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>OBOLS (WEALTH)</span>
            <div style={{ fontSize: '1.5rem', color: '#ffb347' }}>{state.inventory["obols"] || 0}</div>
          </div>

          <button onClick={() => { advanceTime(5); addToast('Time advances. Entropy increases by 5%.', 'ALERT'); }} style={{ padding: '10px', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono, marginBottom: '10px' }}>
            &gt; AWAIT_CYCLES
          </button>
          <button onClick={resetGame} style={{ padding: '10px', backgroundColor: '#3a0c0c', color: 'white', border: 'none', cursor: 'pointer', fontFamily: theme.fontMono }}>
            &gt; TERMINATE_SESSION
          </button>
        </div>

        {/* --- MAIN CONTENT (THE CONSOLE) --- */}
        <div style={{ flexGrow: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, display: 'flex', minHeight: '600px', boxShadow: `0 0 20px rgba(74, 124, 89, 0.05)`, borderRadius: '2px' }}>
            
            {/* --- LEFT PANE --- */}
            <div style={{ flex: 1, padding: '40px', borderRight: `1px dashed ${theme.borderTerminal}`, overflowY: 'auto', maxHeight: '75vh' }}>
              
              {currentTab === 'MAP' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: theme.textBright }}>
                    &gt; {injectNarrative(caterhamChurchyard.title)}
                  </h2>
                  <p style={{ lineHeight: '1.8', fontSize: '1.05rem', marginTop: '20px' }}>
                    {injectNarrative(caterhamChurchyard.text)}
                  </p>
                </>
              )}

              {currentTab === 'CODEX' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', letterSpacing: '2px', color: theme.textBright }}>&gt; GOETIAN_CODEX</h2>
                  <p style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '20px' }}>Cross-reference field intel to identify commanding lieutenants.</p>
                  
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
                      if (isSealed) indexLabel = `[SEALED] ${goetia.name}`;
                      else if (isIdentified) indexLabel = goetia.name;
                      else if (hasAllIntel) indexLabel = `[!] TARGET DATA ACQUIRED`;

                      return (
                        <button 
                          key={goetia.id}
                          onClick={() => setSelectedGoetiaId(goetia.id)}
                          style={{
                            padding: '12px',
                            backgroundColor: selectedGoetiaId === goetia.id ? theme.bgDark : 'transparent',
                            color: hasAllIntel && !isIdentified ? theme.accentRed : theme.textBright,
                            border: `1px solid ${selectedGoetiaId === goetia.id ? theme.textBright : theme.borderTerminal}`,
                            textAlign: 'left', cursor: 'pointer', fontFamily: theme.fontMono, fontWeight: 'bold'
                          }}
                        >
                          &gt; {indexLabel}
                        </button>
                      );
                    })}

                    {allGoetia.filter(g => g.requiredIntel?.some(tag => state.intelLog.includes(tag)) || state.identifiedGoetia.includes(g.id)).length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', border: `1px dashed ${theme.borderTerminal}`, color: theme.textMuted }}>
                            _NO SIGNATURES DETECTED. GATHER FIELD INTEL.
                        </div>
                    )}
                  </div>
                </>
              )}

              {currentTab === 'KAGE_NO_SHO' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; KAGE_NO_SHO</h2>
                  <p style={{ fontSize: '0.9rem', color: theme.textMuted }}>Forge pacts through mutual exchange to bind spirits to your Tether.</p>
                  
                  {allYokai.filter(y => {
                    if (y.utilityClass === 'Shikigami') return true;
                    if (y.unlockFlag && state.flags[y.unlockFlag]) return true;
                    return false;
                  }).map(yokai => {
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
                      <div key={yokai.id} style={{ border: `1px solid ${theme.borderTerminal}`, padding: '15px', marginTop: '20px', backgroundColor: theme.bgDark }}>
                        <h3 style={{ margin: '0 0 10px 0', color: theme.textBright }}>{yokai.nameEn}</h3>
                        <p style={{ fontSize: '0.9rem' }}>{yokai.gameUtility}</p>
                        <p style={{ fontWeight: 'bold', fontSize: '0.85rem', marginTop: '10px' }}>&gt; PACT REQ: <span style={{ color: theme.accentRed }}>{costDisplay}</span></p>
                        
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
                            backgroundColor: canAfford ? theme.textTerminal : '#111', 
                            color: canAfford ? 'black' : theme.textMuted, 
                            border: 'none',
                            cursor: canAfford ? 'pointer' : 'not-allowed', 
                            fontFamily: theme.fontMono, fontWeight: 'bold'
                          }}
                        >
                          {canAfford ? '> BIND TO TETHER' : '> UNMET DEMANDS'}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {currentTab === 'INVENTORY' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; LOCAL_STORAGE</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                    {(Object.entries(state.inventory) as [string, number][])
                      .filter(([key]) => key !== 'obols')
                      .map(([key, amount]) => (
                        <div key={key} style={{ border: `1px solid ${theme.borderTerminal}`, padding: '15px', textAlign: 'center', backgroundColor: theme.bgDark }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 'bold', wordBreak: 'break-word' }}>{formatNode(key)}</div>
                          <div style={{ marginTop: '5px', color: theme.textBright, fontWeight: 'bold' }}>x {amount}</div>
                        </div>
                    ))}
                  </div>
                </>
              )}

              {currentTab === 'JOURNAL' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; FIELD_LOG</h2>
                  {state.activeLeads.length === 0 ? <p style={{color: theme.textMuted}}>_NO ACTIVE LEADS.</p> : (
                    <ul style={{ listStyleType: 'none', paddingLeft: '0', lineHeight: '1.8' }}>
                      {state.activeLeads.map(lead => (
                        <li key={lead.id} style={{ marginBottom: '15px', color: lead.resolved ? theme.textMuted : theme.textTerminal, textDecoration: lead.resolved ? 'line-through' : 'none' }}>
                          <strong style={{color: theme.textBright}}>[+]</strong> {lead.text.toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* --- RIGHT PANE --- */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxHeight: '75vh' }}>
              
              {currentTab === 'MAP' && (
                <>
                   <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', letterSpacing: '2px', color: theme.textBright }}>&gt; AVAILABLE_ACTIONS</h2>
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
                           style={{ padding: '15px', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, cursor: 'pointer', fontFamily: theme.fontMono, textAlign: 'left', fontSize: '1rem', transition: 'background-color 0.2s' }}
                           onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#111'}
                           onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.bgDark}
                         >
                           <span style={{ color: theme.textTerminal, marginRight: '10px' }}>$</span> {injectNarrative(choice.label)}
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
                         <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', letterSpacing: '2px', color: theme.textBright }}>
                           &gt; {isIdentified ? target.name.toUpperCase() : "TARGET_OBSCURED"}
                         </h2>

                         {isIdentified ? (
                           <>
                             <p style={{ color: theme.textBright, fontWeight: 'bold', marginTop: '10px' }}>{target.title || "Classification Pending"}</p>
                             <p style={{ lineHeight: '1.6' }}>{target.description || "No archival data available for this entity yet."}</p>
                           </>
                         ) : (
                           <p style={{ lineHeight: '1.6', color: theme.textMuted }}>Identity hidden. Compile required intel to reveal the lieutenant's true nature.</p>
                         )}

                         <div style={{ marginTop: '30px', padding: '15px', border: `1px dashed ${theme.borderTerminal}` }}>
                           <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: theme.textBright }}>&gt; REQUIRED_INTEL</h3>
                           <ul style={{ listStyleType: 'none', padding: 0 }}>
                             {target.requiredIntel && target.requiredIntel.length > 0 ? target.requiredIntel.map((tag: string) => {
                               const found = state.intelLog.includes(tag);
                               return (
                                 <li key={tag} style={{ color: found ? theme.textBright : theme.textMuted, marginBottom: '8px', fontSize: '0.85rem' }}>
                                   {found ? `[+] CONFIRMED: ${formatNode(tag)}` : `[-] MISSING_DATA_COMPONENT`}
                                 </li>
                               );
                             }) : (
                                <li style={{ color: theme.textMuted }}>_NO INTEL REQUIREMENTS DEFINED.</li>
                             )}
                           </ul>
                         </div>

                         {hasAllIntel && !isIdentified && (
                           <div style={{ marginTop: '40px', textAlign: 'center' }}>
                             <p style={{ color: theme.textBright, marginBottom: '15px' }}>_DATA SUFFICIENT. A PATTERN EMERGES.</p>
                             <button 
                               onClick={() => {
                                 identifyGoetia(target.id);
                                 addToast(`Target Identity Confirmed: ${target.name}`, 'ALERT');
                               }}
                               style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: theme.bgDark, color: theme.textBright, border: `1px solid ${theme.textBright}`, cursor: 'pointer', fontFamily: theme.fontMono, letterSpacing: '2px' }}
                             >
                               &gt; IDENTIFY_ENTITY
                             </button>
                           </div>
                         )}

                         {isIdentified && !isSealed && Object.keys(sealCost).length > 0 && (
                           <div style={{ marginTop: '30px', backgroundColor: theme.bgDark, padding: '20px', border: `1px solid ${theme.accentRed}` }}>
                             <h3 style={{ marginTop: 0, color: theme.accentRed }}>&gt; REQUIRED_CATALYSTS</h3>
                             <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.9rem' }}>
                               {(Object.entries(sealCost) as [string, number][]).map(([item, amount]) => (
                                 <li key={item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                   <span>{formatNode(item)} x{amount}</span>
                                   <span style={{ color: (state.inventory[item] || 0) >= amount ? theme.textBright : theme.accentRed }}>
                                     (Have: {state.inventory[item] || 0})
                                   </span>
                                 </li>
                               ))}
                             </ul>
                             
                             <button 
                               onClick={() => setActiveSealTarget(target.id)}
                               disabled={!canAffordSeal}
                               style={{ padding: '10px', width: '100%', marginTop: '15px', backgroundColor: canAffordSeal ? '#3a0c0c' : '#111', color: canAffordSeal ? 'white' : theme.textMuted, border: 'none', cursor: canAffordSeal ? 'pointer' : 'not-allowed', fontFamily: theme.fontMono }}
                             >
                               {canAffordSeal ? "> INITIATE_SEALING_PROTOCOL" : "> INSUFFICIENT_MATERIALS"}
                             </button>
                           </div>
                         )}

                         {isSealed && (
                           <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', color: theme.textBright, border: `1px solid ${theme.textBright}`, fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '4px' }}>
                             [ TARGET_SEALED ]
                           </div>
                         )}
                       </div>
                     );
                   })() : (
                     <p style={{ color: theme.textMuted, textAlign: 'center', marginTop: '100px' }}>_AWAITING TARGET SELECTION.</p>
                   )}
                </>
              )}

              {currentTab === 'KAGE_NO_SHO' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; ACTIVE_TETHER</h2>
                  <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: theme.textMuted }}>Current spirits bound to your active session.</p>
                  {state.activeContracts.length === 0 ? (
                    <p style={{ color: theme.textMuted }}>_NO CONTRACTS DETECTED.</p>
                  ) : (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      {state.activeContracts.map((id, i) => {
                        const boundYokai = allYokai.find(y => y.id === id);
                        return (
                          <li key={i} style={{ borderBottom: `1px dashed ${theme.borderTerminal}`, padding: '10px 0', fontWeight: 'bold', color: theme.textBright }}>
                            [ 封 ] {boundYokai ? boundYokai.nameEn : formatNode(id)}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </>
              )}

              {currentTab === 'INVENTORY' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; ITEM_ANALYSIS</h2>
                  <p style={{ color: theme.textMuted }}>_SELECT AN ITEM TO VIEW METADATA.</p>
                </>
              )}

              {currentTab === 'JOURNAL' && (
                <>
                  <h2 style={{ borderBottom: `1px solid ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright }}>&gt; LOG_DETAILS</h2>
                  <p style={{ color: theme.textMuted }}>_AWAITING LOG SELECTION.</p>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
      
      {/* Conditionally Render the Sealing Modal */}
      {activeSealTarget && (() => {
        const target = allGoetia.find(g => g.id === activeSealTarget);
        if (!target) return null;
        const sealCost = target.sealCost || {};
        return <SealingTerminal target={target} sealCost={sealCost} onClose={() => setActiveSealTarget(null)} />;
      })()}

      {/* --- TOAST RENDERER --- */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            style={{ 
              backgroundColor: theme.bgPanel, color: theme.textBright, 
              border: `1px solid ${theme.borderTerminal}`, 
              borderLeft: `4px solid ${toast.type === 'INTEL' ? theme.textTerminal : toast.type === 'ITEM' ? '#b8860b' : toast.type === 'SEAL' ? theme.textBright : theme.accentRed}`,
              padding: '15px 20px', fontFamily: theme.fontMono, fontSize: '0.9rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.8)', maxWidth: '300px'
            }}
          >
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: theme.textMuted, fontSize: '0.7rem', letterSpacing: '1px' }}>
              &gt; {toast.type === 'INTEL' ? 'SYS_UPDATE: INTEL' : toast.type === 'ITEM' ? 'SYS_UPDATE: STORAGE' : toast.type === 'SEAL' ? 'PROTOCOL_SUCCESS' : 'CRITICAL_ALERT'}
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
        backgroundColor: active ? theme.bgDark : 'transparent', 
        color: active ? theme.textBright : theme.textMuted, 
        border: 'none', 
        borderLeft: active ? `4px solid ${theme.textBright}` : '4px solid transparent',
        cursor: 'pointer', 
        fontFamily: theme.fontMono, 
        letterSpacing: '1px', 
        fontSize: '0.9rem', 
        transition: 'all 0.2s',
        fontWeight: active ? 'bold' : 'normal'
      }}
    >
      &gt; {children}
    </button>
  );
}