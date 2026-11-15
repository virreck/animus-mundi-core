// tests/helpers.ts
import { gameReducer, type GameAction } from '../src/engine/reducer';
import { initialGameState, type GameState } from '../src/engine/state';

/** A fresh, ACTIVE run. */
export function newRun(): GameState {
  return gameReducer(initialGameState, { type: 'START_INVESTIGATION', payload: { name: 'Tester', portrait: '', agency: 'Darkwire' } });
}

/** Applies actions in order. */
export function apply(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}
