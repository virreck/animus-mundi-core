import type { YokaiContract } from './types';

export const allYokai: YokaiContract[] = [
  {
    "id": "01_ch_chin_obake",
    "nameEn": "Chōchin-obake",
    "kanji": "提灯お化け",
    "utilityClass": "Sensor",
    "gameUtility": "Flashlight / True Sight: Reveals hidden Goetic sigils.",
    "costDescription": "Constant supply of lamp oil.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "lamp_oil"
    }
  },
  {
    "id": "02_shirime",
    "nameEn": "Shirime",
    "kanji": "尻目",
    "utilityClass": "Sensor",
    "gameUtility": "Rear-View Sensor: Prevents back-attacks/ambushes.",
    "costDescription": "A \"prank\" performed on a neutral NPC.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "03_satori",
    "nameEn": "Satori",
    "kanji": "覚",
    "utilityClass": "Sensor",
    "gameUtility": "Interrogation: Detects lies during questioning.",
    "costDescription": "Temporary Sanity/MP drain.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 10
    }
  },
  {
    "id": "04_mokumokuren",
    "nameEn": "Mokumokuren",
    "kanji": "目目連",
    "utilityClass": "Sensor",
    "gameUtility": "Room Scanner: Sees everyone inside a building.",
    "costDescription": "Must be used in a room with windows.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "05_yosuzume",
    "nameEn": "Yosuzume",
    "kanji": "夜雀",
    "utilityClass": "Sensor",
    "gameUtility": "Proximity Alarm: Chirps near Goetic entities.",
    "costDescription": "Small offerings of grain/seed.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "06_ungaiky_",
    "nameEn": "Ungaikyō",
    "kanji": "雲外鏡",
    "utilityClass": "Sensor",
    "gameUtility": "Remote Viewing: A live CCTV feed of a distant room.",
    "costDescription": "Requires a silver-backed mirror focus.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "silver_mirror"
    }
  },
  {
    "id": "07_baku",
    "nameEn": "Baku",
    "kanji": "獏",
    "utilityClass": "Sensor",
    "gameUtility": "Dream Forensics: Extracts memories from the sleeping.",
    "costDescription": "Player loses 1 \"Positive Memory\" (buff).",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "08_yamabiko",
    "nameEn": "Yamabiko",
    "kanji": "山彦",
    "utilityClass": "Sensor",
    "gameUtility": "Sonic Echo: Eavesdrop through thick walls.",
    "costDescription": "Must shout a specific vocal command.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "09_tenjo_name",
    "nameEn": "Tenjo-name",
    "kanji": "天井舐",
    "utilityClass": "Sensor",
    "gameUtility": "Ceiling Scout: Reveals attic traps or hidden items.",
    "costDescription": "Room must be in total darkness.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "10_hiderigami",
    "nameEn": "Hiderigami",
    "kanji": "魃",
    "utilityClass": "Sensor",
    "gameUtility": "Thermal Tracker: Detects \"Cold Spots\" (Death/Ghost).",
    "costDescription": "Drains player hydration/water items.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "water_flask"
    }
  },
  {
    "id": "11_amabie",
    "nameEn": "Amabie",
    "kanji": "アマビエ",
    "utilityClass": "Sensor",
    "gameUtility": "Event Forecast: Predicts upcoming world \"Symptoms.\"",
    "costDescription": "Draw and share the Amabie’s likeness.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "12_ao_and_",
    "nameEn": "Ao-andō",
    "kanji": "青行燈",
    "utilityClass": "Sensor",
    "gameUtility": "Ghost Summoner: Forces spirits to manifest.",
    "costDescription": "Tells a \"Scary Story\" (Time skip).",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "13_inugami",
    "nameEn": "Inugami",
    "kanji": "犬神",
    "utilityClass": "Sensor",
    "gameUtility": "Bloodhound: Tracks targets via DNA/Scent.",
    "costDescription": "A drop of the Player's own blood.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 5
    }
  },
  {
    "id": "14_enenra",
    "nameEn": "Enenra",
    "kanji": "煙々羅",
    "utilityClass": "Stealth",
    "gameUtility": "Smoke Form: Drift through keyholes and vents.",
    "costDescription": "Only works near an active fire/hearth.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "15_nurikabe",
    "nameEn": "Nurikabe",
    "kanji": "ぬりかべ",
    "utilityClass": "Stealth",
    "gameUtility": "Exit Blocker: Traps a suspect in a dead-end.",
    "costDescription": "Player must remain stationary.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "16_kamaitachi",
    "nameEn": "Kamaitachi",
    "kanji": "鎌鼬",
    "utilityClass": "Stealth",
    "gameUtility": "Lock Breaker: Silently slices bolts/chains.",
    "costDescription": "High Wind-Essence cost.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "17_ittan_momen",
    "nameEn": "Ittan-momen",
    "kanji": "一反木綿",
    "utilityClass": "Stealth",
    "gameUtility": "Glider / Capture: Aerial mobility or a straitjacket.",
    "costDescription": "Must be \"washed\" at a shrine after use.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "18_nurarihyon",
    "nameEn": "Nurarihyon",
    "kanji": "ぬらりひょん",
    "utilityClass": "Stealth",
    "gameUtility": "Social Stealth: NPCs ignore your presence.",
    "costDescription": "A high-quality meal or tea offering.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "food_ration"
    }
  },
  {
    "id": "19_noppera_b_",
    "nameEn": "Noppera-bō",
    "kanji": "のっぺら坊",
    "utilityClass": "Stealth",
    "gameUtility": "Identity Theft: Copy the face of a nearby NPC.",
    "costDescription": "Player cannot speak for the duration.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "20_kasa_obake",
    "nameEn": "Kasa-obake",
    "kanji": "傘お化け",
    "utilityClass": "Stealth",
    "gameUtility": "Rain Shield: Blocks \"Pestilence\" acid rain.",
    "costDescription": "Occupies the \"Off-Hand\" equipment slot.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "21_takaonna",
    "nameEn": "Takaonna",
    "kanji": "高女",
    "utilityClass": "Stealth",
    "gameUtility": "Verticality: Peer into 2nd-story windows.",
    "costDescription": "Strains physical stamina/health.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 5
    }
  },
  {
    "id": "22_sunakake_baba",
    "nameEn": "Sunakake-baba",
    "kanji": "砂かけ婆",
    "utilityClass": "Stealth",
    "gameUtility": "Blindness: Stuns guards with spiritual sand.",
    "costDescription": "Requires a pouch of \"Sacred Sand.\"",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "sacred_sand"
    }
  },
  {
    "id": "23_akaname",
    "nameEn": "Akaname",
    "kanji": "垢嘗",
    "utilityClass": "Stealth",
    "gameUtility": "Evidence Eraser: Cleans blood/fingerprints.",
    "costDescription": "Requires a \"dirty\" crime scene to summon.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "24_kodama",
    "nameEn": "Kodama",
    "kanji": "木霊",
    "utilityClass": "Stealth",
    "gameUtility": "Forest Path: Teleport between old-growth trees.",
    "costDescription": "Cannot be used in concrete/urban zones.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "25_betobeto_san",
    "nameEn": "Betobeto-san",
    "kanji": "べとべとさん",
    "utilityClass": "Stealth",
    "gameUtility": "Distraction: Phantom footsteps lead guards away.",
    "costDescription": "Player must politely \"step aside\" to trigger.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "26_kameosa",
    "nameEn": "Kameosa",
    "kanji": "瓶長",
    "utilityClass": "Utility",
    "gameUtility": "Item Duplicator: Temporary infinite small items.",
    "costDescription": "Requires a liquid catalyst (Water/Sake).",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "water_flask"
    }
  },
  {
    "id": "27_zashiki_warashi",
    "nameEn": "Zashiki-warashi",
    "kanji": "座敷童子",
    "utilityClass": "Utility",
    "gameUtility": "Loot Booster: Better clues/items found in-base.",
    "costDescription": "Must be \"housed\" in the Player's HQ.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "28_kappa",
    "nameEn": "Kappa",
    "kanji": "河童",
    "utilityClass": "Utility",
    "gameUtility": "Medic: Heals broken bones and physical injury.",
    "costDescription": "A fresh cucumber or local water source.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "cucumber"
    }
  },
  {
    "id": "29_binb_gami",
    "nameEn": "Binbōgami",
    "kanji": "貧乏神",
    "utilityClass": "Utility",
    "gameUtility": "Curse Transfer: Moves debuffs from Player to NPC.",
    "costDescription": "Drains a large amount of Player Gold.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "30_f_rin_bi",
    "nameEn": "Fūrin-bi",
    "kanji": "風鈴火",
    "utilityClass": "Utility",
    "gameUtility": "Energy Recharge: Restores MP/Shikigami points.",
    "costDescription": "Requires a windy environment.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "31_nezumi_otoko",
    "nameEn": "Nezumi-otoko",
    "kanji": "ねずみ男",
    "utilityClass": "Utility",
    "gameUtility": "Black Market: Buy/Sell \"Illegal\" esoteric goods.",
    "costDescription": "Takes a high commission on all sales.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "32_futakuchi_onna",
    "nameEn": "Futakuchi-onna",
    "kanji": "二口女",
    "utilityClass": "Utility",
    "gameUtility": "Double-Casting: Use two Yokai simultaneously.",
    "costDescription": "Consumes double \"Food\" resources.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "food_ration"
    }
  },
  {
    "id": "33_amefuri_koz_",
    "nameEn": "Amefuri-kozō",
    "kanji": "雨降小僧",
    "utilityClass": "Utility",
    "gameUtility": "Fire Extinguisher: Localized rain puts out fires.",
    "costDescription": "Player gets \"Soaked\" (Speed debuff).",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "34_umi_b_zu",
    "nameEn": "Umi-bōzu",
    "kanji": "海坊主",
    "utilityClass": "Utility",
    "gameUtility": "Fog Cover: Massive smoke screen for escapes.",
    "costDescription": "Only usable near large bodies of water.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "water_flask"
    }
  },
  {
    "id": "35_zeniarai_benten",
    "nameEn": "Zeniarai-benten",
    "kanji": "銭洗弁天",
    "utilityClass": "Utility",
    "gameUtility": "Money Cleansing: Purifies \"Cursed\" Horseman Gold.",
    "costDescription": "Requires a ritual washing at a spring.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "36_ky_bi_no_kitsune",
    "nameEn": "Kyūbi-no-kitsune",
    "kanji": "九尾の狐",
    "utilityClass": "Utility",
    "gameUtility": "Master Catalyst: Massive buff to all Yokai stats.",
    "costDescription": "Requires a permanent, heavy sacrifice.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 20
    }
  },
  {
    "id": "37_tengu",
    "nameEn": "Tengu",
    "kanji": "天狗",
    "utilityClass": "Enforcer",
    "gameUtility": "Kinetic Strike: Wind gust blows back objects.",
    "costDescription": "High cooldown; spiritual fatigue.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 10
    }
  },
  {
    "id": "38_ushioni",
    "nameEn": "Ushioni",
    "kanji": "牛鬼",
    "utilityClass": "Enforcer",
    "gameUtility": "Shadow Trap: Paralyzes a target via their shadow.",
    "costDescription": "Can only be used in bright light.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "39_wany_d_",
    "nameEn": "Wanyūdō",
    "kanji": "輪入道",
    "utilityClass": "Enforcer",
    "gameUtility": "Fire Wall: Flaming wheel protects your perimeter.",
    "costDescription": "Drains \"Fuel\" items from inventory.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "fuel_item"
    }
  },
  {
    "id": "40_gashadokuro",
    "nameEn": "Gashadokuro",
    "kanji": "がしゃどくろ",
    "utilityClass": "Enforcer",
    "gameUtility": "Heavy Siege: Smashes through walls/barriers.",
    "costDescription": "Requires 10+ \"Corpse\" markers nearby.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "41_jor_gumo",
    "nameEn": "Jorōgumo",
    "kanji": "絡新婦",
    "utilityClass": "Enforcer",
    "gameUtility": "Crowd Control: Binds multiple enemies in silk.",
    "costDescription": "Vulnerable to Fire-based Goetic attacks.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "42_nekomata",
    "nameEn": "Nekomata",
    "kanji": "猫又",
    "utilityClass": "Enforcer",
    "gameUtility": "Body Puppet: Reanimates a fallen enemy.",
    "costDescription": "Consumes a \"Spirit Thread\" item.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "spirit_thread"
    }
  },
  {
    "id": "43_raij_",
    "nameEn": "Raijū",
    "kanji": "雷獣",
    "utilityClass": "Enforcer",
    "gameUtility": "EMP / Stun: Disables electronics/Goetia.",
    "costDescription": "Requires a thunder/power source.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "44_basan",
    "nameEn": "Basan",
    "kanji": "波山",
    "utilityClass": "Enforcer",
    "gameUtility": "Ghost Fire: Cold fire damages spirits only.",
    "costDescription": "Player must \"feed\" it wood or paper.",
    "draftCost": 50,
    "activationCost": {
      "ink": 1
    }
  },
  {
    "id": "45_kurozuka",
    "nameEn": "Kurozuka",
    "kanji": "黒塚",
    "utilityClass": "Enforcer",
    "gameUtility": "Life Leech: Steals HP from a target.",
    "costDescription": "Increases Player \"Corruption\" level.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 20
    }
  },
  {
    "id": "46_hannya",
    "nameEn": "Hannya",
    "kanji": "般若",
    "utilityClass": "Enforcer",
    "gameUtility": "Aggro Draw: Forces all enemies to attack it.",
    "costDescription": "High Sanity cost to summon.",
    "draftCost": 50,
    "activationCost": {
      "humanity": 10
    }
  },
  {
    "id": "47_katashiro",
    "nameEn": "Katashiro",
    "kanji": "形代",
    "utilityClass": "Shikigami",
    "gameUtility": "Decoy: Creates a paper clone of the player.",
    "costDescription": "Consumes 1 Paper Doll item.",
    "draftCost": 50,
    "activationCost": {
      "requiredItemId": "paper_doll"
    }
  },
  {
    "id": "48_zenki___goki",
    "nameEn": "Zenki & Goki",
    "kanji": "前鬼・後鬼",
    "utilityClass": "Shikigami",
    "gameUtility": "Bodyguards: Passive physical defense buff.",
    "costDescription": "Constant drain on Spirit Energy.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "49_origami_tsuru",
    "nameEn": "Origami-Tsuru",
    "kanji": "折鶴",
    "utilityClass": "Shikigami",
    "gameUtility": "Messenger: Delivers a seal to a distant target.",
    "costDescription": "Name must be written on the paper.",
    "draftCost": 50,
    "activationCost": {
      "ink": 1
    }
  },
  {
    "id": "50_hitogata",
    "nameEn": "Hitogata",
    "kanji": "人形",
    "utilityClass": "Shikigami",
    "gameUtility": "Curse Eater: Absorbs one status effect.",
    "costDescription": "Doll is destroyed upon use.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "51_cho_gata",
    "nameEn": "Cho-gata",
    "kanji": "蝶形",
    "utilityClass": "Shikigami",
    "gameUtility": "Tracer: Paper butterfly tracks an NPC.",
    "costDescription": "Requires a physical touch.",
    "draftCost": 50,
    "activationCost": {}
  },
  {
    "id": "52_ofuda",
    "nameEn": "Ofuda",
    "kanji": "御札",
    "utilityClass": "Shikigami",
    "gameUtility": "Banishment: Final strike against a Goetia.",
    "costDescription": "High crafting cost (Rare Ink/Paper).",
    "draftCost": 50,
    "activationCost": {
      "ink": 1
    }
  }
];
