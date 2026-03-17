
import fs from 'fs';
const csvText = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1');
const lines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols[8] && cols[8].includes('BIO-CRECIMIENTO')) {
        console.log(`Row ${i}: Predio(0)=[${cols[0]}], Clasifica(24)=[${cols[24]}], N(60)=[${cols[60]}], Tipo(58)=[${cols[58]}]`);
    }
}
