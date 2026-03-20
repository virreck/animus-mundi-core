import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Get the absolute path of this exact script file (Bulletproof ES Module pathing)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Build exact paths starting from the script's location
const targetPath = path.join(__dirname, 'data_ingest', '00_Manifest.txt');
const outDir = path.join(__dirname, 'src', 'content', 'goetia');
const outFile = path.join(outDir, 'index.ts');

console.log('🚀 Script started...');
console.log(`🔍 Looking for raw text file at: ${targetPath}`);

try {
  if (!fs.existsSync(targetPath)) {
     console.error('❌ ERROR: Could not find the manifest file.');
     process.exit(1);
  }

  const rawText = fs.readFileSync(targetPath, 'utf-8');
  console.log(`✅ File read successfully. Processing lines...`);

  const lines = rawText.split('\n');
  const goetiaList = [];

  lines.forEach(line => {
    // Skip empty lines or table headers
    if (line.includes('ID | Name | Rank') || line.includes('---') || line.trim() === '') return;

    const [idStr, name, rank] = line.split('|').map(s => s.trim());
    
    if (idStr && name && rank) {
      // Assign an allegiance for the prototype
      const allegiances = ['Conquest', 'War', 'Famine', 'Death'];
      const assignedAllegiance = allegiances[parseInt(idStr, 10) % 4];

      goetiaList.push({
        id: `${idStr}_${name.toLowerCase()}`,
        manifestId: parseInt(idStr, 10),
        name: name,
        rank: rank,
        allegiance: assignedAllegiance,
        requiredIntel: []
      });
    }
  });

  console.log(`🔨 Successfully parsed ${goetiaList.length} demons.`);

  const outputTs = `import { GoetiaLieutenant } from './types';\n\nexport const allGoetia: GoetiaLieutenant[] = ${JSON.stringify(goetiaList, null, 2)};\n`;

  // Ensure the output directory actually exists
  if (!fs.existsSync(outDir)) {
      console.log(`📁 Creating output directory at ${outDir}...`);
      fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, outputTs);
  console.log(`🏁 SUCCESS: Goetia parsed and written to ${outFile}`);

} catch (error) {
  console.error('🔥 FATAL ERROR:', error);
}