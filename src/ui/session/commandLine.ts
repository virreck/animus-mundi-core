// src/ui/session/commandLine.ts
// Command-line parser that routes typed / palette commands to field operations.
import { ThaumaturgicAudio } from '../audio';
import { escapeHtml } from '../theme';
import type { EvidenceOps } from './evidenceOps';
import type { RoomOps } from './roomOps';
import type { SectorRules } from './sectorRules';
import type { SessionCore } from './useSessionCore';
import type { YokaiOps } from './yokaiOps';

/** Command-line parser that routes typed / palette commands to field operations. */
export function createCommandLine(s: SessionCore & SectorRules & RoomOps & EvidenceOps & YokaiOps) {
  const {
    state,
    dispatch,
    setViewport,
    setMapViewMode,
    setTerminalLines,
    addToast,
    appendLog,
    currentContract,
    currentSubNode,
    currentHeat,
    resolveTargetRoom,
    handleScanRoom,
    handleDecoyPatrol,
    handleAttemptTrapCounter,
    handleEnterRoom,
    handleAttuneAnchor,
    handleInterviewWitness,
    handleRefineReading,
    handleRunForensicTool,
    handleLootRoom
  } = s;

  const processCliCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    appendLog(`<span style="color:#62f080;">root@${escapeHtml(state.playerName.toLowerCase() || 'operative')}:~#</span> ${escapeHtml(trimmed)}`, 'command');

    if (cmd === 'help' || cmd === '?') {
      appendLog(
        `<div style="background:rgba(31,61,38,0.25);border:1px solid #1f3d26;padding:10px;line-height:1.55;">` +
        `<strong style="color:#62f080;">1. RECON &amp; ENTRY:</strong> <code style="color:#ffb800;">scan [#]</code> | <code style="color:#ffb800;">enter [#]</code> | <code style="color:#ffb800;">loot</code> | <code style="color:#ffb800;">interview</code> (Witness) | <code style="color:#ffb800;">attune</code> (Anchor: court, then rank)<br/>` +
        `<strong style="color:#00f3ff;">2. PRE-ENTRY COUNTERS:</strong> <code style="color:#ff2a55;">decoy [#]</code> | <code style="color:#00f3ff;">degauss [#]</code> | <code style="color:#00f3ff;">bypass [#]</code> | <code style="color:#00f3ff;">purge [#]</code> | <code style="color:#00f3ff;">dispel [#]</code><br/>` +
        `<strong style="color:#62f080;">3. FORENSIC SUITE:</strong> <code style="color:#62f080;">vox</code> (Audio) | <code style="color:#62f080;">assay</code> (Matter/Bio) | <code style="color:#62f080;">auspex</code> (Astral/Thermal) | <code style="color:#62f080;">refine [#]</code> (resolve a degraded reading)<br/>` +
        `<strong style="color:#ff2a55;">4. INQUISITION HEAT:</strong> <code style="color:#ff2a55;">spoof</code> (-15 Obols: -25% Heat) | <code style="color:#ff2a55;">bribe</code> (-25 Obols: -45% Heat)` +
        `</div>`,
        'info'
      );
    } else if (cmd === 'scan' || cmd === 'probe') {
      handleScanRoom(resolveTargetRoom(arg));
    } else if (cmd === 'enter' || cmd === 'breach' || cmd === 'move' || cmd === 'node') {
      handleEnterRoom(resolveTargetRoom(arg));
    } else if (cmd === 'loot' || cmd === 'extract') {
      handleLootRoom(false);
    } else if (cmd === 'attune') {
      handleAttuneAnchor();
    } else if (cmd === 'interview' || cmd === 'question' || cmd === 'talk') {
      handleInterviewWitness();
    } else if (cmd === 'refine' || cmd === 'enhance') {
      handleRefineReading(arg);
    } else if (cmd === 'decoy') {
      handleDecoyPatrol(arg);
    } else if (['degauss', 'bypass', 'purge', 'purify', 'dispel'].includes(cmd)) {
      handleAttemptTrapCounter(cmd === 'purify' ? 'purge' : cmd, arg);
    } else if (cmd === 'vox') {
      handleRunForensicTool('vox', 'AUDIO', 'VOX SPECTROGRAM');
    } else if (cmd === 'assay' || cmd === 'reagent') {
      handleRunForensicTool('assay', 'MATTER', 'MATTER ASSAY');
    } else if (cmd === 'auspex' || cmd === 'lidar' || cmd === 'lens') {
      handleRunForensicTool('auspex', 'ASTRAL', 'AUSPEX SENSOR');
    } else if (cmd === 'spoof') {
      if ((state.inventory.obols || 0) < 15) {
        ThaumaturgicAudio.errorBuzz();
        appendLog(`[-] Frequency Spoofing requires 15 Obols.`, 'error');
        return;
      }
      ThaumaturgicAudio.scryPing();
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -15 } });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -25 } });
      appendLog(`[📡 SIGNAL SPOOFED] Broadcasted phantom telemetry (-15 Obols, -25% Inquisition Heat).`, 'success');
      addToast(`Inquisition Heat -25%`, 'SEAL');
    } else if (cmd === 'bribe') {
      if ((state.inventory.obols || 0) < 25) {
        ThaumaturgicAudio.errorBuzz();
        appendLog(`[-] Bribing Malleus Watch constables requires 25 Obols.`, 'error');
        return;
      }
      ThaumaturgicAudio.sealSuccess();
      dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -25 } });
      dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -45 } });
      appendLog(`[🪙 INQUISITION BRIBED] Paid 25 Obols to Malleus Watch officers (-45% Heat; Cordon lifted).`, 'success');
      addToast(`Inquisition Cordon Lifted (-45% Heat)!`, 'SEAL');
    } else if (cmd === 'status' || cmd === 'look') {
      if (!currentContract) return;
      appendLog(`[+] SECTOR: <strong>${currentContract.sectorLabel}</strong> | POS: <strong>${currentSubNode ? currentSubNode.label : 'PERIMETER TETHER'}</strong> | HEAT: <strong>${currentHeat}%</strong>`, 'info');
    } else if (cmd === 'map') {
      setMapViewMode(prev => prev === 'SUB_GRID' ? 'GEO_TRACKER' : 'SUB_GRID');
    } else if (cmd === 'codex') {
      setViewport('CODEX');
    } else if (cmd === 'kage') {
      setViewport('KAGE_NO_SHO');
    } else if (cmd === 'safehouse' || cmd === 'altar') {
      setViewport('SAFEHOUSE_ALTAR');
    } else if (cmd === 'horsemen') {
      setViewport('HORSEMEN');
    } else if (cmd === 'dossier') {
      setViewport('DOSSIER');
    } else if (cmd === 'manual') {
      setViewport('MANUAL');
    } else if (cmd === 'clear' || cmd === 'cls') {
      setTerminalLines([]);
    } else {
      ThaumaturgicAudio.errorBuzz();
      appendLog(`[-] Unknown command "${escapeHtml(cmd)}". Type <code>help</code> or use the buttons below.`, 'error');
    }
  };


  const handleLogout = () => {
    ThaumaturgicAudio.keyClick();
    dispatch({ type: 'EXIT_TO_MENU' });
  };


  return {
    processCliCommand,
    handleLogout
  };
}

export type CommandLine = ReturnType<typeof createCommandLine>;
