const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets['Tabla general'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const row3 = raw[2];
console.log("Row 3 non-null columns from 90 onwards:");
for(let i=90; i<row3.length; i++) {
    if (row3[i] != null && row3[i] !== '') {
        console.log(`[${i}] ${row3[i]}`);
    }
}

const row110 = raw[109];
console.log("\nRow 110 non-null columns from 90 onwards:");
for(let i=90; i<row110.length; i++) {
    if (row110[i] != null && row110[i] !== '') {
        console.log(`[${i}] ${row110[i]}`);
    }
}
