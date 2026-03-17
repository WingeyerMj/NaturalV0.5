
import fs from 'fs';
const csvText = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1');
const lines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
const results = {};
for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const tipo = (cols[58] || '').toLowerCase();
    const prod = (cols[8] || '').toUpperCase();
    if (prod.includes('BIO-CRECIMIENTO') && tipo.includes('presupuestado-pos')) {
        const clasifica = (cols[24] || 'Sin Clasificar').trim();
        const n = parseFloat((cols[60] || '0').replace('.', '').replace(',', '.')) || 0;
        results[clasifica] = (results[clasifica] || 0) + n;
        console.log(`Match: ${clasifica} -> ${n} (Row ${i})`);
    }
}
console.log("\nSummary by Clasifica:");
console.log(JSON.stringify(results, null, 2));
