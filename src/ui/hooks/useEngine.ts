// src/ui/hooks/useEngine.ts
import { useReducer } from 'react';
import type { YokaiId, NodeId, GoetiaId } from '../../engine/state';
import { initialGameState } from '../../engine/state';
import { gameReducer } from '../../engine/reducer';

export function useEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

// Add these inside your useEngine hook return object:
    modifyFaction: (factionId: FactionId, amount: number) => 
      dispatch({ type: 'MODIFY_FACTION', payload: { factionId, amount } }),

    modifyHumanity: (amount: number) => 
      dispatch({ type: 'MODIFY_HUMANITY', payload: amount }),

    setFlag: (flagId: string, value: boolean) => 
      dispatch({ type: 'SET_FLAG', payload: { flagId, value } }),

    resolveLead: (leadId: string) => 
      dispatch({ type: 'RESOLVE_LEAD', payload: leadId }),


  const draftContract = (yokaiId: YokaiId, cost: number) => dispatch({ type: 'DRAFT_CONTRACT', payload: { yokaiId, cost } });
  const advanceTime = (chaosAmount: number) => dispatch({ type: 'ADVANCE_TIME', payload: chaosAmount });
  const travelTo = (nodeId: NodeId) => dispatch({ type: 'TRAVEL', payload: nodeId });
  const identifyGoetia = (goetiaId: GoetiaId) => dispatch({ type: 'IDENTIFY_GOETIA', payload: goetiaId }); // <-- NEW
  const sealGoetia = (goetiaId: GoetiaId) => dispatch({ type: 'SEAL_GOETIA', payload: goetiaId });
  const resetGame = () => dispatch({ type: 'RESET_GAME' });

  return { state, dispatch, draftContract, advanceTime, travelTo, identifyGoetia, sealGoetia, resetGame };
}