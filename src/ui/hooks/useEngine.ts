// src/ui/hooks/useEngine.ts
import { useReducer, useEffect } from 'react';
import type { GameState } from '../../engine/state';
import { initialGameState, normalizeLoadedState } from '../../engine/state';
import { gameReducer } from '../../engine/reducer';
import { isTraining } from '../../engine/tutorial';
import type { ContractCost } from '../../content/yokai/types';

export const SAVE_KEY = 'thaumaturgic_os_save_v1';
/** Older saves kept micro entropy and contracts in their own keys; read once on load for migration. */
const LEGACY_MICRO_ENTROPY_KEY = 'thaumaturgic_os_micro_entropy_v2';
const LEGACY_CONTRACTS_KEY = 'thaumaturgic_os_contracts_v2';

/** Reads the operative name from the save slot without loading it. */
export function peekSavedOperative(): string | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw).playerName ?? null) : null;
  } catch {
    return null;
  }
}

export function useEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Auto-Save (GAME_OVER is saved too, so a dead run can't be reloaded one step before death)
  useEffect(() => {
    // The guided first case is a sandbox and never overwrites the real save
    if ((state.gameStage === 'ACTIVE' || state.gameStage === 'GAME_OVER') && !isTraining(state)) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to write local save data.', error);
      }
    }
  }, [state]);

  const loadGame = () => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return;
    try {
      const parsed: Partial<GameState> = JSON.parse(savedData);
      const legacyMicro = Number.parseFloat(localStorage.getItem(LEGACY_MICRO_ENTROPY_KEY) || '0') || 0;
      let legacyContracts = {};
      try { legacyContracts = JSON.parse(localStorage.getItem(LEGACY_CONTRACTS_KEY) || '{}'); } catch { /* ignore */ }
      dispatch({ type: 'LOAD_GAME', payload: normalizeLoadedState(parsed, legacyMicro, legacyContracts) });
    } catch (error) {
      console.error('Failed to parse local save data.', error);
    }
  };

  const startInvestigation = (name: string, portrait: string, agency: string) => dispatch({ type: 'START_INVESTIGATION', payload: { name, portrait, agency } });
  const modifyFaction = (factionId: string, amount: number) => dispatch({ type: 'MODIFY_FACTION', payload: { factionId, amount } });
  const modifyHumanity = (amount: number) => dispatch({ type: 'MODIFY_HUMANITY', payload: amount });
  const setFlag = (flagId: string, value: boolean) => dispatch({ type: 'SET_FLAG', payload: { flagId, value } });
  const resolveLead = (leadId: string) => dispatch({ type: 'RESOLVE_LEAD', payload: leadId });
  const draftContract = (yokaiId: string, costs: ContractCost, maxCharges?: number) => dispatch({ type: 'DRAFT_CONTRACT', payload: { yokaiId, costs, maxCharges } });
  const advanceTime = (chaosAmount: number = 2) => dispatch({ type: 'ADVANCE_TIME', payload: chaosAmount });
  const modifySectorEntropy = (nodeId: string, amount: number) => dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId, amount } });
  const travelTo = (nodeId: string) => dispatch({ type: 'TRAVEL', payload: nodeId });
  const identifyGoetia = (goetiaId: string) => dispatch({ type: 'IDENTIFY_GOETIA', payload: goetiaId });
  const sealGoetia = (goetiaId: string) => dispatch({ type: 'SEAL_GOETIA', payload: goetiaId });

  const resetGame = () => {
    localStorage.removeItem(SAVE_KEY);
    dispatch({ type: 'RESET_GAME' });
  };

  return {
    state, dispatch, startInvestigation, loadGame, modifyFaction, modifyHumanity,
    setFlag, resolveLead, draftContract, advanceTime, modifySectorEntropy,
    travelTo, identifyGoetia, sealGoetia, resetGame
  };
}
