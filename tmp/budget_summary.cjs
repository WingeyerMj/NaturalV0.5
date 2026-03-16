
const fs = require('fs');

const csvPath = 'Fuentes/Aplicaciones/FV_aplicaciones.csv';
const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split('\n');
const headerLine = lines[0].trim();
const separator = ';';
const header = headerLine.split(separator).map(h => h.trim().replace(/^[\uFEFF]/, ''));

const columnMap = {
    'Predio': 0,
    'Clasifica': 24,
    'Producto': 8,
    'Cantidad': 20, 
    'UnidN': 60,
    'Tipo': 58
};

const results = {};

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim());
    if (cols.length < 58) continue;

    const clasifica = cols[24] || 'Oculto';
    const tipo = (cols[58] || '').toLowerCase();
    const unidN = parseFloat((cols[60] || '0').replace(',', '.')) || 0;
    const producto = cols[8];

    if (tipo.includes('presupuestado')) {
        if (!results[clasifica]) results[clasifica] = { preN: 0, posN: 0, rows: [] };
        if (tipo.includes('pos')) {
            results[clasifica].posN += unidN;
        } else {
            results[clasifica].preN += unidN;
        }
        if (unidN > 0) {
            results[clasifica].rows.push({ i, producto, unidN, tipo });
        }
    }
}

console.log('--- Budget Summary by Clasificación ---');
Object.keys(results).forEach(k => {
    console.log(`${k}: Pre-N=${results[k].preN}, Pos-N=${results[k].posN}`);
    if (results[k].rows.length > 0) {
        // console.log('  Rows:', results[k].rows);
    }
});
