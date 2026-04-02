// src/tools/NarrativeForge.tsx
import { useState } from 'react';

// --- TYPES FOR THE EDITOR ---
type ActionType = 'SET_FLAG' | 'MODIFY_INVENTORY' | 'GATHER_INTEL' | 'ADD_LEAD' | 'ADVANCE_TIME' | 'MODIFY_SECTOR_ENTROPY' | 'MODIFY_HUMANITY' | 'MODIFY_GLOBAL_ENTROPY' | 'SET_CURRENT_NODE';

interface EditorAction {
  id: string;
  type: ActionType;
  payloadKey: string;
  payloadValue: string;
}

interface EditorChoice {
  id: string;
  choiceId: string;
  label: string;
  condition: string;
  responseText: string; // <-- NEW: In-scene narrative updates
  actions: EditorAction[];
}

interface EditorNode {
  id: string;
  title: string;
  baseText: string;
  choices: EditorChoice[];
}

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

export default function NarrativeForge() {
  const [nodes, setNodes] = useState<EditorNode[]>([
    { id: 'new_sector', title: 'UNKNOWN SECTOR', baseText: 'The logic fog is thick here...', choices: [] }
  ]);
  const [activeNodeId, setActiveNodeId] = useState('new_sector');

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];

  // --- SCENE MANAGERS ---
  const updateActiveNode = (updates: Partial<EditorNode>) => {
    setNodes(nodes.map(n => n.id === activeNodeId ? { ...n, ...updates } : n));
  };

  const createNewNode = (prefillId?: string) => {
    const newId = prefillId || prompt('Enter New Scene ID (e.g. asylum_basement):');
    if (!newId || nodes.find(n => n.id === newId)) return null;

    const newNode: EditorNode = {
      id: newId,
      title: newId.toUpperCase().replace(/_/g, ' '),
      baseText: 'You arrive at a new location...',
      choices: []
    };
    
    setNodes([...nodes, newNode]);
    setActiveNodeId(newId);
    return newId;
  };

  const deleteNode = (id: string) => {
    if (nodes.length <= 1) return alert("You must have at least one scene in the project.");
    if (window.confirm(`Delete scene: ${id}?`)) {
      const newNodes = nodes.filter(n => n.id !== id);
      setNodes(newNodes);
      if (activeNodeId === id) setActiveNodeId(newNodes[0].id);
    }
  };

  // --- CHOICE & ACTION MANAGERS ---
  const addChoice = () => {
    const newChoice: EditorChoice = { id: Date.now().toString(), choiceId: 'new_choice', label: 'DO SOMETHING', condition: '', responseText: '', actions: [] };
    updateActiveNode({ choices: [...activeNode.choices, newChoice] });
  };

  const updateChoice = (id: string, field: keyof EditorChoice, value: any) => {
    updateActiveNode({ choices: activeNode.choices.map(c => c.id === id ? { ...c, [field]: value } : c) });
  };

  const removeChoice = (id: string) => {
    updateActiveNode({ choices: activeNode.choices.filter(c => c.id !== id) });
  };

  const addAction = (choiceId: string) => {
    const newAction: EditorAction = { id: Date.now().toString(), type: 'SET_FLAG', payloadKey: 'flag_name', payloadValue: 'true' };
    updateActiveNode({
      choices: activeNode.choices.map(c => c.id === choiceId ? { ...c, actions: [...c.actions, newAction] } : c)
    });
  };

  const updateAction = (choiceId: string, actionId: string, field: keyof EditorAction, value: string) => {
    updateActiveNode({
      choices: activeNode.choices.map(c => c.id === choiceId ? { ...c, actions: c.actions.map(a => a.id === actionId ? { ...a, [field]: value } : a) } : c)
    });
  };

  const removeAction = (choiceId: string, actionId: string) => {
    updateActiveNode({
      choices: activeNode.choices.map(c => c.id === choiceId ? { ...c, actions: c.actions.filter(a => a.id !== actionId) } : c)
    });
  };

  // --- THE MAGIC BRANCHING FUNCTION ---
  const branchToNewScene = (choiceId: string) => {
    const newId = prompt('Enter the ID for the new connected Scene (e.g. holding_cells):');
    if (!newId) return;

    if (!nodes.find(n => n.id === newId)) {
      const newNode: EditorNode = {
        id: newId,
        title: newId.toUpperCase().replace(/_/g, ' '),
        baseText: '...',
        choices: []
      };
      
      setNodes(prevNodes => {
        const mapped = prevNodes.map(n => {
          if (n.id === activeNodeId) {
            return {
              ...n,
              choices: n.choices.map(c => c.id === choiceId ? {
                ...c, 
                actions: [
                  ...c.actions, 
                  { 
                    id: Date.now().toString(), 
                    type: 'SET_CURRENT_NODE' as ActionType, 
                    payloadKey: '', 
                    payloadValue: newId 
                  }
                ]
              } : c)
            };
          }
          return n;
        });
        return [...mapped, newNode];
      });
      setActiveNodeId(newId);
    }
  };

  // --- EXPORT COMPILER ---
  const generateScript = () => {
    let script = `// --- COMPILED NARRATIVE BRANCH ---\n`;
    script += `import type { GameState } from '../../engine/state';\n`;
    script += `import type { GameAction } from '../../engine/reducer';\n\n`;
    
    nodes.forEach(node => {
      const camelNodeId = node.id.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      script += `export const ${camelNodeId} = {\n`;
      script += `  title: "${node.title}",\n`;
      
      // AUTO-GENERATING THE CONDITIONAL TEXT BLOCK
      script += `  text: (state: GameState) => {\n`;
      const choicesWithText = [...node.choices].reverse().filter(c => c.responseText && c.responseText.trim() !== '');
      choicesWithText.forEach(c => {
        script += `    if (state.flags['${node.id}_${c.choiceId}_clicked']) {\n`;
        script += `      return "${c.responseText.replace(/\n/g, '\\n').replace(/"/g, '\\"')}";\n`;
        script += `    }\n`;
      });
      script += `    return "${node.baseText.replace(/\n/g, '\\n').replace(/"/g, '\\"')}";\n`;
      script += `  },\n`;
      
      script += `  choices: [\n`;
      node.choices.forEach((c, idx) => {
        script += `    {\n`;
        script += `      id: "${c.choiceId}",\n`;
        script += `      label: "${c.label}",\n`;
        if (c.condition) {
          script += `      condition: (state: GameState) => ${c.condition},\n`;
        }
        
        script += `      actions: [\n`;
        
        // AUTO-GENERATING THE REQUIRED FLAG FOR IN-SCENE TEXT
        const compiledActions: string[] = [];
        if (c.responseText && c.responseText.trim() !== '') {
          compiledActions.push(`{ type: 'SET_FLAG', payload: { flagId: '${node.id}_${c.choiceId}_clicked', value: true } }`);
        }

        c.actions.forEach(a => {
          let payloadStr = '';
          if (a.type === 'SET_FLAG') payloadStr = `{ flagId: '${a.payloadKey}', value: ${a.payloadValue} }`;
          else if (a.type === 'MODIFY_INVENTORY') payloadStr = `{ itemId: '${a.payloadKey}', amount: ${a.payloadValue} }`;
          else if (a.type === 'ADD_LEAD') payloadStr = `{ id: '${a.payloadKey}', text: '${a.payloadValue.replace(/'/g, "\\'")}' }`;
          else if (a.type === 'GATHER_INTEL') payloadStr = `'${a.payloadKey}'`;
          else if (a.type === 'MODIFY_SECTOR_ENTROPY') payloadStr = `{ nodeId: '${a.payloadKey || node.id}', amount: ${a.payloadValue} }`;
          else if (a.type === 'SET_CURRENT_NODE') payloadStr = `'${a.payloadValue}'`; 
          else payloadStr = `${a.payloadValue}`; 

          compiledActions.push(`{ type: '${a.type}', payload: ${payloadStr} }`);
        });

        compiledActions.forEach((ca, caIdx) => {
          script += `        ${ca}${caIdx < compiledActions.length - 1 ? ',' : ''}\n`;
        });

        script += `      ] as GameAction[]\n`;
        script += `    }${idx < node.choices.length - 1 ? ',' : ''}\n`;
      });

      script += `  ]\n};\n\n`;
    });

    return script;
  };

  const handleExport = () => {
    navigator.clipboard.writeText(generateScript());
    alert(`Complete branch copied to clipboard!`);
  };

  // --- UI STYLES ---
  const inputStyle = { width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', marginBottom: '10px' };
  const labelStyle = { display: 'block', fontSize: '0.8rem', color: theme.textMuted, marginBottom: '4px' };

  return (
    <div style={{ height: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, display: 'flex' }}>
      
      {/* 1. LEFT SIDEBAR: SCENE EXPLORER */}
      <div style={{ width: '250px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.borderTerminal}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: `1px dashed ${theme.borderTerminal}` }}>
          <h2 style={{ color: theme.textBright, fontSize: '1rem', margin: 0, letterSpacing: '2px' }}>SCENE EXPLORER</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {nodes.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <div 
                onClick={() => setActiveNodeId(n.id)}
                style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: n.id === activeNodeId ? theme.textTerminal : 'transparent', color: n.id === activeNodeId ? 'black' : theme.textMuted, fontWeight: n.id === activeNodeId ? 'bold' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                &gt; {n.id}
              </div>
              <button onClick={() => deleteNode(n.id)} style={{ padding: '10px', background: 'transparent', border: 'none', color: theme.accentRed, cursor: 'pointer' }}>X</button>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: `1px dashed ${theme.borderTerminal}` }}>
          <button onClick={() => createNewNode()} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: theme.textBright, border: `1px dashed ${theme.textBright}`, cursor: 'pointer', fontFamily: theme.fontMono }}>+ ADD UNLINKED SCENE</button>
        </div>
      </div>

      {/* 2. CENTER PANEL: ACTIVE SCENE EDITOR */}
      <div style={{ flex: 2, backgroundColor: theme.bgDark, padding: '30px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>NODE ID (File Name / Reference)</label>
          <input style={inputStyle} value={activeNode.id} onChange={e => updateActiveNode({ id: e.target.value })} />
          
          <label style={labelStyle}>NODE TITLE (Display Name)</label>
          <input style={inputStyle} value={activeNode.title} onChange={e => updateActiveNode({ title: e.target.value })} />

          <label style={labelStyle}>BASE NARRATIVE TEXT</label>
          <textarea style={{...inputStyle, height: '120px', resize: 'vertical'}} value={activeNode.baseText} onChange={e => updateActiveNode({ baseText: e.target.value })} placeholder="Describe the scene..." />
        </div>

        <div style={{ marginTop: '30px', borderTop: `1px solid ${theme.borderTerminal}`, paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: theme.textBright, fontSize: '1.2rem', margin: 0 }}>&gt; CHOICES & BRANCHES</h2>
            <button onClick={addChoice} style={{ padding: '8px 15px', backgroundColor: theme.textTerminal, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ ADD CHOICE</button>
          </div>

          {activeNode.choices.map((choice) => (
            <div key={choice.id} style={{ border: `1px solid ${theme.borderTerminal}`, padding: '15px', marginBottom: '20px', backgroundColor: '#050705' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>CHOICE ID</label>
                  <input style={inputStyle} value={choice.choiceId} onChange={e => updateChoice(choice.id, 'choiceId', e.target.value)} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>BUTTON LABEL</label>
                  <input style={inputStyle} value={choice.label} onChange={e => updateChoice(choice.id, 'label', e.target.value)} />
                </div>
              </div>

              <label style={labelStyle}>CONDITION (Optional TS Logic - e.g., !state.flags['door_opened'])</label>
              <input style={inputStyle} value={choice.condition} onChange={e => updateChoice(choice.id, 'condition', e.target.value)} placeholder="Leave blank for always available" />
              
              <div style={{ marginTop: '10px' }}>
                <label style={labelStyle}>POST-CHOICE NARRATIVE (Updates scene text without branching to a new node)</label>
                <textarea style={{...inputStyle, height: '60px', resize: 'vertical', marginBottom: '0'}} value={choice.responseText} onChange={e => updateChoice(choice.id, 'responseText', e.target.value)} placeholder="Text to display after player clicks this choice..." />
              </div>

              <div style={{ marginTop: '15px', padding: '10px', border: `1px dashed ${theme.borderTerminal}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: theme.textBright }}>ACTIONS TRAY</span>
                  <div>
                    <button onClick={() => branchToNewScene(choice.id)} style={{ padding: '4px 8px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontSize: '0.8rem', marginRight: '10px', fontWeight: 'bold' }}>🔀 BRANCH TO NEW SCENE</button>
                    <button onClick={() => addAction(choice.id)} style={{ padding: '4px 8px', backgroundColor: 'transparent', color: theme.textTerminal, border: `1px solid ${theme.textTerminal}`, cursor: 'pointer', fontSize: '0.8rem' }}>+ ACTION</button>
                  </div>
                </div>

                {choice.actions.map(action => (
                  <div key={action.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select style={{...inputStyle, marginBottom: 0, width: '30%'}} value={action.type} onChange={e => updateAction(choice.id, action.id, 'type', e.target.value)}>
                      <option value="SET_FLAG">SET_FLAG</option>
                      <option value="SET_CURRENT_NODE">SET_CURRENT_NODE</option>
                      <option value="MODIFY_INVENTORY">MODIFY_INVENTORY</option>
                      <option value="GATHER_INTEL">GATHER_INTEL</option>
                      <option value="ADD_LEAD">ADD_LEAD</option>
                      <option value="ADVANCE_TIME">ADVANCE_TIME</option>
                      <option value="MODIFY_SECTOR_ENTROPY">MODIFY_SECTOR_ENTROPY</option>
                      <option value="MODIFY_HUMANITY">MODIFY_HUMANITY</option>
                    </select>
                    
                    {/* If linking to a node, show a dropdown of available scenes instead of a text input */}
                    {action.type === 'SET_CURRENT_NODE' ? (
                       <select style={{...inputStyle, marginBottom: 0, width: '60%'}} value={action.payloadValue} onChange={e => updateAction(choice.id, action.id, 'payloadValue', e.target.value)}>
                         <option value="">Select Target Scene...</option>
                         {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                       </select>
                    ) : (
                      <>
                        <input style={{...inputStyle, marginBottom: 0, width: '30%'}} value={action.payloadKey} onChange={e => updateAction(choice.id, action.id, 'payloadKey', e.target.value)} placeholder="Key/ID (e.g. obols)" />
                        <input style={{...inputStyle, marginBottom: 0, width: '30%'}} value={action.payloadValue} onChange={e => updateAction(choice.id, action.id, 'payloadValue', e.target.value)} placeholder="Value/Amount (e.g. 10)" />
                      </>
                    )}
                    
                    <button onClick={() => removeAction(choice.id, action.id)} style={{ padding: '8px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer' }}>X</button>
                  </div>
                ))}
              </div>
              <button onClick={() => removeChoice(choice.id)} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}>DELETE CHOICE</button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. RIGHT PANEL: COMPILER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000', borderLeft: `1px solid ${theme.borderTerminal}` }}>
        <button onClick={handleExport} style={{ padding: '20px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '2px' }}>
          &gt; COMPILE BRANCH TO CLIPBOARD
        </button>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, color: '#a8ccaf', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {generateScript()}
          </pre>
        </div>
      </div>

    </div>
  );
}