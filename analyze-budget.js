
import fs from 'fs';

const csvText = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1');
const lines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
const header = lines[0].split(';');

const colMap = {
    predio: 0,
    producto: 8,
    cantidad: 57,
    tipo: 58,
    u_med: 13,
    unidades_n: 60
};

let totalQty = 0;
let totalN = 0;
let count = 0;

console.log("Filtering: Bio-Crecimiento, presupuestado-pos, Puente Alto");

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const predio = cols[colMap.predio] || '';
    const producto = (cols[colMap.producto] || '').toUpperCase();
    const tipo = (cols[colMap.tipo] || '').toLowerCase();
    const qtyStr = cols[colMap.cantidad] || '0';
    const nStr = cols[colMap.unidades_n] || '0';

    if (producto.includes('BIO-CRECIMIENTO') && 
        tipo.includes('presupuestado-pos') && 
        predio.includes('Puente Alto')) {
        
        const qty = parseFloat(qtyStr.replace('.', '').replace(',', '.')) || 0;
        const nUnits = parseFloat(nStr.replace('.', '').replace(',', '.')) || 0;
        
        totalQty += qty;
        totalN += nUnits;
        count++;
        
        console.log(`Row ${i}: Qty=${qty}, N=${nUnits}, Cuartel=${cols[26] || cols[25]}`);
    }
}

console.log(`\nResults:`);
console.log(`Matched Rows: ${count}`);
console.log(`Total Quantity: ${totalQty}`);
console.log(`Total Nitrogen Units (N): ${totalN}`);
