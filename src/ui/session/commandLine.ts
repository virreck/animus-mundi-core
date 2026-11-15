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
    setDebugOpen,
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

  const showHelp = () =>
    appendLog(
      `<div style="border-left:2px solid #1f3d26;padding-left:10px;line-height:1.6;color:#a8ccaf;">` +
      `THAUMATURGIC OS 4.14 — COMMAND INDEX<br/>` +
      `<code>scan [#]</code> <code>enter [#]</code> <code>loot</code> <code>interview</code> <code>attune</code><br/>` +
      `<code>decoy [#]</code> <code>degauss [#]</code> <code>bypass [#]</code> <code>purge [#]</code> <code>dispel [#]</code><br/>` +
      `<code>vox</code> <code>assay</code> <code>auspex</code> <code>refine [#]</code><br/>` +
      `<code>spoof</code> <code>bribe</code> <code>status</code> <code>help</code><br/>` +
      `<span style="color:#4f7a59;">Full documentation: F7 MANUAL.</span>` +
      `</div>`,
      'info'
    );

  /** Pays Obols to knock Heat down in the current sector (spoof / bribe). */
  const buyHeatRelief = (opts: { cost: number; heat: number; refusal: string; log: string; toast: string; sound: () => void }) => {
    if ((state.inventory.obols || 0) < opts.cost) {
      ThaumaturgicAudio.errorBuzz();
      appendLog(opts.refusal, 'error');
      return;
    }
    opts.sound();
    dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: -opts.cost } });
    dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -opts.heat } });
    appendLog(opts.log, 'success');
    addToast(opts.toast, 'SEAL');
  };

  const showStatus = () => {
    if (!currentContract) return;
    appendLog(`[+] SECTOR: <strong>${currentContract.sectorLabel}</strong> | POS: <strong>${currentSubNode?.label ?? 'PERIMETER TETHER'}</strong> | HEAT: <strong>${currentHeat}%</strong>`, 'info');
  };

  /** Every command and its aliases. Each handler gets the rest of the line as its argument. */
  const COMMANDS: Array<[string[], (arg: string) => void]> = [
    [['help', '?'], showHelp],
    [['scan', 'probe'], arg => handleScanRoom(resolveTargetRoom(arg))],
    [['enter', 'breach', 'move', 'node'], arg => handleEnterRoom(resolveTargetRoom(arg))],
    [['loot', 'extract'], () => handleLootRoom(false)],
    [['attune'], () => handleAttuneAnchor()],
    [['interview', 'question', 'talk'], () => handleInterviewWitness()],
    [['refine', 'enhance'], arg => handleRefineReading(arg)],
    [['decoy'], arg => handleDecoyPatrol(arg)],
    [['degauss'], arg => handleAttemptTrapCounter('degauss', arg)],
    [['bypass'], arg => handleAttemptTrapCounter('bypass', arg)],
    [['purge', 'purify'], arg => handleAttemptTrapCounter('purge', arg)],
    [['dispel'], arg => handleAttemptTrapCounter('dispel', arg)],
    [['vox'], () => handleRunForensicTool('vox', 'AUDIO', 'VOX SPECTROGRAM')],
    [['assay', 'reagent'], () => handleRunForensicTool('assay', 'MATTER', 'MATTER ASSAY')],
    [['auspex', 'lidar', 'lens'], () => handleRunForensicTool('auspex', 'ASTRAL', 'AUSPEX SENSOR')],
    [['spoof'], () => buyHeatRelief({
      cost: 15, heat: 25, sound: () => ThaumaturgicAudio.scryPing(),
      refusal: `[-] Frequency Spoofing requires 15 Obols.`,
      log: `[📡 SIGNAL SPOOFED] Broadcasted phantom telemetry (-15 Obols, -25% Inquisition Heat).`,
      toast: `Inquisition Heat -25%`
    })],
    [['bribe'], () => buyHeatRelief({
      cost: 25, heat: 45, sound: () => ThaumaturgicAudio.sealSuccess(),
      refusal: `[-] Bribing Malleus Watch constables requires 25 Obols.`,
      log: `[🪙 INQUISITION BRIBED] Paid 25 Obols to Malleus Watch officers (-45% Heat; Cordon lifted).`,
      toast: `Inquisition Cordon Lifted (-45% Heat)!`
    })],
    [['status', 'look'], showStatus],
    [['map'], () => setMapViewMode(prev => (prev === 'SUB_GRID' ? 'GEO_TRACKER' : 'SUB_GRID'))],
    [['codex'], () => setViewport('CODEX')],
    [['kage'], () => setViewport('KAGE_NO_SHO')],
    [['safehouse', 'altar'], () => setViewport('SAFEHOUSE_ALTAR')],
    [['horsemen'], () => setViewport('HORSEMEN')],
    [['dossier'], () => setViewport('DOSSIER')],
    [['manual'], () => setViewport('MANUAL')],
    [['clear', 'cls'], () => setTerminalLines([])],
    // Not listed in help: opens the passphrase-locked playtest log
    [['debug'], () => setDebugOpen(true)]
  ];
  const COMMAND_INDEX = new Map(COMMANDS.flatMap(([names, run]) => names.map(n => [n, run] as const)));

  const processCliCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    appendLog(`<span style="color:#62f080;">root@${escapeHtml(state.playerName.toLowerCase() || 'operative')}:~#</span> ${escapeHtml(trimmed)}`, 'command');

    const run = COMMAND_INDEX.get(cmd);
    if (run) {
      run(arg);
      return;
    }
    ThaumaturgicAudio.errorBuzz();
    appendLog(`[-] command not found: ${escapeHtml(cmd)}`, 'error');
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
