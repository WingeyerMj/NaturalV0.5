
import fs from 'fs';
const h = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1').split(/\r\n|\r|\n/)[0];
h.split(';').forEach((c, i) => console.log(`${i}: ${c}`));
