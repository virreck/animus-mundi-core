/// src/content/yokai/index.ts
import type { YokaiContract } from './types';

export const allYokai: YokaiContract[] = [
  {
    "id": "01_ch_chin_obake",
    "nameEn": "Chōchin-obake",
    "kanji": "提灯お化け",
    "utilityClass": "Sensor",
    "gameUtility": "Instantly reveals 1 hidden Intel tag at the current Node without advancing Sector Entropy.",
    "costDescription": "Constant supply of lamp oil.",
    "draftCost": { "obols": 20 },
    "activationCost": { "requiredItemId": "lamp_oil" }
  },
  {
    "id": "02_shirime",
    "nameEn": "Shirime",
    "kanji": "尻目",
    "utilityClass": "Sensor",
    "gameUtility": "Passive: Automatically negates the first Goetic Ambush event, preventing a forced Humanity drain.",
    "costDescription": "A \"prank\" performed on a neutral NPC.",
    "draftCost": { "obols": 35 },
    "activationCost": {}
  },
  {
    "id": "03_satori",
    "nameEn": "Satori",
    "kanji": "覚",
    "utilityClass": "Sensor",
    "gameUtility": "Guarantees a successful Interrogation action, granting an Active Lead while bypassing NPC deception.",
    "costDescription": "Temporary Sanity/MP drain.",
    "draftCost": { "obols": 40 },
    "activationCost": { "humanity": 10 }
  },
  {
    "id": "04_mokumokuren",
    "nameEn": "Mokumokuren",
    "kanji": "目目連",
    "utilityClass": "Sensor",
    "gameUtility": "Scans the current Node, permanently marking all interactive choices and potential item drops.",
    "costDescription": "Must be used in a room with windows.",
    "draftCost": { "obols": 30 },
    "activationCost": {}
  },
  {
    "id": "05_yosuzume",
    "nameEn": "Yosuzume",
    "kanji": "夜雀",
    "utilityClass": "Sensor",
    "gameUtility": "Passive: Alerts the player if the unidentified Goetia's required Intel is present at the current Node.",
    "costDescription": "Small offerings of grain/seed.",
    "draftCost": { "obols": 25 },
    "activationCost": {}
  },
  {
    "id": "06_ungaiky_",
    "nameEn": "Ungaikyō",
    "kanji": "雲外鏡",
    "utilityClass": "Sensor",
    "gameUtility": "Allows the player to Gather Intel from an adjacent Node without triggering a Travel action.",
    "costDescription": "Requires a silver-backed mirror focus.",
    "draftCost": { "obols": 60 },
    "activationCost": { "requiredItemId": "silver_mirror" }
  },
  {
    "id": "07_baku",
    "nameEn": "Baku",
    "kanji": "獏",
    "utilityClass": "Sensor",
    "gameUtility": "Extracts 1 piece of Goetic Intel from a sleeping or unconscious NPC.",
    "costDescription": "Player loses 1 \"Positive Memory\" (buff).",
    "draftCost": { "obols": 50 },
    "activationCost": { "humanity": 5 }
  },
  {
    "id": "08_yamabiko",
    "nameEn": "Yamabiko",
    "kanji": "山彦",
    "utilityClass": "Sensor",
    "gameUtility": "Bypasses locked doors to intercept audio-based Intel tags (e.g., 'necrotic_whispers').",
    "costDescription": "Must shout a specific vocal command.",
    "draftCost": { "obols": 30 },
    "activationCost": {}
  },
  {
    "id": "09_tenjo_name",
    "nameEn": "Tenjo-name",
    "kanji": "天井舐",
    "utilityClass": "Sensor",
    "gameUtility": "Reveals hidden items added to your Inventory dictionary (Catalysts, Obols) at the current Node.",
    "costDescription": "Room must be in total darkness.",
    "draftCost": { "obols": 25 },
    "activationCost": {}
  },
  {
    "id": "10_hiderigami",
    "nameEn": "Hiderigami",
    "kanji": "魃",
    "utilityClass": "Sensor",
    "gameUtility": "Automatically detects Death/Famine aligned Goetia presence and prevents associated passive penalties.",
    "costDescription": "Drains player hydration/water items.",
    "draftCost": { "obols": 45 },
    "activationCost": { "requiredItemId": "water_flask" }
  },
  {
    "id": "11_amabie",
    "nameEn": "Amabie",
    "kanji": "アマビエ",
    "utilityClass": "Sensor",
    "gameUtility": "Permanently reduces Sector Entropy by 15% upon successful execution.",
    "costDescription": "Draw and share the Amabie’s likeness.",
    "draftCost": { "ink": 1 },
    "activationCost": { "ink": 1 }
  },
  {
    "id": "12_ao_and_",
    "nameEn": "Ao-andō",
    "kanji": "青行燈",
    "utilityClass": "Sensor",
    "gameUtility": "Forces a Goetic manifestation, immediately unlocking 2 Intel tags but advancing Time heavily.",
    "costDescription": "Tells a \"Scary Story\" (Time skip).",
    "draftCost": { "obols": 50 },
    "activationCost": { "humanity": 15 }
  },
  {
    "id": "13_inugami",
    "nameEn": "Inugami",
    "kanji": "犬神",
    "utilityClass": "Sensor",
    "gameUtility": "Tracks a specific Active Lead, revealing the exact Node required to resolve it.",
    "costDescription": "A drop of the Player's own blood.",
    "draftCost": { "humanity": 10 },
    "activationCost": { "humanity": 5 }
  },
  {
    "id": "14_enenra",
    "nameEn": "Enenra",
    "kanji": "煙々羅",
    "utilityClass": "Stealth",
    "gameUtility": "Bypasses physical barriers (Locked Doors, Vents) to access restricted narrative choices.",
    "costDescription": "Only works near an active fire/hearth.",
    "draftCost": { "obols": 40 },
    "activationCost": {}
  },
  {
    "id": "15_nurikabe",
    "nameEn": "Nurikabe",
    "kanji": "ぬりかべ",
    "utilityClass": "Stealth",
    "gameUtility": "Traps a fleeing entity, preventing a target Goetia from changing its current Node.",
    "costDescription": "Player must remain stationary.",
    "draftCost": { "obols": 35 },
    "activationCost": {}
  },
  {
    "id": "16_kamaitachi",
    "nameEn": "Kamaitachi",
    "kanji": "鎌鼬",
    "utilityClass": "Stealth",
    "gameUtility": "Instantly destroys a mechanical lock or physical binding without generating Sector Entropy.",
    "costDescription": "High Wind-Essence cost.",
    "draftCost": { "obols": 45 },
    "activationCost": {}
  },
  {
    "id": "17_ittan_momen",
    "nameEn": "Ittan-momen",
    "kanji": "一反木綿",
    "utilityClass": "Stealth",
    "gameUtility": "Allows safe descent from high elevations or acts as a temporary straitjacket for hostile NPCs.",
    "costDescription": "Must be \"washed\" at a shrine after use.",
    "draftCost": { "obols": 30 },
    "activationCost": {}
  },
  {
    "id": "18_nurarihyon",
    "nameEn": "Nurarihyon",
    "kanji": "ぬらりひょん",
    "utilityClass": "Stealth",
    "gameUtility": "Grants complete invisibility to standard NPCs, bypassing social barriers or guards.",
    "costDescription": "A high-quality meal or tea offering.",
    "draftCost": { "obols": 20, "tributeItemId": "food_ration" },
    "activationCost": { "requiredItemId": "food_ration" }
  },
  {
    "id": "19_noppera_b_",
    "nameEn": "Noppera-bō",
    "kanji": "のっぺら坊",
    "utilityClass": "Stealth",
    "gameUtility": "Copies the identity of an NPC, unlocking faction-specific dialogue choices.",
    "costDescription": "Player cannot speak for the duration.",
    "draftCost": { "obols": 55 },
    "activationCost": {}
  },
  {
    "id": "20_kasa_obake",
    "nameEn": "Kasa-obake",
    "kanji": "傘お化け",
    "utilityClass": "Stealth",
    "gameUtility": "Passive: Nullifies environmental hazards (Acid Rain, Toxic Fog) at corrupted Nodes.",
    "costDescription": "Occupies the \"Off-Hand\" equipment slot.",
    "draftCost": { "obols": 25 },
    "activationCost": {}
  },
  {
    "id": "21_takaonna",
    "nameEn": "Takaonna",
    "kanji": "高女",
    "utilityClass": "Stealth",
    "gameUtility": "Grants access to 2nd-story or elevated narrative paths without triggering alarms.",
    "costDescription": "Strains physical stamina/health.",
    "draftCost": { "obols": 30 },
    "activationCost": { "humanity": 5 }
  },
  {
    "id": "22_sunakake_baba",
    "nameEn": "Sunakake-baba",
    "kanji": "砂かけ婆",
    "utilityClass": "Stealth",
    "gameUtility": "Stuns all hostile entities at the current Node, allowing a free Escape action.",
    "costDescription": "Requires a pouch of \"Sacred Sand.\"",
    "draftCost": { "obols": 40 },
    "activationCost": { "requiredItemId": "sacred_sand" }
  },
  {
    "id": "23_akaname",
    "nameEn": "Akaname",
    "kanji": "垢嘗",
    "utilityClass": "Stealth",
    "gameUtility": "Erases forensic evidence (blood, prints), reducing Sector Entropy caused by the player's violent actions.",
    "costDescription": "Requires a \"dirty\" crime scene to summon.",
    "draftCost": { "obols": 45 },
    "activationCost": {}
  },
  {
    "id": "24_kodama",
    "nameEn": "Kodama",
    "kanji": "木霊",
    "utilityClass": "Stealth",
    "gameUtility": "Teleports the player between any two Forest/Park Nodes without advancing Time.",
    "costDescription": "Cannot be used in concrete/urban zones.",
    "draftCost": { "obols": 50 },
    "activationCost": {}
  },
  {
    "id": "25_betobeto_san",
    "nameEn": "Betobeto-san",
    "kanji": "べとべとさん",
    "utilityClass": "Stealth",
    "gameUtility": "Creates a phantom distraction, forcing security NPCs to abandon their current post.",
    "costDescription": "Player must politely \"step aside\" to trigger.",
    "draftCost": { "obols": 25 },
    "activationCost": {}
  },
  {
    "id": "26_kameosa",
    "nameEn": "Kameosa",
    "kanji": "瓶長",
    "utilityClass": "Utility",
    "gameUtility": "Duplicates one non-rare Inventory item (e.g., Lamp Oil, Sacred Sand). Cannot duplicate Obols or Ink.",
    "costDescription": "Requires a liquid catalyst (Water/Sake).",
    "draftCost": { "obols": 60 },
    "activationCost": { "requiredItemId": "water_flask" }
  },
  {
    "id": "27_zashiki_warashi",
    "nameEn": "Zashiki-warashi",
    "kanji": "座敷童子",
    "utilityClass": "Utility",
    "gameUtility": "Passive: Increases the amount of Obols generated when resolving Active Leads.",
    "costDescription": "Must be \"housed\" in the Player's HQ.",
    "draftCost": { "obols": 100 },
    "activationCost": {}
  },
  {
    "id": "28_kappa",
    "nameEn": "Kappa",
    "kanji": "河童",
    "utilityClass": "Utility",
    "gameUtility": "Restores 25 Humanity. Can only be used near a water source Node.",
    "costDescription": "A fresh cucumber or local water source.",
    "draftCost": { "obols": 40 },
    "activationCost": { "requiredItemId": "cucumber" }
  },
  {
    "id": "29_binb_gami",
    "nameEn": "Binbōgami",
    "kanji": "貧乏神",
    "utilityClass": "Utility",
    "gameUtility": "Transfers a Goetic Curse debuff from the Player to a target NPC.",
    "costDescription": "Drains a large amount of Player Gold.",
    "draftCost": { "obols": 75 },
    "activationCost": {}
  },
  {
    "id": "30_f_rin_bi",
    "nameEn": "Fūrin-bi",
    "kanji": "風鈴火",
    "utilityClass": "Utility",
    "gameUtility": "Restores 1 Dragon's Blood Ink. Requires an outdoor/windy Node.",
    "costDescription": "Requires a windy environment.",
    "draftCost": { "obols": 80 },
    "activationCost": {}
  },
  {
    "id": "31_nezumi_otoko",
    "nameEn": "Nezumi-otoko",
    "kanji": "ねずみ男",
    "utilityClass": "Utility",
    "gameUtility": "Opens a black market shop UI anywhere, allowing Obols to be traded for missing Catalysts.",
    "costDescription": "Takes a high commission on all sales.",
    "draftCost": { "obols": 75 },
    "activationCost": {}
  },
  {
    "id": "32_futakuchi_onna",
    "nameEn": "Futakuchi-onna",
    "kanji": "二口女",
    "utilityClass": "Utility",
    "gameUtility": "Passive: Increases the Player's active Tether capacity, allowing 4 Yokai contracts instead of 3.",
    "costDescription": "Consumes double \"Food\" resources.",
    "draftCost": { "obols": 150 },
    "activationCost": { "requiredItemId": "food_ration" }
  },
  {
    "id": "33_amefuri_koz_",
    "nameEn": "Amefuri-kozō",
    "kanji": "雨降小僧",
    "utilityClass": "Utility",
    "gameUtility": "Extinguishes fires, unlocking paths blocked by War-aligned Goetic fire events.",
    "costDescription": "Player gets \"Soaked\" (Speed debuff).",
    "draftCost": { "obols": 35 },
    "activationCost": {}
  },
  {
    "id": "34_umi_b_zu",
    "nameEn": "Umi-bōzu",
    "kanji": "海坊主",
    "utilityClass": "Utility",
    "gameUtility": "Generates massive fog cover, resetting the current Node's hostile alert state to zero.",
    "costDescription": "Only usable near large bodies of water.",
    "draftCost": { "obols": 55 },
    "activationCost": { "requiredItemId": "water_flask" }
  },
  {
    "id": "35_zeniarai_benten",
    "nameEn": "Zeniarai-benten",
    "kanji": "銭洗弁天",
    "utilityClass": "Utility",
    "gameUtility": "Purifies Cursed Obols (dropped by Goetia), converting them into usable currency.",
    "costDescription": "Requires a ritual washing at a spring.",
    "draftCost": { "obols": 60 },
    "activationCost": {}
  },
  {
    "id": "36_ky_bi_no_kitsune",
    "nameEn": "Kyūbi-no-kitsune",
    "kanji": "九尾の狐",
    "utilityClass": "Utility",
    "gameUtility": "Massive Catalyst: Fully restores Humanity and resets Sector Entropy to 0.",
    "costDescription": "Requires a permanent, heavy sacrifice.",
    "draftCost": { "obols": 300 },
    "activationCost": { "humanity": 50 }
  },
  {
    "id": "37_tengu",
    "nameEn": "Tengu",
    "kanji": "天狗",
    "utilityClass": "Enforcer",
    "gameUtility": "Kinetic Strike: Destroys physical barricades or knocks back minor demonic enemies.",
    "costDescription": "High cooldown; spiritual fatigue.",
    "draftCost": { "obols": 60 },
    "activationCost": { "humanity": 10 }
  },
  {
    "id": "38_ushioni",
    "nameEn": "Ushioni",
    "kanji": "牛鬼",
    "utilityClass": "Enforcer",
    "gameUtility": "Shadow Trap: Paralyzes a target entity, removing the Time penalty for sealing rituals.",
    "costDescription": "Can only be used in bright light.",
    "draftCost": { "obols": 75 },
    "activationCost": {}
  },
  {
    "id": "39_wany_d_",
    "nameEn": "Wanyūdō",
    "kanji": "輪入道",
    "utilityClass": "Enforcer",
    "gameUtility": "Fire Wall: Prevents Sector Entropy from increasing for the next 3 actions at this Node.",
    "costDescription": "Drains \"Fuel\" items from inventory.",
    "draftCost": { "obols": 70 },
    "activationCost": { "requiredItemId": "fuel_item" }
  },
  {
    "id": "40_gashadokuro",
    "nameEn": "Gashadokuro",
    "kanji": "がしゃどくろ",
    "utilityClass": "Enforcer",
    "gameUtility": "Heavy Siege: Smashes through Goetic Barriers, granting immediate access to the Boss Node.",
    "costDescription": "Requires 10+ \"Corpse\" markers nearby.",
    "draftCost": { "obols": 120 },
    "activationCost": {}
  },
  {
    "id": "41_jor_gumo",
    "nameEn": "Jorōgumo",
    "kanji": "絡新婦",
    "utilityClass": "Enforcer",
    "gameUtility": "Crowd Control: Binds multiple lesser demons, preventing them from draining Humanity during investigations.",
    "costDescription": "Vulnerable to Fire-based Goetic attacks.",
    "draftCost": { "obols": 65 },
    "activationCost": {}
  },
  {
    "id": "42_nekomata",
    "nameEn": "Nekomata",
    "kanji": "猫又",
    "utilityClass": "Enforcer",
    "gameUtility": "Reanimates a fallen NPC to extract one final Intel tag before they pass on.",
    "costDescription": "Consumes a \"Spirit Thread\" item.",
    "draftCost": { "obols": 55 },
    "activationCost": { "requiredItemId": "spirit_thread" }
  },
  {
    "id": "43_raij_",
    "nameEn": "Raijū",
    "kanji": "雷獣",
    "utilityClass": "Enforcer",
    "gameUtility": "EMP/Stun: Disables electronic security systems and stuns synthetic Goetic constructs.",
    "costDescription": "Requires a thunder/power source.",
    "draftCost": { "obols": 60 },
    "activationCost": {}
  },
  {
    "id": "44_basan",
    "nameEn": "Basan",
    "kanji": "波山",
    "utilityClass": "Enforcer",
    "gameUtility": "Ghost Fire: Destroys cursed objects that passively raise Sector Entropy.",
    "costDescription": "Player must \"feed\" it wood or paper.",
    "draftCost": { "obols": 50 },
    "activationCost": { "ink": 1 }
  },
  {
    "id": "45_kurozuka",
    "nameEn": "Kurozuka",
    "kanji": "黒塚",
    "utilityClass": "Enforcer",
    "gameUtility": "Life Leech: Steals 20 Humanity from an NPC target, but significantly raises Sector Entropy.",
    "costDescription": "Increases Player \"Corruption\" level.",
    "draftCost": { "obols": 80 },
    "activationCost": { "humanity": 20 }
  },
  {
    "id": "46_hannya",
    "nameEn": "Hannya",
    "kanji": "般若",
    "utilityClass": "Enforcer",
    "gameUtility": "Aggro Draw: Forces all active curses to target the Yokai instead of the player, sparing Humanity.",
    "costDescription": "High Sanity cost to summon.",
    "draftCost": { "obols": 75 },
    "activationCost": { "humanity": 10 }
  },
  {
    "id": "47_katashiro",
    "nameEn": "Katashiro",
    "kanji": "形代",
    "utilityClass": "Shikigami",
    "gameUtility": "Decoy: Creates a paper clone to automatically absorb one lethal Humanity drain.",
    "costDescription": "Consumes 1 Paper Doll item.",
    "draftCost": { "obols": 15 },
    "activationCost": { "requiredItemId": "paper_doll" }
  },
  {
    "id": "48_zenki___goki",
    "nameEn": "Zenki & Goki",
    "kanji": "前鬼・後鬼",
    "utilityClass": "Shikigami",
    "gameUtility": "Passive: Reduces all incoming Humanity damage by 2 while the contract is in the Tether.",
    "costDescription": "Constant drain on Spirit Energy.",
    "draftCost": { "obols": 40 },
    "activationCost": {}
  },
  {
    "id": "49_origami_tsuru",
    "nameEn": "Origami-Tsuru",
    "kanji": "折鶴",
    "utilityClass": "Shikigami",
    "gameUtility": "Messenger: Allows the player to execute a Seal Goetia action from an adjacent Node.",
    "costDescription": "Name must be written on the paper.",
    "draftCost": { "ink": 1 },
    "activationCost": { "ink": 1 }
  },
  {
    "id": "50_hitogata",
    "nameEn": "Hitogata",
    "kanji": "人形",
    "utilityClass": "Shikigami",
    "gameUtility": "Curse Eater: Immediately removes one negative status effect (e.g., Poison, Sickness).",
    "costDescription": "Doll is destroyed upon use.",
    "draftCost": { "obols": 25 },
    "activationCost": {}
  },
  {
    "id": "51_cho_gata",
    "nameEn": "Cho-gata",
    "kanji": "蝶形",
    "utilityClass": "Shikigami",
    "gameUtility": "Tracer: Marks an NPC. Their movement across the Map will no longer raise Sector Entropy.",
    "costDescription": "Requires a physical touch.",
    "draftCost": { "obols": 25 },
    "activationCost": {}
  },
  {
    "id": "52_ofuda",
    "nameEn": "Ofuda",
    "kanji": "御札",
    "utilityClass": "Shikigami",
    "gameUtility": "Acts as a wildcard Catalyst during a Sealing Ritual, substituting for one missing item.",
    "costDescription": "High crafting cost (Rare Ink/Paper).",
    "draftCost": { "obols": 45 },
    "activationCost": { "ink": 1 }
  }
];
