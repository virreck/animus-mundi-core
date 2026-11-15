// src/ui/session/roomOps.ts
// Recon and movement: scan, decoy, trap counters and room entry.
import { HAZARD_MANIFEST, type SubGridNode } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import type { SectorRules } from './sectorRules';
import type { SessionCore } from './useSessionCore';

/** What a scan reports about a room, by room type (anchors are the fallback). */
const SCAN_SIGNATURE: Partial<Record<SubGridNode['nodeType'], string>> = {
  ANOMALY: '<span style="color:#62f080;">[CLUE SIGNAL DETECTED]</span>',
  SHRINE: '<span style="color:#00f3ff;">[DORMANT KAMI SHRINE]</span>',
  PATROL: '<span style="color:#ff2a55;">[MALLEUS HOUND PATROL INSIDE!]</span>',
  WITNESS: '<span style="color:#00f3ff;">[CIVILIAN WITNESS — LIFE SIGNS]</span>'
};
const ANCHOR_SIGNATURE = '<span style="color:#ffb800;">[GOETIAN CONDUIT ANCHOR]</span>';

function thresholdNote(node: SubGridNode): string {
  if (node.patrolActive) return `<br/><span style="color:#ff2a55;">⚠️ THRESHOLD ALERT: Malleus Hound Patrol inside.</span>`;
  if (node.hazard !== 'NONE') return `<br/><span style="color:#00f3ff;">⚠️ THRESHOLD ANOMALY: "${HAZARD_MANIFEST[node.hazard].symptom}"</span>`;
  return `<br/><span style="color:#62f080;">✓ Threshold clear.</span>`;
}

/** Flavour line for the first look inside an uncleared room. */
function arrivalNote(node: SubGridNode): string | null {
  if (node.status === 'CLEARED') return null;
  if (node.rawSignalSymptom) return `[🔎 SIGNAL] <em>"${node.rawSignalSymptom}"</em>`;
  if (node.nodeType === 'SHRINE') return `[⛩️ SHRINE] A dormant spirit altar. Offerings still wet.`;
  if (node.nodeType === 'WITNESS') return `[🗣 LIFE SIGNS] Someone is huddled in the corner, staring at nothing.`;
  return null;
}

const patchNode = (nodes: SubGridNode[], nodeId: string, patch: Partial<SubGridNode>) =>
  nodes.map(n => (n.id === nodeId ? { ...n, ...patch } : n));

/** Recon and movement: scan, decoy, trap counters and room entry. */
export function createRoomOps(s: SessionCore & SectorRules) {
  const {
    state,
    dispatch,
    updateContract,
    visualFxRef,
    isSectorSecured,
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

  /** Shared checks for scanning and entering: no case, lost, secured, or cordoned. True = stop. */
  const sectorUnavailable = (securedMsg: string): boolean => {
    if (!currentContract) return true;
    if (blockIfSectorLost()) return true;
    if (isSectorSecured(currentContract.sectorId)) {
      appendLog(securedMsg, 'success');
      return true;
    }
    if (currentHeat >= 100) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[!] MALLEUS CORDON ACTIVE — SECTOR HEAT 100%.`, 'error');
      return true;
    }
    return false;
  };

  /** Explains which rooms can be reached from here. True = the node is out of reach. */
  const outOfReach = (node: SubGridNode, prefix: string): boolean => {
    if (isAdjacentOrEntry(node)) return false;
    ThaumaturgicAudio.errorBuzz();
    const reachableList = (currentContract?.subNodes || []).filter(n => isAdjacentOrEntry(n)).map(n => `Room ${n.index}`).join(', ');
    appendLog(`[-] ${prefix}: <strong>${node.label}</strong>. Linked from ${currentSubNode?.label ?? 'PERIMETER'}: ${reachableList}.`, 'error');
    return true;
  };

  const handleScanRoom = (targetNode?: SubGridNode | null) => {
    if (sectorUnavailable(`[✓] Sector SECURED. It will lie dormant for a while. Switch to REGIONAL MAP to deploy elsewhere.`)) return;
    const contract = currentContract!;
    const node = targetNode || selectedSubNode;
    if (!node) return;
    if (node.status !== 'LOCKED') {
      appendLog(`[i] <strong>${node.label}</strong> is already ${node.status}.`, 'system');
      return;
    }
    if (outOfReach(node, 'NO LINE OF SIGHT')) return;

    const humCost = state.tetheredYokai.length > 0 ? 2 : 5;
    if (state.humanity <= humCost) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] TETHER TOO WEAK TO SCAN.`, 'error');
      return;
    }

    ThaumaturgicAudio.scryPing();
    dispatch({ type: 'MODIFY_HUMANITY', payload: -humCost });
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 1.0 });

    updateContract(contract.sectorId, c => ({ ...c, selectedSubNodeId: node.id, subNodes: patchNode(c.subNodes, node.id, { status: 'SCANNED' }) }));

    const entryHeat = getRoomEntryHeatCost(node);
    const sigDesc = SCAN_SIGNATURE[node.nodeType] ?? ANCHOR_SIGNATURE;
    const warningTxt = `<br/><span style="color:#a8ccaf;">• Entry Ward Cost: <strong>+${entryHeat}% Heat</strong></span>` + thresholdNote(node);

    appendLog(`[📡 SCAN] <strong>${node.label}</strong> (-${humCost}% HUM): ${sigDesc}${warningTxt}`, 'info');
  };

  const resolveCounterTarget = (arg?: string): SubGridNode | null => {
    if (!currentContract) return null;
    if (arg?.trim()) return resolveTargetRoom(arg);
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
    updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: target.id, subNodes: patchNode(c.subNodes, target.id, { patrolActive: false }) }));
    appendLog(`[✓ DECOY DEPLOYED on <strong>${target.label}</strong>] Phantom signal lured the Malleus Hound Patrol away.`, 'success');
    addToast(`Patrol Cleared in ${target.label}!`, 'SEAL');
  };

  const handleAttemptTrapCounter = (cmdUsed: string, arg?: string) => {
    if (!currentContract) return;
    if (blockIfSectorLost()) return;
    const target = resolveCounterTarget(arg);
    if (!target) return;

    if (target.status === 'LOCKED') {
      appendLog(`[-] THRESHOLD UNREAD: <strong>${target.label}</strong>.`, 'warn');
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
    updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: target.id, subNodes: patchNode(c.subNodes, target.id, { hazard: 'NONE' }) }));

    if (target.hazard === 'WIRE') {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -10 } });
    }
    appendLog(`[✓ TRAP DISARMED on <strong>${target.label}</strong>] ${hazardSpec.clearMsg}`, 'success');

    if (target.rawSignalSymptom && target.status !== 'CLEARED' && currentSubNode?.id === target.id) {
      appendLog(`[🔎 CLUE SIGNAL in <strong>${target.label}</strong>] <em>"${target.rawSignalSymptom}"</em>`, 'info');
    }
    addToast(`Disarmed: ${hazardSpec.label}`, 'SEAL');
  };

  /** Walking through a live patrol or trap: damage, extra heat, and the obstacle is spent. */
  const springThreshold = (node: SubGridNode, baseHeat: number) => {
    if (node.patrolActive) {
      const heatGain = baseHeat + scaleHeat(20);
      dispatch({ type: 'MODIFY_HUMANITY', payload: -12 });
      triggerHudFlash('DAMAGE');
      appendLog(`[!] WALKED INTO MALLEUS PATROL in <strong>${node.label}</strong>! Witch-hounds ambushed your tether (-12% HUM, +${heatGain}% Heat)!`, 'error');
      addToast(`Malleus Ambush! -12% Humanity`, 'ALERT');
      return { heatGain, patch: { patrolActive: false } as Partial<SubGridNode> };
    }
    if (node.hazard !== 'NONE') {
      const trapName = HAZARD_MANIFEST[node.hazard].label;
      const trapHumPenalty = state.tetheredYokai.includes('yokai_baku') ? -4 : -8;
      const heatGain = baseHeat + scaleHeat(10);
      dispatch({ type: 'MODIFY_HUMANITY', payload: trapHumPenalty });
      triggerHudFlash('DAMAGE');
      appendLog(`[💥 THRESHOLD TRAP TRIGGERED in <strong>${node.label}</strong>!] Walked through a live <strong>${trapName}</strong> (${trapHumPenalty}% HUM, +${heatGain}% Total Heat)!`, 'error');
      addToast(`Triggered ${trapName}! (${trapHumPenalty}% HUM)`, 'ALERT');
      return { heatGain, patch: { hazard: 'NONE' } as Partial<SubGridNode> };
    }
    appendLog(`[⚡ ENTER] Moved into <strong>${node.label}</strong> (+${baseHeat}% Inquisition Heat).`, 'info');
    return { heatGain: baseHeat, patch: {} as Partial<SubGridNode> };
  };

  const handleEnterRoom = (targetNode?: SubGridNode | null) => {
    if (sectorUnavailable(`[✓] Sector already SECURED.`)) return;
    const contract = currentContract!;
    const node = targetNode || selectedSubNode;
    if (!node) return;
    if (node.id === currentSubNode?.id) {
      appendLog(`[i] Already positioned inside <strong>${node.label}</strong>.`, 'system');
      return;
    }
    if (outOfReach(node, 'NO ROUTE')) return;

    ThaumaturgicAudio.senseSweep();
    addMicroEntropy(0.01);
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 8, alpha: 1.0 });

    const { heatGain, patch } = springThreshold(node, getRoomEntryHeatCost(node));
    if (node.nodeType === 'ANCHOR') {
      appendLog(`[⚡ CONDUIT ANCHOR] The air is thick enough to chew. Your vessel hums against your ribs.`, 'warn');
    }
    const arrival = arrivalNote(node);
    if (arrival) appendLog(arrival, 'info');

    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: heatGain } });
    if (currentHeat + heatGain >= 100) {
      ThaumaturgicAudio.errorBuzz();
      triggerHudFlash('DAMAGE');
      appendLog(`<div style="background:rgba(255,42,85,0.2);border:1px solid #ff2a55;padding:8px;color:#ff2a55;font-weight:bold;">[🚨 100% INQUISITION HEAT — SECTOR LOCKDOWN!]</div>`, 'error');
    }

    const firstEntry = node.status === 'LOCKED' || node.status === 'SCANNED';
    updateContract(contract.sectorId, c => ({
      ...c,
      activeSubNodeId: node.id,
      selectedSubNodeId: node.id,
      subNodes: patchNode(c.subNodes, node.id, firstEntry ? { ...patch, status: 'ENTERED' } : patch)
    }));
  };


  return {
    handleScanRoom,
    resolveCounterTarget,
    handleDecoyPatrol,
    handleAttemptTrapCounter,
    handleEnterRoom
  };
}

export type RoomOps = ReturnType<typeof createRoomOps>;
