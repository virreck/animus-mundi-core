import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Establish bulletproof absolute pathing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.join(__dirname, 'data_ingest', '01_Yokai.txt');
const outDir = path.join(__dirname, 'src', 'content', 'yokai');
const outFile = path.join(outDir, 'index.ts');

console.log('🚀 Starting Yokai parser with dynamic cost generation...');

try {
  if (!fs.existsSync(targetPath)) {
     console.error('❌ ERROR: Could not find 01_Yokai.txt in data_ingest folder.');
     process.exit(1);
  }

  const rawText = fs.readFileSync(targetPath, 'utf-8');
  const lines = rawText.split('\n');
  const yokaiList = [];

  lines.forEach(line => {
    // Skip empty lines or the table header
    if (line.includes('ID | Name') || line.includes('---') || line.trim() === '') return;

    const [idStr, nameEn, kanji, utilityClass, utility, costDesc] = line.split('|').map(s => s.trim());
    
    if (idStr && nameEn && kanji) {
      
      // --- DYNAMIC COST ENGINE ---
      let humanityCost = 0;
      let inkCost = 0;
      let reqItem = null;
      const descLower = costDesc.toLowerCase();

      // Detect Humanity / Spiritual / Sanity costs
      if (descLower.includes('sanity') || descLower.includes('spiritual fatigue')) humanityCost = 10;
      if (descLower.includes('blood') || descLower.includes('stamina')) humanityCost = 5;
      if (descLower.includes('corruption') || descLower.includes('heavy sacrifice')) humanityCost = 20;

      // Detect Ink / Paper costs
      if (descLower.includes('ink') || descLower.includes('seal')) inkCost = 2;
      if (descLower.includes('paper') && !descLower.includes('paper doll')) inkCost = 1;

      // Detect specific required items
      if (descLower.includes('lamp oil')) reqItem = 'lamp_oil';
      if (descLower.includes('water') || descLower.includes('hydration')) reqItem = 'water_flask';
      if (descLower.includes('sand')) reqItem = 'sacred_sand';
      if (descLower.includes('food') || descLower.includes('meal')) reqItem = 'food_ration';
      if (descLower.includes('fuel')) reqItem = 'fuel_item';
      if (descLower.includes('spirit thread')) reqItem = 'spirit_thread';
      if (descLower.includes('paper doll')) reqItem = 'paper_doll';
      if (descLower.includes('mirror')) reqItem = 'silver_mirror';
      if (descLower.includes('cucumber')) reqItem = 'cucumber';

      // Push the fully compiled entity to the array
      yokaiList.push({
        id: `${idStr}_${nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        nameEn: nameEn,
        kanji: kanji,
        utilityClass: utilityClass,
        gameUtility: utility,
        costDescription: costDesc,
        draftCost: 50, // Standard base Obol cost to draft the contract
        activationCost: {
          humanity: humanityCost > 0 ? humanityCost : undefined,
          ink: inkCost > 0 ? inkCost : undefined,
          requiredItemId: reqItem || undefined
        }
      });
    }
  });

  console.log(`🔨 Successfully parsed ${yokaiList.length} Yokai and Shikigami.`);

  // 3. Format the TypeScript output with the Vite strict-mode 'import type'
  const outputTs = `import type { YokaiContract } from './types';\n\nexport const allYokai: YokaiContract[] = ${JSON.stringify(yokaiList, null, 2)};\n`;

  // 4. Ensure output directory exists and write the file
  if (!fs.existsSync(outDir)) {
      console.log(`📁 Creating output directory at ${outDir}...`);
      fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, outputTs);
  console.log(`🏁 SUCCESS: Yokai parsed and written to ${outFile}`);

} catch (error) {
  console.error('🔥 FATAL ERROR:', error);
}