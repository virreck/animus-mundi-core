// src/ui/hooks/useEngine.ts
import { useReducer } from 'react';
import type { YokaiId, NodeId, GoetiaId, FactionId } from '../../engine/state';
import { initialGameState } from '../../engine/state';
import { gameReducer } from '../../engine/reducer';
import type { ContractCost } from '../../content/yokai/types';

export function useEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const startInvestigation = (name: string, portrait: string, agency: string) => 
    dispatch({ type: 'START_INVESTIGATION', payload: { name, portrait, agency } });

  const modifyFaction = (factionId: FactionId, amount: number) => 
    dispatch({ type: 'MODIFY_FACTION', payload: { factionId, amount } });

  const modifyHumanity = (amount: number) => 
    dispatch({ type: 'MODIFY_HUMANITY', payload: amount });

  const setFlag = (flagId: string, value: boolean) => 
    dispatch({ type: 'SET_FLAG', payload: { flagId, value } });

  const resolveLead = (leadId: string) => 
    dispatch({ type: 'RESOLVE_LEAD', payload: leadId });

  const draftContract = (yokaiId: YokaiId, costs: ContractCost) => 
    dispatch({ type: 'DRAFT_CONTRACT', payload: { yokaiId, costs } });
    
  const advanceTime = (chaosAmount: number = 2) => 
    dispatch({ type: 'ADVANCE_TIME', payload: chaosAmount });
    
  const travelTo = (nodeId: NodeId) => 
    dispatch({ type: 'TRAVEL', payload: nodeId });
    
  const identifyGoetia = (goetiaId: GoetiaId) => 
    dispatch({ type: 'IDENTIFY_GOETIA', payload: goetiaId });
    
  const sealGoetia = (goetiaId: GoetiaId) => 
    dispatch({ type: 'SEAL_GOETIA', payload: goetiaId });
    
  const resetGame = () => 
    dispatch({ type: 'RESET_GAME' });

  return { 
    state, 
    dispatch, 
    startInvestigation,
    modifyFaction,
    modifyHumanity,
    setFlag,
    resolveLead,
    draftContract, 
    advanceTime, 
    travelTo, 
    identifyGoetia, 
    sealGoetia, 
    resetGame 
  };
}
