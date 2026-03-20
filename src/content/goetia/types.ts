export type GoeticRank = 'King' | 'Duke' | 'Prince' | 'Marquis' | 'President' | 'Earl' | 'Knight';
export type HorsemanAllegiance = 'Conquest' | 'War' | 'Famine' | 'Death';

export interface GoetiaLieutenant {
  id: string;          // e.g., "01_bael"
  manifestId: number;  // 1
  name: string;        // "Bael"
  rank: GoeticRank;
  
  // Engine Mechanics
  allegiance: HorsemanAllegiance; // To determine what passive penalty they inflict
  requiredIntel: string[];        // Tags needed in the Grimoire to identify them
}