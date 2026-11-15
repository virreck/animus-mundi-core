// src/ui/session/roomOps.ts
// Recon and movement: scan, decoy, trap counters and room entry.
import { HAZARD_MANIFEST, type SubGridNode } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import type { SectorRules } from './sectorRules';
import type { SessionCore } from './useSessionCore';

/** Recon and movement: scan, decoy, trap counters and room entry. */
export function createRoomOps(s: SessionCore & SectorRules) {
  const {
    state,
    dispatch,
    updateContract,
    visualFxRef,
    isSectorSecured,
    consumeFirstTimeHint,
    triggerHudFlash,
    addMicroEntropy,
    addToast,
    appendLog,
    currentContract,
    currentSubNode,
    selectedSubNode,
    currentHeat,
    resolveTargetRoom,
    isAdjacentOrEntry,
    scaleHeat,
    addSectorHeat,
    getRoomEntryHeatCost,
    blockIfSectorLost
  } = s;

  const handleScanRoom = (targetNode?: SubGridNode | null) => {
    if (!currentContract) return;
    if (blockIfSectorLost()) return;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(`[✓] Sector is permanently SECURED. Switch to REGIONAL MAP to deploy elsewhere.`, 'success');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS LOCKDOWN (100% HEAT)! Execute <code>spoof</code> or <code>bribe</code> first.`, 'error');
      return;
    }

    const node = targetNode || selectedSubNode;
    if (!node) return;
    if (node.status !== 'LOCKED') {
      appendLog(`[i] <strong>${node.label}</strong> is already ${node.status}.`, 'system');
      return;
    }
    if (!isAdjacentOrEntry(node)) {
      ThaumaturgicAudio.errorBuzz();
      const reachableList = currentContract.subNodes.filter(n => isAdjacentOrEntry(n)).map(n => `Room ${n.index}`).join(', ');
      appendLog(`[-] Cannot scan <strong>${node.label}</strong>—not connected to your current position (${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}). Reachable rooms: <strong>${reachableList}</strong>.`, 'error');
      return;
    }

    const humCost = state.tetheredYokai.length > 0 ? 2 : 5;
    if (state.humanity <= humCost) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Insufficient Humanity to run Auspex Scan.`, 'error');
      return;
    }

    ThaumaturgicAudio.scryPing();
    dispatch({ type: 'MODIFY_HUMANITY', payload: -humCost });
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 1.0 });

    const updatedNodes = (nodes: SubGridNode[]) => nodes.map(n =>
      n.id === node.id ? { ...n, status: 'SCANNED' as const } : n
    );
    updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: node.id, subNodes: updatedNodes(c.subNodes) }));

    const entryHeat = getRoomEntryHeatCost(node);
    const sigDesc =
      node.nodeType === 'ANOMALY' ? '<span style="color:#62f080;">[CLUE SIGNAL DETECTED]</span>' :
      node.nodeType === 'SHRINE' ? '<span style="color:#00f3ff;">[DORMANT KAMI SHRINE]</span>' :
      node.nodeType === 'PATROL' ? '<span style="color:#ff2a55;">[MALLEUS HOUND PATROL INSIDE!]</span>' :
      node.nodeType === 'WITNESS' ? '<span style="color:#00f3ff;">[CIVILIAN WITNESS — LIFE SIGNS]</span>' :
      '<span style="color:#ffb800;">[GOETIAN CONDUIT ANCHOR]</span>';

    let warningTxt = `<br/><span style="color:#a8ccaf;">• Entry Ward Cost: <strong>+${entryHeat}% Heat</strong></span>`;
    if (node.patrolActive) {
      const patrolHint = consumeFirstTimeHint('patrol_scan')
        ? ` — Run <code>decoy ${node.index}</code> BEFORE entering to lure them away safely.`
        : '';
      warningTxt += `<br/><span style="color:#ff2a55;">⚠️ THRESHOLD ALERT: Malleus Hound Patrol inside!${patrolHint}</span>`;
    } else if (node.hazard !== 'NONE') {
      const trapHint = consumeFirstTimeHint('trap_scan')
        ? ` — Disarm BEFORE entering (<code>degauss ${node.index}</code> / <code>bypass ${node.index}</code> / <code>purge ${node.index}</code> / <code>dispel ${node.index}</code>).`
        : '';
      warningTxt += `<br/><span style="color:#00f3ff;">⚠️ THRESHOLD TRAP: "${HAZARD_MANIFEST[node.hazard].symptom}"${trapHint}</span>`;
    } else {
      warningTxt += `<br/><span style="color:#62f080;">✓ Threshold clear.</span>`;
    }

    appendLog(`[📡 SCAN] <strong>${node.label}</strong> (-${humCost}% HUM): ${sigDesc}${warningTxt}`, 'info');
  };

  const resolveCounterTarget = (arg?: string): SubGridNode | null => {
    if (!currentContract) return null;
    if (arg && arg.trim()) return resolveTargetRoom(arg);
    if (selectedSubNode && selectedSubNode.status !== 'LOCKED' && (selectedSubNode.patrolActive || selectedSubNode.hazard !== 'NONE')) {
      return selectedSubNode;
    }
    if (currentSubNode && (currentSubNode.patrolActive || currentSubNode.hazard !== 'NONE')) {
      return currentSubNode;
    }
    return selectedSubNode || currentSubNode;
  };

  const handleDecoyPatrol = (arg?: string) => {
    if (!currentContract) return;
    if (blockIfSectorLost()) return;
    const target = resolveCounterTarget(arg);
    if (!target) return;

    if (!target.patrolActive) {
      appendLog(`[i] No active Malleus Patrol in <strong>${target.label}</strong>.`, 'system');
      return;
    }
    ThaumaturgicAudio.scryPing();
    triggerHudFlash('DECODE');
    const updatedNodes = (nodes: SubGridNode[]) => nodes.map(n =>
      n.id === target.id ? { ...n, patrolActive: false } : n
    );
    updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: target.id, subNodes: updatedNodes(c.subNodes) }));
    appendLog(`[✓ DECOY DEPLOYED on <strong>${target.label}</strong>] Phantom signal lured the Malleus Hound Patrol away.`, 'success');
    addToast(`Patrol Cleared in ${target.label}!`, 'SEAL');
  };

  const handleAttemptTrapCounter = (cmdUsed: string, arg?: string) => {
    if (!currentContract) return;
    if (blockIfSectorLost()) return;
    const target = resolveCounterTarget(arg);
    if (!target) return;

    if (target.status === 'LOCKED') {
      appendLog(`[-] Scan <strong>${target.label}</strong> first (<code>scan ${target.index}</code>) before attempting to disarm its threshold.`, 'warn');
      return;
    }
    if (target.hazard === 'NONE') {
      appendLog(`[i] No active trap in <strong>${target.label}</strong>.`, 'system');
      return;
    }

    const hazardSpec = HAZARD_MANIFEST[target.hazard];
    if (hazardSpec.counterCmd !== cmdUsed) {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      const shockHum = state.tetheredYokai.includes('yokai_baku') ? -3 : -6;
      dispatch({ type: 'MODIFY_HUMANITY', payload: shockHum });
      const shockHeat = addSectorHeat(8);
      appendLog(`[!] WRONG COUNTER-MEASURE on <strong>${target.label}</strong>! Running <code>${cmdUsed}</code> against <strong>${hazardSpec.label}</strong> caused a feedback shock (${shockHum}% HUM, +${shockHeat}% Heat)!`, 'error');
      addToast(`Wrong Counter-Command! ${shockHum}% HUM`, 'ALERT');
      return;
    }

    ThaumaturgicAudio.scryPing();
    triggerHudFlash('DECODE');
    const updatedNodes = (nodes: SubGridNode[]) => nodes.map(n =>
      n.id === target.id ? { ...n, hazard: 'NONE' as const } : n
    );
    updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: target.id, subNodes: updatedNodes(c.subNodes) }));

    if (target.hazard === 'WIRE') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -10 } });
    }
    appendLog(`[✓ TRAP DISARMED on <strong>${target.label}</strong>] ${hazardSpec.clearMsg}`, 'success');

    if (target.rawSignalSymptom && target.status !== 'CLEARED' && currentSubNode && currentSubNode.id === target.id) {
      appendLog(`[🔎 CLUE SIGNAL in <strong>${target.label}</strong>] <em>"${target.rawSignalSymptom}"</em>`, 'info');
    }
    addToast(`Disarmed: ${hazardSpec.label}`, 'SEAL');
  };

  const handleEnterRoom = (targetNode?: SubGridNode | null) => {
    if (!currentContract) return;
    if (blockIfSectorLost()) return;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(`[✓] Sector already SECURED.`, 'success');
      return;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] 100% HEAT LOCKDOWN! Run <code>spoof</code> or <code>bribe</code> to lift the Malleus cordon.`, 'error');
      return;
    }

    const node = targetNode || selectedSubNode;
    if (!node) return;
    if (currentSubNode && node.id === currentSubNode.id) {
      appendLog(`[i] Already positioned inside <strong>${node.label}</strong>.`, 'system');
      return;
    }
    if (!isAdjacentOrEntry(node)) {
      ThaumaturgicAudio.errorBuzz();
      const reachableList = currentContract.subNodes.filter(n => isAdjacentOrEntry(n)).map(n => `Room ${n.index}`).join(', ');
      appendLog(`[-] <strong>${node.label}</strong> is not connected to your current room (${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}). Connected rooms: <strong>${reachableList}</strong>.`, 'error');
      return;
    }

    ThaumaturgicAudio.senseSweep();
    addMicroEntropy(0.01);
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 8, alpha: 1.0 });

    let heatGain = getRoomEntryHeatCost(node);
    let patrolClearedOnImpact = false;
    let trapClearedOnImpact = false;

    if (node.patrolActive) {
      heatGain += scaleHeat(20);
      patrolClearedOnImpact = true;
      dispatch({ type: 'MODIFY_HUMANITY', payload: -12 });
      triggerHudFlash('DAMAGE');
      appendLog(`[!] WALKED INTO MALLEUS PATROL in <strong>${node.label}</strong>! Witch-hounds ambushed your tether (-12% HUM, +${heatGain}% Heat)!`, 'error');
      addToast(`Malleus Ambush! -12% Humanity`, 'ALERT');
    } else if (node.hazard !== 'NONE') {
      const trapName = HAZARD_MANIFEST[node.hazard].label;
      const trapHumPenalty = state.tetheredYokai.includes('yokai_baku') ? -4 : -8;
      heatGain += scaleHeat(10);
      trapClearedOnImpact = true;
      dispatch({ type: 'MODIFY_HUMANITY', payload: trapHumPenalty });
      triggerHudFlash('DAMAGE');
      appendLog(`[💥 THRESHOLD TRAP TRIGGERED in <strong>${node.label}</strong>!] Walked through a live <strong>${trapName}</strong> (${trapHumPenalty}% HUM, +${heatGain}% Total Heat)!`, 'error');
      addToast(`Triggered ${trapName}! (${trapHumPenalty}% HUM)`, 'ALERT');
    } else {
      appendLog(`[⚡ ENTER] Moved into <strong>${node.label}</strong> (+${heatGain}% Inquisition Heat).`, 'info');
    }

    if (node.nodeType === 'ANCHOR' && consumeFirstTimeHint('anchor_intro')) {
      appendLog(
        `<div style="border-left:2px solid #ffb800;padding-left:8px;margin:4px 0;color:#ffb800;">` +
        `<strong>[⚡ GOETIAN CONDUIT ANCHOR REACHED]</strong> This chamber is the epicenter of the demon's tear in reality. Type <code style="color:#62f080;">attune</code> to read which Horseman's <strong>court</strong> it serves (and gain <strong>+4s</strong> on this sector's Sealing Rite). Attune a second time for a costly deep reading of its <strong>rank</strong>.` +
        `</div>`,
        'warn'
      );
    }

    if (node.rawSignalSymptom && node.status !== 'CLEARED') {
      const toolHint = consumeFirstTimeHint('clue_tool_intro')
        ? ` — Match <code>vox</code> (Audio), <code>assay</code> (Matter), or <code>auspex</code> (Astral/Thermal) to decode.`
        : '';
      appendLog(`[🔎 CLUE SIGNAL IN <strong>${node.label}</strong>] <em>"${node.rawSignalSymptom}"</em>${toolHint}`, 'info');
    } else if (node.nodeType === 'SHRINE' && node.status !== 'CLEARED') {
      appendLog(`[⛩️ KAMI SHRINE] Dormant spirit altar found.`, 'info');
    } else if (node.nodeType === 'WITNESS' && node.status !== 'CLEARED') {
      appendLog(`[🗣 WITNESS] Someone is huddled in the corner, staring at nothing. Run <code>interview</code> to take their statement.`, 'info');
    }

    const newHeat = Math.min(100, currentHeat + heatGain);
    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: heatGain } });

    if (newHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      appendLog(`<div style="background:rgba(255,42,85,0.2);border:1px solid #ff2a55;padding:8px;color:#ff2a55;font-weight:bold;">[🚨 100% INQUISITION HEAT — SECTOR LOCKDOWN!]</div>`, 'error');
    }

    const firstEntry = node.status === 'LOCKED' || node.status === 'SCANNED';
    const updatedNodes = (nodes: SubGridNode[]) => nodes.map(n =>
      n.id === node.id
        ? {
            ...n,
            status: firstEntry ? ('ENTERED' as const) : n.status,
            patrolActive: patrolClearedOnImpact ? false : n.patrolActive,
            hazard: trapClearedOnImpact ? ('NONE' as const) : n.hazard
          }
        : n
    );

    updateContract(currentContract.sectorId, c => ({
      ...c,
      activeSubNodeId: node.id,
      selectedSubNodeId: node.id,
      subNodes: updatedNodes(c.subNodes)
    }));
  };

  /** Evidence already gathered in the current sector, by kind. */

  return {
    handleScanRoom,
    resolveCounterTarget,
    handleDecoyPatrol,
    handleAttemptTrapCounter,
    handleEnterRoom
  };
}

export type RoomOps = ReturnType<typeof createRoomOps>;
