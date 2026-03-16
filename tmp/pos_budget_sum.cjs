
const fs = require('fs');

const csvPath = 'Fuentes/Aplicaciones/FV_aplicaciones.csv';
const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split('\n');
const separator = ';';

const sums = {};

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim());
    if (cols.length < 61) continue;
    
    const clasifica = cols[24] || 'Unknown';
    const tipo = (cols[58] || '').toLowerCase();
    const unidN = parseFloat((cols[60] || '0').replace(',', '.')) || 0;
    const producto = cols[8] || '';

    if (tipo.includes('presupuestado') && tipo.includes('pos')) {
        const key = `${clasifica}|${producto}`;
        if (!sums[key]) sums[key] = 0;
        sums[key] += unidN;
    }
}

console.log('--- POS Budget Units (N) per Clasifica | Producto ---');
Object.entries(sums).forEach(([k, v]) => {
    console.log(`${k}: ${v}`);
});
