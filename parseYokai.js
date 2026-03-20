import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.join(__dirname, 'data_ingest', '01_Yokai.txt');
const outDir = path.join(__dirname, 'src', 'content', 'yokai');
const outFile = path.join(outDir, 'index.ts');

console.log('🚀 Starting Yokai parser...');

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
      yokaiList.push({
        id: `${idStr}_${nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        nameEn: nameEn,
        kanji: kanji,
        utilityClass: utilityClass,
        gameUtility: utility,
        costDescription: costDesc,
        baseCost: { obols: 100 } // Prototype default value
      });
    }
  });

  console.log(`🔨 Successfully parsed ${yokaiList.length} Yokai and Shikigami.`);

  // Notice the 'import type' for Vite strict mode!
  const outputTs = `import type { YokaiContract } from './types';\n\nexport const allYokai: YokaiContract[] = ${JSON.stringify(yokaiList, null, 2)};\n`;

  if (!fs.existsSync(outDir)) {
      console.log(`📁 Creating output directory at ${outDir}...`);
      fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, outputTs);
  console.log(`🏁 SUCCESS: Yokai parsed and written to ${outFile}`);

} catch (error) {
  console.error('🔥 FATAL ERROR:', error);
}