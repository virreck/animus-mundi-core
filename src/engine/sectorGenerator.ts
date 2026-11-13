// src/engine/sectorGenerator.ts
import { allGoetia } from '../content/goetia';
import { allYokai } from '../content/yokai';

export type ForensicChannel = 'AUDIO_FLUX' | 'THERMAL_TRACE' | 'MATTER_SAMPLE' | 'ASTRAL_ECHO';

export interface PhenomenonDef {
  tag: string;
  label: string;
  category: 'AUDITORY' | 'PHYSICAL' | 'THERMAL' | 'COGNITIVE';
  channel: ForensicChannel;
  rawSignalSymptom: string;
  forensicReports: string[];
}

export const PHENOMENON_CATALOG: PhenomenonDef[] = [
  {
    tag: 'hoarse_voice',
    label: 'Hoarse Vocalizations',
    category: 'AUDITORY',
    channel: 'AUDIO_FLUX',
    rawSignalSymptom: 'Sub-audible 85Hz carrier wave vibrating through the ventilation brickwork.',
    forensicReports: [
      'VOX SPECTROGRAM: Directional mics isolated a rasping, gravelly cadence speaking over the static—like vocal cords dragged across crushed glass.',
      'VOX INTERCEPT: Isolated a harsh, guttural command echoing from empty rooms before the ward ruptured.',
      'VOX DECODE: Sub-harmonic rasp detected at 85Hz reciting inverted Solomonic Psalms from inside the sealed duct.'
    ]
  },
  {
    tag: 'amphibian_tracks',
    label: 'Amphibian Mucus / Tracks',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Viscous, cold-blooded organic residue coating the damp masonry.',
    forensicReports: [
      'REAGENT ASSAY: Wide, webbed impressions coat the damp masonry, trailing a batrachian alkaloid slime that resists acid.',
      'REAGENT ASSAY: Heavy, three-toed amphibious stride patterns lead directly from the drainage culvert into the sanctum.',
      'REAGENT ASSAY: Translucent batrachian spawn and marsh-alkaloid mucus coat the brass door handles.'
    ]
  },
  {
    tag: 'sudden_invisibility',
    label: 'Optical / Light Refraction',
    category: 'COGNITIVE',
    channel: 'THERMAL_TRACE',
    rawSignalSymptom: 'Visible flashlight beams are bending 45 degrees around an unseen mass in the room center.',
    forensicReports: [
      'LIDAR PHOTOMETRICS: Security feeds show violent physical displacement of dust, yet the entity bends all visible light around its mass.',
      'LIDAR PHOTOMETRICS: Laser pulses bounce off a dense, moving silhouette in the corridor, while the naked eye sees only empty air.',
      'LIDAR PHOTOMETRICS: Complete photon absorption pocket recorded in the corner alcove; laser grid warps 45 degrees off-axis.'
    ]
  },
  {
    tag: 'earthquake_tremors',
    label: 'Localized Seismic Tremors',
    category: 'PHYSICAL',
    channel: 'AUDIO_FLUX',
    rawSignalSymptom: 'Rhythmic 14Hz infrasound tremor resonating through the load-bearing concrete.',
    forensicReports: [
      'VOX GEOPHONE: Micro-tremors at 14Hz are shattering load-bearing pillars in a 50-meter radius while surrounding streets remain dead still.',
      'VOX GEOPHONE: Deep foundation cracks radiate outward from the room, accompanied by a rhythmic, subterranean grinding.',
      'VOX GEOPHONE: Tectonic hammering directly beneath the floorboards, synchronized to a slow heartbeat.'
    ]
  },
  {
    tag: 'lost_languages',
    label: 'Xenoglossia / Dead Scripts',
    category: 'COGNITIVE',
    channel: 'ASTRAL_ECHO',
    rawSignalSymptom: 'Unidentified pre-Babylonian glyphs and phonetic sigils bleeding through the wall plaster.',
    forensicReports: [
      'ENOCHIAN LENS: Delirious witnesses are speaking fluent pre-Babylonian Aramaic and inscribing phonetic Enochian syntax onto the walls.',
      'ENOCHIAN LENS: Printed manifests in the room have spontaneously rewritten themselves into archaic cuneiform dialects.',
      'ENOCHIAN LENS: Chalk markings on the lintel match the Celestial Alphabet of Agrippa and the Lesser Key.'
    ]
  },
  {
    tag: 'avian_screeches',
    label: 'Avian / Raptor Shrieks',
    category: 'AUDITORY',
    channel: 'AUDIO_FLUX',
    rawSignalSymptom: 'High-decibel ultrasonic screeching saturating the upper acoustic band.',
    forensicReports: [
      'VOX SPECTROGRAM: High-decibel, predatory bird shrieks saturate the upper frequencies, accompanied by shed black pinfeathers.',
      'VOX SPECTROGRAM: The rafters vibrate with regurgitated bone pellets and the deafening acoustic clamor of unseen wings.',
      'VOX SPECTROGRAM: Corvid and strigiform calls overlap in a mathematical polyrhythm from inside the sealed chimney.'
    ]
  },
  {
    tag: 'cryptic_whispers',
    label: 'Sub-Audible Whispers',
    category: 'AUDITORY',
    channel: 'AUDIO_FLUX',
    rawSignalSymptom: 'Polyphonic white-noise murmur bleeding across dead copper intercom lines.',
    forensicReports: [
      'VOX EVP CAPTURE: White-noise filters uncovered layered voices whispering private operative memories never spoken aloud.',
      'VOX EVP CAPTURE: A persistent, sibilant murmur bleeds through the stonework, reciting events from three days in the future.',
      'VOX EVP CAPTURE: Fifty distinct voices whispering in unison over unpowered copper telephone wires.'
    ]
  },
  {
    tag: 'star_alignment',
    label: 'Astrolabe / Celestial Drift',
    category: 'COGNITIVE',
    channel: 'ASTRAL_ECHO',
    rawSignalSymptom: 'Compasses spin toward an impossible medieval star projection on the ceiling.',
    forensicReports: [
      'ENOCHIAN LENS: Looking up through the breached roof reveals a night sky locked to a winter constellation from 1347 AD.',
      'ENOCHIAN LENS: Burn marks on the floorboards map an exact 1:1 projection of the Pleiades star cluster.',
      'ENOCHIAN LENS: Local magnetic north is rotating toward a fixed celestial point 30 degrees below the horizon.'
    ]
  },
  {
    tag: 'mind_fog',
    label: 'Cognitive Amnesia / Fog',
    category: 'COGNITIVE',
    channel: 'ASTRAL_ECHO',
    rawSignalSymptom: 'Heavy conceptual static inducing immediate short-term memory loops and Déjà vu.',
    forensicReports: [
      'ENOCHIAN LENS: First responders wandered in circles for four hours, unable to recognize their own names or weapons.',
      'ENOCHIAN LENS: Heavy conceptual static blankets the room, inducing immediate short-term memory loops and fugue states.',
      'ENOCHIAN LENS: Operatives report losing 20 minutes of subjective time upon crossing the threshold.'
    ]
  },
  {
    tag: 'necrotic_stasis',
    label: 'Necrotic Tissue Stasis',
    category: 'THERMAL',
    channel: 'THERMAL_TRACE',
    rawSignalSymptom: 'Ambient room temperature has plunged to -18°C with crystalline gray hoarfrost.',
    forensicReports: [
      'LIDAR THERMOGRAPHY: Organic matter in the room refuses to decay normally, locked in a freezing, gray rigor mortis devoid of bacteria.',
      'LIDAR THERMOGRAPHY: Ambient temperature plunges to -18°C; cellular activity in nearby flora has halted in crystalline stasis.',
      'LIDAR THERMOGRAPHY: Black hoarfrost coats the walls; exhaled breath freezes into gray, ash-like crystals.'
    ]
  },
  {
    tag: 'corpse_theft',
    label: 'Exhumation / Cadaver Theft',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Formaldehyde residue, bone dust, and wrenched sarcophagus seals across the floor.',
    forensicReports: [
      'REAGENT ASSAY: Heavy stone sarcophagi and morgue drawers have been wrenched open; every cadaver has been systematically harvested.',
      'REAGENT ASSAY: Drag marks and formaldehyde trails lead from the emptied vaults toward the sector anchor.',
      'REAGENT ASSAY: Seventeen anatomical specimens vanished from locked cold-storage without a single broken seal.'
    ]
  },
  {
    tag: 'plague_vectors',
    label: 'Pathogenic / Pestilent Spores',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Black, oily fungal pustules and airborne spores coating the ventilation grates.',
    forensicReports: [
      'REAGENT ASSAY: Black, oily pustules and airborne fungal spores coat the ventilation shafts, rotting organic rations in seconds.',
      'REAGENT ASSAY: Swarms of bloated flies and sudden gangrenous lesions have incapacitated the local garrison.',
      'REAGENT ASSAY: Unidentified necrotic mold is digesting leather, wood, and cloth across the room.'
    ]
  },
  {
    tag: 'metal_transmutation',
    label: 'Alchemical Transmutation',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Brass fixtures and copper pipes are weeping liquid quicksilver and soft lead.',
    forensicReports: [
      'REAGENT ASSAY: Brass shell casings and copper pipes have spontaneously transmuted into brittle, impure veins of lead and gold.',
      'REAGENT ASSAY: The molecular lattice of the vault door has been alchemically rearranged into soft, malleable tin.',
      'REAGENT ASSAY: Iron grates have turned into porous, weeping amalgamations of bismuth and quicksilver.'
    ]
  },
  {
    tag: 'blood_frenzy',
    label: 'Hematophagic / Martial Frenzy',
    category: 'COGNITIVE',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Arterial spray and hyper-elevated adrenal pheromones saturating the floorboards.',
    forensicReports: [
      'REAGENT ASSAY: Civilians and officers tore at each other with bare hands; adrenaline and cortisol levels in blood samples are lethal.',
      'REAGENT ASSAY: Survivors exhibit unblinking, hyper-aggressive berserker rage triggered by the sight of arterial red.',
      'REAGENT ASSAY: Fingernail gouges and arterial spray cover the wainscoting from a spontaneous, unprovoked melee.'
    ]
  },
  {
    tag: 'weapon_decay',
    label: 'Rapid Ferrous Oxidation',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Tempered steel locks and iron bars have dissolved into piles of flaky red rust.',
    forensicReports: [
      'REAGENT ASSAY: Tempered steel locks and Inquisition sidearms have oxidized into flaky red rust dust within minutes of exposure.',
      'REAGENT ASSAY: Every iron bar along the perimeter has corroded through as if submerged in acid for a century.',
      'REAGENT ASSAY: Gunpowder in sealed brass cartridges has turned into inert, damp gray paste.'
    ]
  },
  {
    tag: 'illusory_terrain',
    label: 'Non-Euclidean Spatial Shift',
    category: 'COGNITIVE',
    channel: 'THERMAL_TRACE',
    rawSignalSymptom: 'Depth-sensors report the hallway is 140m long inside a 25m building footprint.',
    forensicReports: [
      'LIDAR TOPOGRAPHY: Internal hallway measures 140 meters long from the inside, despite the building exterior measuring only 25 meters.',
      'LIDAR TOPOGRAPHY: Doorways loop back into themselves; compasses spin wildly amidst shimmering mirage walls.',
      'LIDAR TOPOGRAPHY: Stairwells descend three floors below the known bedrock table into an impossible courtyard.'
    ]
  },
  {
    tag: 'wolf_howls',
    label: 'Canine / Lupine Howls',
    category: 'AUDITORY',
    channel: 'AUDIO_FLUX',
    rawSignalSymptom: 'Deep, predatory lupine howls vibrating in the sub-bass spectrum.',
    forensicReports: [
      'VOX SPECTROGRAM: Deep, resonant wolf howls vibrate through the sub-bass spectrum, accompanied by massive claw gouges in the oak doors.',
      'VOX SPECTROGRAM: Coarse, singed lupine fur and predatory jaw marks were recovered from the mauled Malleus hound.',
      'VOX SPECTROGRAM: Pacing quadruped paw-prints circle the room perimeter, each print the size of a dinner plate.'
    ]
  },
  {
    tag: 'thermal_scorching',
    label: 'Pyroclastic Scorching',
    category: 'THERMAL',
    channel: 'THERMAL_TRACE',
    rawSignalSymptom: 'Vitrified brick and flash-melted glass radiating 1,200°C residual heat signatures.',
    forensicReports: [
      'LIDAR THERMOGRAPHY: Vitrified brick and flash-melted glass indicate a localized temperature spike exceeding 1,200°C with zero smoke.',
      'LIDAR THERMOGRAPHY: Ashen handprints and sulfur-crusted char marks sear the ceiling directly above the conduit.',
      'LIDAR THERMOGRAPHY: Brass fixtures have melted into droplets while paper ledgers inches away remain unburnt.'
    ]
  },
  {
    tag: 'serpent_scales',
    label: 'Ophidian Scales / Venom',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Iridescent reptilian scales and crystallized hemotoxic venom on the stone.',
    forensicReports: [
      'REAGENT ASSAY: Iridescent, palm-sized reptilian scales and neurotoxic venom residue coat the threshold.',
      'REAGENT ASSAY: Sinuous, heavy coiling tracks have crushed the floorboards, smelling sharply of ozone and vipers.',
      'REAGENT ASSAY: Hemotoxic venom crystallized across the altar stone, matching no known terrestrial pit viper.'
    ]
  },
  {
    tag: 'temporal_distortion',
    label: 'Chronometric Drift',
    category: 'COGNITIVE',
    channel: 'ASTRAL_ECHO',
    rawSignalSymptom: 'Quartz clocks in the room are running backward; dust motes hang frozen in mid-air.',
    forensicReports: [
      'ENOCHIAN LENS: Quartz wristwatches on dead guards are running backward; dust motes hang suspended in mid-air.',
      'ENOCHIAN LENS: Your OS clock desynchronized by 47 hours the moment the probe crossed the room threshold.',
      'ENOCHIAN LENS: Half-life decay inside the room is oscillating between 10x acceleration and total temporal freeze.'
    ]
  },
  {
    tag: 'astral_projection',
    label: 'Ectoplasmic / Astral Tether',
    category: 'COGNITIVE',
    channel: 'ASTRAL_ECHO',
    rawSignalSymptom: 'Luminous silver threads of residual ectoplasm hanging suspended in the air.',
    forensicReports: [
      'ENOCHIAN LENS: Luminous silver threads of residual ectoplasm hang in the air, left by consciousnesses ripped from their bodies.',
      'ENOCHIAN LENS: Comatose subjects in the ward claim their minds are floating thirty feet above the building.',
      'ENOCHIAN LENS: Mirrors in the room reflect the astral doubles of operatives three seconds before they enter.'
    ]
  },
  {
    tag: 'sulfur_stench',
    label: 'Brimstone / Sulfuric Miasma',
    category: 'THERMAL',
    channel: 'THERMAL_TRACE',
    rawSignalSymptom: 'Superheated yellow crystalline sulfur deposits venting from uncracked granite.',
    forensicReports: [
      'LIDAR GAS-SCAN: Lethal parts-per-million of hydrogen sulfide and volcanic brimstone choke the lower corridors.',
      'LIDAR GAS-SCAN: Yellow crystalline sulfur deposits have condensed across every cold surface.',
      'LIDAR GAS-SCAN: Fumarole-grade sulfur dioxide is venting from solid, uncracked granite.'
    ]
  },
  {
    tag: 'water_corruption',
    label: 'Brackish / Abyssal Brine',
    category: 'PHYSICAL',
    channel: 'MATTER_SAMPLE',
    rawSignalSymptom: 'Pelagic black kelp and freezing abyssal saltwater oozing from dry-wall plumbing.',
    forensicReports: [
      'REAGENT ASSAY: Tap water and rain puddles have turned into thick, freezing abyssal seawater teeming with dead deep-sea microbes.',
      'REAGENT ASSAY: Barnacles and black kelp are growing rapidly out of the dry-wall plumbing.',
      'REAGENT ASSAY: The air in the room carries the crushing, salty chemical profile of a pelagic trench.'
    ]
  },
  {
    tag: 'tempest_winds',
    label: 'Barometric Cyclone / Gale',
    category: 'THERMAL',
    channel: 'THERMAL_TRACE',
    rawSignalSymptom: 'Severe barometric pressure drop with a 90-knot vortex spinning inside the room.',
    forensicReports: [
      'LIDAR BAROMETRICS: Indoor air pressure dropped to hurricane levels; localized gale-force gusts shattered every window outward.',
      'LIDAR BAROMETRICS: Static electricity arcs across the room amidst a roaring, unnatural wind tunnel.',
      'LIDAR BAROMETRICS: Cyclonic vortex spinning at 90 knots in the center of a windowless subterranean vault.'
    ]
  }
];

export type RoomHazardType =
  | 'NONE'
  | 'AETHYRIC_STATIC'
  | 'INQUISITION_WIRE'
  | 'MIASMA_FOG'
  | 'FERROUS_LOCK'
  | 'BLOOD_WARD'
  | 'CHRONO_LOOP';

export const HAZARD_MANIFEST: Record<Exclude<RoomHazardType, 'NONE'>, {
  label: string;
  symptom: string;
  counterCmd: string;
  clearMsg: string;
}> = {
  AETHYRIC_STATIC: {
    label: 'Aethyric White-Noise Static',
    symptom: 'Electromagnetic screech is blinding local sensors and scrambling telemetry packets.',
    counterCmd: 'degauss',
    clearMsg: 'Coils degaussed. Electromagnetic carrier wave stabilized.'
  },
  INQUISITION_WIRE: {
    label: 'Ordo Malleus Laser Tripwire',
    symptom: 'Encrypted Vatican-Crown laser tripwires and acoustic relays hum across the threshold.',
    counterCmd: 'bypass',
    clearMsg: 'Malleus carrier frequency spoofed (-10% Inquisition Heat). Tripwires disarmed.'
  },
  MIASMA_FOG: {
    label: 'Pestilent Miasma Vapor',
    symptom: 'Choking, spore-laden abyssal vapor blankets the floor, corroding exposed lenses.',
    counterCmd: 'purify',
    clearMsg: 'Thermal incense flare ignited. Miasma particulates incinerated.'
  },
  FERROUS_LOCK: {
    label: 'Magnetized Ferrous Lattice',
    symptom: 'Crushing magnetic flux is pinning metallic gear and distorting iron filings in the room.',
    counterCmd: 'demag',
    clearMsg: 'Reverse-polarity pulse emitted. Magnetic flux lattice collapsed.'
  },
  BLOOD_WARD: {
    label: 'Coagulated Goetic Blood-Ward',
    symptom: 'A pulsing vein of arterial sigils seals the inner sanctum, feeding on ambient vitality.',
    counterCmd: 'lance',
    clearMsg: 'Cold-iron lance pulse severed the arterial sigil circuit.'
  },
  CHRONO_LOOP: {
    label: 'Localized Chronometric Eddy',
    symptom: 'Time inside the chamber is stuttering in a 4-second recursive loop, resetting probes.',
    counterCmd: 'anchor',
    clearMsg: 'Saturnian lead-clock anchor deployed. Local timeline synchronized.'
  }
};

export interface SubGridNode {
  id: string;
  index: number;
  label: string;
  x: number;
  y: number;
  connections: string[];
  wardLevel: number;
  status: 'LOCKED' | 'PROBED' | 'BREACHED' | 'EXTRACTED';
  nodeType: 'ENTRY' | 'ANOMALY' | 'SALVAGE' | 'SHRINE' | 'AMBUSH' | 'ANCHOR';
  hazard: RoomHazardType;
  signalChannel?: ForensicChannel;
  rawSignalSymptom?: string;
  signTag?: string;
  forensicText?: string;
  salvageDrop?: { itemId: string; amount: number; obols: number };
  shrineYokaiId?: string;
}

export interface SectorContract {
  sectorId: string;
  sectorLabel: string;
  targetGoetiaId: string;
  activeSubNodeId: string | null;
  selectedSubNodeId: string;
  subNodes: SubGridNode[];
  discoveredLogs: { id: string; nodeLabel: string; text: string; channel: string }[];
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
  { outputId: 'gold_leaf', label: 'Solomonic Gold Leaf', obolCost: 20, rawMaterialId: 'scrap_metal', rawAmount: 2, desc: 'Solar-grade leaf required to compel Goetic Kings.' },
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
  lambeth_sanctum: ['LOLLARD TOWER', 'CRYPT ARCHIVES', 'CLOISTER GARTH', 'BELLFOUNDERS PIT', 'APOTHECARY CELL', 'PROFANED NAVE'],
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

  const getPhenomMeta = (tag: string) => {
    const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
    if (!def) {
      return {
        channel: 'ASTRAL_ECHO' as ForensicChannel,
        symptom: 'Unidentified conceptual distortion vibrating in the room.',
        report: `FORENSIC LOG: Anomalous resonance signature [${tag}] isolated.`
      };
    }
    return {
      channel: def.channel,
      symptom: def.rawSignalSymptom,
      report: def.forensicReports[Math.floor(Math.random() * def.forensicReports.length)]
    };
  };

  const p0 = getPhenomMeta(requiredTags[0]);
  const p1 = getPhenomMeta(requiredTags[1]);
  const p2 = getPhenomMeta(requiredTags[2]);

  const hazards: RoomHazardType[] = ['AETHYRIC_STATIC', 'INQUISITION_WIRE', 'MIASMA_FOG', 'FERROUS_LOCK', 'BLOOD_WARD', 'CHRONO_LOOP'];
  const randomHazard = () => hazards[Math.floor(Math.random() * hazards.length)];

  const subNodes: SubGridNode[] = [
    {
      id: `${sectorId}_n0`,
      index: 1,
      label: `1: ${labels[0]}`,
      x: coords[0].x,
      y: coords[0].y,
      connections: [`${sectorId}_n1`, `${sectorId}_n2`],
      wardLevel: 1,
      status: 'LOCKED',
      nodeType: 'ANOMALY',
      hazard: 'NONE',
      signalChannel: p0.channel,
      rawSignalSymptom: p0.symptom,
      signTag: requiredTags[0],
      forensicText: p0.report,
      salvageDrop: { itemId: rawMaterials[0], amount: 2, obols: 12 }
    },
    {
      id: `${sectorId}_n1`,
      index: 2,
      label: `2: ${labels[1]}`,
      x: coords[1].x,
      y: coords[1].y,
      connections: [`${sectorId}_n0`, `${sectorId}_n3`, `${sectorId}_n4`],
      wardLevel: 1,
      status: 'LOCKED',
      nodeType: 'ANOMALY',
      hazard: randomHazard(),
      signalChannel: p1.channel,
      rawSignalSymptom: p1.symptom,
      signTag: requiredTags[1],
      forensicText: p1.report,
      salvageDrop: { itemId: rawMaterials[1], amount: 2, obols: 15 }
    },
    {
      id: `${sectorId}_n2`,
      index: 3,
      label: `3: ${labels[2]}`,
      x: coords[2].x,
      y: coords[2].y,
      connections: [`${sectorId}_n0`, `${sectorId}_n3`, `${sectorId}_n4`],
      wardLevel: 1,
      status: 'LOCKED',
      nodeType: 'SHRINE',
      hazard: 'NONE',
      shrineYokaiId: randomYokai.id,
      salvageDrop: { itemId: 'alchemical_distillate', amount: 2, obols: 18 }
    },
    {
      id: `${sectorId}_n3`,
      index: 4,
      label: `4: ${labels[3]}`,
      x: coords[3].x,
      y: coords[3].y,
      connections: [`${sectorId}_n1`, `${sectorId}_n2`, `${sectorId}_n5`],
      wardLevel: 2,
      status: 'LOCKED',
      nodeType: 'AMBUSH',
      hazard: 'INQUISITION_WIRE',
      salvageDrop: { itemId: rawMaterials[2], amount: 3, obols: 22 }
    },
    {
      id: `${sectorId}_n4`,
      index: 5,
      label: `5: ${labels[4]}`,
      x: coords[4].x,
      y: coords[4].y,
      connections: [`${sectorId}_n1`, `${sectorId}_n2`, `${sectorId}_n5`],
      wardLevel: 2,
      status: 'LOCKED',
      nodeType: 'ANOMALY',
      hazard: randomHazard(),
      signalChannel: p2.channel,
      rawSignalSymptom: p2.symptom,
      signTag: requiredTags[2],
      forensicText: p2.report,
      salvageDrop: { itemId: rawMaterials[0], amount: 2, obols: 16 }
    },
    {
      id: `${sectorId}_n5`,
      index: 6,
      label: `6: ${labels[5]} [ANCHOR]`,
      x: coords[5].x,
      y: coords[5].y,
      connections: [`${sectorId}_n3`, `${sectorId}_n4`],
      wardLevel: 3,
      status: 'LOCKED',
      nodeType: 'ANCHOR',
      hazard: randomHazard(),
      signalChannel: p2.channel,
      rawSignalSymptom: p2.symptom,
      signTag: requiredTags[2],
      forensicText: `CONDUIT EPICENTER: ${p2.report}`,
      salvageDrop: { itemId: 'cursed_earth', amount: 3, obols: 28 }
    }
  ];

  return {
    sectorId,
    sectorLabel,
    targetGoetiaId: target.id,
    activeSubNodeId: null,
    selectedSubNodeId: subNodes[0].id,
    subNodes,
    discoveredLogs: []
  };
}