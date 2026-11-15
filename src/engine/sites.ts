// src/engine/sites.ts
// THE LONG CAMPAIGN — procedural sites. The sixteen sectors on the regional map are only
// where the infestation starts. As the campaign runs, new sites break open and get
// linked into the map until every spirit has had somewhere to anchor.
import { MACRO_SECTORS, type MacroSectorDef } from '../content/map';
import type { GameState, NodeId } from './state';

/** A generated site: a normal map node plus the room names its case files use. */
export interface ProceduralSiteDef extends MacroSectorDef {
  procedural: true;
  /** Eight room names: entry, four middle rooms, anchor, two spares. */
  rooms: string[];
}

export interface CampaignState {
  /** World ticks elapsed this run. */
  tick: number;
  /** Sites that have broken open, in the order they appeared. */
  sites: ProceduralSiteDef[];
  /** Ticks each secured sector has lain dormant (cleared when it re-infests). */
  dormancy: Record<NodeId, number>;
  /** How many times each sector has re-infested. */
  cycles: Record<NodeId, number>;
  /** Earliest tick the next new site may break open. */
  nextSiteAt: number;
  /** Sectors secured over the whole run (re-infested ones count again). */
  casesClosed: number;
}

export const initialCampaign = (): CampaignState => ({ tick: 0, sites: [], dormancy: {}, cycles: {}, nextSiteAt: 0, casesClosed: 0 });

// ---------------------------------------------------------------------------
// SITE CATALOGUE
// ---------------------------------------------------------------------------
const DISTRICTS = [
  'DEPTFORD', 'PECKHAM', 'KENNINGTON', 'BERMONDSEY', 'ROTHERHITHE', 'STOCKWELL', 'SYDENHAM', 'NORWOOD',
  'SELHURST', 'PURLEY', 'COULSDON', 'MITCHAM', 'TOOTING', 'CLAPHAM', 'ELTHAM', 'LEWISHAM', 'CATFORD',
  'BALHAM', 'DULWICH', 'SOUTHWARK', 'VAUXHALL', 'LIMEHOUSE', 'WAPPING', 'CAMBERWELL', 'FOREST HILL', 'KIDBROOKE'
];

/** [label, short code, rooms: entry, 4 middle, anchor, 2 spares] */
const SITE_KINDS: Array<[string, string, string[]]> = [
  ['PLAGUE PIT', 'PIT', ['GATEHOUSE', 'LIME KILN', 'BONE TRENCH', "SEXTON'S HUT", 'DEAD CART SHED', 'PIT FLOOR', 'CHARNEL SHAFT', 'BURIAL REGISTER']],
  ['TUBE SIDING', 'SIDING', ['TICKET HALL', 'ESCALATOR SHAFT', 'SIGNAL CABIN', 'DISUSED PLATFORM', "DRIVERS' MESS", 'SIDING TUNNEL', 'FAN CHAMBER', 'LOST PROPERTY']],
  ['WATER TOWER', 'TOWER', ['PUMP HOUSE', 'VALVE GALLERY', 'STAIR CORE', 'GAUGE ROOM', 'OVERFLOW SUMP', 'CISTERN', "KEEPER'S FLAT", 'INSPECTION HATCH']],
  ['LIDO', 'LIDO', ['TURNSTILES', 'CHANGING CUBICLES', 'BOILER ROOM', 'SUN TERRACE', 'FILTER PLANT', 'DEEP END', 'CAFE KIOSK', 'DIVING TOWER']],
  ['MAGDALENE LAUNDRY', 'LAUNDRY', ['RECEIVING ROOM', 'WASH HOUSE', 'MANGLE ROOM', 'DORMITORY', "MOTHER'S OFFICE", 'DRYING LOFT', 'CHAPEL', "PENITENTS' YARD"]],
  ['SUBSTATION', 'SUBSTN', ['SECURITY FENCE', 'SWITCH HALL', 'CABLE TUNNEL', 'CONTROL ROOM', 'BATTERY ROOM', 'TRANSFORMER PIT', 'OIL STORE', 'METER ROOM']],
  ['MUSIC HALL', 'HALL', ['FOYER', 'STALLS', 'ORCHESTRA PIT', 'DRESSING ROOMS', 'FLY TOWER', 'UNDER-STAGE', 'GALLERY', 'BOX OFFICE']],
  ['FOUNDRY', 'FOUNDRY', ['YARD GATE', 'PATTERN SHOP', 'CASTING FLOOR', 'CUPOLA', 'SAND STORE', 'CRUCIBLE PIT', "FOREMAN'S HUT", 'SLAG HEAP']],
  ['CHAPEL OF EASE', 'CHAPEL', ['PORCH', 'NAVE', 'VESTRY', 'BELL CHAMBER', 'CHOIR LOFT', 'CRYPT', 'OSSUARY NICHE', 'ORGAN LOFT']],
  ['SEWER JUNCTION', 'SEWER', ['MANHOLE', 'OUTFALL', 'PENSTOCK', 'STORM RELIEF', "FLUSHERS' STORE", 'CONFLUENCE CHAMBER', 'BRICK CULVERT', 'SILT TRAP']],
  ['COLD STORE', 'COLD', ['LOADING DOCK', 'ANTEROOM', 'MEAT HALL', 'BLAST FREEZER', 'COMPRESSOR ROOM', 'DEEP FREEZE', 'TALLY OFFICE', 'ICE DRAIN']],
  ['TELEPHONE EXCHANGE', 'EXCH', ['RECEPTION', 'SWITCHBOARD FLOOR', 'RELAY RACKS', "OPERATORS' CANTEEN", 'CABLE VAULT', 'TRUNK ROOM', 'BATTERY ROOM', 'ROOF MAST']],
  ['ICE WELL', 'ICEWELL', ['WHARF STEPS', 'WAREHOUSE', 'BLOCK STORE', 'HOIST LOFT', 'WEIGH OFFICE', 'WELL SHAFT', 'CANAL BASIN', 'SAWDUST STORE']],
  ['GASHOLDER', 'GAS', ['GATE LODGE', 'RETORT HOUSE', 'VALVE HOUSE', 'PURIFIER BEDS', 'METER HOUSE', 'HOLDER BELL', 'TAR WELL', 'GUIDE FRAME']],
  ['DEAD LETTER OFFICE', 'DLO', ['SORTING HALL', 'PIGEONHOLES', 'FRANKING ROOM', 'BASEMENT ARCHIVE', "CLERK'S DESK", 'INCINERATOR', 'PNEUMATIC TUBES', 'MAIL BAGS']],
  ['WORKHOUSE', 'WKHSE', ['CASUAL WARD', 'OAKUM SHED', 'REFECTORY', 'INFIRMARY', "MASTER'S OFFICE", 'DEAD HOUSE', 'STONE YARD', 'BOILER HOUSE']]
];

/** The map holds at most one site of each kind. */
export const MAX_PROCEDURAL_SITES = SITE_KINDS.length;

export const SITE_TUNING = {
  /** Minimum distance (map units) between a new site and any existing node. */
  minSpacing: 0.1,
  /** Distance band from the parent node a new site is placed in. */
  minReach: 0.1,
  maxReach: 0.17,
  /** A new site also links to its nearest other node within this distance. */
  secondLinkReach: 0.2,
  bounds: { x0: 0.05, x1: 0.95, y0: 0.06, y1: 0.93 }
} as const;

// ---------------------------------------------------------------------------
// MAP SELECTORS (static sectors + generated sites)
// ---------------------------------------------------------------------------
type SiteState = Partial<Pick<GameState, 'campaign'>>;

const mergedCache = new WeakMap<ProceduralSiteDef[], MacroSectorDef[]>();

/** Every node on the regional map, with links back from the sectors that new sites attach to. */
export function getAllSectors(state: SiteState): MacroSectorDef[] {
  const sites = state.campaign?.sites;
  if (!sites || sites.length === 0) return MACRO_SECTORS;
  const hit = mergedCache.get(sites);
  if (hit) return hit;
  const backLinks: Record<string, string[]> = {};
  sites.forEach(s => s.connections.forEach(c => (backLinks[c] ||= []).push(s.id)));
  const merged = [...MACRO_SECTORS, ...sites].map(s => {
    const extra = (backLinks[s.id] || []).filter(id => !s.connections.includes(id));
    return extra.length ? { ...s, connections: [...s.connections, ...extra] } : s;
  });
  mergedCache.set(sites, merged);
  return merged;
}

export const getSectorDef = (state: SiteState, sectorId: NodeId): MacroSectorDef | undefined =>
  getAllSectors(state).find(s => s.id === sectorId);

export const isProceduralSite = (sec: MacroSectorDef | undefined): sec is ProceduralSiteDef =>
  !!sec && (sec as ProceduralSiteDef).procedural === true;

// ---------------------------------------------------------------------------
// GENERATION
// ---------------------------------------------------------------------------
const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

/**
 * Rolls a new site next to an existing field node. Returns null when there is no room
 * left on the map or every site kind is already in use.
 */
export function generateSite(state: SiteState, rng: () => number = Math.random): ProceduralSiteDef | null {
  const existing = getAllSectors(state);
  const sites = state.campaign?.sites || [];
  const usedKinds = new Set(sites.map(s => s.id.split('__')[1]));
  const freeKinds = SITE_KINDS.filter(([, code]) => !usedKinds.has(code.toLowerCase()));
  if (freeKinds.length === 0) return null;

  const { minSpacing, minReach, maxReach, secondLinkReach, bounds } = SITE_TUNING;
  const parents = existing.filter(s => s.id !== 'safehouse');
  const clear = (x: number, y: number) =>
    x >= bounds.x0 && x <= bounds.x1 && y >= bounds.y0 && y <= bounds.y1 &&
    existing.every(n => Math.hypot(n.x - x, n.y - y) >= minSpacing);

  for (let attempt = 0; attempt < 240; attempt++) {
    const parent = pick(parents, rng);
    const angle = rng() * Math.PI * 2;
    const reach = minReach + rng() * (maxReach - minReach);
    const x = +(parent.x + Math.cos(angle) * reach).toFixed(3);
    const y = +(parent.y + Math.sin(angle) * reach).toFixed(3);
    if (!clear(x, y)) continue;

    const [kindLabel, code, rooms] = pick(freeKinds, rng);
    const usedNames = new Set(sites.map(s => s.region));
    const district = pick(DISTRICTS.filter(d => !usedNames.has(d)), rng) || pick(DISTRICTS, rng);
    const connections = [parent.id];
    const second = parents
      .filter(n => n.id !== parent.id)
      .map(n => ({ n, d: Math.hypot(n.x - x, n.y - y) }))
      .filter(o => o.d <= secondLinkReach)
      .sort((a, b) => a.d - b.d)[0];
    if (second) connections.push(second.n.id);

    const index = MACRO_SECTORS.length + sites.length; // 17, 18, ...
    return {
      id: `site_${index}__${code.toLowerCase()}`,
      label: `${district} ${kindLabel}`,
      short: `${code}-${index}`,
      region: district,
      tier: Math.max(1, Math.min(4, parent.tier)),
      x,
      y,
      connections,
      unlockedByDefault: true,
      procedural: true,
      rooms
    };
  }
  return null;
}
