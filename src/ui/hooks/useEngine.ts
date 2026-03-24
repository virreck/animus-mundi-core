// src/ui/hooks/useEngine.ts
import { useReducer, useEffect } from 'react';
import type { YokaiId, NodeId, GoetiaId, FactionId, GameState } from '../../engine/state';
import { initialGameState } from '../../engine/state';
import { gameReducer } from '../../engine/reducer';
import type { ContractCost } from '../../content/yokai/types';

const SAVE_KEY = 'thaumaturgic_os_save_v1';

export function useEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Auto-Save
  useEffect(() => {
    if (state.gameStage === 'ACTIVE') {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const loadGame = () => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsedState: GameState = JSON.parse(savedData);
        dispatch({ type: 'LOAD_GAME', payload: parsedState });
      } catch (error) {
        console.error("Failed to parse local save data.", error);
      }
    }
  };

  const startInvestigation = (name: string, portrait: string, agency: string) => dispatch({ type: 'START_INVESTIGATION', payload: { name, portrait, agency } });
  const modifyFaction = (factionId: FactionId, amount: number) => dispatch({ type: 'MODIFY_FACTION', payload: { factionId, amount } });
  const modifyHumanity = (amount: number) => dispatch({ type: 'MODIFY_HUMANITY', payload: amount });
  const setFlag = (flagId: string, value: boolean) => dispatch({ type: 'SET_FLAG', payload: { flagId, value } });
  const resolveLead = (leadId: string) => dispatch({ type: 'RESOLVE_LEAD', payload: leadId });
  const draftContract = (yokaiId: YokaiId, costs: ContractCost) => dispatch({ type: 'DRAFT_CONTRACT', payload: { yokaiId, costs } });
  const advanceTime = (chaosAmount: number = 2) => dispatch({ type: 'ADVANCE_TIME', payload: chaosAmount });
  
  // Expose Sector Entropy
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