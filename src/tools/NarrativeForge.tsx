import { useState } from 'react';

// --- TYPES FOR THE EDITOR ---
type ActionType = 'SET_FLAG' | 'MODIFY_INVENTORY' | 'GATHER_INTEL' | 'ADD_LEAD' | 'ADVANCE_TIME' | 'MODIFY_SECTOR_ENTROPY' | 'MODIFY_HUMANITY' | 'MODIFY_GLOBAL_ENTROPY';

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
  actions: EditorAction[];
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
  const [nodeId, setNodeId] = useState('new_sector');
  const [title, setTitle] = useState('UNKNOWN SECTOR');
  const [baseText, setBaseText] = useState('The logic fog is thick here...');
  const [choices, setChoices] = useState<EditorChoice[]>([]);

  // --- HANDLERS ---
  const addChoice = () => {
    setChoices([...choices, { id: Date.now().toString(), choiceId: 'new_choice', label: 'DO SOMETHING', condition: '', actions: [] }]);
  };

  const updateChoice = (id: string, field: keyof EditorChoice, value: any) => {
    setChoices(choices.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeChoice = (id: string) => {
    setChoices(choices.filter(c => c.id !== id));
  };

  const addAction = (choiceId: string) => {
    setChoices(choices.map(c => {
      if (c.id === choiceId) {
        return { ...c, actions: [...c.actions, { id: Date.now().toString(), type: 'SET_FLAG', payloadKey: 'flag_name', payloadValue: 'true' }] };
      }
      return c;
    }));
  };

  const updateAction = (choiceId: string, actionId: string, field: keyof EditorAction, value: string) => {
    setChoices(choices.map(c => {
      if (c.id === choiceId) {
        return { ...c, actions: c.actions.map(a => a.id === actionId ? { ...a, [field]: value } : a) };
      }
      return c;
    }));
  };

  const removeAction = (choiceId: string, actionId: string) => {
    setChoices(choices.map(c => {
      if (c.id === choiceId) return { ...c, actions: c.actions.filter(a => a.id !== actionId) };
      return c;
    }));
  };

  // --- EXPORT COMPILER ---
  const generateScript = () => {
    const camelNodeId = nodeId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    let script = `// src/content/narrative/${nodeId}.ts\n`;
    script += `import type { GameState } from '../../engine/state';\n`;
    script += `import type { GameAction } from '../../engine/reducer';\n\n`;
    
    script += `export const ${camelNodeId} = {\n`;
    script += `  title: "${title}",\n`;
    script += `  text: (state: GameState) => {\n`;
    script += `    let narrative = "${baseText.replace(/\n/g, '\\n')}";\n`;
    script += `    // Add dynamic text conditions here based on state.flags if needed\n`;
    script += `    return narrative;\n`;
    script += `  },\n`;
    script += `  choices: [\n`;

    choices.forEach((c, idx) => {
      script += `    {\n`;
      script += `      id: "${c.choiceId}",\n`;
      script += `      label: "${c.label}",\n`;
      if (c.condition) {
        script += `      condition: (state: GameState) => ${c.condition},\n`;
      }
      script += `      actions: [\n`;
      
      c.actions.forEach((a, aIdx) => {
        let payloadStr = '';
        if (a.type === 'SET_FLAG') payloadStr = `{ flagId: '${a.payloadKey}', value: ${a.payloadValue} }`;
        else if (a.type === 'MODIFY_INVENTORY') payloadStr = `{ itemId: '${a.payloadKey}', amount: ${a.payloadValue} }`;
        else if (a.type === 'ADD_LEAD') payloadStr = `{ id: '${a.payloadKey}', text: '${a.payloadValue.replace(/'/g, "\\'")}' }`;
        else if (a.type === 'GATHER_INTEL') payloadStr = `'${a.payloadKey}'`;
        else if (a.type === 'MODIFY_SECTOR_ENTROPY') payloadStr = `{ nodeId: '${a.payloadKey || nodeId}', amount: ${a.payloadValue} }`;
        else payloadStr = `${a.payloadValue}`; // For flat numbers like ADVANCE_TIME

        script += `        { type: '${a.type}', payload: ${payloadStr} }${aIdx < c.actions.length - 1 ? ',' : ''}\n`;
      });

      script += `      ] as GameAction[]\n`;
      script += `    }${idx < choices.length - 1 ? ',' : ''}\n`;
    });

    script += `  ]\n};\n`;
    return script;
  };

  const handleExport = () => {
    const script = generateScript();
    navigator.clipboard.writeText(script);
    alert(`Node [${nodeId}] copied to clipboard! Drop it into your narrative folder.`);
  };

  // --- UI STYLES ---
  const inputStyle = { width: '100%', padding: '8px', backgroundColor: 'black', color: theme.textBright, border: `1px solid ${theme.borderTerminal}`, fontFamily: theme.fontMono, outline: 'none', marginBottom: '10px' };
  const labelStyle = { display: 'block', fontSize: '0.8rem', color: theme.textMuted, marginBottom: '4px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bgDark, color: theme.textTerminal, fontFamily: theme.fontMono, padding: '40px', display: 'flex', gap: '40px' }}>
      
      {/* EDITOR PANEL */}
      <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '30px', overflowY: 'auto', maxHeight: '90vh' }}>
        <h1 style={{ borderBottom: `1px dashed ${theme.textTerminal}`, paddingBottom: '10px', color: theme.textBright, letterSpacing: '2px' }}>&gt; THAUMATURGIC_OS // NARRATIVE_FORGE</h1>
        
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>NODE ID (File Name)</label>
          <input style={inputStyle} value={nodeId} onChange={e => setNodeId(e.target.value)} placeholder="e.g. caterham_asylum" />
          
          <label style={labelStyle}>NODE TITLE (Display Name)</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. ABANDONED ASYLUM" />

          <label style={labelStyle}>BASE NARRATIVE TEXT</label>
          <textarea style={{...inputStyle, height: '120px', resize: 'vertical'}} value={baseText} onChange={e => setBaseText(e.target.value)} placeholder="Describe the scene..." />
        </div>

        <div style={{ marginTop: '30px', borderTop: `1px solid ${theme.borderTerminal}`, paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: theme.textBright, fontSize: '1.2rem', margin: 0 }}>&gt; CHOICES & BRANCHES</h2>
            <button onClick={addChoice} style={{ padding: '8px 15px', backgroundColor: theme.textTerminal, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ ADD CHOICE</button>
          </div>

        {choices.map((choice) => (
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

              <div style={{ marginTop: '15px', padding: '10px', border: `1px dashed ${theme.borderTerminal}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: theme.textBright }}>ACTIONS TRAY</span>
                  <button onClick={() => addAction(choice.id)} style={{ padding: '4px 8px', backgroundColor: 'transparent', color: theme.textTerminal, border: `1px solid ${theme.textTerminal}`, cursor: 'pointer', fontSize: '0.8rem' }}>+ ACTION</button>
                </div>

                {choice.actions.map(action => (
                  <div key={action.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select style={{...inputStyle, marginBottom: 0, width: '30%'}} value={action.type} onChange={e => updateAction(choice.id, action.id, 'type', e.target.value)}>
                      <option value="SET_FLAG">SET_FLAG</option>
                      <option value="MODIFY_INVENTORY">MODIFY_INVENTORY</option>
                      <option value="GATHER_INTEL">GATHER_INTEL</option>
                      <option value="ADD_LEAD">ADD_LEAD</option>
                      <option value="ADVANCE_TIME">ADVANCE_TIME</option>
                      <option value="MODIFY_SECTOR_ENTROPY">MODIFY_SECTOR_ENTROPY</option>
                      <option value="MODIFY_HUMANITY">MODIFY_HUMANITY</option>
                    </select>
                    <input style={{...inputStyle, marginBottom: 0, width: '30%'}} value={action.payloadKey} onChange={e => updateAction(choice.id, action.id, 'payloadKey', e.target.value)} placeholder="Key/ID (e.g. obols)" />
                    <input style={{...inputStyle, marginBottom: 0, width: '30%'}} value={action.payloadValue} onChange={e => updateAction(choice.id, action.id, 'payloadValue', e.target.value)} placeholder="Value/Amount (e.g. 10)" />
                    <button onClick={() => removeAction(choice.id, action.id)} style={{ padding: '8px', backgroundColor: theme.accentRed, color: 'white', border: 'none', cursor: 'pointer' }}>X</button>
                  </div>
                ))}
              </div>
              <button onClick={() => removeChoice(choice.id)} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: 'transparent', color: theme.accentRed, border: `1px solid ${theme.accentRed}`, cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}>DELETE CHOICE</button>
            </div>
          ))}
        </div>
      </div>

      {/* COMPILER PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <button onClick={handleExport} style={{ padding: '15px', backgroundColor: theme.textBright, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '2px' }}>
          &gt; COMPILE & COPY TO CLIPBOARD
        </button>
        <div style={{ flex: 1, backgroundColor: '#000', border: `1px solid ${theme.borderTerminal}`, padding: '20px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, color: '#a8ccaf', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {generateScript()}
          </pre>
        </div>
      </div>

    </div>
  );
}