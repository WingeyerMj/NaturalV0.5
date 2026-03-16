
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
    'Tipo': 58,
    'Fecha': 5
};

console.log('--- Budgeted-Pos Rows with Puente Alto context ---');
let totalUnidN = 0;
const rows = [];
for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.includes('Puente Alto')) {
        const cols = row.split(separator).map(c => c.trim());
        const tipo = (cols[58] || '').toLowerCase();
        
        if (tipo.includes('presupuestado') && tipo.includes('pos')) {
            const unidNStr = cols[60];
            const unidN = parseFloat((unidNStr || '0').replace(',', '.')) || 0;
            const producto = cols[8];
            const clasifica = cols[24];
            const date = cols[5];
            
            rows.push({ i, producto, unidN, tipo, clasifica, date });
            totalUnidN += unidN;
        }
    }
}
console.log(JSON.stringify(rows, null, 2));
console.log('Grand Total UnidN (Budgeted-Pos) for Puente Alto rows:', totalUnidN);
