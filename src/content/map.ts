// src/content/map.ts
// Regional map: the 16 macro sectors and the Safehouse.

export interface MacroSectorDef {
  id: string;
  label: string;
  short: string;
  region: string;
  tier: number;
  x: number;
  y: number;
  connections: string[];
  unlockedByDefault?: boolean;
}

export const MACRO_SECTORS: MacroSectorDef[] = [
  { id: 'safehouse', label: 'SAFEHOUSE / ALTAR HUB', short: 'SAFEHOUSE', region: 'CATERHAM HUB', tier: 0, x: 0.50, y: 0.52, connections: ['caterham_churchyard', 'caterham_asylum', 'chaldon_quarry', 'croydon_relay'], unlockedByDefault: true },
  { id: 'caterham_churchyard', label: 'ST. LAWRENCE CRYPT', short: 'CRYPT-01', region: 'SURREY HILLS', tier: 1, x: 0.34, y: 0.72, connections: ['safehouse', 'chaldon_quarry', 'waddon_marsh'], unlockedByDefault: true },
  { id: 'caterham_asylum', label: 'CATERHAM ASYLUM', short: 'ASYLUM-GW', region: 'SURREY HILLS', tier: 1, x: 0.66, y: 0.72, connections: ['safehouse', 'croydon_relay', 'malleus_precinct'], unlockedByDefault: true },
  { id: 'chaldon_quarry', label: 'CHALDON FIRE-QUARRIES', short: 'QUARRY-02', region: 'WEALD FRINGE', tier: 1, x: 0.18, y: 0.62, connections: ['safehouse', 'caterham_churchyard', 'waddon_marsh', 'thames_nexus'], unlockedByDefault: true },
  { id: 'croydon_relay', label: 'CROYDON TELECOM SPIRE', short: 'SPIRE-04', region: 'SOUTH LONDON', tier: 2, x: 0.72, y: 0.50, connections: ['safehouse', 'caterham_asylum', 'malleus_precinct', 'woolwich_arsenal'] },
  { id: 'waddon_marsh', label: 'WADDON GASWORKS MARSH', short: 'MARSH-05', region: 'SOUTH LONDON', tier: 2, x: 0.28, y: 0.44, connections: ['caterham_churchyard', 'chaldon_quarry', 'thames_nexus', 'brixton_morgue'] },
  { id: 'malleus_precinct', label: 'MALLEUS INQUISITION HQ', short: 'PRECINCT', region: 'SOUTH LONDON', tier: 2, x: 0.84, y: 0.60, connections: ['caterham_asylum', 'croydon_relay', 'woolwich_arsenal', 'greenwich_observatory'] },
  { id: 'brixton_morgue', label: 'BRIXTON OSSUARY MORGUE', short: 'MORGUE-07', region: 'INNER SOUTH', tier: 2, x: 0.42, y: 0.34, connections: ['waddon_marsh', 'lambeth_sanctum', 'blackfriars_vault'] },
  { id: 'thames_nexus', label: 'THAMES BARRAGE NEXUS', short: 'LEY-NEXUS', region: 'THAMES ESTUARY', tier: 3, x: 0.14, y: 0.36, connections: ['chaldon_quarry', 'waddon_marsh', 'battersea_forge', 'highgate_catacombs'] },
  { id: 'woolwich_arsenal', label: 'WOOLWICH ROYAL ARSENAL', short: 'ARSENAL', region: 'DOCKLANDS', tier: 3, x: 0.86, y: 0.36, connections: ['croydon_relay', 'malleus_precinct', 'greenwich_observatory', 'whitechapel_abattoir'] },
  { id: 'greenwich_observatory', label: 'MERIDIAN ASTROLABE', short: 'MERIDIAN', region: 'GREENWICH', tier: 3, x: 0.74, y: 0.24, connections: ['malleus_precinct', 'woolwich_arsenal', 'whitechapel_abattoir', 'st_pauls_whisper'] },
  { id: 'lambeth_sanctum', label: 'LAMBETH PALACE CRYPT', short: 'LAMBETH', region: 'WESTMINSTER', tier: 3, x: 0.54, y: 0.28, connections: ['brixton_morgue', 'battersea_forge', 'blackfriars_vault', 'st_pauls_whisper'] },
  { id: 'battersea_forge', label: 'BATTERSEA COIL FORGE', short: 'COIL-FORGE', region: 'NINE ELMS', tier: 3, x: 0.28, y: 0.22, connections: ['thames_nexus', 'lambeth_sanctum', 'highgate_catacombs'] },
  { id: 'blackfriars_vault', label: 'BLACKFRIARS MITHRAEUM', short: 'MITHRAEUM', region: 'CITY OF LONDON', tier: 4, x: 0.46, y: 0.14, connections: ['brixton_morgue', 'lambeth_sanctum', 'st_pauls_whisper', 'highgate_catacombs'] },
  { id: 'whitechapel_abattoir', label: 'WHITECHAPEL ABATTOIR', short: 'ABATTOIR', region: 'EAST END', tier: 4, x: 0.84, y: 0.14, connections: ['woolwich_arsenal', 'greenwich_observatory', 'st_pauls_whisper'] },
  { id: 'highgate_catacombs', label: 'HIGHGATE NECROPOLIS', short: 'HIGHGATE', region: 'NORTHGATE', tier: 4, x: 0.16, y: 0.12, connections: ['thames_nexus', 'battersea_forge', 'blackfriars_vault'] },
  { id: 'st_pauls_whisper', label: 'ST. PAULS OMEGA DOME', short: 'OMEGA-DOME', region: 'LUDGATE HILL', tier: 4, x: 0.64, y: 0.12, connections: ['greenwich_observatory', 'lambeth_sanctum', 'blackfriars_vault', 'whitechapel_abattoir'] }
];
