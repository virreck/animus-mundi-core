// src/ui/session/evidenceOps.ts
// Evidence gathering: forensic tools, refine, witness interviews, anchor attunement, looting.
import { allGoetia } from '../../content/goetia';
import { allYokai } from '../../content/yokai';
import { AMBIGUITY_GROUPS, COURT_RESONANCE, DEEP_ATTUNE_COST, type EvidenceLog, RANK_RESONANCE, REFINE_COST, isAmbiguous } from '../../engine/evidence';
import { type ForensicChannel, HAZARD_MANIFEST, PHENOMENON_CATALOG, type SubGridNode } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import { escapeHtml, formatLabel } from '../theme';
import type { RoomOps } from './roomOps';
import type { SectorRules } from './sectorRules';
import type { SessionCore } from './useSessionCore';

/** Evidence gathering: forensic tools, refine, witness interviews, anchor attunement, looting. */
export function createEvidenceOps(s: SessionCore & SectorRules & RoomOps) {
  const {
    state,
    dispatch,
    updateContract,
    triggerHudFlash,
    addMicroEntropy,
    addToast,
    appendLog,
    currentContract,
    currentSubNode,
    currentHeat,
    addSectorHeat,
    blockIfSectorLost
  } = s;

  const sectorEvidence = (kind: EvidenceLog['kind']) => (currentContract?.discoveredLogs || []).filter(l => l.kind === kind);

  const addEvidence = (log: EvidenceLog) => {
    if (!currentContract) return;
    updateContract(currentContract.sectorId, c => ({
      ...c,
      discoveredLogs: c.discoveredLogs.some(l => l.id === log.id) ? c.discoveredLogs : [...c.discoveredLogs, log]
    }));
  };

  // The anchor is where the demon's tether is strongest. A first attunement reads its COURT
  // (and calibrates the vessel for +4s); a second, costlier deep attunement reads its RANK.
  const handleAttuneAnchor = () => {
    if (!currentContract || !currentSubNode) {
      appendLog(`[-] NO POSITION.`, 'error');
      return;
    }
    if (blockIfSectorLost()) return;
    if (currentSubNode.nodeType !== 'ANCHOR') {
      appendLog(`[-] NO CONDUIT IN RANGE.`, 'warn');
      return;
    }
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] VESSEL INTERFERENCE — THRESHOLD STILL LIVE.`, 'error');
      return;
    }
    const target = allGoetia.find(g => g.id === currentContract.targetGoetiaId);
    if (!target) return;
    const hasCourt = sectorEvidence('COURT').length > 0;
    const hasRank = sectorEvidence('RANK').length > 0;

    if (!hasCourt) {
      ThaumaturgicAudio.sealSuccess();
      triggerHudFlash('DECODE');
      dispatch({ type: 'SET_ATTUNED_SECTOR', payload: currentContract.sectorId });
      addEvidence({ id: `${currentContract.sectorId}_court`, kind: 'COURT', value: target.allegiance, nodeLabel: currentSubNode.label, channel: 'RESONANCE', text: COURT_RESONANCE[target.allegiance] });
      appendLog(
        `<div style="border-left:3px solid #ffb800;padding-left:10px;margin:4px 0;color:#ffb800;">` +
        `<strong>[⚡ VESSEL ATTUNED — COURT RESONANCE]</strong><br/>${COURT_RESONANCE[target.allegiance]}<br/>` +
        `<span style="color:#a8ccaf;">Vessel calibrated: +4s.</span>` +
        `</div>`,
        'success'
      );
      addToast(`Court: ${target.allegiance}`, 'INTEL');
      return;
    }
    if (!hasRank) {
      if (state.humanity <= DEEP_ATTUNE_COST.humanity) {
        ThaumaturgicAudio.errorBuzz();
        appendLog(`[-] TETHER TOO WEAK FOR A DEEP READING.`, 'error');
        return;
      }
      ThaumaturgicAudio.heavyStampImpact();
      triggerHudFlash('DAMAGE');
      dispatch({ type: 'MODIFY_HUMANITY', payload: -DEEP_ATTUNE_COST.humanity });
      const heat = addSectorHeat(DEEP_ATTUNE_COST.heat);
      addEvidence({ id: `${currentContract.sectorId}_rank`, kind: 'RANK', value: target.rank, nodeLabel: currentSubNode.label, channel: 'RESONANCE', text: RANK_RESONANCE[target.rank] });
      appendLog(
        `<div style="border-left:3px solid #ff2a55;padding-left:10px;margin:4px 0;color:#ffb3b3;">` +
        `<strong>[⚡ DEEP ATTUNEMENT — RANK RESONANCE]</strong> (-${DEEP_ATTUNE_COST.humanity}% HUM, +${heat}% Heat)<br/>${RANK_RESONANCE[target.rank]}` +
        `</div>`,
        'warn'
      );
      addToast(`Rank: ${target.rank.toUpperCase()}`, 'INTEL');
      return;
    }
    appendLog(`[i] Conduit exhausted. Resonance logged to case file.`, 'system');
  };

  const handleInterviewWitness = () => {
    if (!currentContract || !currentSubNode) {
      appendLog(`[-] NO POSITION.`, 'error');
      return;
    }
    if (blockIfSectorLost()) return;
    if (currentSubNode.nodeType !== 'WITNESS' || !currentSubNode.witnessText) {
      appendLog(`[-] NO SUBJECT PRESENT.`, 'warn');
      return;
    }
    if (currentSubNode.status === 'CLEARED') {
      appendLog(`[i] Statement already on file.`, 'system');
      return;
    }
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] Subject unresponsive: <em>"${HAZARD_MANIFEST[currentSubNode.hazard].symptom}"</em>`, 'error');
      return;
    }
    ThaumaturgicAudio.typewriterClack();
    triggerHudFlash('DECODE');
    addEvidence({
      id: `${currentSubNode.id}_witness`,
      kind: 'WITNESS',
      nodeLabel: currentSubNode.label,
      channel: 'WITNESS',
      witness: currentSubNode.witnessName,
      text: currentSubNode.witnessText
    });
    appendLog(
      `<div style="background:rgba(0,243,255,0.07);border-left:3px solid #00f3ff;padding:8px 10px;margin:4px 0;">` +
      `<div style="color:#00f3ff;font-weight:bold;">[🗣 WITNESS STATEMENT — ${escapeHtml(currentSubNode.witnessName || 'UNNAMED')}]</div>` +
      `<div style="color:#ffffff;margin-top:4px;">"${escapeHtml(currentSubNode.witnessText)}"</div>` +
      `</div>`,
      'success'
    );
    addToast('Statement on file', 'INTEL');
    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      appendLog(`[📦 The witness pressed something into your hand] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>.`, 'info');
    }
    const roomId = currentSubNode.id;
    updateContract(currentContract.sectorId, c => ({
      ...c,
      subNodes: c.subNodes.map(n => (n.id === roomId ? { ...n, status: 'CLEARED' as const } : n))
    }));
  };

  // Re-process a degraded reading to pin it to a single phenomenon. Works from anywhere in the sector.
  const handleRefineReading = (arg?: string) => {
    if (!currentContract) return;
    if (blockIfSectorLost()) return;
    const readings = sectorEvidence('PHENOMENON');
    const pending = readings.filter(isAmbiguous);
    if (pending.length === 0) {
      appendLog(readings.length === 0 ? `[-] NO READINGS ON FILE.` : `[i] NO DEGRADED READINGS.`, 'system');
      return;
    }
    const num = parseInt((arg || '').trim(), 10);
    const log = !isNaN(num) ? readings[num - 1] : pending[pending.length - 1];
    if (!log || !isAmbiguous(log)) {
      appendLog(`[-] READING ${escapeHtml(arg || '')} NOT DEGRADED. DEGRADED: ${pending.map(l => `#${readings.indexOf(l) + 1}`).join(', ')}.`, 'warn');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS CORDON ACTIVE — SIGNAL PROCESSING JAMMED.`, 'error');
      return;
    }
    if (state.humanity <= REFINE_COST.humanity) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] TETHER TOO WEAK TO REPROCESS.`, 'error');
      return;
    }
    const tag = log.trueTag || log.candidates![0];
    const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
    const preciseText = def ? def.forensicReports[Math.floor(Math.random() * def.forensicReports.length)] : log.text;
    ThaumaturgicAudio.scryPing();
    dispatch({ type: 'MODIFY_HUMANITY', payload: -REFINE_COST.humanity });
    const heat = addSectorHeat(REFINE_COST.heat);
    updateContract(currentContract.sectorId, c => ({
      ...c,
      discoveredLogs: c.discoveredLogs.map(l => (l.id === log.id ? { ...l, candidates: [tag], text: preciseText } : l))
    }));
    appendLog(
      `<div style="border-left:3px solid #62f080;padding-left:10px;margin:4px 0;">` +
      `<div style="color:#62f080;font-weight:bold;">[✓ READING #${readings.indexOf(log) + 1} REFINED → ${escapeHtml(def?.label || tag)}] (-${REFINE_COST.humanity}% HUM, +${heat}% Heat)</div>` +
      `<div style="color:#ffffff;margin-top:4px;">"${escapeHtml(preciseText)}"</div>` +
      `</div>`,
      'success'
    );
    addToast(`Reading resolved: ${def?.label || tag}`, 'INTEL');
  };

  const handleRunForensicTool = (toolCmd: string, expectedChannel: ForensicChannel, toolLabel: string) => {
    if (blockIfSectorLost()) return;
    if (!currentContract || !currentSubNode) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] NO POSITION.`, 'error');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS CORDON ACTIVE — INSTRUMENTS JAMMED.`, 'error');
      return;
    }
    if (currentSubNode.status === 'CLEARED') {
      appendLog(`[i] <strong>${currentSubNode.label}</strong> has already been cleared.`, 'system');
      return;
    }
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      const shockHum = state.tetheredYokai.includes('yokai_baku') ? -3 : -6;
      dispatch({ type: 'MODIFY_HUMANITY', payload: shockHum });
      const shockHeat = addSectorHeat(10);
      appendLog(`[!] FEEDBACK: <code>${toolCmd}</code> against <em>"${HAZARD_MANIFEST[currentSubNode.hazard].symptom}"</em> (${shockHum}% HUM, +${shockHeat}% Heat).`, 'error');
      addToast(`Feedback shock ${shockHum}% HUM`, 'ALERT');
      return;
    }

    if (currentSubNode.nodeType === 'WITNESS') {
      appendLog(`[i] Instruments pick up nothing but a frightened heartbeat.`, 'system');
      return;
    }
    if (!currentSubNode.signalChannel) {
      handleLootRoom(true);
      return;
    }

    if (currentSubNode.signalChannel !== expectedChannel) {
      ThaumaturgicAudio.errorBuzz();
      const wrongHeat = addSectorHeat(5);
      appendLog(`[-] ${toolLabel}: STATIC. (+${wrongHeat}% Heat)`, 'warn');
      addToast(`${toolLabel}: no signal`, 'ALERT');
      return;
    }

    ThaumaturgicAudio.sealSuccess();
    triggerHudFlash('DECODE');
    addMicroEntropy(0.01);
    const group = currentSubNode.ambiguityGroupId ? AMBIGUITY_GROUPS.find(g => g.id === currentSubNode.ambiguityGroupId) : undefined;
    const readingCount = sectorEvidence('PHENOMENON').length + 1;
    const newLog: EvidenceLog | null = currentSubNode.signTag ? {
      id: `${currentSubNode.id}_log`,
      kind: 'PHENOMENON',
      nodeLabel: currentSubNode.label,
      channel: expectedChannel,
      trueTag: currentSubNode.signTag,
      candidates: group ? group.tags : [currentSubNode.signTag],
      text: group ? group.report : currentSubNode.forensicText || ''
    } : null;
    if (newLog) {
      const options = (newLog.candidates || []).map(t => PHENOMENON_CATALOG.find(p => p.tag === t)?.label || t);
      appendLog(
        `<div style="background:rgba(98,240,128,0.09);border-left:3px solid ${group ? '#ffb800' : '#62f080'};padding:8px 10px;margin:4px 0;">` +
        `<div style="color:${group ? '#ffb800' : '#62f080'};font-weight:bold;">[${group ? '≈' : '✓'} ${toolLabel} // READING ${readingCount}/3 AT ${currentSubNode.label}${group ? ' — DEGRADED' : ''}]</div>` +
        `<div style="color:#ffffff;margin-top:4px;">"${escapeHtml(newLog.text)}"</div>` +
        (group
          ? `<div style="color:#a8ccaf;margin-top:4px;font-size:0.9em;">UNRESOLVED: <strong>${options.join(' / ')}</strong></div>`
          : '') +
        `</div>`,
        'success'
      );
      addToast(group ? `Reading ${readingCount}/3: degraded` : `Reading ${readingCount}/3 decoded`, 'INTEL');
    }

    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      appendLog(`[📦 SALVAGE] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>.`, 'info');
    }

    const updatedNodes = (nodes: SubGridNode[]) => nodes.map(n =>
      n.id === currentSubNode.id ? { ...n, status: 'CLEARED' as const } : n
    );

    updateContract(currentContract.sectorId, c => ({
      ...c,
      subNodes: updatedNodes(c.subNodes),
      discoveredLogs: newLog && !c.discoveredLogs.some(l => l.id === newLog.id) ? [...c.discoveredLogs, newLog] : c.discoveredLogs
    }));
  };

  const handleLootRoom = (bypassSignalCheck = false) => {
    if (blockIfSectorLost()) return;
    if (!currentContract || !currentSubNode) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] NO POSITION.`, 'error');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS CORDON ACTIVE — SECTOR HEAT 100%.`, 'error');
      return;
    }
    if (currentSubNode.status === 'CLEARED') {
      appendLog(`[i] <strong>${currentSubNode.label}</strong> is already cleared.`, 'system');
      return;
    }
    if (currentSubNode.hazard !== 'NONE') {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      dispatch({ type: 'MODIFY_HUMANITY', payload: -6 });
      const lootHeat = addSectorHeat(10);
      appendLog(`[!] FEEDBACK: <em>"${HAZARD_MANIFEST[currentSubNode.hazard].symptom}"</em> (-6% HUM, +${lootHeat}% Heat).`, 'error');
      return;
    }
    if (currentSubNode.nodeType === 'WITNESS') {
      appendLog(`[i] The witness flinches away from your hands.`, 'system');
      return;
    }
    if (!bypassSignalCheck && currentSubNode.signalChannel) {
      appendLog(`[!] UNDECODED SIGNAL: <em>"${currentSubNode.rawSignalSymptom}"</em>`, 'warn');
      return;
    }

    ThaumaturgicAudio.sealSuccess();
    triggerHudFlash('DECODE');
    addMicroEntropy(0.01);

    if (currentSubNode.nodeType === 'SHRINE' && currentSubNode.shrineYokaiId) {
      const yokai = allYokai.find(y => y.id === currentSubNode.shrineYokaiId);
      if (yokai && yokai.unlockFlag && state.flags[yokai.unlockFlag]) {
        // A page already written: the spirit remembers you
        dispatch({ type: 'ADD_BOND', payload: { yokaiId: yokai.id, amount: 1 } });
        appendLog(`[⛩️ SHRINE] ${escapeHtml(yokai.nameEn.toUpperCase())} remembers you. Bond deepens.`, 'success');
      } else if (yokai && yokai.unlockFlag) {
        dispatch({ type: 'SET_FLAG', payload: { flagId: yokai.unlockFlag, value: true } });
        appendLog(
          `<div style="border-left:3px solid #00f3ff;padding-left:10px;margin:4px 0;color:#00f3ff;">` +
          `<strong>[⛩️ SHRINE AWAKENED: ${yokai.nameEn.toUpperCase()}]</strong> A new page fills in the KAGE NO SHO.` +
          `</div>`,
          'success'
        );
        addToast(`Page written: ${yokai.nameEn}`, 'SEAL');
      }
    }

    if (currentSubNode.salvageDrop) {
      const { itemId, amount, obols } = currentSubNode.salvageDrop;
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: obols } });
      appendLog(`[📦 SALVAGE COLLECTED] +${amount}x <strong style="color:#ffb800;">${formatLabel(itemId)}</strong>, +${obols} <strong style="color:#ffb800;">OBOLS</strong>.`, 'info');
    }

    const updatedNodes = (nodes: SubGridNode[]) => nodes.map(n =>
      n.id === currentSubNode.id ? { ...n, status: 'CLEARED' as const } : n
    );

    updateContract(currentContract.sectorId, c => ({ ...c, subNodes: updatedNodes(c.subNodes) }));
  };


  return {
    sectorEvidence,
    addEvidence,
    handleAttuneAnchor,
    handleInterviewWitness,
    handleRefineReading,
    handleRunForensicTool,
    handleLootRoom
  };
}

export type EvidenceOps = ReturnType<typeof createEvidenceOps>;
