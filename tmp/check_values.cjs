
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
    'Cantidad': 20, // Real Aplicado
    'UnidN': 60,
    'Tipo': 58,
    'Estado': 38
};

console.log('Rows for Puente Alto:');
let totalUnidN = 0;
for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes('Puente Alto')) {
        const cols = lines[i].split(separator).map(c => c.trim());
        const tipo = cols[columnMap['Tipo']];
        const unidNStr = cols[columnMap['UnidN']];
        const unidN = parseFloat((unidNStr || '0').replace(',', '.')) || 0;
        
        if (tipo === 'Real') {
            console.log(`Row ${i} (REAL):`, {
                Clasifica: cols[columnMap['Clasifica']],
                Producto: cols[columnMap['Producto']],
                RealAplica: cols[columnMap['Cantidad']],
                UnidN: unidN
            });
            totalUnidN += unidN;
        }
    }
}
console.log('Total UnidN (REAL) for Puente Alto:', totalUnidN);
