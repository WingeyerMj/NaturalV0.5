
const fs = require('fs');

const csvPath = 'Fuentes/Aplicaciones/FV_aplicaciones.csv';
const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split('\n');
const headerLine = lines[0].trim();
const separator = headerLine.includes(';') ? ';' : ',';
const header = headerLine.split(separator).map(h => h.trim().replace(/^[\uFEFF]/, ''));

console.log('Separator:', separator);
console.log('Header count:', header.length);
header.forEach((h, i) => console.log(`${i}: ${h}`));
