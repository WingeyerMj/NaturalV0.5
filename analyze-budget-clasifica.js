
import fs from 'fs';

const csvText = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1');
const lines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');

const colMap = {
    predio: 0,
    producto: 8,
    cantidad: 57,
    tipo: 58,
    clasifica: 24,
    unidades_n: 60
};

let totalN = 0;
let count = 0;

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const clasifica = (cols[colMap.clasifica] || '').trim();
    const producto = (cols[colMap.producto] || '').toUpperCase();
    const tipo = (cols[colMap.tipo] || '').toLowerCase();
    const nStr = cols[colMap.unidades_n] || '0';

    if (producto.includes('BIO-CRECIMIENTO') && 
        tipo.includes('presupuestado-pos') && 
        clasifica === 'Puente Alto') {
        
        const nUnits = parseFloat(nStr.replace('.', '').replace(',', '.')) || 0;
        totalN += nUnits;
        count++;
        console.log(`PUENTE ALTO: N=${nUnits}, Row=${i}`);
    }
}

console.log(`Total N for Puente Alto: ${totalN}`);
