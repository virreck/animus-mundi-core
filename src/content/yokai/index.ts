// src/content/yokai/index.ts
import type { YokaiContract } from './types';

export const allYokai: YokaiContract[] = [
  // =======================================================================
  // 1. STEALTH & INFILTRATION (Heat Management)
  // =======================================================================
  {
    id: "yokai_kitsune",
    nameEn: "Kitsune Mask",
    kanji: "狐",
    utilityClass: "Stealth",
    unlockFlag: "kitsune_mask_found",
    gameUtility: "Passive: Reduces all Sector Heat spikes by 50%, but drains 2 Humanity every time it masks your signature.",
    costDescription: "A permanent sacrifice of Tether stability.",
    draftCost: { obols: 15, humanity: 10 }
  },
  {
    id: "yokai_tengu",
    nameEn: "Tengu",
    kanji: "天狗",
    utilityClass: "Stealth",
    unlockFlag: "tengu_feather_found",
    gameUtility: "Passive: Traveling between Map Sectors no longer generates Sector Heat, but the winds demand a toll of 5 Obols per trip.",
    costDescription: "Requires esoteric ink to bind the wind.",
    draftCost: { obols: 20, ink: 1 }
  },

  // =======================================================================
  // 2. UTILITY & ECONOMY (Safehouse Actions)
  // =======================================================================
  {
    id: "yokai_baku",
    nameEn: "Dream-Eater Baku",
    kanji: "獏",
    utilityClass: "Utility",
    unlockFlag: "baku_idol_found",
    gameUtility: "Passive: Fully restores Humanity when resting at the Safehouse, but resting now costs 10 Obols and advances Time by double the normal amount.",
    costDescription: "A heavy toll of underworld currency.",
    draftCost: { obols: 15, humanity: 5 }
  },
  {
    id: "yokai_zashiki",
    nameEn: "Zashiki-warashi",
    kanji: "座敷童子",
    utilityClass: "Utility",
    unlockFlag: "zashiki_shrine_found",
    gameUtility: "Passive: Generates +3 bonus Obols whenever gaining Obols from a narrative choice. However, your maximum Humanity cap is effectively lowered by 15.",
    costDescription: "Must be housed in the Player's OS.",
    draftCost: { humanity: 15, obols: 10 }
  },
  {
    id: "yokai_kameosa",
    nameEn: "Kameosa",
    kanji: "瓶長",
    utilityClass: "Utility",
    unlockFlag: "kameosa_jar_found",
    gameUtility: "Passive: Synthesizing Catalysts at the Safehouse costs 0 Obols, but costs 2 Humanity per craft. It turns blood into matter.",
    costDescription: "Requires a steady flow of Obols to bind initially.",
    draftCost: { obols: 30, ink: 1 }
  },

  // =======================================================================
  // 3. ENFORCER & RITUAL SUPPORT (Minigames & Min-Maxing)
  // =======================================================================
  {
    id: "yokai_kamaitachi",
    nameEn: "Severing Kamaitachi",
    kanji: "鎌鼬",
    utilityClass: "Enforcer",
    unlockFlag: "kamaitachi_blade_found",
    gameUtility: "Passive: Adds +15s to Grand Rite Banishments. If the Banishment fails, the Global Entropy penalty is doubled.",
    costDescription: "High Obol and Ink cost.",
    draftCost: { obols: 20, ink: 2 }
  },
  {
    id: "yokai_amabie",
    nameEn: "Amabie",
    kanji: "アマビエ",
    utilityClass: "Enforcer",
    unlockFlag: "amabie_scale_found",
    gameUtility: "Passive: If a Sealing minigame is failed, Global Entropy does not increase, but the Amabie consumes 15 Obols. If you cannot pay, the Tether snaps.",
    costDescription: "Tether stability sacrificed.",
    draftCost: { obols: 25, humanity: 20 }
  },
  {
    id: "yokai_noppera",
    nameEn: "Noppera-bō",
    kanji: "のっぺら坊",
    utilityClass: "Enforcer",
    unlockFlag: "noppera_mask_found",
    gameUtility: "Passive: Narrative choices that drain Humanity deal 50% less damage, but increase Sector Heat by 5 as reality rejects the faceless illusion.",
    costDescription: "Requires blood and ink.",
    draftCost: { obols: 15, ink: 1, humanity: 5 }
  }
];