// src/content/yokai/shikigami.ts
import type { YokaiId } from '../../engine/state';

export const katashiro = {
  id: "katashiro_decoy" as YokaiId,
  name: "Katashiro (形代)",
  type: "shikigami",
  utility: "Creates a paper clone of the player to absorb one status effect.",
  cost: 15
};