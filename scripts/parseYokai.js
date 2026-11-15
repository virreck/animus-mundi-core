import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Establish bulletproof absolute pathing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const targetPath = path.join(repoRoot, 'data_ingest', '01_Yokai.txt');
const outDir = path.join(repoRoot, 'data_ingest', 'generated');
// Writes a JSON scaffold to data_ingest/generated/. The hand-curated
// src/content/yokai/index.ts (titles, costs, clue fingerprints) is never
// overwritten — copy across anything you need by hand.
const outFile = path.join(outDir, 'yokai.json');

// --- DYNAMIC COST ENGINE ---
// Each rule is [keywords, value]. Rules are checked in order and the LAST match wins.
const HUMANITY_RULES = [
  [['sanity', 'spiritual fatigue'], 10],
  [['blood', 'stamina'], 5],
  [['corruption', 'heavy sacrifice'], 20]
];
const ITEM_RULES = [
  [['lamp oil'], 'lamp_oil'],
  [['water', 'hydration'], 'water_flask'],
  [['sand'], 'sacred_sand'],
  [['food', 'meal'], 'food_ration'],
  [['fuel'], 'fuel_item'],
  [['spirit thread'], 'spirit_thread'],
  [['paper doll'], 'paper_doll'],
  [['mirror'], 'silver_mirror'],
  [['cucumber'], 'cucumber']
];

const lastMatch = (text, rules, fallback) =>
  rules.reduce((found, [words, value]) => (words.some(w => text.includes(w)) ? value : found), fallback);

function inkCostFor(text) {
  // Paper (but not a paper doll) is the cheaper ink cost, and overrides ink / seal
  if (text.includes('paper') && !text.includes('paper doll')) return 1;
  return text.includes('ink') || text.includes('seal') ? 2 : 0;
}

/** One table row -> a Yokai entry, or null for headers, rules and blank lines. */
function parseYokaiLine(line) {
  if (line.includes('ID | Name') || line.includes('---') || line.trim() === '') return null;
  const [idStr, nameEn, kanji, utilityClass, utility, costDesc = ''] = line.split('|').map(s => s.trim());
  if (!idStr || !nameEn || !kanji) return null;

  const descLower = costDesc.toLowerCase();
  const humanityCost = lastMatch(descLower, HUMANITY_RULES, 0);
  const inkCost = inkCostFor(descLower);
  const reqItem = lastMatch(descLower, ITEM_RULES, null);
  return {
    id: `${idStr}_${nameEn.toLowerCase().replaceAll(/[^a-z0-9]/g, '_')}`,
    nameEn,
    kanji,
    utilityClass,
    gameUtility: utility,
    costDescription: costDesc,
    draftCost: 50, // Standard base Obol cost to draft the contract
    activationCost: {
      humanity: humanityCost > 0 ? humanityCost : undefined,
      ink: inkCost > 0 ? inkCost : undefined,
      requiredItemId: reqItem || undefined
    }
  };
}

console.log('🚀 Starting Yokai parser with dynamic cost generation...');

try {
  if (!fs.existsSync(targetPath)) {
     console.error('❌ ERROR: Could not find 01_Yokai.txt in data_ingest folder.');
     process.exit(1);
  }

  const rawText = fs.readFileSync(targetPath, 'utf-8');
  const yokaiList = rawText.split('\n').map(parseYokaiLine).filter(Boolean);

  console.log(`🔨 Successfully parsed ${yokaiList.length} Yokai and Shikigami.`);

  // 3. Format the TypeScript output with the Vite strict-mode 'import type'
  const outputJson = JSON.stringify(yokaiList, null, 2) + '\n';

  // 4. Ensure output directory exists and write the file
  if (!fs.existsSync(outDir)) {
      console.log(`📁 Creating output directory at ${outDir}...`);
      fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, outputJson);
  console.log(`🏁 SUCCESS: Yokai parsed and written to ${outFile}`);

} catch (error) {
  console.error('🔥 FATAL ERROR:', error);
  process.exitCode = 1;
}