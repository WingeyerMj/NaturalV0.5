
import fs from 'fs';
const lines = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1').split(/\r\n|\r|\n/);
const header = lines[0].split(';');
[10,11,12,13,14,15,16,17].forEach(idx => {
    const cols = lines[idx].split(';');
    console.log(`\n--- Row ${idx} ---`);
    header.forEach((h, i) => {
        if (cols[i]) console.log(`${i}: [${h}] -> "${cols[i]}"`);
    });
});
