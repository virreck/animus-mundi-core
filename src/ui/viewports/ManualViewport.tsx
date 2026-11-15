// src/ui/viewports/ManualViewport.tsx
// [F7] MANUAL viewport.
import { useState, type CSSProperties as ReactCSSProperties } from 'react';
import { DEEP_ATTUNE_COST, REFINE_COST } from '../../engine/evidence';
import { KAGE_TUNING } from '../../engine/kage';
import { ThaumaturgicAudio } from '../audio';
import { FONT_ZOOM_MAP, type FontScale, theme } from '../theme';

/** Plain-English meanings of the game's terms (MANUAL tab 7). */
const GLOSSARY: Array<[string, string]> = [
  ['Entropy', 'How close the world is to falling apart. It rises when spirits escape or rituals fail. If it reaches 100%, you lose.'],
  ['Humanity (HUM)', 'Your health. Scans, traps and some powers cost it. Rest at the Safehouse to get it back. At 0% the run ends.'],
  ['Obols', 'Money. You find it while searching rooms and spend it on materials, bribes and spirit tributes.'],
  ['Heat', 'How close the witch-hunters are to finding you in one place. Entering rooms raises it. At 100% that place is locked down.'],
  ['Ordo Malleus', 'Witch-hunters. They want to burn the problem away, you included.'],
  ['Sector', 'A place on the Regional Map, like a crypt or an asylum. Each one hides one spirit.'],
  ['Room', 'One of the boxes on the local map. Tap a room to select it; the buttons then act on that room.'],
  ['Scan', 'Look through a door before going in: what is inside, any trap, and the Heat it will cost.'],
  ['Enter', 'Walk into the selected room. You can only reach rooms next to the one you are in.'],
  ['Loot', 'Search the room you are in for materials and Obols.'],
  ['Clue / reading', 'Evidence about the spirit, found by using the right instrument in a room.'],
  ['VOX / ASSAY / AUSPEX', 'Your three instruments. VOX for sounds, ASSAY for things you could touch, AUSPEX for light, heat, time or the mind.'],
  ['Degraded', 'An unclear clue (shown in amber). It could be one of a few things.'],
  ['Refine', 'Turn an unclear clue into a clear one. Costs Humanity and Heat.'],
  ['Trap (ward)', 'A dangerous door. The scan describes it; DEGAUSS, BYPASS, PURGE or DISPEL removes it (see tab 2).'],
  ['Patrol', 'Witch-hunter guards in a room. Use DECOY to lure them away before going in.'],
  ['Witness', 'A frightened person in a room. Interview them for a description of the spirit, with gaps in it.'],
  ['Shrine', 'An altar to a helper spirit. Searching it adds that spirit to your Kage No Sho.'],
  ['Kage No Sho', 'Your Book of Shadows: the helper spirits you have found, and where you bind them.'],
  ['Shikigami / daemon', 'A helper spirit you have bound. It has a side effect, and a power you can use a few times.'],
  ['Bond', 'How well you know a helper spirit. Use it more and its side effect gets easier.'],
  ['Pact', 'Your deal with a bound helper. Renew it with ink to refill its charges. Breaking it offends the spirit for a while.'],
  ['Anchor', 'The room that ties the spirit to the place. Attune there to learn about the spirit.'],
  ['Attune', 'At the anchor: once tells you which Horseman the spirit serves, twice tells you its rank.'],
  ['Court', 'Which of the four Horsemen a spirit serves.'],
  ['Rank', 'How important a spirit is (King, Duke, Prince and so on).'],
  ['Codex', 'The list of all 72 spirits. Tick clues to narrow it down, strike out the ones that do not fit, and start the seal here.'],
  ['Catalysts', 'The materials needed to seal a particular spirit. Make them at the Safehouse.'],
  ['Sealing Rite', 'Locking a spirit away: type its name, then trace its star. If it fails, the spirit escapes for good.'],
  ['Ripeness', 'The ring around each place on the Regional Map. It fills while you are elsewhere; when it is full, the spirit breaks loose on its own.'],
  ['Manifested / lost', 'The spirit escaped. That place is lost for good and the escaped spirit makes its neighbours worse.'],
  ['Re-infestation', 'A place you cleared that has a new spirit in it. It opens up again on the map.'],
  ['Horsemen', 'The four big enemies. Each spirit you seal weakens one of them.'],
  ['Grand Rite of Banishment', 'The final ritual that defeats a Horseman for good (see tab 6).'],
  ['Safehouse', 'Your base: rest, make materials and lower Heat.'],
  ['Save slots', 'Three separate games. Each saves by itself. On the title screen you can export a game to a file and import it on another device.']
];

export const ManualViewport = ({ fontScale, onReplayTutorial }: { fontScale: FontScale; onReplayTutorial?: () => void }) => {
  const [tab, setTab] = useState<'FORENSICS' | 'COUNTERS' | 'LORE' | 'INQUISITION' | 'SHIKIGAMI' | 'GRAND_RITE' | 'WORDS'>('FORENSICS');
  const subTabStyle = (active: boolean): ReactCSSProperties => ({
    padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer',
    border: `1px solid ${active ? theme.textBright : theme.borderTerminal}`,
    backgroundColor: active ? theme.textBright : '#060907',
    color: active ? '#000000' : '#4a7c59'
  });

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px', padding: '12px', zoom: FONT_ZOOM_MAP[fontScale] }}>
      <div style={{ backgroundColor: theme.bgPanel, border: `1px solid ${theme.textBright}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: theme.accentAmber, letterSpacing: '2px' }}>SYNDICATE FIELD CODEX // THAUMATURGIC OS v4.14</div>
          <h2 style={{ margin: '2px 0 0 0', color: theme.textBright, letterSpacing: '2px', fontSize: '1.15rem' }}>OPERATIVE FIELD MANUAL &amp; PROTOCOL INDEX</h2>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('FORENSICS'); }} style={subTabStyle(tab === 'FORENSICS')}>1. RECON &amp; FORENSICS</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('COUNTERS'); }} style={subTabStyle(tab === 'COUNTERS')}>2. PRE-ENTRY COUNTERS</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('LORE'); }} style={subTabStyle(tab === 'LORE')}>3. SOLOMONIC DEMONOLOGY</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('INQUISITION'); }} style={subTabStyle(tab === 'INQUISITION')}>4. ORDO MALLEUS &amp; HEAT</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('SHIKIGAMI'); }} style={subTabStyle(tab === 'SHIKIGAMI')}>5. SHIKIGAMI &amp; SAFEHOUSE</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('GRAND_RITE'); }} style={subTabStyle(tab === 'GRAND_RITE')}>6. THE GRAND RITE</button>
          <button onClick={() => { ThaumaturgicAudio.keyClick(); setTab('WORDS'); }} style={subTabStyle(tab === 'WORDS')}>7. WHAT THE WORDS MEAN</button>
          {onReplayTutorial && (
            <button onClick={() => { ThaumaturgicAudio.keyClick(); onReplayTutorial(); }} style={{ ...subTabStyle(false), borderColor: theme.accentAmber, color: theme.accentAmber }}>
              ▶ REPLAY GUIDED CASE
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '20px', overflowY: 'auto', fontSize: '0.84rem', lineHeight: '1.65', color: '#a8ccaf' }}>
        {tab === 'FORENSICS' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0 }}>STEP-BY-STEP ROOM INFILTRATION &amp; 3-TOOL FORENSICS</h3>
            <p>
              Every Goetian demon has a <strong>unique 3-phenomenon fingerprint</strong>, but field instruments are rarely clean. Most readings come back <strong>degraded</strong>: they narrow a clue to two or three possible phenomena instead of one. Build a case from several kinds of evidence, then work the <strong>[F2] CODEX</strong> yourself — click a phenomenon once to require it, twice to rule it out, filter by court and rank, and <strong>STRIKE</strong> suspects as you eliminate them:
            </p>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li><strong>Readings</strong> — 3 clue rooms per sector. <code>refine [#]</code> resolves a degraded reading from anywhere in the sector (-{REFINE_COST.humanity}% HUM, +heat).</li>
              <li><strong>Witness</strong> — one room holds a civilian who saw the entity. <code>interview</code> them for a redacted statement, then compare it against the Lemegeton entries in the Codex.</li>
              <li><strong>Anchor resonance</strong> — <code>attune</code> at the [ANCHOR] reveals the demon's Horseman <strong>court</strong> (+4s Sealing bonus). Attune again for a deep reading of its <strong>rank</strong> (-{DEEP_ATTUNE_COST.humanity}% HUM, +heat).</li>
              <li><strong>Sector conditions</strong> — some sectors are surveilled, hallowed, storm-wracked, heavily warded or have an unusually lucid witness. Layouts change every contract (5–8 rooms).</li>
            </ul>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'grid', gridTemplateColumns: '150px 160px 1fr', rowGap: '10px', columnGap: '12px', marginTop: '12px' }}>
              <strong style={{ color: theme.accentAmber }}>scan [#]</strong>
              <span style={{ color: '#a8ccaf' }}>[RECON]</span>
              <span>Scans a reachable room from outside, revealing if a Malleus Patrol or Threshold Trap is waiting inside.</span>

              <strong style={{ color: theme.accentAmber }}>enter [#]</strong>
              <span style={{ color: '#a8ccaf' }}>[MOVEMENT]</span>
              <span>Steps inside a reachable room. Walking into an active trap or patrol without disarming it first triggers heavy Humanity &amp; Heat penalties!</span>

              <strong style={{ color: theme.textBright }}>vox</strong>
              <span style={{ color: theme.textBright }}>[AUDIO CLUES]</span>
              <span>Decodes acoustic phenomena: hoarse voices, whispers, wolf howls, avian shrieks, seismic tremors, and gale winds.</span>

              <strong style={{ color: theme.textBright }}>assay</strong>
              <span style={{ color: theme.textBright }}>[MATTER CLUES]</span>
              <span>Tests physical &amp; biological residue: amphibian slime, rust decay, transmuted metals, spores, blood frenzy, and sulfur.</span>

              <strong style={{ color: theme.textBright }}>auspex</strong>
              <span style={{ color: theme.textBright }}>[ASTRAL CLUES]</span>
              <span>Reads thermal, optical, &amp; spatial shifts: light refraction, dead scripts, star drift, mind fog, -18°C stasis, and 1,200°C scorching.</span>

              <strong style={{ color: theme.textBright }}>refine [#]</strong>
              <span style={{ color: theme.textBright }}>[RESOLVE READING]</span>
              <span>Re-processes a degraded reading so it points to a single phenomenon. Costs Humanity &amp; Heat — sometimes it's cheaper to reason around it.</span>

              <strong style={{ color: theme.accentCyan }}>interview</strong>
              <span style={{ color: '#a8ccaf' }}>[WITNESS]</span>
              <span>Takes a statement from the sector's witness. Parts are redacted or forgotten; match what survives to a demon's description.</span>

              <strong style={{ color: theme.accentCyan }}>loot / attune</strong>
              <span style={{ color: '#a8ccaf' }}>[SHRINE / ANCHOR]</span>
              <span><code>loot</code> awakens Kami Shrines &amp; collects salvage. <code>attune</code> inside the [ANCHOR] reads the demon's court (+4s Sealing bonus); a second, deep attunement reads its rank.</span>
            </div>
          </div>
        )}

        {tab === 'COUNTERS' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.accentCyan, marginTop: 0 }}>PRE-ENTRY COUNTERMEASURES (DISARM BEFORE ENTERING!)</h3>
            <p>
              When you run <code>scan [#]</code> on a reachable room, the terminal reports any Malleus Patrol or Trap waiting inside. <strong>You can pass a room number (e.g., <code>degauss 2</code>) to disarm it from outside before entering</strong>:
            </p>
            <div style={{ backgroundColor: '#030504', border: `1px solid ${theme.borderTerminal}`, padding: '14px', display: 'grid', gridTemplateColumns: '160px 210px 1fr', rowGap: '10px', columnGap: '12px', marginTop: '12px' }}>
              <strong style={{ color: theme.accentRed }}>decoy [#]</strong>
              <span style={{ color: theme.accentRed }}>Malleus Hound Patrol</span>
              <span>Lures the Inquisition patrol out of the room so you can enter without taking ambush damage.</span>

              <strong style={{ color: theme.accentCyan }}>degauss [#]</strong>
              <span style={{ color: theme.accentAmber }}>Aethyric Static Field</span>
              <span>Symptom: Electromagnetic static screech scrambling forensic instruments.</span>

              <strong style={{ color: theme.accentCyan }}>bypass [#]</strong>
              <span style={{ color: theme.accentAmber }}>Malleus Laser Tripwire</span>
              <span>Symptom: Encrypted Inquisition laser tripwires spanning the doorway threshold (-10% Heat when bypassed).</span>

              <strong style={{ color: theme.accentCyan }}>purge [#]</strong>
              <span style={{ color: theme.accentAmber }}>Toxic Brimstone Miasma</span>
              <span>Symptom: Choking, spore-laden sulfur vapor blanketing the chamber floor.</span>

              <strong style={{ color: theme.accentCyan }}>dispel [#]</strong>
              <span style={{ color: theme.accentAmber }}>Goetic Blood-Hex Ward</span>
              <span>Symptom: Pulsing crimson sigils sealing the room architecture against intrusion.</span>
            </div>
          </div>
        )}

        {tab === 'LORE' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0 }}>THE 72 SPIRITS OF SOLOMON &amp; RESONANCE CASCADES</h3>
            <p>
              In the 17th-century <em>Lemegeton Clavicula Salomonis</em>, King Solomon bound <strong>72 Goetic spirits</strong> into a single Brass Vessel using their geometric seals and planetary metals: <strong>Kings</strong> (Gold Leaf), <strong>Marquises</strong> (Silver Shavings), <strong>Dukes</strong> (Copper Wire), <strong>Presidents</strong> (Quicksilver Drops), <strong>Princes</strong> (Sacred Sand), <strong>Earls</strong> (Cold Iron Filings), and <strong>Knights</strong> (Lead Weights).
            </p>
            <p>
              Each of the <strong>Four Horsemen</strong> (Conquest, War, Famine, Death) uses 18 Goetian Lieutenants to anchor itself into London and Surrey. Sealing a high-ranking <strong>King, Prince, or Duke</strong> triggers a <em>Solomonic Resonance Cascade</em> that automatically severs and binds <strong>1 to 2 lesser demons</strong> of that Horseman's court into your Brass Vessel.
            </p>
            <p>
              <strong style={{ color: theme.accentRed }}>Failure is permanent.</strong> If the Sealing Rite timer runs out before the binding geometry is complete, the spirit <strong>manifests</strong>: it can never be sealed, its sector is <strong>lost</strong> for the rest of the run, and its Horseman's court will always be one lieutenant short at the Grand Rite.
            </p>
            <p>
              <strong style={{ color: theme.accentAmber }}>Anchors ripen.</strong> Every trip you make (and every rest at the Safehouse) is time the other open sectors spend ripening. The ring around each sector on the Regional Map shows how close its anchor is; the sector you are heading into holds still. Higher Global Entropy speeds every anchor up. At 100% the demon <strong>manifests on its own</strong> and the sector is lost.
            </p>
            <p>
              <strong style={{ color: theme.accentRed }}>Manifested demons don't stay put.</strong> Each one bleeds Heat into neighbouring sectors, adds a trickle of Global Entropy, and makes neighbouring anchors ripen faster. Every manifested lieutenant also costs its Horseman's Grand Rite 5% odds and 3 seconds.
            </p>
            <p>
              <strong style={{ color: '#00f3ff' }}>The long campaign.</strong> Sixteen sectors cannot hold seventy-two spirits, so the map keeps moving. A secured sector lies dormant for a while, then <strong>re-infests</strong>: a new anchor takes root with a fresh layout and a fresh case file. As the campaign runs, <strong>new sites break open</strong> on the Regional Map (marked with a dashed ring) and link into the sectors around them. New cases only arrive while fewer than five sectors are open, and stop for good once every spirit has been sealed or has broken free. Lost sectors never come back.
            </p>
            <p>
              <strong style={{ color: theme.accentAmber }}>Two endings.</strong> Banishing all four Horsemen ends the run whenever you choose to do it. Sealing all 72 spirits <em>first</em> (the full Lesser Key, with nothing released) is the perfect ending.
            </p>
          </div>
        )}

        {tab === 'INQUISITION' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.accentRed, marginTop: 0 }}>THE ORDO MALLEUS &amp; 100% HEAT LOCKDOWNS</h3>
            <p>
              The <strong>Ordo Malleus</strong> monitors ley-line spikes using mobile direction-finding vans and witch-hound packs. Every room entry raises <strong>Inquisition Heat (0%–100%)</strong> based on the room's Ward Level (<strong>+8%</strong>, <strong>+16%</strong>, or <strong>+24%</strong> on first entry; <strong>+2%</strong> when backtracking):
            </p>
            <ul>
              <li><strong>75%–99% Heat:</strong> Malleus strike teams sweep the perimeter. The CRT display flickers crimson.</li>
              <li><strong>100% Heat (TOTAL SECTOR LOCKDOWN):</strong> All room actions are locked out! Execute <code>spoof</code> (-15 Obols for -25% Heat) or <code>bribe</code> (-25 Obols for -45% Heat) to lift the cordon.</li>
            </ul>
          </div>
        )}

        {tab === 'SHIKIGAMI' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.accentCyan, marginTop: 0 }}>THE KAGE NO SHO [F3] &amp; THE SAFEHOUSE [F4]</h3>
            <p>
              The <strong>Kage no Sho</strong> — the Book of Shadows — holds a page for every Yokai you can bargain with. Pages start <strong>unwritten</strong>.{' '}
              <strong>Kami shrines</strong> turn up in some sectors: <code>loot</code> one to wake it and its spirit's page writes itself. Only written pages can be bound.
              Binding costs Obols, Humanity and sometimes Esoteric Ink (distilled in the book for 10 Obols).
            </p>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li><strong>Two at most.</strong> Any bound daemon halves the Humanity cost of <code>scan</code>.</li>
              <li>Every daemon has a <strong>passive</strong> effect, usually with a price attached, and a few <strong>charges</strong> of an active invocation, used from the daemon panel in Field Ops.</li>
              <li><strong>Bonds</strong> grow by {KAGE_TUNING.bondPerInvocation} for each invocation, {KAGE_TUNING.bondPerSecuredSector} for each sector secured while bound, {KAGE_TUNING.bondPerRenewal} for each renewal, and {KAGE_TUNING.bondPerShrineRevisit} for waking a shrine you already know. <strong>Bond II</strong> ({KAGE_TUNING.bondThresholds[0]}) adds a charge; <strong>Bond III</strong> ({KAGE_TUNING.bondThresholds[1]}) adds another and softens the daemon's drawback.</li>
              <li><strong>Renewal rites:</strong> {KAGE_TUNING.renewalInk} Esoteric Ink and the spirit's favoured offering restore all its charges.</li>
              <li><strong>Pacts have consequences.</strong> Spend the last charge and the daemon leaves, offended for {KAGE_TUNING.burnedDryOffense} sector. Sever a pact by hand and it stays away for {KAGE_TUNING.brokenPactOffense} sectors and remembers it. Offended spirits come back after that many sectors are secured or lost.</li>
              <li><strong>Hungry spirits</strong> — Baku, Zashiki-warashi, Kameosa and Kamaitachi — take their offering every time a sector closes. Miss one and the bond weakens; with no bond left, they walk out.</li>
            </ul>
            <p style={{ marginTop: '14px' }}>
              The <strong>Safehouse altar</strong> turns raw salvage (Scrap Metal, Cursed Earth, Alchemical Distillate) plus Obols into the planetary catalysts each spirit's seal needs — every dossier in the Codex lists its own.
              The <strong>hearth</strong> restores 30% Humanity, but resting is time: the world clock ticks and open anchors ripen.{' '}
              <strong>Counter-intelligence</strong> suppresses 35% Heat in a chosen sector for 20 Obols.
            </p>
          </div>
        )}

        {tab === 'GRAND_RITE' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.accentRed, marginTop: 0 }}>THE GRAND RITE OF BANISHMENT [F5]</h3>
            <p>
              Each Horseman is held in the world by its 18 Goetian lieutenants. The Grand Rite severs a Horseman for good — but it is a single roll of the dice, and the dice are weighted by your work in the field.
            </p>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li><strong>Odds:</strong> 5% base, <strong>+5%</strong> for every sealed lieutenant of that court, <strong>−5%</strong> for every manifested one. Never below 5% or above 95%.</li>
              <li><strong>The rite:</strong> trace three binding matrices in a row against one timer (60 seconds; Kamaitachi adds 15; every manifested lieutenant of that court takes 3).</li>
              <li><strong>Resolution:</strong> complete all three and the odds are rolled. Success banishes the Horseman. Failure — or running out of time — spikes Global Entropy by 25%. You may try again.</li>
              <li><strong>Victory:</strong> banish all four Horsemen to close the operation. Your debrief scores sectors lost, spirits left loose and final entropy. Seal all 72 before the last banishment for the perfect ending.</li>
            </ul>
            <p style={{ marginTop: '14px', color: theme.accentAmber }}>
              The Rite is not available during the guided training case.
            </p>
          </div>
        )}

        {tab === 'WORDS' && (
          <div>
            <h3 style={{ color: theme.textBright, marginTop: 0 }}>WHAT THE WORDS MEAN</h3>
            <p>Every term in the game, in plain English.</p>
            <dl style={{ margin: 0 }}>
              {GLOSSARY.map(([term, meaning]) => (
                <div key={term} style={{ padding: '5px 0', borderBottom: `1px dashed ${theme.borderTerminal}` }}>
                  <dt style={{ color: theme.textBright, fontWeight: 'bold', display: 'inline' }}>{term}: </dt>
                  <dd style={{ margin: 0, display: 'inline' }}>{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </main>
  );
};
