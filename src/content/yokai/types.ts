export type YokaiClass = 'Sensor' | 'Stealth' | 'Utility' | 'Enforcer' | 'Shikigami';

// A strictly typed cost object that the Engine can read
export interface ActivationCost {
  obols?: number;
  ink?: number;
  humanity?: number;
  requiredItemId?: string; // e.g., "lamp_oil", "sacred_sand", "spirit_thread"
}

export interface YokaiContract {
  id: string;          
  nameEn: string;      
  kanji: string;       
  utilityClass: YokaiClass; 
  gameUtility: string; 
  costDescription: string; // The lore-friendly text (e.g., "Constant supply of lamp oil.")
  
  // The mechanical costs
  draftCost: number;             // How many Obols it costs to equip them at the Hub
  activationCost: ActivationCost; // What it costs to actually click their button in the field
}