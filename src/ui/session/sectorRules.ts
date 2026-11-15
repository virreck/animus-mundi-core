// src/ui/session/sectorRules.ts
// Shared sector rules: room targeting, adjacency, quirk-scaled heat, lost-sector guard.
import { allGoetia } from '../../content/goetia';
import { SECTOR_QUIRKS, type SubGridNode, getSectorQuirk } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import { escapeHtml } from '../theme';
import type { SessionCore } from './useSessionCore';

/** Shared sector rules: room targeting, adjacency, quirk-scaled heat, lost-sector guard. */
export function createSectorRules(s: SessionCore) {
  const {
    state,
    dispatch,
    selectedSuspectId,
    isSectorLost,
    appendLog,
    currentContract,
    currentSubNode,
    selectedSubNode,
    caseEvidence
  } = s;

  const resolveTargetRoom = (arg?: string): SubGridNode | null => {
    if (!currentContract) return null;
    if (!arg || !arg.trim()) return selectedSubNode || currentSubNode;
    const num = parseInt(arg.trim(), 10);
    if (!isNaN(num)) return currentContract.subNodes.find(n => n.index === num) || null;
    return currentContract.subNodes.find(n => n.label.toLowerCase().includes(arg.toLowerCase())) || null;
  };

  const isAdjacentOrEntry = (targetNode: SubGridNode): boolean => {
    if (!currentSubNode) return targetNode.index === 1;
    return currentSubNode.connections.includes(targetNode.id);
  };

  const currentQuirk = getSectorQuirk(currentContract);
  /** Applies the current sector's quirk multiplier to a heat gain (losses pass through). */
  const scaleHeat = (amount: number) =>
    amount > 0 ? Math.max(1, Math.round(amount * SECTOR_QUIRKS[currentQuirk].heatMultiplier)) : amount;
  /** Adds (quirk-scaled) heat to the current sector and returns the amount applied. */
  const addSectorHeat = (amount: number) => {
    const applied = scaleHeat(amount);
    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: applied } });
    return applied;
  };

  const getRoomEntryHeatCost = (node: SubGridNode): number => {
    const firstEntry = node.status === 'LOCKED' || node.status === 'SCANNED';
    return scaleHeat(firstEntry ? node.wardLevel * 8 : 2);
  };

  /** Logs and returns true when the current sector has been lost to a released demon. */
  const blockIfSectorLost = (): boolean => {
    if (!currentContract || !isSectorLost(currentContract.sectorId)) return false;
    ThaumaturgicAudio.errorBuzz();
    const demon = allGoetia.find(g => g.id === currentContract.targetGoetiaId);
    appendLog(`[✗] SECTOR LOST: <strong>${escapeHtml(demon?.name.toUpperCase() || 'THE ANCHOR')}</strong> has manifested here and can no longer be contained. Switch to the REGIONAL MAP and deploy elsewhere.`, 'error');
    return true;
  };


  const activeSectorClueCount = caseEvidence.length;
  const activeReadingCount = caseEvidence.filter(l => l.kind === 'PHENOMENON').length;

  const selectedSuspect = allGoetia.find(g => g.id === selectedSuspectId) || allGoetia[0];
  const selectedRoomHeatCost = selectedSubNode ? getRoomEntryHeatCost(selectedSubNode) : 8;


  return {
    resolveTargetRoom,
    isAdjacentOrEntry,
    currentQuirk,
    scaleHeat,
    addSectorHeat,
    getRoomEntryHeatCost,
    blockIfSectorLost,
    activeSectorClueCount,
    activeReadingCount,
    selectedSuspect,
    selectedRoomHeatCost
  };
}

export type SectorRules = ReturnType<typeof createSectorRules>;
