
import fs from 'fs';

const compositions = { 'BIO-CRECIMIENTO': { n: 0.1, k: 0, p: 0 } };

const lines = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1').split(/\r\n|\r|\n/);
const header = lines[0].split(';');

const colMap = {
    producto: 8,
    cantidad: 12, // try 12 or 57
    cantidad_2: 57,
    tipo: 58,
    clasifica: 24,
    n_units: 60
};

function parseNum(val) {
    if (!val) return 0;
    let clean = val.toString().replace(/[$\s]/g, '');
    if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }
    return parseFloat(clean) || 0;
}

[10,11,12,13,14,15,16,17].forEach(idx => {
    const cols = lines[idx].split(';');
    const prod = (cols[colMap.producto] || '').toUpperCase();
    const tipo = (cols[colMap.tipo] || '').toLowerCase();
    const clas = (cols[colMap.clasifica] || '').trim();
    
    let qty = parseNum(cols[colMap.cantidad]);
    if (qty === 0) qty = parseNum(cols[colMap.cantidad_2]);
    
    let n_units = parseNum(cols[colMap.n_units]);
    
    console.log(`Row ${idx}: ${clas}, ${prod}, ${tipo}`);
    console.log(`  Qty=${qty}, N_from_CSV=${n_units}`);
    
    let calcN = n_units;
    if (calcN === 0) {
        calcN = qty * 0.1;
        console.log(`  Calculated N = ${calcN} (Qty * 0.1)`);
    } else {
        console.log(`  Using CSV N = ${calcN}`);
    }
});
