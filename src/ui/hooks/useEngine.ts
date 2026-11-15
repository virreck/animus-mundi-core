// src/ui/hooks/useEngine.ts
import { useCallback, useReducer, useEffect, useRef, useState, type Dispatch } from 'react';
import { initialGameState, normalizeLoadedState, type GameState } from '../../engine/state';
import { gameReducer, type GameAction } from '../../engine/reducer';
import { isTraining } from '../../engine/tutorial';
import type { ContractCost } from '../../content/yokai/types';
import {
  LEGACY_CONTRACTS_KEY, LEGACY_MICRO_ENTROPY_KEY, deleteSlot, getActiveSlot, readSlot, setActiveSlot as persistActiveSlot, writeSlot
} from '../saves';
import { describeAction, installErrorCapture, logDebug, setDebugContext, snapshotOf, snapshotWorthy } from '../debug/debugLog';

/** The original single-save key (now slot 1). */
export { LEGACY_SAVE_KEY as SAVE_KEY } from '../saves';

export function useEngine() {
  const [state, rawDispatch] = useReducer(gameReducer, initialGameState);
  /** The slot this session reads from and autosaves into. */
  const [activeSlot, setActiveSlot] = useState<number>(() => getActiveSlot());

  // --- Playtest log: every action, plus a snapshot whenever the world moves ---
  useEffect(() => {
    installErrorCapture();
    logDebug('SESSION', 'App opened', { userAgent: globalThis.navigator?.userAgent });
  }, []);
  const dispatch: Dispatch<GameAction> = useCallback(action => {
    const line = describeAction(action);
    if (line) logDebug('ACTION', line);
    rawDispatch(action);
  }, []);
  const lastLogged = useRef<GameState | null>(null);
  useEffect(() => {
    setDebugContext({ slot: activeSlot, training: isTraining(state) });
    if (snapshotWorthy(lastLogged.current, state)) logDebug('SNAPSHOT', `tick ${state.campaign?.tick ?? 0}`, snapshotOf(state));
    lastLogged.current = state;
  }, [state, activeSlot]);

  const chooseSlot = (slot: number) => {
    persistActiveSlot(slot);
    setActiveSlot(slot);
  };

  // Auto-Save (GAME_OVER is saved too, so a dead run can't be reloaded one step before death)
  useEffect(() => {
    // The guided first case is a sandbox and never overwrites the real save
    if ((state.gameStage === 'ACTIVE' || state.gameStage === 'GAME_OVER') && !isTraining(state)) {
      if (!writeSlot(activeSlot, state)) console.error('Failed to write local save data.');
    }
  }, [state, activeSlot]);

  /** Loads a slot (the active one by default) and makes it the active slot. */
  const loadGame = (slot: number = activeSlot) => {
    const parsed = readSlot(slot);
    if (!parsed) return;
    chooseSlot(slot);
    let legacyMicro = 0;
    let legacyContracts = {};
    if (slot === 1) {
      legacyMicro = Number.parseFloat(localStorage.getItem(LEGACY_MICRO_ENTROPY_KEY) || '0') || 0;
      try { legacyContracts = JSON.parse(localStorage.getItem(LEGACY_CONTRACTS_KEY) || '{}'); } catch { /* ignore */ }
    }
    dispatch({ type: 'LOAD_GAME', payload: normalizeLoadedState(parsed, legacyMicro, legacyContracts) });
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

  /** Clears a slot (the active one by default) and returns to a blank state. */
  const resetGame = (slot: number = activeSlot) => {
    deleteSlot(slot);
    dispatch({ type: 'RESET_GAME' });
  };

  return {
    state, dispatch, startInvestigation, loadGame, modifyFaction, modifyHumanity,
    setFlag, resolveLead, draftContract, advanceTime, modifySectorEntropy,
    travelTo, identifyGoetia, sealGoetia, resetGame, activeSlot, chooseSlot
  };
}
