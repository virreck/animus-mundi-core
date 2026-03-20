// src/content/goetia/types.ts
export type GoeticRank = 'King' | 'Duke' | 'Prince' | 'Marquis' | 'President' | 'Earl' | 'Knight';
export type HorsemanAllegiance = 'Conquest' | 'War' | 'Famine' | 'Death';

export interface GoetiaLieutenant {
  id: string;
  manifestId: number;
  name: string;
  rank: GoeticRank;
  allegiance: HorsemanAllegiance;
  requiredIntel: string[];
  // Added optional fields to prevent TS errors until index is fully populated
  title?: string; 
  description?: string;
  sealCost?: Record<string, number>;
}