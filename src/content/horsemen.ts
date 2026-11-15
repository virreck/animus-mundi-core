// src/content/horsemen.ts
// Lore for the four Horsemen courts.

export const HORSEMAN_LORE: Record<'CONQUEST' | 'WAR' | 'FAMINE' | 'DEATH', {
  riderTitle: string;
  sealName: string;
  color: string;
  domain: string;
  omenDesc: string;
}> = {
  CONQUEST: {
    riderTitle: 'THE WHITE RIDER // CROWN & BOW OF SUBJUGATION',
    sealName: 'FIRST SEAL (REV 6:2)',
    color: '#00f3ff',
    domain: 'Solar Kings, Astral Princes, Mind Fog & False Sovereignty',
    omenDesc: 'Channels the Solar Kings and Aerial Princes of the Lemegeton to overwrite human free will, blind surveillance grids, and crown false prophets.'
  },
  WAR: {
    riderTitle: 'THE RED RIDER // GREAT SWORD OF SLAUGHTER',
    sealName: 'SECOND SEAL (REV 6:4)',
    color: '#ff2a55',
    domain: 'Martial Marquises, Ferrous Oxidation, Pyroclastic Ruin & Frenzy',
    omenDesc: 'Harnesses the Martial Marquises and Earls of the Ars Goetia to corrode steel, ignite spontaneous firestorms, and drive precincts into blood frenzy.'
  },
  FAMINE: {
    riderTitle: 'THE BLACK RIDER // SCALES OF SCARCITY',
    sealName: 'THIRD SEAL (REV 6:5)',
    color: '#ffb800',
    domain: 'Mercurial Presidents, Pathogenic Blight, Transmutation & Usury',
    omenDesc: 'Commands the Presidents of the Goetia to rot organic provisions, transmute bullion into leaden dross, and choke ventilation shafts with spores.'
  },
  DEATH: {
    riderTitle: 'THE PALE RIDER // SCYTHE OF THE OSSUARY TETHER',
    sealName: 'FOURTH SEAL (REV 6:8)',
    color: '#62f080',
    domain: 'Necromantic Dukes, Tissue Stasis, Exhumation & Spectral Trumpets',
    omenDesc: 'Anchors through Necromantic Dukes and Knights of the Goetia to harvest morgues, lock living tissue in cryo-stasis, and bridge Hades into reality.'
  }
};
