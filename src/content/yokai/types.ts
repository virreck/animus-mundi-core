export type YokaiClass = 'Sensor' | 'Stealth' | 'Utility' | 'Enforcer' | 'Shikigami';

export interface YokaiContract {
  id: string;          // e.g., "01_chochin_obake"
  nameEn: string;      // "Chōchin-obake"
  kanji: string;       // "提灯お化け"
  utilityClass: YokaiClass; 
  gameUtility: string; // "Flashlight / True Sight: Reveals hidden Goetic sigils."
  costDescription: string; // "Constant supply of lamp oil."
  
  // Mechanical hooks for the Engine
  baseCost: { obols?: number; ink?: number; humanity?: number };
}