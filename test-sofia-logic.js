
import fs from 'fs';
import { SofiaImportModel } from './src/models/SofiaModel.js';

const csvText = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1');
const result = SofiaImportModel.parseCSV(csvText, 'Fincas Viejas');

if (result.error) {
    console.error(result.error);
    process.exit(1);
}

const budgetRows = result.rows.filter(r => 
    (r.tipo_registro || '').toLowerCase().includes('presupuestado-pos') && 
    (r.producto || '').toUpperCase().includes('BIO-CRECIMIENTO')
);

console.log(`Found ${budgetRows.length} budget-pos rows for BIO-CRECIMIENTO.`);

SofiaImportModel.REGISTROS = result.rows;

budgetRows.forEach(r => {
    console.log(`Row: Clas=[${r.clasifica}], Qty=${r.cantidad}, N=${r.n_units}`);
});

const units = SofiaImportModel.getFertilizacionUnidades({
    producto: 'BIO-CRECIMIENTO',
    budgetType: 'pos',
    ciclo: '2025-2026'
}, 'fincasviejas');

console.log("\ngetFertilizacionUnidades Result:");
console.log(JSON.stringify(units, null, 2));
