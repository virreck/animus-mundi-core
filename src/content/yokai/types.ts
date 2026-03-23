// src/content/yokai/types.ts

export type YokaiClass = 'Sensor' | 'Stealth' | 'Utility' | 'Enforcer' | 'Shikigami';

export interface ActivationCost {
  obols?: number;
  ink?: number;
  humanity?: number;
  requiredItemId?: string; 
}

export interface ContractCost {
  obols?: number;
  humanity?: number;
  ink?: number;
  tributeItemId?: string; 
}

export interface YokaiContract {
  id: string;          
  nameEn: string;      
  kanji: string;       
  utilityClass: YokaiClass; 
  gameUtility: string; 
  costDescription: string; 
  unlockFlag?: string;
  draftCost: ContractCost;       
  activationCost: ActivationCost; 
}