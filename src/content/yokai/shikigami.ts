import type { YokaiContract } from './types';

export const katashiro: YokaiContract = {
  id: "47_katashiro",
  nameEn: "Katashiro",
  kanji: "形代",
  utilityClass: "Shikigami",
  gameUtility: "Decoy: Creates a paper clone of the player to absorb one fatal hit.",
  costDescription: "Consumes 1 Paper Doll item.",
  draftCost: 15,
  activationCost: {
    requiredItemId: "paper_doll",
    humanity: 2
  }
};