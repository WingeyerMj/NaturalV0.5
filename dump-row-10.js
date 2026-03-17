
import fs from 'fs';
const lines = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1').split(/\r\n|\r|\n/);
const header = lines[0].split(';');
const row10 = lines[10].split(';');
console.log(`Row 10 has ${row10.length} columns.`);
row10.forEach((val, i) => {
    console.log(`${i}: [${header[i]}] -> "${val}"`);
});
