
const fs = require('fs');

const csvPath = 'Fuentes/Aplicaciones/FV_aplicaciones.csv';
const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split('\n');
const headerLine = lines[0].trim();
const separator = headerLine.includes(';') ? ';' : ',';
const header = headerLine.split(separator).map(h => h.trim().replace(/^[\uFEFF]/, ''));

console.log('Header with indices:');
header.forEach((h, i) => console.log(`${i}: ${h}`));

const columnMap = {
    'Predio': header.findIndex(h => h.toLowerCase() === 'predio'),
    'Producto': header.findIndex(h => h.toLowerCase() === 'producto'),
    'Cantidad': header.findIndex(h => h.toLowerCase() === 'cantidad'),
    'Unid N': header.findIndex(h => h.toLowerCase() === 'unidades n'),
    'Clasifica': header.findIndex(h => h.toLowerCase() === 'clasificación'),
    'Tipo': header.findIndex(h => h.toLowerCase() === 'tipo registro'),
    'Estado': header.findIndex(h => h.toLowerCase() === 'estado')
};

console.log('\nColumn Mapping:', columnMap);

console.log('\nFirst 20 rows containing "Puente Alto":');
let count = 0;
for (let i = 1; i < lines.length && count < 20; i++) {
    if (lines[i].includes('Puente Alto')) {
        const cols = lines[i].split(separator).map(c => c.trim());
        console.log(`Row ${i}:`, {
            Predio: cols[columnMap['Predio']],
            Clasifica: cols[columnMap['Clasifica']],
            Producto: cols[columnMap['Producto']],
            Cantidad: cols[columnMap['Cantidad']],
            UnidN: cols[columnMap['Unid N']],
            Tipo: cols[columnMap['Tipo']]
        });
        count++;
    }
}
