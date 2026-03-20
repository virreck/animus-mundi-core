// src/ui/hooks/useEngine.ts
import { useReducer } from 'react';
import type { YokaiId, NodeId } from '../../engine/state';
import { initialGameState } from '../../engine/state';
import { gameReducer } from '../../engine/reducer';

export function useEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Helper functions so your UI is clean and easy to read
  const draftContract = (yokaiId: YokaiId, cost: number) => dispatch({ type: 'DRAFT_CONTRACT', payload: { yokaiId, cost } });
  const advanceTime = (chaosAmount: number) => dispatch({ type: 'ADVANCE_TIME', payload: chaosAmount });
  const travelTo = (nodeId: NodeId) => dispatch({ type: 'TRAVEL', payload: nodeId });
  const resetGame = () => dispatch({ type: 'RESET_GAME' });

  return { state, draftContract, advanceTime, travelTo, resetGame };
}