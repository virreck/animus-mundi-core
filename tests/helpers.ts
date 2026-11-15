// tests/helpers.ts
import { gameReducer, type GameAction } from '../src/engine/reducer';
import { initialGameState, type GameState } from '../src/engine/state';
import { allYokai } from '../src/content/yokai';

/** A fresh, ACTIVE run with no Book of Shadows pages written. */
export function blankRun(): GameState {
  return gameReducer(initialGameState, { type: 'START_INVESTIGATION', payload: { name: 'Tester', portrait: '', agency: 'Darkwire' } });
}

/** A fresh, ACTIVE run where every Yokai page is already written (so any daemon can be bound). */
export function newRun(): GameState {
  const s = blankRun();
  return { ...s, flags: { ...s.flags, ...Object.fromEntries(allYokai.map(y => [y.unlockFlag!, true])) } };
}

/** Applies actions in order. */
export function apply(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}
