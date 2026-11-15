// src/ui/session/SessionContext.ts
import { createContext, useContext } from 'react';
import type { SessionCore } from './useSessionCore';
import type { FieldOps } from './useFieldOps';
import type { MapCanvas } from './useMapCanvas';

/** Everything a viewport can read or call: state, derived case data and handlers. */
export type Session = SessionCore & FieldOps & MapCanvas;

/** Provided once in App; read in viewports with useSession(). */
export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionContext.Provider>');
  return session;
}
