// src/engine/sectorGenerator.ts
import { allGoetia } from '../content/goetia';
import { allYokai } from '../content/yokai';

export interface PhenomenonDef {
  tag: string;
  label: string;
  category: 'AUDITORY' | 'PHYSICAL' | 'THERMAL' | 'COGNITIVE';
  forensicReports: string[];
}

export const PHENOMENON_CATALOG: PhenomenonDef[] = [
  {
    tag: 'hoarse_voice',
    label: 'Hoarse Vocalizations',
    category: 'AUDITORY',
    forensicReports: [
      'AUDIO TRIAGE: Directional mics isolated a rasping, gravelly cadence speaking over the static—like vocal cords dragged across crushed glass.',
      'WITNESS INTERCEPT: Local constabulary reported a harsh, guttural command echoing from empty rooms before the riot broke out.'
    ]
  },
  {
    tag: 'amphibian_tracks',
    label: 'Amphibian Mucus / Tracks',
    category: 'PHYSICAL',
    forensicReports: [
      'FORENSIC SWEEP: Wide, webbed impressions coat the damp masonry, trailing a viscous, cold-blooded slime that resists chemical reagents.',
      'TRACE EVIDENCE: Heavy,three-toed amphibious stride patterns lead directly from the drainage culvert into the sanctum.'
    ]
  },
  {
    tag: 'sudden_invisibility',
    label: 'Optical / Light Refraction',
    category: 'COGNITIVE',
    forensicReports: [
      'CCTV TELEMETRY: Security feeds show violent physical displacement of furniture and dust, yet the perpetrator bends all visible light around its mass.',
      'FIELD OBSERVATION: LiDAR pulses bounce off a dense, moving silhouette in the center of the corridor, but the naked eye sees only empty air.'
    ]
  },
  {
    tag: 'earthquake_tremors',
    label: 'Localized Seismic Tremors',
    category: 'PHYSICAL',
    forensicReports: [
      'SEISMIC LOG: Micro-tremors at 14Hz are shattering load-bearing concrete pillars in a 50-meter radius while surrounding streets remain dead still.',
      'STRUCTURAL SCAN: Deep foundation cracks radiate outward from the room, accompanied by a rhythmic, subterranean grinding.'
    ]
  },
  {
    tag: 'lost_languages',
    label: 'Xenoglossia / Dead Scripts',
    category: 'COGNITIVE',
    forensicReports: [
      'LINGUISTIC ANALYSIS: Delirious witnesses are speaking fluent pre-Babylonian Aramaic and inscribing phonetic Enochian syntax onto the walls.',
      'INTERCEPTED LOGS: Printed manifests in the room have spontaneously rewritten themselves into archaic cuneiform dialects.'
    ]
  },
  {
    tag: 'avian_screeches',
    label: 'Avian / Raptor Shrieks',
    category: 'AUDITORY',
    forensicReports: [
      'AUDIO TRIAGE: High-decibel, predatory bird shrieks saturate the upper frequencies, accompanied by shed black pinfeathers.',
      'ENVIRONMENTAL SCAN: The rafters are littered with regurgitated bone pellets and the deafening clamor of unseen wings.'
    ]
  },
  {
    tag: 'cryptic_whispers',
    label: 'Sub-Audible Whispers',
    category: 'AUDITORY',
    forensicReports: [
      'EVP CAPTURE: White-noise filters uncovered layered, overlapping voices whispering private operative memories that were never spoken aloud.',
      'ACOUSTIC SWEEP: A persistent, sibilant murmur bleeds through the stonework, reciting events from three days in the future.'
    ]
  },
  {
    tag: 'star_alignment',
    label: 'Astrolabe / Celestial Drift',
    category: 'COGNITIVE',
    forensicReports: [
      'ASTRONOMICAL ANOMALY: Looking up through the breached roof reveals a night sky locked to a winter constellation from 1347 AD.',
      'GEOMETRIC SCAN: Burn marks on the floorboards map an exact 1:1 projection of the Pleiades star cluster.'
    ]
  },
  {
    tag: 'mind_fog',
    label: 'Cognitive Amnesia / Fog',
    category: 'COGNITIVE',
    forensicReports: [
      'NEURO-TELEMETRY: First responders wandered in circles for four hours, unable to recognize their own names or weapons.',
      'TETHER DIAGNOSTIC: Heavy conceptual static blankets the room, inducing immediate short-term memory loops and fugue states.'
    ]
  },
  {
    tag: 'necrotic_stasis',
    label: 'Necrotic Tissue Stasis',
    category: 'THERMAL',
    forensicReports: [
      'PATHOLOGY REPORT: Organic matter in the room refuses to decay normally, locked in a freezing, gray rigor mortis devoid of bacteria.',
      'THERMAL SCAN: Ambient temperature plunges to -18°C; cellular activity in nearby flora has halted in crystalline stasis.'
    ]
  },
  {
    tag: 'corpse_theft',
    label: 'Exhumation / Cadaver Theft',
    category: 'PHYSICAL',
    forensicReports: [
      'CRIME SCENE LOG: Heavy stone sarcophagi and morgue drawers have been wrenched open; every cadaver has been systematically harvested.',
      'FORENSIC SWEEP: Drag marks and formaldehyde trails lead from the emptied vaults toward the sector anchor.'
    ]
  },
  {
    tag: 'plague_vectors',
    label: 'Pathogenic / Pestilent Spores',
    category: 'PHYSICAL',
    forensicReports: [
      'BIO-HAZARD ALERT: Black, oily pustules and airborne fungal spores coat the ventilation shafts, rotting organic rations in seconds.',
      'MEDICAL INTERCEPT: Swarms of bloated flies and sudden gangrenous lesions have incapacitated the local garrison.'
    ]
  },
  {
    tag: 'metal_transmutation',
    label: 'Alchemical Transmutation',
    category: 'PHYSICAL',
    forensicReports: [
      'METALLURGICAL SCAN: Brass shell casings and copper pipes have spontaneously transmuted into brittle, impure veins of lead and gold.',
      'MATERIAL ANALYSIS: The molecular lattice of the vault door has been alchemically rearranged into soft, malleable tin.'
    ]
  },
  {
    tag: 'blood_frenzy',
    label: 'Hematophagic / Martial Frenzy',
    category: 'COGNITIVE',
    forensicReports: [
      'BALLISTICS REPORT: Civilians and officers tore at each other with bare hands; adrenaline and cortisol levels in blood samples are lethal.',
      'PSYCH-EVAL: Survivors exhibit unblinking, hyper-aggressive berserker rage triggered by the sight of arterial red.'
    ]
  },
  {
    tag: 'weapon_decay',
    label: 'Rapid Ferrous Oxidation',
    category: 'PHYSICAL',
    forensicReports: [
      'FORENSIC SWEEP: Tempered steel locks and Inquisition sidearms have oxidized into flaky red rust dust within minutes of exposure.',
      'METALLURGICAL LOG: Every iron bar along the perimeter has corroded through as if submerged in acid for a century.'
    ]
  },
  {
    tag: 'illusory_terrain',
    label: 'Non-Euclidean Spatial Shift',
    category: 'COGNITIVE',
    forensicReports: [
      'LASER RANGEFINDER: Internal hallway measures 140 meters long from the inside, despite the building exterior measuring only 25 meters.',
      'ARCHITECTURAL SCAN: Doorways loop back into themselves; compasses spin wildly amidst shimmeringmirage walls.'
    ]
  },
  {
    tag: 'wolf_howls',
    label: 'Canine / Lupine Howls',
    category: 'AUDITORY',
    forensicReports: [
      'AUDIO TRIAGE: Deep, resonant wolf howls vibrate through the sub-bass spectrum, accompanied by massive claw gouges in the oak doors.',
      'FORENSIC SWEEP: Coarse, singed lupine fur and lupine jaw marks were recovered from the mauled Malleus hound.'
    ]
  },
  {
    tag: 'thermal_scorching',
    label: 'Pyroclastic Scorching',
    category: 'THERMAL',
    forensicReports: [
      'THERMAL SCAN: Vitrified brick and flash-melted glass indicate a localized temperature spike exceeding 1,200°C with zero smoke or fuel source.',
      'FORENSIC SWEEP: Ashen handprints and sulfur-crusted char marks sear the ceiling directly above the conduit.'
    ]
  },
  {
    tag: 'serpent_scales',
    label: 'Ophidian Scales / Venom',
    category: 'PHYSICAL',
    forensicReports: [
      'TRACE EVIDENCE: Iridescent, palm-sizedreptilian scales and neurotoxic venom residue coat the threshold.',
      'FORENSIC SWEEP: Sinuous, heavy coiling tracks have crushed the floorboards, smelling sharply of ozone and vipers.'
    ]
  },
  {
    tag: 'temporal_distortion',
    label: 'Chronometric Drift',
    category: 'COGNITIVE',
    forensicReports: [
      'CHRONO-SYNC ALERT: Quartz wristwatches on dead guards are running backward; dust motes hang suspended in mid-air.',
      'TELEMETRY LOG: Your OS clock desynchronized by 47 hours the moment the probe crossed the room threshold.'
    ]
  },
  {
    tag: 'astral_projection',
    label: 'Ectoplasmic / Astral Tether',
    category: 'COGNITIVE',
    forensicReports: [
      'AETHYRIC SCAN: Luminous silver threads of residual ectoplasm hang in the air, left by consciousnesses ripped from their bodies.',
      'WITNESS INTERCEPT: Comatose subjects in the ward claim their minds are floating thirtyfeet above the building.'
    ]
  },
  {
    tag: 'sulfur_stench',
    label: 'Brimstone / Sulfuric Miasma',
    category: 'THERMAL',
    forensicReports: [
      'ATMOS SENSOR: Lethal parts-per-million of hydrogen sulfide and volcanic brimstone choke the lower corridors.',
      'CHEMICAL SWEEP: Yellow crystalline sulfur deposits have condensed across every cold surface.'
    ]
  },
  {
    tag: 'water_corruption',
    label: 'Brackish /Abyssal Brine',
    category: 'PHYSICAL',
    forensicReports: [
      'HYDRO-ANALYSIS: Tap water and rain puddles have turned into thick, freezing abyssal seawater teeming with dead deep-sea microorganisms.',
      'FORENSIC SWEEP: Barnacles and black kelp are growing rapidly out of the dry-wall plumbing.'
    ]
  },
  {
    tag: 'tempest_winds',
    label: 'Barometric Cyclone / Gale',
    category: 'THERMAL',
    forensicReports: [
      'BAROMETRIC ALERT: Indoor air pressure dropped to hurricane levels; localized gale-force gusts shattered every window outward.',
      'ATMOS SENSOR: Static electricity arcs across the room amidst a roaring, unnatural wind tunnel.'
    ]
  }
];

export interface SubGridNode {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
  wardLevel: number;
  status: 'LOCKED' | 'PROBED' | 'BREACHED' | 'EXTRACTED';
  nodeType: 'ENTRY' | 'ANOMALY' | 'SALVAGE' | 'SHRINE' | 'AMBUSH' | 'ANCHOR';
  signTag?: string;
  forensicText?: string;
  salvageDrop?: { itemId: string; amount: number; obols: number };
  shrineYokaiId?: string;
}

export interface SectorContract {
  sectorId: string;
  sectorLabel: string;
  targetGoetiaId: string;
  activeSubNodeId: string;
  selectedSubNodeId: string;
  subNodes: SubGridNode[];
  discoveredLogs: { id: string; nodeLabel: string; text: string }[];
}

export interface AltarRecipe {
  outputId: string;
  label: string;
  obolCost: number;
  rawMaterialId: 'scrap_metal' | 'cursed_earth' | 'alchemical_distillate';
  rawAmount: number;
  desc: string;
}

export const ALTAR_RECIPES: AltarRecipe[] = [
  { outputId: 'cold_iron_filings', label: 'Cold Iron Filings', obolCost: 10, rawMaterialId: 'scrap_metal', rawAmount: 1, desc: 'Ferrous filings quenched in warded brine. Disrupts martial & aerial Goetia.' },
  { outputId: 'copper_wire', label: 'Spool of Copper Wire', obolCost: 8, rawMaterialId: 'scrap_metal', rawAmount: 1, desc: 'Conductive Solomonic grounding wire for Dukes and Earls.' },
  { outputId: 'silver_shavings', label: 'Silver Shavings', obolCost: 12, rawMaterialId: 'scrap_metal', rawAmount: 1, desc: 'Lunar-aligned silver curls used to bind Princes and Marquises.' },
  { outputId: 'lead_weights', label: 'Stamped Lead Weights', obolCost: 10, rawMaterialId: 'scrap_metal', rawAmount: 1, desc: 'Heavy Saturnian anchors used to pin Earls and Knights.' },
  { outputId: 'gold_leaf', label: 'Solomonic Gold Leaf', obolCost: 20, rawMaterialId: 'scrap_metal', rawAmount: 2, desc: 'Solar-grade箔 required to compel Goetic Kings.' },
  { outputId: 'grave_dust', label: 'Consecrated Grave Dust', obolCost: 10, rawMaterialId: 'cursed_earth', rawAmount: 1, desc: 'Ossuary soil saturated with necrotic resonance.' },
  { outputId: 'sacred_sand', label: 'Sacred Quartz Sand', obolCost: 10, rawMaterialId: 'cursed_earth', rawAmount: 1, desc: 'Purified silica for drawing unbroken containment circles.' },
  { outputId: 'bone_meal', label: 'Calcined Bone Meal', obolCost: 12, rawMaterialId: 'cursed_earth', rawAmount: 1, desc: 'Kiln-reduced ash used to bind Death-aligned spirits.' },
  { outputId: 'black_salt', label: 'Alchemical Black Salt', obolCost: 10, rawMaterialId: 'alchemical_distillate', rawAmount: 1, desc: 'Charcoal-cured halite that absorbs abyssal backlash.' },
  { outputId: 'brimstone_ash', label: 'Brimstone Ash', obolCost: 12, rawMaterialId: 'alchemical_distillate', rawAmount: 1, desc: 'Sulfuric residue required for pyrokinetic and War entities.' },
  { outputId: 'mercury_drops', label: 'Quicksilver Drops', obolCost: 15, rawMaterialId: 'alchemical_distillate', rawAmount: 1, desc: 'Liquid mercury catalyst required to seal Goetic Presidents.' }
];

const ROOM_NAMES_BY_SECTOR: Record<string, string[]> = {
  caterham_churchyard: ['WEST LICHGATE', 'WEATHERED TOMBSTONES', 'BELLFRY CRYPT', 'OSSUARY VAULT', 'SEXTON SHED', 'SUNKEN ALTAR'],
  caterham_asylum: ['RIOT PERIMETER', 'ADMIN RECORDS', 'HYDROTHERAPY WARD', 'PADDED CELLS', 'MORGUE CHUTE', 'INCINERATOR ANCHOR'],
  chaldon_quarry: ['BLASTING PIT', 'CHALK GALLERIES', 'FOREMAN SHACK', 'FLOODED SHAFT', 'TIMBER WINCH', 'SUBTERRANEAN FAULT'],
  croydon_relay: ['MICROWAVE TOWER', 'SERVER COOLING BAY', 'FIBER JUNCTION', 'BACKUP GENERATOR', 'SIGNAL BUNKER', 'DEAD-AIR CORE'],
  malleus_precinct: ['CHECKPOINT ALPHA', 'EVIDENCE LOCKER', 'INTERROGATION CELL', 'HOUND KENNELS', 'ARMORY VAULT', 'DETENTION CORE'],
  brixton_morgue: ['AUTOPSY SUITE B', 'COLD LOCKERS', 'CREMATORIUM FLUE', 'TOXICOLOGY LAB', 'DRAINAGE SLUICE', 'EMBALMING SANCTUM'],
  waddon_marsh: ['STAGNANT WEIR', 'GASWORKS RUINS', 'SILT PUMPING HOUSE', 'BOG BOARDWALK', 'RUSTED GASHOLDER', 'MIASMA SINKHOLE'],
  thames_nexus: ['FLOODED TUNNEL', 'SLUICE GATE 04', 'SUB-STATION RELAY', 'DRIFTWOOD SHRINE', 'TURBINE HALL', 'TIDAL VORTEX'],
  blackfriars_vault: ['MITHRAEUM RUINS', 'BULLION CAGE', 'LEDGER ARCHIVE', 'PNEUMATIC TUBE HUB', 'FLOODWALL BULKHEAD', 'USURY ALTAR'],
  highgate_catacombs: ['EGYPTIAN AVENUE', 'CIRCLE OF LEBANON', 'DISSENTERS CHAPEL', 'COLUMBARIUM WALL', 'IVY MAUSOLEUM', 'NECROPOLIS HEART'],
  woolwich_arsenal: ['FOUNDRY FLOOR', 'SHELL MAGAZINE', 'PROVING GROUNDS', 'BLAST FURNACE 02', 'GUNCOTTON STORE', 'ORDNANCE BREACH'],
  greenwich_observatory: ['MERIDIAN COURTYARD', 'TRANSIT ROOM', 'OCTAGON CHAMBER', 'TELESCOPE DOME', 'CHRONOMETER VAULT', 'ASTRAL ZENITH'],
  whitechapel_abattoir: ['CATTLE CHUTE', 'MEATHOOK GALLERY', 'RENDERING VATS', 'BONE GRINDER', 'SALTING CELLAR', 'CRIMSON CONDUIT'],
  lambeth_sanctum: ['Lollard TOWER', 'CRYPT ARCHIVES', 'CLOISTER GARTH', 'BELLFOUNDERS PIT', 'APOTHECARY CELL', 'PROFANED NAVE'],
  battersea_forge: ['COAL WHARF', 'TURBINE HALL A', 'CONTROL GALLERY', 'BOILER HOUSE', 'SWITCHGEAR ROOM', 'ASHEN REACTOR'],
  st_pauls_whisper: ['DEAN STAIRWELL', 'WHISPERING GALLERY', 'GEOMETRIC DOME', 'CRYPT OF ST FAITH', 'BELL CRADLE', 'OMEGA THRONE']
};

export function generateSectorContract(sectorId: string, sectorLabel: string, sealedGoetia: string[], usedGoetiaIds: string[] = []): SectorContract {
  const available = allGoetia.filter(g => !sealedGoetia.includes(g.id) && !usedGoetiaIds.includes(g.id));
  const fallbackPool = allGoetia.filter(g => !sealedGoetia.includes(g.id));
  const pool = available.length > 0 ? available : fallbackPool.length > 0 ? fallbackPool : allGoetia;
  const target = pool[Math.floor(Math.random() * pool.length)];

  const labels = ROOM_NAMES_BY_SECTOR[sectorId] || ['PERIMETER', 'OUTER HALL', 'STORAGE BAY', 'SHRINE ALCOVE', 'SECURITY HUB', 'INNER SANCTUM'];
  const coords = [
    { x: 0.16, y: 0.50 },
    { x: 0.38, y: 0.24 },
    { x: 0.38, y: 0.76 },
    { x: 0.62, y: 0.24 },
    { x: 0.62, y: 0.76 },
    { x: 0.85, y: 0.50 }
  ];

  const requiredTags = target.requiredIntel && target.requiredIntel.length >= 3
    ? target.requiredIntel
    : ['hoarse_voice', 'weapon_decay', 'corpse_theft'];

  const randomYokai = allYokai[Math.floor(Math.random() * allYokai.length)];
  const rawMaterials: ('scrap_metal' | 'cursed_earth' | 'alchemical_distillate')[] = ['scrap_metal', 'cursed_earth', 'alchemical_distillate'];

  const getReport = (tag: string) => {
    const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
    if (!def) return `FORENSIC LOG: Anomalous resonance signature [${tag}] detected in the immediate vicinity.`;
    return def.forensicReports[Math.floor(Math.random() * def.forensicReports.length)];
  };

  const subNodes: SubGridNode[] = [
    {
      id: `${sectorId}_n0`,
      label: labels[0],
      x: coords[0].x,
      y: coords[0].y,
      connections: [`${sectorId}_n1`, `${sectorId}_n2`],
      wardLevel: 1,
      status: 'BREACHED',
      nodeType: 'ANOMALY',
      signTag: requiredTags[0],
      forensicText: getReport(requiredTags[0]),
      salvageDrop: { itemId: rawMaterials[0], amount: 2, obols: 12 }
    },
    {
      id: `${sectorId}_n1`,
      label: labels[1],
      x: coords[1].x,
      y: coords[1].y,
      connections: [`${sectorId}_n0`, `${sectorId}_n3`, `${sectorId}_n4`],
      wardLevel: 1,
      status: 'LOCKED',
      nodeType: 'ANOMALY',
      signTag: requiredTags[1],
      forensicText: getReport(requiredTags[1]),
      salvageDrop: { itemId: rawMaterials[1], amount: 2, obols: 15 }
    },
    {
      id: `${sectorId}_n2`,
      label: labels[2],
      x: coords[2].x,
      y: coords[2].y,
      connections: [`${sectorId}_n0`, `${sectorId}_n3`, `${sectorId}_n4`],
      wardLevel: 1,
      status: 'LOCKED',
      nodeType: 'SHRINE',
      shrineYokaiId: randomYokai.id,
      salvageDrop: { itemId: 'alchemical_distillate', amount: 2, obols: 18 }
    },
    {
      id: `${sectorId}_n3`,
      label: labels[3],
      x: coords[3].x,
      y: coords[3].y,
      connections: [`${sectorId}_n1`, `${sectorId}_n2`, `${sectorId}_n5`],
      wardLevel: 2,
      status: 'LOCKED',
      nodeType: 'AMBUSH',
      salvageDrop: { itemId: rawMaterials[2], amount: 3, obols: 20 }
    },
    {
      id: `${sectorId}_n4`,
      label: labels[4],
      x: coords[4].x,
      y: coords[4].y,
      connections: [`${sectorId}_n1`, `${sectorId}_n2`, `${sectorId}_n5`],
      wardLevel: 2,
      status: 'LOCKED',
      nodeType: 'ANOMALY',
      signTag: requiredTags[2],
      forensicText: getReport(requiredTags[2]),
      salvageDrop: { itemId: rawMaterials[0], amount: 2, obols: 15 }
    },
    {
      id: `${sectorId}_n5`,
      label: `${labels[5]} [ANCHOR]`,
      x: coords[5].x,
      y: coords[5].y,
      connections: [`${sectorId}_n3`, `${sectorId}_n4`],
      wardLevel: 3,
      status: 'LOCKED',
      nodeType: 'ANCHOR',
      signTag: requiredTags[2],
      forensicText: `CONDUIT EPICENTER: The conceptual tear is wide open here. ${getReport(requiredTags[2])}`,
      salvageDrop: { itemId: 'cursed_earth', amount: 2, obols: 25 }
    }
  ];

  return {
    sectorId,
    sectorLabel,
    targetGoetiaId: target.id,
    activeSubNodeId: subNodes[0].id,
    selectedSubNodeId: subNodes[0].id,
    subNodes,
    discoveredLogs: []
  };
}