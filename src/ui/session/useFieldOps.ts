// src/ui/session/useFieldOps.ts
// Composes the field-operation modules into one object for the session.
import { createCommandLine } from './commandLine';
import { createEvidenceOps } from './evidenceOps';
import { createRoomOps } from './roomOps';
import { createSectorRules } from './sectorRules';
import type { SessionCore } from './useSessionCore';
import { createYokaiOps } from './yokaiOps';

/**
 * Builds every field operation on top of the session core. Each part only sees the parts
 * before it (rules -> rooms -> evidence -> yokai -> command line), which keeps them loosely coupled.
 */
export function useFieldOps(core: SessionCore) {
  const rules = createSectorRules(core);
  const withRules = { ...core, ...rules };
  const rooms = createRoomOps(withRules);
  const withRooms = { ...withRules, ...rooms };
  const evidence = createEvidenceOps(withRooms);
  const withEvidence = { ...withRooms, ...evidence };
  const yokai = createYokaiOps(withEvidence);
  const commands = createCommandLine({ ...withEvidence, ...yokai });
  return { ...rules, ...rooms, ...evidence, ...yokai, ...commands };
}

export type FieldOps = ReturnType<typeof useFieldOps>;
