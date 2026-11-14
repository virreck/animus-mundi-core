// src/ui/hooks/useEngine.ts
import { useReducer, useEffect } from 'react';
import type { YokaiId, NodeId, GoetiaId, FactionId, GameState } from '../../engine/state';
import { initialGameState, normalizeLoadedState } from '../../engine/state';
import { gameReducer } from '../../engine/reducer';
import type { ContractCost } from '../../content/yokai/types';

export const SAVE_KEY = 'thaumaturgic_os_save_v1';
/** Pre-v2 saves kept micro entropy in its own key; read once on load for migration. */
const LEGACY_MICRO_ENTROPY_KEY = 'thaumaturgic_os_micro_entropy_v2';

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
    if (state.gameStage === 'ACTIVE' || state.gameStage === 'GAME_OVER') {
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
      const legacyMicro = parseFloat(localStorage.getItem(LEGACY_MICRO_ENTROPY_KEY) || '0') || 0;
      dispatch({ type: 'LOAD_GAME', payload: normalizeLoadedState(parsed, legacyMicro) });
    } catch (error) {
      console.error('Failed to parse local save data.', error);
    }
  };

  const startInvestigation = (name: string, portrait: string, agency: string) => dispatch({ type: 'START_INVESTIGATION', payload: { name, portrait, agency } });
  const modifyFaction = (factionId: FactionId, amount: number) => dispatch({ type: 'MODIFY_FACTION', payload: { factionId, amount } });
  const modifyHumanity = (amount: number) => dispatch({ type: 'MODIFY_HUMANITY', payload: amount });
  const setFlag = (flagId: string, value: boolean) => dispatch({ type: 'SET_FLAG', payload: { flagId, value } });
  const resolveLead = (leadId: string) => dispatch({ type: 'RESOLVE_LEAD', payload: leadId });
  const draftContract = (yokaiId: YokaiId, costs: ContractCost, maxCharges?: number) => dispatch({ type: 'DRAFT_CONTRACT', payload: { yokaiId, costs, maxCharges } });
  const advanceTime = (chaosAmount: number = 2) => dispatch({ type: 'ADVANCE_TIME', payload: chaosAmount });
  const modifySectorEntropy = (nodeId: string, amount: number) => dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId, amount } });
  const travelTo = (nodeId: NodeId) => dispatch({ type: 'TRAVEL', payload: nodeId });
  const identifyGoetia = (goetiaId: GoetiaId) => dispatch({ type: 'IDENTIFY_GOETIA', payload: goetiaId });
  const sealGoetia = (goetiaId: GoetiaId) => dispatch({ type: 'SEAL_GOETIA', payload: goetiaId });

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
