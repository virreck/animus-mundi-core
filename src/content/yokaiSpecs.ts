// src/content/yokaiSpecs.ts
// Active-invocation specs (charges, effects) for each bindable Yokai.

export const YOKAI_DAEMON_SPECS: Record<string, {
  codeName: string;
  classTag: string;
  passiveHook: string;
  activeLabel: string;
  maxCharges: number;
  activeDesc: string;
  loreNote: string;
}> = {
  yokai_kitsune: {
    codeName: 'KITSUNE.SYS // SPECTRAL PROXY',
    classTag: 'COUNTER-SURVEILLANCE',
    passiveHook: 'PASSIVE HOOK: Reduces Room Scan Humanity cost from -5% to -2%.',
    activeLabel: 'FOXFIRE SHROUD',
    maxCharges: 2,
    activeDesc: 'Injects phantom MAC addresses into Ordo Malleus trackers, venting -30% Inquisition Heat.',
    loreNote: 'Nine-tailed fox spirit bound into a coaxial packet-spoofing talisman.'
  },
  yokai_tengu: {
    codeName: 'TENGU.DMN // AERIAL LIDAR',
    classTag: 'RECONNAISSANCE',
    passiveHook: 'PASSIVE HOOK: Reduces Room Scan cost to -2% HUM.',
    activeLabel: 'GALE SWEEP',
    maxCharges: 2,
    activeDesc: 'Spends 5% Humanity to radar-scan the entire sub-grid, revealing every room at once.',
    loreNote: 'Mountain crow-tengu bound to high-frequency microwave telemetry relays.'
  },
  yokai_baku: {
    codeName: 'BAKU.EXE // COGNITIVE SCRUBBER',
    classTag: 'NEURO-STABILIZER',
    passiveHook: 'PASSIVE HOOK: Halves Humanity backlash when triggering room traps.',
    activeLabel: 'DEVOUR NIGHTMARE',
    maxCharges: 2,
    activeDesc: 'Consumes local paranoia waves, converting -15% Inquisition Heat into +20% Humanity.',
    loreNote: 'Dream-devouring chimera spirit wired directly into the operative biometric headset.'
  },
  yokai_zashiki: {
    codeName: 'ZASHIKI.BOT // TREASURY LEDGER',
    classTag: 'LOGISTICS & ARBITRAGE',
    passiveHook: 'PASSIVE HOOK: Optimizes salvage routing across syndicate dead-drops.',
    activeLabel: 'FORTUNE BOON',
    maxCharges: 1,
    activeDesc: 'Single-use: Liquidates dormant syndicate caches for +35 Obols & +1 Scrap Metal.',
    loreNote: 'Parlor-dwelling guardian spirit that manipulates subterranean bullion ledgers.'
  },
  yokai_kameosa: {
    codeName: 'KAMEOSA.ALC // CRUCIBLE VAT',
    classTag: 'ALCHEMICAL SYNTHESIS',
    passiveHook: 'PASSIVE HOOK: Safehouse Altar recipes cost 0 Obols (substituting -2% Humanity per craft).',
    activeLabel: 'FERMENT MATTER',
    maxCharges: 3,
    activeDesc: 'Spends 8% Humanity to synthesize +1 Scrap Metal, +1 Cursed Earth, & +1 Distillate.',
    loreNote: 'Inexhaustible sake-jar tsukumogami retrofitted for rapid planetary catalyst distillation.'
  },
  yokai_kamaitachi: {
    codeName: 'KAMAITACHI.VEX // VORTEX BREACHER',
    classTag: 'TACTICAL INFILTRATION',
    passiveHook: 'PASSIVE HOOK: Grants +5s on Goetian Sealing Rites and +15s on Grand Banishments.',
    activeLabel: 'WIND SICKLE',
    maxCharges: 2,
    activeDesc: 'Silently enters the selected adjacent room with 0% Heat, disarming Patrols & Traps.',
    loreNote: 'Whirlwind weasel triad that slices through warded iron and laser tripwires before sensors register.'
  },
  yokai_amabie: {
    codeName: 'AMABIE.ISO // REALITY ANCHOR',
    classTag: 'ENTROPY MITIGATION',
    passiveHook: 'PASSIVE HOOK: Dampens micro-entropy drift during regional transit.',
    activeLabel: 'PROPHETIC WARD',
    maxCharges: 1,
    activeDesc: 'Single-use: Spends 10 Obols to broadcast a stabilizing woodblock seal (-2.50% Global Entropy).',
    loreNote: 'Pelagic prophetic mermaid spirit whose geometric likeness repairs fraying reality.'
  },
  yokai_noppera: {
    codeName: 'NOPPERA.MSK // IDENTITY SPOOFER',
    classTag: 'DECEPTION & STEALTH',
    passiveHook: 'PASSIVE HOOK: Masks biometric signature from Malleus facial-recognition cameras.',
    activeLabel: 'FACELESS DECOY',
    maxCharges: 2,
    activeDesc: 'Disarms all Malleus Hound Patrols in the current sector and drops Inquisition Heat by -15%.',
    loreNote: 'Faceless phantom daemon that loops blank CCTV frames across Inquisition precincts.'
  }
};
