// src/engine/sectorGenerator.ts
import { allGoetia } from '../content/goetia';
import { allYokai } from '../content/yokai';

export type ForensicChannel = 'AUDIO' | 'MATTER' | 'ASTRAL';

export interface PhenomenonDef {
  tag: string;
  label: string;
  channel: ForensicChannel;
  rawSignalSymptom: string;
  forensicReports: string[];
}

export const PHENOMENON_CATALOG: PhenomenonDef[] = [
  {
    tag: 'hoarse_voice',
    label: 'Hoarse Vocalizations',
    channel: 'AUDIO',
    rawSignalSymptom: 'Sub-audible 85Hz vocal rasp vibrating through the ventilation brickwork.',
    forensicReports: [
      'VOX LOG: Directional mics isolated a gravelly, rasping voice reciting inverted Solomonic Psalms from inside the sealed duct.',
      'VOX LOG: Audio sweep captured a harsh, guttural command echoing from empty walls.'
    ]
  },
  {
    tag: 'amphibian_tracks',
    label: 'Amphibian Mucus / Tracks',
    channel: 'MATTER',
    rawSignalSymptom: 'Viscous, cold-blooded slime and webbed tracks coating the damp masonry.',
    forensicReports: [
      'ASSAY LOG: Three-toed amphibious tracks and batrachian alkaloid mucus trail directly toward the inner sanctum.',
      'ASSAY LOG: Translucent amphibian spawn and cold marsh-slime coat the brass door handles.'
    ]
  },
  {
    tag: 'sudden_invisibility',
    label: 'Optical Light Refraction',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Flashlight beams bend 45 degrees around an unseen silhouette in the room center.',
    forensicReports: [
      'AUSPEX LOG: Complete photon refraction pocket recorded; an unseen mass displaces dust while bending visible light.',
      'AUSPEX LOG: Thermal-optical sweep reveals a dense humanoid silhouette invisible to the naked eye.'
    ]
  },
  {
    tag: 'earthquake_tremors',
    label: 'Localized Seismic Tremors',
    channel: 'AUDIO',
    rawSignalSymptom: 'Rhythmic 14Hz infrasound hammering vibrating through the load-bearing concrete.',
    forensicReports: [
      'VOX LOG: Subterranean 14Hz acoustic tremors are fracturing concrete pillars while surrounding streets remain dead still.',
      'VOX LOG: Geophone mics isolated a slow, rhythmic tectonic pounding directly beneath the floorboards.'
    ]
  },
  {
    tag: 'lost_languages',
    label: 'Xenoglossia / Dead Scripts',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Shifting pre-Babylonian Aramaic and Enochian glyphs bleeding through the wall plaster.',
    forensicReports: [
      'AUSPEX LOG: Chalk markings on the lintel match the Celestial Alphabet of Agrippa and pre-Babylonian Aramaic.',
      'AUSPEX LOG: Printed manifests in the chamber have spontaneously rewritten themselves into archaic cuneiform.'
    ]
  },
  {
    tag: 'avian_screeches',
    label: 'Avian / Raptor Shrieks',
    channel: 'AUDIO',
    rawSignalSymptom: 'High-decibel predatory bird shrieks saturating the upper acoustic band.',
    forensicReports: [
      'VOX LOG: Deafening raptor shrieks echo from the rafters alongside shed black pinfeathers and bone pellets.',
      'VOX LOG: Ultrasonic spectrogram isolated layered corvid and owl calls inside the sealed chimney.'
    ]
  },
  {
    tag: 'cryptic_whispers',
    label: 'Sub-Audible Whispers',
    channel: 'AUDIO',
    rawSignalSymptom: 'Polyphonic white-noise whispers bleeding across unpowered copper intercom lines.',
    forensicReports: [
      'VOX LOG: EVP filters uncovered fifty overlapping voices whispering operative memories never spoken aloud.',
      'VOX LOG: Sibilant whispers bleed through dead telephone lines, reciting events from three days in the future.'
    ]
  },
  {
    tag: 'star_alignment',
    label: 'Astrolabe / Celestial Drift',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Compasses spin wildly toward an impossible 14th-century star projection on the ceiling.',
    forensicReports: [
      'AUSPEX LOG: Burn marks on the floor map an exact 1:1 projection of the Pleiades cluster from 1347 AD.',
      'AUSPEX LOG: Local magnetic north is locked onto a celestial point 30 degrees below the horizon.'
    ]
  },
  {
    tag: 'mind_fog',
    label: 'Cognitive Amnesia / Fog',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Heavy conceptual static inducing short-term memory loops and acute disorientation.',
    forensicReports: [
      'AUSPEX LOG: First responders wandered in circles for hours, unable to recall their own names or orders.',
      'AUSPEX LOG: Dense cognitive static blankets the threshold, erasing short-term memory on contact.'
    ]
  },
  {
    tag: 'necrotic_stasis',
    label: 'Necrotic Tissue Stasis',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Ambient temperature plunged to -18°C with crystalline gray hoarfrost halting decay.',
    forensicReports: [
      'AUSPEX LOG: Ambient temperature dropped to -18°C; organic matter is locked in bacterial-free necrotic stasis.',
      'AUSPEX LOG: Black hoarfrost coats the walls; cellular decay has halted completely inside the room.'
    ]
  },
  {
    tag: 'corpse_theft',
    label: 'Exhumation / Cadaver Theft',
    channel: 'MATTER',
    rawSignalSymptom: 'Formaldehyde residue, bone dust, and wrenched sarcophagus seals across the floor.',
    forensicReports: [
      'ASSAY LOG: Heavy stone sarcophagi have been wrenched open from the inside; cadavers systematically harvested.',
      'ASSAY LOG: Drag marks and chemical formaldehyde trails lead directly toward the sector anchor.'
    ]
  },
  {
    tag: 'plague_vectors',
    label: 'Pathogenic / Pestilent Spores',
    channel: 'MATTER',
    rawSignalSymptom: 'Black, oily fungal pustules and airborne necrotic spores coating the vents.',
    forensicReports: [
      'ASSAY LOG: Airborne necrotic mold spores coat the ventilation grates, rotting organic rations in seconds.',
      'ASSAY LOG: Bloated flies and black fungal pustules have contaminated the chamber.'
    ]
  },
  {
    tag: 'metal_transmutation',
    label: 'Alchemical Transmutation',
    channel: 'MATTER',
    rawSignalSymptom: 'Brass fixtures and copper pipes are weeping liquid quicksilver and soft lead.',
    forensicReports: [
      'ASSAY LOG: Brass shell casings and copper pipes have spontaneously transmuted into brittle veins of lead.',
      'ASSAY LOG: Iron grates have turned into porous, weeping amalgamations of bismuth and quicksilver.'
    ]
  },
  {
    tag: 'blood_frenzy',
    label: 'Hematophagic / Martial Frenzy',
    channel: 'MATTER',
    rawSignalSymptom: 'Arterial spray and hyper-elevated adrenal pheromones saturating the floorboards.',
    forensicReports: [
      'ASSAY LOG: Blood samples show lethal adrenal and cortisol spikes—witnesses tore at each other bare-handed.',
      'ASSAY LOG: Fingernail gouges and arterial spray cover the wainscoting from a spontaneous berserker melee.'
    ]
  },
  {
    tag: 'weapon_decay',
    label: 'Rapid Ferrous Oxidation',
    channel: 'MATTER',
    rawSignalSymptom: 'Tempered steel locks and iron bars have dissolved into piles of flaky red rust.',
    forensicReports: [
      'ASSAY LOG: Tempered steel locks and sidearms oxidized into flaky red rust within minutes of exposure.',
      'ASSAY LOG: Gunpowder in sealed brass cartridges has turned into inert, damp gray paste.'
    ]
  },
  {
    tag: 'illusory_terrain',
    label: 'Non-Euclidean Spatial Shift',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Rangefinders measure a 140-meter hallway inside a 25-meter building footprint.',
    forensicReports: [
      'AUSPEX LOG: Internal hallway measures 140m long despite the exterior walls spanning only 25m.',
      'AUSPEX LOG: Doorways loop back into themselves amidst shimmering spatial mirage corridors.'
    ]
  },
  {
    tag: 'wolf_howls',
    label: 'Canine / Lupine Howls',
    channel: 'AUDIO',
    rawSignalSymptom: 'Deep, predatory lupine howls vibrating through the sub-bass spectrum.',
    forensicReports: [
      'VOX LOG: Resonant wolf howls vibrate through the sub-bass band alongside massive claw gouges in oak doors.',
      'VOX LOG: Spectrogram isolated predatory lupine howls circling the room perimeter.'
    ]
  },
  {
    tag: 'thermal_scorching',
    label: 'Pyroclastic Scorching',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Vitrified brick and flash-melted glass radiating 1,200°C residual thermal signatures.',
    forensicReports: [
      'AUSPEX LOG: Vitrified brick indicates a localized 1,200°C thermal spike with zero smoke or fuel source.',
      'AUSPEX LOG: Brass fixtures melted into droplets while paper ledgers inches away remained unburnt.'
    ]
  },
  {
    tag: 'serpent_scales',
    label: 'Ophidian Scales / Venom',
    channel: 'MATTER',
    rawSignalSymptom: 'Iridescent reptilian scales and crystallized hemotoxic venom coating the stone.',
    forensicReports: [
      'ASSAY LOG: Palm-sized iridescent serpent scales and neurotoxic venom residue coat the threshold.',
      'ASSAY LOG: Heavy coiling tracks crushed the floorboards, reeking of ozone and pit-viper venom.'
    ]
  },
  {
    tag: 'temporal_distortion',
    label: 'Chronometric Drift',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Quartz clocks are running backward while dust motes hang frozen in mid-air.',
    forensicReports: [
      'AUSPEX LOG: Wristwatches in the chamber run backward; OS telemetry desynchronized by 47 hours.',
      'AUSPEX LOG: Radioactive half-life decay inside the room oscillates between 10x speed and total freeze.'
    ]
  },
  {
    tag: 'astral_projection',
    label: 'Ectoplasmic / Astral Tether',
    channel: 'ASTRAL',
    rawSignalSymptom: 'Luminous silver threads of residual ectoplasm hanging suspended in the air.',
    forensicReports: [
      'AUSPEX LOG: Luminous silver threads of ectoplasm hang in the air where consciousnesses were ripped loose.',
      'AUSPEX LOG: Mirrors in the room reflect operative silhouettes three seconds before they cross the door.'
    ]
  },
  {
    tag: 'sulfur_stench',
    label: 'Brimstone / Sulfuric Miasma',
    channel: 'MATTER',
    rawSignalSymptom: 'Yellow crystalline sulfur deposits and volcanic brimstone venting from solid granite.',
    forensicReports: [
      'ASSAY LOG: Fumarole-grade hydrogen sulfide and yellow brimstone crystals coat every cold surface.',
      'ASSAY LOG: Volcanic sulfur dioxide is venting directly out of uncracked granite masonry.'
    ]
  },
  {
    tag: 'water_corruption',
    label: 'Brackish / Abyssal Brine',
    channel: 'MATTER',
    rawSignalSymptom: 'Pelagic black kelp and freezing abyssal saltwater oozing from dry plumbing.',
    forensicReports: [
      'ASSAY LOG: Tap water turned into freezing abyssal seawater teeming with dead deep-sea microbes.',
      'ASSAY LOG: Barnacles and black kelp are growing rapidly out of dry-wall copper pipes.'
    ]
  },
  {
    tag: 'tempest_winds',
    label: 'Barometric Cyclone / Gale',
    channel: 'AUDIO',
    rawSignalSymptom: 'Roaring 90-knot indoor wind tunnel howling inside a windowless subterranean room.',
    forensicReports: [
      'VOX LOG: Acoustic sensors recorded a 90-knot cyclonic gale roaring inside a sealed subterranean vault.',
      'VOX LOG: Barometric pressure collapsed to hurricane levels, blowing every window frame outward.'
    ]
  }
];

// Guarantees every single one of the 72 Goetia has a 100% unique 3-phenomenon fingerprint
const UNIQUE_SIGNS_CACHE: Record<string, string[]> = {};

export function getUniqueGoetiaSigns(goetiaId: string): string[] {
  if (Object.keys(UNIQUE_SIGNS_CACHE).length === 0) {
    const usedSignatures = new Set<string>();
    const allTags = PHENOMENON_CATALOG.map(p => p.tag);

    const allegiancePools: Record<string, string[]> = {
      CONQUEST: ['mind_fog', 'star_alignment', 'astral_projection', 'sudden_invisibility', 'lost_languages', 'temporal_distortion'],
      WAR: ['blood_frenzy', 'thermal_scorching', 'weapon_decay', 'earthquake_tremors', 'wolf_howls', 'sulfur_stench'],
      FAMINE: ['plague_vectors', 'metal_transmutation', 'water_corruption', 'amphibian_tracks', 'avian_screeches', 'hoarse_voice'],
      DEATH: ['necrotic_stasis', 'corpse_theft', 'cryptic_whispers', 'serpent_scales', 'illusory_terrain', 'mind_fog']
    };

    allGoetia.forEach(g => {
      const base = g.requiredIntel && g.requiredIntel.length >= 3
        ? [...g.requiredIntel.slice(0, 3)]
        : ['hoarse_voice', 'weapon_decay', 'corpse_theft'];

      const sigKey = (arr: string[]) => [...arr].sort().join('|');

      if (!usedSignatures.has(sigKey(base))) {
        usedSignatures.add(sigKey(base));
        UNIQUE_SIGNS_CACHE[g.id] = base;
      } else {
        const candidatePool = [...(allegiancePools[g.allegiance] || []), ...allTags];
        let resolved = base;
        for (const cand of candidatePool) {
          if (cand === base[0] || cand === base[1]) continue;
          const attempt = [base[0], base[1], cand];
          if (!usedSignatures.has(sigKey(attempt))) {
            resolved = attempt;
            break;
          }
        }
        usedSignatures.add(sigKey(resolved));
        UNIQUE_SIGNS_CACHE[g.id] = resolved;
      }
    });
  }
  return UNIQUE_SIGNS_CACHE[goetiaId] || ['hoarse_voice', 'weapon_decay', 'corpse_theft'];
}

// Streamlined 4 Room Traps (Clear Symptoms -> Intuitive Counter-Commands)
export type RoomHazardType = 'NONE' | 'STATIC' | 'WIRE' | 'MIASMA' | 'HEX';

export const HAZARD_MANIFEST: Record<Exclude<RoomHazardType, 'NONE'>, {
  label: string;
  symptom: string;
  counterCmd: string;
  clearMsg: string;
}> = {
  STATIC: {
    label: 'Aethyric Static Field',
    symptom: 'Electromagnetic static screech is scrambling forensic instruments.',
    counterCmd: 'degauss',
    clearMsg: 'Coils degaussed. Electromagnetic interference cleared.'
  },
  WIRE: {
    label: 'Malleus Laser Tripwire',
    symptom: 'Encrypted Inquisition laser tripwires span the doorway threshold.',
    counterCmd: 'bypass',
    clearMsg: 'Tripwire frequency spoofed (-10% Inquisition Heat). Doorway safe.'
  },
  MIASMA: {
    label: 'Toxic Brimstone Miasma',
    symptom: 'Choking, spore-laden sulfur vapor blankets the chamber floor.',
    counterCmd: 'purge',
    clearMsg: 'Thermal flare ignited. Toxic miasma purged.'
  },
  HEX: {
    label: 'Goetic Blood-Hex Ward',
    symptom: 'Pulsing crimson sigils seal the room architecture against intrusion.',
    counterCmd: 'dispel',
    clearMsg: 'Cold-iron pulse shattered the Goetic Blood-Hex.'
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
  status: 'LOCKED' | 'SCANNED' | 'ENTERED' | 'CLEARED';
  nodeType: 'ANOMALY' | 'SHRINE' | 'PATROL' | 'ANCHOR';
  hazard: RoomHazardType;
  patrolActive?: boolean;
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

  // Uses the 100% unique 3-phenomenon fingerprint for this demon
  const requiredTags = getUniqueGoetiaSigns(target.id);

  const randomYokai = allYokai[Math.floor(Math.random() * allYokai.length)];
  const rawMaterials: ('scrap_metal' | 'cursed_earth' | 'alchemical_distillate')[] = ['scrap_metal', 'cursed_earth', 'alchemical_distillate'];

  const getPhenomMeta = (tag: string) => {
    const def = PHENOMENON_CATALOG.find(p => p.tag === tag);
    if (!def) {
      return {
        channel: 'ASTRAL' as ForensicChannel,
        symptom: 'Unidentified spatial distortion vibrating in the room.',
        report: `AUSPEX LOG: Anomalous resonance signature [${tag}] isolated.`
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

  const traps: RoomHazardType[] = ['STATIC', 'WIRE', 'MIASMA', 'HEX'];
  const randomTrap = () => traps[Math.floor(Math.random() * traps.length)];

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
      hazard: randomTrap(),
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
      nodeType: 'PATROL',
      hazard: 'NONE', // Mutually exclusive with room traps so you can always decoy or disarm cleanly!
      patrolActive: true,
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
      hazard: randomTrap(),
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
      hazard: randomTrap(),
      signalChannel: p2.channel,
      rawSignalSymptom: p2.symptom,
      signTag: requiredTags[2],
      forensicText: `CONDUIT ANCHOR [${target.allegiance} COURT]: ${p2.report}`,
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