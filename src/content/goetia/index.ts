// src/content/goetia/index.ts
import type { GoetiaLieutenant } from './types';

export const allGoetia: GoetiaLieutenant[] = [
  // --- THE FIRST 18 (1 - 18) ---
  {
    id: "01_bael", manifestId: 1, name: "Bael", rank: "King", allegiance: "CONQUEST",
    title: "The First Principal Spirit",
    description: "A ruling King of the East. He manifests with three heads: a toad, a man, and a cat. He grants the power of invisibility and speaks with a hoarse voice.",
    requiredIntel: ["hoarse_voice", "amphibian_tracks", "sudden_invisibility"],
    sealCost: { sacred_sand: 1, cold_iron_filings: 2 }
  },
  {
    id: "02_agares", manifestId: 2, name: "Agares", rank: "Duke", allegiance: "CONQUEST",
    title: "The Old Man on the Crocodile",
    description: "Manifests as a frail man riding a crocodile, carrying a goshawk. He halts those who run, retrieves runaways, and teaches all languages.",
    requiredIntel: ["earthquake_tremors", "lost_languages", "avian_screeches"],
    sealCost: { copper_wire: 2, obols: 10 }
  },
  {
    id: "03_vassago", manifestId: 3, name: "Vassago", rank: "Prince", allegiance: "CONQUEST",
    title: "The Blind Seer",
    description: "A spirit of good nature who declares things past and to come, and discovers all things hidden or lost.",
    requiredIntel: ["cryptic_whispers", "star_alignment", "mind_fog"],
    sealCost: { silver_shavings: 1, sacred_sand: 2 }
  },
  {
    id: "04_samigina", manifestId: 4, name: "Samigina", rank: "Marquis", allegiance: "DEATH",
    title: "The Pale Horse",
    description: "Manifests as a small horse or ass. He speaks with a rough voice and teaches all liberal sciences, gathering dead souls to answer questions.",
    requiredIntel: ["hoarse_voice", "necrotic_stasis", "corpse_theft"],
    sealCost: { grave_dust: 2, bone_meal: 1 }
  },
  {
    id: "05_marbas", manifestId: 5, name: "Marbas", rank: "President", allegiance: "FAMINE",
    title: "The Great Lion",
    description: "Appears as a great lion. He causes and cures diseases, imparts wisdom, and changes men into other shapes.",
    requiredIntel: ["plague_vectors", "metal_transmutation", "blood_frenzy"],
    sealCost: { mercury_drops: 1, brimstone_ash: 2 }
  },
  {
    id: "06_valefor", manifestId: 6, name: "Valefor", rank: "Duke", allegiance: "WAR",
    title: "The Lion-Headed Ass",
    description: "A familiar spirit who tempts men to steal and creates conflict among thieves. He excels in guerrilla warfare.",
    requiredIntel: ["weapon_decay", "corpse_theft", "illusory_terrain"],
    sealCost: { copper_wire: 2, black_salt: 1 }
  },
  {
    id: "07_amon", manifestId: 7, name: "Amon", rank: "Marquis", allegiance: "WAR",
    title: "The Flame-Breathing Wolf",
    description: "Appears as a wolf with a serpent's tail, vomiting flames. He reconciles controversies between friends and foes.",
    requiredIntel: ["wolf_howls", "thermal_scorching", "serpent_scales"],
    sealCost: { brimstone_ash: 3, silver_shavings: 1 }
  },
  {
    id: "08_barbatos", manifestId: 8, name: "Barbatos", rank: "Duke", allegiance: "FAMINE",
    title: "The Forest Master",
    description: "Appears when the sun is in Sagittarius with four noble kings. He understands the songs of birds and the barking of dogs, and breaks hidden enchantments.",
    requiredIntel: ["avian_screeches", "wolf_howls", "illusory_terrain"],
    sealCost: { copper_wire: 1, sacred_sand: 2 }
  },
  {
    id: "09_paimon", manifestId: 9, name: "Paimon", rank: "King", allegiance: "CONQUEST",
    title: "The Obedient King",
    description: "Rides a dromedary camel, preceded by men playing trumpets and cymbals. He binds any man to the summoner's will.",
    requiredIntel: ["hoarse_voice", "mind_fog", "temporal_distortion"],
    sealCost: { gold_leaf: 1, sacred_sand: 3 }
  },
  {
    id: "10_buer", manifestId: 10, name: "Buer", rank: "President", allegiance: "FAMINE",
    title: "The Centaur Star",
    description: "Appears as a centaur armed with a bow and arrows. He heals all distempers in man and gives good familiars.",
    requiredIntel: ["plague_vectors", "star_alignment", "lost_languages"],
    sealCost: { mercury_drops: 2, sacred_sand: 1 }
  },
  {
    id: "11_gusion", manifestId: 11, name: "Gusion", rank: "Duke", allegiance: "DEATH",
    title: "The Cynocephalus",
    description: "Appears as a baboon. He tells of past, present, and future, shows the meaning of all questions, and reconciles friendships.",
    requiredIntel: ["cryptic_whispers", "necrotic_stasis", "mind_fog"],
    sealCost: { copper_wire: 2, grave_dust: 1 }
  },
  {
    id: "12_sitri", manifestId: 12, name: "Sitri", rank: "Prince", allegiance: "CONQUEST",
    title: "The Leopard-Headed Griffin",
    description: "Enflames men with women's love, and women with men's love. He forces them to show themselves naked.",
    requiredIntel: ["blood_frenzy", "avian_screeches", "mind_fog"],
    sealCost: { silver_shavings: 2, black_salt: 1 }
  },
  {
    id: "13_beleth", manifestId: 13, name: "Beleth", rank: "King", allegiance: "CONQUEST",
    title: "The Terrible King",
    description: "Rides a pale horse with musical instruments playing before him. He is furious when first summoned and requires a hazel wand to command.",
    requiredIntel: ["earthquake_tremors", "sudden_invisibility", "mind_fog"],
    sealCost: { gold_leaf: 1, cold_iron_filings: 2 }
  },
  {
    id: "14_leraje", manifestId: 14, name: "Leraje", rank: "Marquis", allegiance: "WAR",
    title: "The Archer in Green",
    description: "Appears as an archer clad in green. He causes great battles and contests, and makes arrow wounds putrefy.",
    requiredIntel: ["weapon_decay", "blood_frenzy", "plague_vectors"],
    sealCost: { silver_shavings: 1, brimstone_ash: 2 }
  },
  {
    id: "15_eligos", manifestId: 15, name: "Eligos", rank: "Duke", allegiance: "WAR",
    title: "The Knight of the Lance",
    description: "A goodly knight carrying a lance, ensign, and serpent. He discovers hidden things and knows the outcome of wars.",
    requiredIntel: ["weapon_decay", "serpent_scales", "cryptic_whispers"],
    sealCost: { copper_wire: 2, cold_iron_filings: 1 }
  },
  {
    id: "16_zepar", manifestId: 16, name: "Zepar", rank: "Duke", allegiance: "CONQUEST",
    title: "The Soldier of Red",
    description: "Appears as a soldier in red apparel. He causes women to love men and can make them barren.",
    requiredIntel: ["blood_frenzy", "necrotic_stasis", "mind_fog"],
    sealCost: { copper_wire: 1, grave_dust: 2 }
  },
  {
    id: "17_botis", manifestId: 17, name: "Botis", rank: "President", allegiance: "FAMINE",
    title: "The Ugly Viper",
    description: "Appears initially as an ugly viper, then puts on a human shape with great teeth and two horns, carrying a sharp sword.",
    requiredIntel: ["serpent_scales", "weapon_decay", "cryptic_whispers"],
    sealCost: { mercury_drops: 1, cold_iron_filings: 2 }
  },
  {
    id: "18_bathin", manifestId: 18, name: "Bathin", rank: "Duke", allegiance: "FAMINE",
    title: "The Pale Horseman",
    description: "A strong man with a serpent's tail riding a pale horse. He transports men instantly from one country to another.",
    requiredIntel: ["serpent_scales", "temporal_distortion", "astral_projection"],
    sealCost: { copper_wire: 2, sacred_sand: 1 }
  },

  // --- THE SECOND 18 (19 - 36) ---
  {
    id: "19_sallos", manifestId: 19, name: "Sallos", rank: "Duke", allegiance: "CONQUEST",
    title: "The Pacifist Soldier",
    description: "A gallant soldier riding a crocodile, wearing a ducal crown. He is peaceable and causes love between the sexes.",
    requiredIntel: ["amphibian_tracks", "illusory_terrain", "mind_fog"],
    sealCost: { copper_wire: 2, silver_shavings: 1 }
  },
  {
    id: "20_purson", manifestId: 20, name: "Purson", rank: "King", allegiance: "CONQUEST",
    title: "The Bear-Riding King",
    description: "A lion-faced man carrying a viper, riding a bear. He knows all hidden things and can discover treasure.",
    requiredIntel: ["serpent_scales", "wolf_howls", "cryptic_whispers"],
    sealCost: { gold_leaf: 1, sacred_sand: 2 }
  },
  {
    id: "21_marax", manifestId: 21, name: "Marax", rank: "Earl", allegiance: "FAMINE",
    title: "The Bull-Faced Man",
    description: "Appears as a great bull with a man's face. He gives good familiars and knows the virtues of all herbs and stones.",
    requiredIntel: ["plague_vectors", "metal_transmutation", "astral_projection"],
    sealCost: { lead_weights: 2, sacred_sand: 1 }
  },
  {
    id: "22_ipos", manifestId: 22, name: "Ipos", rank: "Prince", allegiance: "WAR",
    title: "The Angel-Lion",
    description: "An angel with a lion's head, goose's feet, and hare's tail. He makes men witty and bold.",
    requiredIntel: ["avian_screeches", "blood_frenzy", "cryptic_whispers"],
    sealCost: { silver_shavings: 2, cold_iron_filings: 1 }
  },
  {
    id: "23_aim", manifestId: 23, name: "Aim", rank: "Duke", allegiance: "WAR",
    title: "The Firebrand",
    description: "A man with three heads (serpent, man, calf) riding a viper. He sets cities and castles on fire with a firebrand.",
    requiredIntel: ["thermal_scorching", "serpent_scales", "weapon_decay"],
    sealCost: { copper_wire: 1, brimstone_ash: 3 }
  },
  {
    id: "24_naberius", manifestId: 24, name: "Naberius", rank: "Marquis", allegiance: "DEATH",
    title: "The Three-Headed Dog",
    description: "Appears as a black crane fluttering about. He makes men cunning in arts and sciences, and restores lost dignities.",
    requiredIntel: ["avian_screeches", "hoarse_voice", "corpse_theft"],
    sealCost: { silver_shavings: 1, bone_meal: 2 }
  },
  {
    id: "25_glasya_labolas", manifestId: 25, name: "Glasya-Labolas", rank: "President", allegiance: "DEATH",
    title: "The Author of Bloodshed",
    description: "A dog with the wings of a griffin. He incites murders and bloodshed, and can make a man invisible.",
    requiredIntel: ["blood_frenzy", "wolf_howls", "sudden_invisibility"],
    sealCost: { mercury_drops: 1, grave_dust: 2 }
  },
  {
    id: "26_bune", manifestId: 26, name: "Bune", rank: "Duke", allegiance: "DEATH",
    title: "The Three-Headed Dragon",
    description: "A dragon with three heads (dog, griffin, man). He moves the dead, gathers demons around graves, and gives riches.",
    requiredIntel: ["corpse_theft", "necrotic_stasis", "hoarse_voice"],
    sealCost: { copper_wire: 1, grave_dust: 3 }
  },
  {
    id: "27_ronove", manifestId: 27, name: "Ronove", rank: "Marquis", allegiance: "FAMINE",
    title: "The Monster of Rhetoric",
    description: "Appears as a monster. He teaches rhetoric, gives good servants, and grants favor with friends and foes.",
    requiredIntel: ["lost_languages", "illusory_terrain", "cryptic_whispers"],
    sealCost: { silver_shavings: 2, sacred_sand: 1 }
  },
  {
    id: "28_berith", manifestId: 28, name: "Berith", rank: "Duke", allegiance: "FAMINE",
    title: "The Red Soldier",
    description: "A soldier clad in red, riding a red horse, wearing a gold crown. He turns all metals into gold and is a great liar.",
    requiredIntel: ["metal_transmutation", "illusory_terrain", "cryptic_whispers"],
    sealCost: { copper_wire: 2, gold_leaf: 1 }
  },
  {
    id: "29_astaroth", manifestId: 29, name: "Astaroth", rank: "Duke", allegiance: "CONQUEST",
    title: "The Foul Angel",
    description: "A hurtful angel riding an infernal dragon, carrying a viper. He emits a poisonous breath and knows all secrets.",
    requiredIntel: ["serpent_scales", "sulfur_stench", "plague_vectors"],
    sealCost: { copper_wire: 2, brimstone_ash: 2 }
  },
  {
    id: "30_forneus", manifestId: 30, name: "Forneus", rank: "Marquis", allegiance: "FAMINE",
    title: "The Great Sea Monster",
    description: "Appears as a great sea monster. He teaches arts and sciences, makes men beloved, and teaches languages.",
    requiredIntel: ["water_corruption", "lost_languages", "mind_fog"],
    sealCost: { silver_shavings: 2, black_salt: 1 }
  },
  {
    id: "31_foras", manifestId: 31, name: "Foras", rank: "President", allegiance: "CONQUEST",
    title: "The Strong Man",
    description: "A strong man in human shape. He teaches logic, ethics, and the virtues of herbs, and can make a man invisible and live long.",
    requiredIntel: ["sudden_invisibility", "temporal_distortion", "metal_transmutation"],
    sealCost: { mercury_drops: 1, sacred_sand: 2 }
  },
  {
    id: "32_asmoday", manifestId: 32, name: "Asmoday", rank: "King", allegiance: "CONQUEST",
    title: "The Three-Headed Beast",
    description: "A king with three heads (bull, man, ram), a serpent's tail, and webbed feet, breathing fire. He gives the Ring of Virtues.",
    requiredIntel: ["thermal_scorching", "amphibian_tracks", "serpent_scales"],
    sealCost: { gold_leaf: 1, brimstone_ash: 2 }
  },
  {
    id: "33_gaap", manifestId: 33, name: "Gaap", rank: "President", allegiance: "CONQUEST",
    title: "The Guide of Kings",
    description: "Appears in human form to guide four great kings. He causes love or hate, delivers familiars, and answers truly of things past and future.",
    requiredIntel: ["mind_fog", "astral_projection", "cryptic_whispers"],
    sealCost: { mercury_drops: 1, obols: 10 }
  },
  {
    id: "34_furfur", manifestId: 34, name: "Furfur", rank: "Earl", allegiance: "WAR",
    title: "The Winged Hart",
    description: "Appears as a hart with a fiery tail. He creates storms, tempests, and thunder, and causes love between man and wife.",
    requiredIntel: ["tempest_winds", "thermal_scorching", "blood_frenzy"],
    sealCost: { lead_weights: 1, brimstone_ash: 2 }
  },
  {
    id: "35_marchosias", manifestId: 35, name: "Marchosias", rank: "Marquis", allegiance: "WAR",
    title: "The She-Wolf",
    description: "Appears as a wolf with a griffin's wings and a serpent's tail, vomiting fire. A strong fighter loyal to his summoner.",
    requiredIntel: ["wolf_howls", "thermal_scorching", "weapon_decay"],
    sealCost: { silver_shavings: 1, cold_iron_filings: 2 }
  },
  {
    id: "36_stolas", manifestId: 36, name: "Stolas", rank: "Prince", allegiance: "FAMINE",
    title: "The Crowned Owl",
    description: "Appears as a mighty raven or owl with a crown. He teaches astronomy and the properties of herbs and precious stones.",
    requiredIntel: ["avian_screeches", "star_alignment", "lost_languages"],
    sealCost: { silver_shavings: 2, sacred_sand: 1 }
  },

  // --- THE THIRD 18 (37 - 54) ---
  {
    id: "37_phenex", manifestId: 37, name: "Phenex", rank: "Marquis", allegiance: "FAMINE",
    title: "The Sweet-Voiced Bird",
    description: "Appears as a phoenix bird with a child's voice. He sings beautifully but requires the summoner to demand he take human shape.",
    requiredIntel: ["avian_screeches", "thermal_scorching", "illusory_terrain"],
    sealCost: { silver_shavings: 2, brimstone_ash: 1 }
  },
  {
    id: "38_halphas", manifestId: 38, name: "Halphas", rank: "Earl", allegiance: "WAR",
    title: "The Stock-Dove",
    description: "Appears as a stock-dove speaking with a hoarse voice. He builds towns full of ammunition and weapons, and sends men of war to places.",
    requiredIntel: ["avian_screeches", "weapon_decay", "hoarse_voice"],
    sealCost: { lead_weights: 2, cold_iron_filings: 2 }
  },
  {
    id: "39_malphas", manifestId: 39, name: "Malphas", rank: "President", allegiance: "WAR",
    title: "The Great Crow",
    description: "Appears as a crow but takes human shape. He builds high towers and houses, and destroys the enemy's desires or thoughts.",
    requiredIntel: ["avian_screeches", "earthquake_tremors", "mind_fog"],
    sealCost: { mercury_drops: 1, cold_iron_filings: 2 }
  },
  {
    id: "40_raum", manifestId: 40, name: "Raum", rank: "Earl", allegiance: "FAMINE",
    title: "The Thief of Kings",
    description: "Appears as a crow. He steals treasure out of kings' houses, destroys cities, and tells all things past and what is to come.",
    requiredIntel: ["avian_screeches", "earthquake_tremors", "temporal_distortion"],
    sealCost: { lead_weights: 1, black_salt: 2 }
  },
  {
    id: "41_focalor", manifestId: 41, name: "Focalor", rank: "Duke", allegiance: "WAR",
    title: "The Wind and Sea",
    description: "A man with a griffin's wings. He slays men by drowning them and overthrows ships of war, commanding the winds and seas.",
    requiredIntel: ["water_corruption", "tempest_winds", "necrotic_stasis"],
    sealCost: { copper_wire: 2, black_salt: 1 }
  },
  {
    id: "42_vepar", manifestId: 42, name: "Vepar", rank: "Duke", allegiance: "DEATH",
    title: "The Mermaid of Wounds",
    description: "Appears as a mermaid. She governs the waters and guides ships, but can cause men to die in three days by putrefying their wounds.",
    requiredIntel: ["water_corruption", "plague_vectors", "necrotic_stasis"],
    sealCost: { copper_wire: 1, grave_dust: 2 }
  },
  {
    id: "43_sabnock", manifestId: 43, name: "Sabnock", rank: "Marquis", allegiance: "WAR",
    title: "The Builder of Forts",
    description: "An armed soldier with a lion's head riding a pale horse. He builds high towers and afflicts men with wounds and gangrene.",
    requiredIntel: ["earthquake_tremors", "plague_vectors", "weapon_decay"],
    sealCost: { silver_shavings: 1, cold_iron_filings: 3 }
  },
  {
    id: "44_shax", manifestId: 44, name: "Shax", rank: "Marquis", allegiance: "FAMINE",
    title: "The Great Stork",
    description: "Appears as a stork speaking with a hoarse, subtle voice. He steals money from kings and takes away sight, hearing, and understanding.",
    requiredIntel: ["avian_screeches", "mind_fog", "hoarse_voice"],
    sealCost: { silver_shavings: 2, black_salt: 1 }
  },
  {
    id: "45_vine", manifestId: 45, name: "Vine", rank: "King", allegiance: "WAR",
    title: "The Lion on the Black Horse",
    description: "A lion riding a black horse, carrying a viper. He builds towers, overthrows stone walls, and makes the waters rough.",
    requiredIntel: ["earthquake_tremors", "tempest_winds", "serpent_scales"],
    sealCost: { gold_leaf: 1, cold_iron_filings: 2 }
  },
  {
    id: "46_bifrons", manifestId: 46, name: "Bifrons", rank: "Earl", allegiance: "DEATH",
    title: "The Grave-Lighter",
    description: "Appears as a monster but takes human shape. He teaches astrology, geometry, and moves dead bodies, lighting candles on their graves.",
    requiredIntel: ["corpse_theft", "thermal_scorching", "star_alignment"],
    sealCost: { lead_weights: 1, grave_dust: 2 }
  },
  {
    id: "47_uvall", manifestId: 47, name: "Uvall", rank: "Duke", allegiance: "CONQUEST",
    title: "The Dromedary",
    description: "Appears as a great dromedary. He procures the love of women and tells things past, present, and to come.",
    requiredIntel: ["temporal_distortion", "blood_frenzy", "cryptic_whispers"],
    sealCost: { copper_wire: 2, sacred_sand: 1 }
  },
  {
    id: "48_haagenti", manifestId: 48, name: "Haagenti", rank: "President", allegiance: "FAMINE",
    title: "The Winged Bull",
    description: "Appears as a mighty bull with griffin's wings. He makes men wise, transmutes all metals to gold, and turns water into wine.",
    requiredIntel: ["metal_transmutation", "water_corruption", "avian_screeches"],
    sealCost: { mercury_drops: 1, gold_leaf: 1 }
  },
  {
    id: "49_crocell", manifestId: 49, name: "Crocell", rank: "Duke", allegiance: "FAMINE",
    title: "The Angel of Water",
    description: "Appears as an angel. He speaks mystically of hidden things, teaches geometry, and can warm waters or discover baths.",
    requiredIntel: ["water_corruption", "thermal_scorching", "lost_languages"],
    sealCost: { copper_wire: 2, obols: 5 }
  },
  {
    id: "50_furcas", manifestId: 50, name: "Furcas", rank: "Knight", allegiance: "DEATH",
    title: "The Cruel Old Man",
    description: "A cruel old man with a long beard, riding a pale horse with a sharp weapon. He teaches philosophy, astrology, and chiromancy.",
    requiredIntel: ["star_alignment", "necrotic_stasis", "hoarse_voice"],
    sealCost: { lead_weights: 2, bone_meal: 1 }
  },
  {
    id: "51_balam", manifestId: 51, name: "Balam", rank: "King", allegiance: "CONQUEST",
    title: "The Three-Headed Terrible",
    description: "A king with three heads (bull, man, ram) with a serpent's tail and flaming eyes, riding a bear. He gives invisibility and wit.",
    requiredIntel: ["sudden_invisibility", "thermal_scorching", "mind_fog"],
    sealCost: { gold_leaf: 1, black_salt: 2 }
  },
  {
    id: "52_alloces", manifestId: 52, name: "Alloces", rank: "Duke", allegiance: "WAR",
    title: "The Red Lion Soldier",
    description: "A soldier riding a great horse, with a lion's face, very red, and flaming eyes. He teaches astronomy and brings good familiars.",
    requiredIntel: ["blood_frenzy", "thermal_scorching", "star_alignment"],
    sealCost: { copper_wire: 2, cold_iron_filings: 2 }
  },
  {
    id: "53_camio", manifestId: 53, name: "Camio", rank: "President", allegiance: "FAMINE",
    title: "The Bird of Ashes",
    description: "Appears as a thrush, then as a man carrying a sharp sword in burning ashes. He translates the language of birds, dogs, and waters.",
    requiredIntel: ["avian_screeches", "water_corruption", "brimstone_ash"],
    sealCost: { mercury_drops: 1, brimstone_ash: 2 }
  },
  {
    id: "54_murmur", manifestId: 54, name: "Murmur", rank: "Duke", allegiance: "DEATH",
    title: "The Trumpeter of the Dead",
    description: "A warrior riding a griffin, preceded by trumpets. He forces the souls of the dead to appear before the summoner to answer questions.",
    requiredIntel: ["avian_screeches", "necrotic_stasis", "corpse_theft"],
    sealCost: { copper_wire: 1, grave_dust: 3 }
  },

  // --- THE FOURTH 18 (55 - 72) ---
  {
    id: "55_orobas", manifestId: 55, name: "Orobas", rank: "Prince", allegiance: "CONQUEST",
    title: "The Faithful Horse",
    description: "Appears as a horse. He discovers all things past, present, and future, gives dignities, and is incredibly faithful to the summoner.",
    requiredIntel: ["temporal_distortion", "cryptic_whispers", "astral_projection"],
    sealCost: { silver_shavings: 2, sacred_sand: 1 }
  },
  {
    id: "56_gremory", manifestId: 56, name: "Gremory", rank: "Duke", allegiance: "CONQUEST",
    title: "The Duchess of the Camel",
    description: "Appears as a beautiful woman riding a camel, wearing a duchess's crown tied to her waist. She discovers hidden treasures and procures love.",
    requiredIntel: ["illusory_terrain", "mind_fog", "astral_projection"],
    sealCost: { copper_wire: 2, obols: 15 }
  },
  {
    id: "57_ose", manifestId: 57, name: "Ose", rank: "President", allegiance: "DEATH",
    title: "The Leopard of Delusions",
    description: "Appears as a leopard. He makes men believe they are kings or the Pope, driving them into deep delusions, and teaches divine secrets.",
    requiredIntel: ["mind_fog", "illusory_terrain", "necrotic_stasis"],
    sealCost: { mercury_drops: 1, black_salt: 2 }
  },
  {
    id: "58_amy", manifestId: 58, name: "Amy", rank: "President", allegiance: "FAMINE",
    title: "The Flaming Fire",
    description: "Appears first as a flaming fire, then as a man. He teaches astrology and liberal sciences, and betrays treasures kept by spirits.",
    requiredIntel: ["thermal_scorching", "star_alignment", "astral_projection"],
    sealCost: { mercury_drops: 1, brimstone_ash: 2 }
  },
  {
    id: "59_oriax", manifestId: 59, name: "Oriax", rank: "Marquis", allegiance: "CONQUEST",
    title: "The Star-Rider",
    description: "A lion with a serpent's tail, riding a strong horse, holding two hissing serpents. He teaches the virtues of the stars and the mansions of the planets.",
    requiredIntel: ["serpent_scales", "star_alignment", "astral_projection"],
    sealCost: { silver_shavings: 1, gold_leaf: 1 }
  },
  {
    id: "60_vapula", manifestId: 60, name: "Vapula", rank: "Duke", allegiance: "FAMINE",
    title: "The Griffin-Lion",
    description: "Appears as a lion with griffin's wings. He makes men incredibly skilled in all handicrafts and professions.",
    requiredIntel: ["avian_screeches", "metal_transmutation", "lost_languages"],
    sealCost: { copper_wire: 2, cold_iron_filings: 1 }
  },
  {
    id: "61_zagan", manifestId: 61, name: "Zagan", rank: "King", allegiance: "CONQUEST",
    title: "The Bull of Alchemy",
    description: "A bull with griffin's wings. He makes men witty, turns wine into water and blood into wine, and transforms any metal into coins.",
    requiredIntel: ["metal_transmutation", "blood_frenzy", "water_corruption"],
    sealCost: { gold_leaf: 1, obols: 20 }
  },
  {
    id: "62_volac", manifestId: 62, name: "Volac", rank: "President", allegiance: "FAMINE",
    title: "The Child on the Dragon",
    description: "Appears as a child with angel's wings, riding a two-headed dragon. He reveals hidden treasures and the hiding places of serpents.",
    requiredIntel: ["serpent_scales", "cryptic_whispers", "astral_projection"],
    sealCost: { mercury_drops: 2, sacred_sand: 1 }
  },
  {
    id: "63_andras", manifestId: 63, name: "Andras", rank: "Marquis", allegiance: "WAR",
    title: "The Assassin of Owls",
    description: "An angel with the head of a night raven or owl, riding a strong black wolf, carrying a sharp sword. He sows discord and kills those who anger him.",
    requiredIntel: ["avian_screeches", "wolf_howls", "blood_frenzy"],
    sealCost: { silver_shavings: 1, cold_iron_filings: 3 }
  },
  {
    id: "64_haures", manifestId: 64, name: "Haures", rank: "Duke", allegiance: "WAR",
    title: "The Burning Leopard",
    description: "Appears as a leopard. He destroys and burns the summoner's enemies, but will lie endlessly if not constrained to a magic triangle.",
    requiredIntel: ["thermal_scorching", "illusory_terrain", "weapon_decay"],
    sealCost: { copper_wire: 1, brimstone_ash: 3 }
  },
  {
    id: "65_andrealphus", manifestId: 65, name: "Andrealphus", rank: "Marquis", allegiance: "CONQUEST",
    title: "The Peacock Astronomer",
    description: "Appears as a peacock with great noises. He teaches geometry perfectly and can transform men into the likeness of a bird.",
    requiredIntel: ["avian_screeches", "star_alignment", "illusory_terrain"],
    sealCost: { silver_shavings: 2, sacred_sand: 1 }
  },
  {
    id: "66_cimejes", manifestId: 66, name: "Cimejes", rank: "Marquis", allegiance: "WAR",
    title: "The Black Horseman",
    description: "A valiant warrior riding a goodly black horse. He rules over all spirits in Africa and finds lost or hidden things.",
    requiredIntel: ["weapon_decay", "earthquake_tremors", "lost_languages"],
    sealCost: { silver_shavings: 1, black_salt: 2 }
  },
  {
    id: "67_amdusias", manifestId: 67, name: "Amdusias", rank: "Duke", allegiance: "FAMINE",
    title: "The Musical Unicorn",
    description: "Appears as a unicorn. He causes all manner of musical instruments to be heard but not seen, and makes trees bend to his will.",
    requiredIntel: ["earthquake_tremors", "illusory_terrain", "cryptic_whispers"],
    sealCost: { copper_wire: 2, sacred_sand: 1 }
  },
  {
    id: "68_belial", manifestId: 68, name: "Belial", rank: "King", allegiance: "CONQUEST",
    title: "The Lawless One",
    description: "Two beautiful angels sitting in a chariot of fire. He distributes presentations and senatorships, but requires constant sacrifices to tell the truth.",
    requiredIntel: ["thermal_scorching", "mind_fog", "sudden_invisibility"],
    sealCost: { gold_leaf: 1, obols: 25 }
  },
  {
    id: "69_decarabia", manifestId: 69, name: "Decarabia", rank: "Marquis", allegiance: "FAMINE",
    title: "The Star in the Pentacle",
    description: "Appears as a star in a pentacle. He knows the virtues of all birds and precious stones, and can cause illusionary birds to sing and fly.",
    requiredIntel: ["star_alignment", "avian_screeches", "illusory_terrain"],
    sealCost: { silver_shavings: 2, mercury_drops: 1 }
  },
  {
    id: "70_seere", manifestId: 70, name: "Seere", rank: "Prince", allegiance: "CONQUEST",
    title: "The Beautiful Winged Horse",
    description: "A beautiful man riding a winged horse. He can transport goods anywhere on earth in the blink of an eye and is of good nature.",
    requiredIntel: ["temporal_distortion", "astral_projection", "sudden_invisibility"],
    sealCost: { silver_shavings: 1, sacred_sand: 2 }
  },
  {
    id: "71_dantalion", manifestId: 71, name: "Dantalion", rank: "Duke", allegiance: "DEATH",
    title: "The Many-Faced Book",
    description: "A man with many countenances (men and women) carrying a book. He knows all human thoughts, can change them at will, and causes love.",
    requiredIntel: ["mind_fog", "cryptic_whispers", "necrotic_stasis"],
    sealCost: { copper_wire: 1, bone_meal: 2 }
  },
  {
    id: "72_andromalius", manifestId: 72, name: "Andromalius", rank: "Earl", allegiance: "WAR",
    title: "The Serpent-Holder",
    description: "A man holding a great serpent in his hand. He brings back stolen goods, punishes thieves, and discovers all underhand dealings.",
    requiredIntel: ["serpent_scales", "blood_frenzy", "weapon_decay"],
    sealCost: { lead_weights: 1, cold_iron_filings: 2 }
  }
];