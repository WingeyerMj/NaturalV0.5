
const fs = require('fs');

const csvPath = 'Fuentes/Aplicaciones/FV_aplicaciones.csv';
const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split('\n');
const separator = ';';

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim());
    if (cols.length < 61) continue;
    
    const clasifica = cols[24] || 'Unknown';
    const producto = cols[8] || '';
    const tipo = (cols[58] || '').toLowerCase();

    if (clasifica === 'Puente Alto' && producto === 'BIO-CRECIMIENTO' && tipo.includes('presupuestado') && tipo.includes('pos')) {
        console.log(`Row ${i}: N=${cols[60]} Date=${cols[5]} Labor=${cols[40]} Cant=${cols[12]}`);
    }
}
