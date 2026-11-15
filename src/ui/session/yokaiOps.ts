// src/ui/session/yokaiOps.ts
// Yokai daemons: unbinding and active invocations.
import { allYokai } from '../../content/yokai';
import { YOKAI_DAEMON_SPECS } from '../../content/yokaiSpecs';
import { getMaxCharges, KAGE_TUNING } from '../../engine/kage';
import type { SubGridNode } from '../../engine/sectorGenerator';
import { ThaumaturgicAudio } from '../audio';
import { escapeHtml } from '../theme';
import type { EvidenceOps } from './evidenceOps';
import type { RoomOps } from './roomOps';
import type { SectorRules } from './sectorRules';
import type { SessionCore } from './useSessionCore';

/** Yokai daemons: unbinding and active invocations. */
export function createYokaiOps(s: SessionCore & SectorRules & RoomOps & EvidenceOps) {
  const {
    state,
    dispatch,
    updateContract,
    yokaiCharges,
    addMicroEntropy,
    addToast,
    appendLog,
    currentContract,
    selectedSubNode,
    isAdjacentOrEntry
  } = s;

  /** Severs a pact by hand. A spirit cut loose with charges left is offended for a while. */
  const handleUnbindYokai = (yokaiId: string, reason = 'Pact severed') => {
    ThaumaturgicAudio.errorBuzz();
    const hadCharges = (yokaiCharges[yokaiId] ?? getMaxCharges(state, yokaiId)) > 0;
    dispatch({ type: 'BREAK_PACT', payload: yokaiId });
    const yName = allYokai.find(y => y.id === yokaiId)?.nameEn || yokaiId;
    appendLog(
      `[*] PACT SEVERED: <strong style="color:#ff2a55;">${escapeHtml(yName)}</strong> (${escapeHtml(reason)}).` +
      (hadCharges ? ` It will not deal with you for ${KAGE_TUNING.brokenPactOffense} sectors.` : ''),
      'warn'
    );
    addToast(`Pact severed: ${yName}`, 'ALERT');
  };

  const reveal = (n: SubGridNode): SubGridNode => (n.status === 'LOCKED' ? { ...n, status: 'SCANNED' } : n);

  /** Each daemon's active power. Returns false if it could not be used (nothing is spent). */
  const ACTIVE_POWERS: Record<string, (codeName: string) => boolean> = {
    yokai_kitsune: codeName => {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -30 } });
      appendLog(`[👹 ${codeName} // FOXFIRE SHROUD] Injected phantom telemetry (-30% Inquisition Heat).`, 'success');
      return true;
    },
    yokai_tengu: codeName => {
      if (!currentContract) return false;
      if (state.humanity <= 5) { addToast('Requires 5% Humanity!', 'ALERT'); return false; }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -5 });
      updateContract(currentContract.sectorId, c => ({ ...c, subNodes: c.subNodes.map(reveal) }));
      appendLog(`[👹 ${codeName} // GALE SWEEP] Aerial LiDAR scanned every room (-5% HUM)!`, 'success');
      return true;
    },
    yokai_baku: codeName => {
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -15 } });
      dispatch({ type: 'MODIFY_HUMANITY', payload: 20 });
      appendLog(`[👹 ${codeName} // DEVOUR NIGHTMARE] Converted -15% Inquisition Heat into +20% Humanity.`, 'success');
      return true;
    },
    yokai_zashiki: codeName => {
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 35 } });
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'scrap_metal', amount: 1 } });
      appendLog(`[👹 ${codeName} // FORTUNE BOON] Liquidated syndicate cache for +35 Obols and +1 Scrap Metal!`, 'success');
      return true;
    },
    yokai_kameosa: codeName => {
      if (state.humanity <= 8) { addToast('Requires 8% Humanity!', 'ALERT'); return false; }
      dispatch({ type: 'MODIFY_HUMANITY', payload: -8 });
      ['scrap_metal', 'cursed_earth', 'alchemical_distillate'].forEach(itemId =>
        dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId, amount: 1 } }));
      appendLog(`[👹 ${codeName} // FERMENT MATTER] Synthesized +1 Metal, +1 Earth, and +1 Distillate (-8% HUM)!`, 'success');
      return true;
    },
    yokai_kamaitachi: codeName => {
      if (!currentContract || !selectedSubNode) return false;
      if (!isAdjacentOrEntry(selectedSubNode)) {
        addToast('Select a reachable adjacent room first!', 'ALERT');
        return false;
      }
      const targetId = selectedSubNode.id;
      updateContract(currentContract.sectorId, c => ({
        ...c,
        activeSubNodeId: targetId,
        subNodes: c.subNodes.map(n => (n.id === targetId ? { ...n, status: 'ENTERED' as const, hazard: 'NONE' as const, patrolActive: false } : n))
      }));
      appendLog(`[👹 ${codeName} // WIND SICKLE] Sliced silently into <strong>${selectedSubNode.label}</strong> (0% Heat, Patrols &amp; Traps disarmed)!`, 'success');
      return true;
    },
    yokai_amabie: codeName => {
      if ((state.inventory.obols || 0) < 10) { addToast('Requires 10 Obols!', 'ALERT'); return false; }
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -10 } });
      addMicroEntropy(-2.5);
      appendLog(`[👹 ${codeName} // PROPHETIC WARD] Purged -2.50% Global Entropy (-10 Obols).`, 'success');
      return true;
    },
    yokai_noppera: codeName => {
      if (currentContract) {
        updateContract(currentContract.sectorId, c => ({
          ...c,
          subNodes: c.subNodes.map(n => (n.patrolActive ? { ...reveal(n), patrolActive: false } : n))
        }));
      }
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -15 } });
      appendLog(`[👹 ${codeName} // FACELESS DECOY] Disarmed sector Malleus Patrols and dropped Heat by -15%.`, 'success');
      return true;
    }
  };

  const handleInvokeYokaiPower = (yokaiId: string) => {
    const spec = YOKAI_DAEMON_SPECS[yokaiId];
    if (!spec) return;
    const maxCharges = getMaxCharges(state, yokaiId);
    const currentCharges = yokaiCharges[yokaiId] ?? maxCharges;
    if (currentCharges <= 0) {
      handleUnbindYokai(yokaiId, 'Contract charges exhausted');
      return;
    }

    const yName = allYokai.find(y => y.id === yokaiId)?.nameEn || yokaiId;
    const power = ACTIVE_POWERS[yokaiId];
    // A power returns false when its cost can't be paid; nothing is spent then
    if (power && !power(spec.codeName)) return;

    ThaumaturgicAudio.scryPing();
    const remaining = currentCharges - 1;
    // The reducer decrements the charge and unbinds the daemon at zero, so the
    // power's own effects above are never rolled back.
    dispatch({ type: 'CONSUME_YOKAI_CHARGE', payload: { yokaiId } });

    if (remaining <= 0) {
      appendLog(`[*] BURNED DRY: <strong style="color:#ff2a55;">${escapeHtml(yName)}</strong> leaves your tether, offended.`, 'warn');
      addToast(`${yName} departs, offended`, 'ALERT');
    } else {
      addToast(`${yName}: ${remaining}/${maxCharges} charges`, 'SEAL');
    }
  };


  return {
    handleUnbindYokai,
    handleInvokeYokaiPower
  };
}

export type YokaiOps = ReturnType<typeof createYokaiOps>;
