// src/ui/viewports/ManualViewport.tsx
// [F7] MANUAL viewport.
import { useState, type CSSProperties as ReactCSSProperties } from 'react';
import { DEEP_ATTUNE_COST, REFINE_COST } from '../../engine/evidence';
import { ThaumaturgicAudio } from '../audio';
import { FONT_ZOOM_MAP, type FontScale, theme } from '../theme';

export const ManualViewport = ({ fontScale }: { fontScale: FontScale }) => {
  const [tab, setTab] = useState<'FORENSICS' | 'COUNTERS' | 'LORE' | 'INQUISITION'>('FORENSICS');
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
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: theme.bgPanel, border: `1px solid ${theme.borderTerminal}`, padding: '20px', overflowY: 'auto', fontSize: '0.84rem', lineHeight: '1.65', color: '#a8ccaf' }}>
        {tab === 'FORENSICS' && (
          <div style={{ maxWidth: '940px' }}>
            <h3 style={{ color: theme.textBright, marginTop: 0 }}>STEP-BY-STEP ROOM INFILTRATION &amp; 3-TOOL FORENSICS</h3>
            <p>
              Every Goetian demon has a <strong>unique 3-phenomenon fingerprint</strong>, but field instruments are rarely clean. Most readings come back <strong>degraded</strong>: they narrow a clue to two or three possible phenomena instead of one. Build a case from several kinds of evidence, then use <strong>[F2] CODEX</strong> to see which suspects still fit:
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
      </div>
    </main>
  );
};
